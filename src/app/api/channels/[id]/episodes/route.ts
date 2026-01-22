import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'
import { prisma } from '@/lib/prisma'
import { getStyleById } from '@/lib/channel-styles'

const MAX_SCENES_PER_BATCH = 15

interface SceneData {
    order: number
    title?: string
    promptText?: string
    dialogue?: string
    duration?: number
    hookType?: string
    environmentDetails?: string
}

interface EpisodeData {
    title: string
    synopsis: string
    storyOutline: string
    topicIdea: string
    mainLocation?: string
    scenes: SceneData[]
}

// Generate a batch of scenes
async function generateSceneBatch(
    config: { provider: string; apiKey: string; model?: string },
    channel: {
        name: string
        niche: string
        targetAudience: string | null
        dialogueLanguage: string | null
    },
    styleKeywords: string,
    characterBible: string,
    episodeInfo: { title: string; synopsis: string; storyOutline: string },
    startScene: number,
    endScene: number,
    totalScenes: number,
    dialogueLangLabel: string,
    langInstruction: string
): Promise<SceneData[]> {
    const batchSize = endScene - startScene + 1

    const batchPrompt = `You are continuing to write scenes for Episode "${episodeInfo.title}" of channel "${channel.name}"
NICHE: ${channel.niche}
VISUAL STYLE: ${styleKeywords}
DIALOGUE LANGUAGE: ${dialogueLangLabel.toUpperCase()}
${characterBible}

EPISODE CONTEXT:
- Title: ${episodeInfo.title}
- Synopsis: ${episodeInfo.synopsis}
- Story Arc: ${episodeInfo.storyOutline}

Generate scenes ${startScene} to ${endScene} (${batchSize} scenes) out of ${totalScenes} total.
${startScene === 1 ? 'This is the OPENING - start with a strong hook!' : ''}
${endScene === totalScenes ? 'This is the ENDING - provide a satisfying conclusion or cliffhanger!' : ''}
${startScene > 1 && endScene < totalScenes ? 'This is a MIDDLE section - maintain tension and build towards climax.' : ''}

🎬 DIALOGUE GUIDELINES:
- Each scene: 18-22 words dialogue (flexible for pacing)
- ${langInstruction}

Return JSON array ONLY:
{
    "scenes": [
        {
            "order": ${startScene},
            "title": "Scene ${startScene}: [Title]",
            "dialogue": "18-22 word dialogue in ${dialogueLangLabel}",
            "promptText": "[CHARACTER DESCRIPTION VERBATIM] [action] in [environment]. Speaking: [dialogue]. Style: ${styleKeywords}. Camera: [movement]. Lighting: [details]. Mood: [tone]. Negative: flickering, blurry",
            "duration": 8,
            "hookType": "tension"
        }
    ]
}

RULES:
1. Generate EXACTLY ${batchSize} scenes (scene ${startScene} to ${endScene})
2. Include CHARACTER DESCRIPTIONS VERBATIM in promptText
3. ALL dialogue in ${dialogueLangLabel.toUpperCase()} ONLY
4. Return ONLY valid JSON, no markdown`

    console.log(`[Batch] Generating scenes ${startScene}-${endScene} of ${totalScenes}`)

    const result = await generateText(config as any, batchPrompt)

    // Parse batch result
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
        throw new Error(`No JSON found for batch ${startScene}-${endScene}`)
    }

    const batchData = JSON.parse(jsonMatch[0])
    const scenes = batchData.scenes || []

    console.log(`[Batch] Got ${scenes.length} scenes for batch ${startScene}-${endScene}`)

    return scenes
}

// POST: Generate a new episode with AI-created content
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const { totalScenes = 10 } = await req.json()

        // Get channel with characters AND existing episodes
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id },
            include: {
                characters: true,
                episodes: {
                    select: {
                        episodeNumber: true,
                        title: true,
                        topicIdea: true,
                        synopsis: true
                    },
                    orderBy: { episodeNumber: 'asc' }
                },
                _count: { select: { episodes: true } }
            }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Get AI config
        const config = await getAIConfigFromSettings(session.user.id)
        if (!config) {
            return NextResponse.json({ error: 'Chưa cấu hình API key' }, { status: 400 })
        }

        // Get visual style
        const visualStyle = channel.visualStyleId ? getStyleById(channel.visualStyleId) : null
        const styleKeywords = visualStyle?.promptKeywords || channel.visualStyleKeywords || 'cinematic, professional'

        // Parse knowledge base for episode ideas
        let knowledgeBase: { episodeIdeas?: { title: string; synopsis: string; hook: string }[] } = {}
        try {
            knowledgeBase = channel.knowledgeBase ? JSON.parse(channel.knowledgeBase) : {}
        } catch { }

        // Episode number
        const nextEpisodeNumber = channel._count.episodes + 1

        // Build character bible for prompts
        const characterBible = channel.characters.length > 0
            ? `\n\nCHARACTER BIBLE (use VERBATIM in every scene):\n${channel.characters.map((c: { name: string; role: string; fullDescription: string }) =>
                `[${c.name}] - ${c.role.toUpperCase()}:\n${c.fullDescription}`
            ).join('\n\n')}`
            : ''

        // Build existing episodes summary to avoid duplication
        const recentEpisodes = channel.episodes.slice(-10)
        const existingEpisodesSummary = recentEpisodes.length > 0
            ? `\n\n⚠️ EXISTING EPISODES (DO NOT DUPLICATE):\n${recentEpisodes.map((ep: { episodeNumber: number; title: string; topicIdea: string | null; synopsis: string | null }) =>
                `Ep${ep.episodeNumber}: ${ep.title}`
            ).join('\n')}`
            : ''

        // Dialogue language
        const dialogueLang = channel.dialogueLanguage || 'vi'
        const langInstruction = dialogueLang === 'en'
            ? 'ALL dialogue MUST be in ENGLISH only.'
            : 'ALL dialogue MUST be in VIETNAMESE (tiếng Việt) only.'
        const dialogueLangLabel = dialogueLang === 'en' ? 'English' : 'Vietnamese'

        console.log('=== EPISODE GENERATION START ===')
        console.log('Channel:', channel.name)
        console.log('Episode number:', nextEpisodeNumber)
        console.log('Total scenes:', totalScenes)

        // STEP 1: Generate episode metadata first (title, synopsis, outline)
        const metaPrompt = `You are a professional YouTube content creator for channel: "${channel.name}"
NICHE: ${channel.niche}
${channel.targetAudience ? `TARGET AUDIENCE: ${channel.targetAudience}` : ''}
${characterBible}
${existingEpisodesSummary}

Create Episode ${nextEpisodeNumber} metadata for a ${totalScenes}-scene episode.
${knowledgeBase.episodeIdeas && knowledgeBase.episodeIdeas.length > 0
                ? `\nInspired by: ${knowledgeBase.episodeIdeas[0]?.title || 'original idea'}`
                : ''}

Return JSON:
{
    "title": "Catchy episode title in ${dialogueLangLabel}",
    "synopsis": "2-3 sentence episode summary",
    "storyOutline": "Story arc: beginning -> development -> climax -> resolution",
    "topicIdea": "Main topic/theme"
}

Return ONLY valid JSON, no markdown.`

        let episodeData: EpisodeData

        try {
            console.log('[Meta] Generating episode metadata...')
            const metaResult = await generateText(config, metaPrompt)
            const metaMatch = metaResult.match(/\{[\s\S]*\}/)
            if (!metaMatch) {
                throw new Error('No JSON in metadata response')
            }
            episodeData = JSON.parse(metaMatch[0])
            episodeData.scenes = []
            console.log('[Meta] Episode:', episodeData.title)
        } catch (metaError) {
            console.error('[Meta] Error:', metaError)
            return NextResponse.json({
                error: 'Không thể tạo metadata episode. Vui lòng thử lại.',
                details: String(metaError)
            }, { status: 400 })
        }

        // STEP 2: Generate scenes in batches
        const allScenes: SceneData[] = []

        if (totalScenes <= MAX_SCENES_PER_BATCH) {
            // Single batch for small episodes
            try {
                const scenes = await generateSceneBatch(
                    config,
                    { name: channel.name, niche: channel.niche, targetAudience: channel.targetAudience, dialogueLanguage: channel.dialogueLanguage },
                    styleKeywords,
                    characterBible,
                    episodeData,
                    1,
                    totalScenes,
                    totalScenes,
                    dialogueLangLabel,
                    langInstruction
                )
                allScenes.push(...scenes)
            } catch (sceneError) {
                console.error('[Scenes] Error:', sceneError)
                return NextResponse.json({
                    error: 'Không thể tạo scenes. Vui lòng thử lại.',
                    details: String(sceneError)
                }, { status: 400 })
            }
        } else {
            // Multiple batches for large episodes
            const numBatches = Math.ceil(totalScenes / MAX_SCENES_PER_BATCH)
            console.log(`[Batch] Will generate ${numBatches} batches for ${totalScenes} scenes`)

            for (let batch = 0; batch < numBatches; batch++) {
                const startScene = batch * MAX_SCENES_PER_BATCH + 1
                const endScene = Math.min((batch + 1) * MAX_SCENES_PER_BATCH, totalScenes)

                try {
                    const scenes = await generateSceneBatch(
                        config,
                        { name: channel.name, niche: channel.niche, targetAudience: channel.targetAudience, dialogueLanguage: channel.dialogueLanguage },
                        styleKeywords,
                        characterBible,
                        episodeData,
                        startScene,
                        endScene,
                        totalScenes,
                        dialogueLangLabel,
                        langInstruction
                    )
                    allScenes.push(...scenes)
                    console.log(`[Batch] Completed batch ${batch + 1}/${numBatches}, total scenes: ${allScenes.length}`)
                } catch (batchError) {
                    console.error(`[Batch] Error in batch ${batch + 1}:`, batchError)
                    // Continue with partial results if we have some scenes
                    if (allScenes.length > 0) {
                        console.log(`[Batch] Continuing with ${allScenes.length} scenes already generated`)
                        break
                    }
                    return NextResponse.json({
                        error: `Lỗi tạo scenes batch ${batch + 1}. Vui lòng thử lại.`,
                        details: String(batchError)
                    }, { status: 400 })
                }
            }
        }

        // Validate scenes
        if (allScenes.length === 0) {
            return NextResponse.json({
                error: 'Không thể tạo scenes. Vui lòng thử lại.',
                details: 'No scenes generated'
            }, { status: 400 })
        }

        console.log(`[Result] Total scenes generated: ${allScenes.length}`)

        // Create episode in database
        try {
            const episode = await prisma.episode.create({
                data: {
                    episodeNumber: nextEpisodeNumber,
                    title: episodeData.title || `Episode ${nextEpisodeNumber}`,
                    synopsis: episodeData.synopsis || '',
                    storyOutline: episodeData.storyOutline || '',
                    topicIdea: episodeData.topicIdea || '',
                    totalScenes: totalScenes,
                    generatedScenes: allScenes.length,
                    status: 'completed',
                    channelId: id,
                    scenes: {
                        create: allScenes.map((scene, index) => ({
                            order: scene.order || index + 1,
                            title: scene.title || `Scene ${index + 1}`,
                            promptText: scene.promptText || scene.dialogue || 'Scene prompt',
                            duration: scene.duration || 8,
                            hookType: scene.hookType || null
                        }))
                    }
                },
                include: {
                    scenes: {
                        orderBy: { order: 'asc' }
                    }
                }
            })

            console.log('=== EPISODE CREATED ===')
            console.log('ID:', episode.id)
            console.log('Scenes:', episode.scenes.length)

            return NextResponse.json({
                success: true,
                episode
            })
        } catch (dbError) {
            console.error('Database error:', dbError)
            return NextResponse.json({
                error: 'Lỗi lưu episode vào database',
                details: String(dbError)
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Generate episode error:', error)
        return NextResponse.json({ error: 'Failed to generate episode', details: String(error) }, { status: 500 })
    }
}

// GET: List episodes for channel
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const episodes = await prisma.episode.findMany({
            where: { channelId: id },
            include: {
                _count: { select: { scenes: true } }
            },
            orderBy: { episodeNumber: 'asc' }
        })

        return NextResponse.json({ episodes })
    } catch (error) {
        console.error('List episodes error:', error)
        return NextResponse.json({ error: 'Failed to load episodes' }, { status: 500 })
    }
}
