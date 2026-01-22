import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'
import { prisma } from '@/lib/prisma'
import { getStyleById } from '@/lib/channel-styles'

interface SceneData {
    order: number
    title?: string
    promptText?: string
    dialogue?: string
    duration?: number
    hookType?: string
}

interface EpisodeData {
    title: string
    synopsis: string
    storyOutline: string
    topicIdea: string
    scenes: SceneData[]
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

        // Parse knowledge base
        let knowledgeBase: { episodeIdeas?: { title: string; synopsis: string }[] } = {}
        try {
            knowledgeBase = channel.knowledgeBase ? JSON.parse(channel.knowledgeBase) : {}
        } catch { }

        const nextEpisodeNumber = channel._count.episodes + 1

        // Character bible
        const characterBible = channel.characters.length > 0
            ? `\nCHARACTER BIBLE:\n${channel.characters.map((c: { name: string; role: string; fullDescription: string }) =>
                `[${c.name}] - ${c.role}: ${c.fullDescription}`
            ).join('\n')}`
            : ''

        // Existing episodes (avoid duplication)
        const recentEpisodes = channel.episodes.slice(-5)
        const existingEpisodesSummary = recentEpisodes.length > 0
            ? `\n⚠️ DO NOT DUPLICATE: ${recentEpisodes.map((ep: { title: string }) => ep.title).join(', ')}`
            : ''

        // Language
        const dialogueLang = channel.dialogueLanguage || 'vi'
        const dialogueLangLabel = dialogueLang === 'en' ? 'English' : 'Vietnamese'

        console.log('=== EPISODE START ===')
        console.log('Channel:', channel.name, '| Scenes:', totalScenes)

        // Generate ALL at once - let AI decide how much it can handle
        const fullPrompt = `Create Episode ${nextEpisodeNumber} with ${totalScenes} scenes for channel "${channel.name}"
NICHE: ${channel.niche}
STYLE: ${styleKeywords}
DIALOGUE: ${dialogueLangLabel.toUpperCase()} ONLY
${characterBible}
${existingEpisodesSummary}

Return JSON:
{
    "title": "Episode title",
    "synopsis": "Brief summary",
    "storyOutline": "Story arc",
    "topicIdea": "Theme",
    "scenes": [
        {"order": 1, "title": "Scene 1", "dialogue": "18-22 words in ${dialogueLangLabel}", "promptText": "[character] [action] in [place]. Style: ${styleKeywords}", "duration": 8}
    ]
}

Generate ALL ${totalScenes} scenes. Return ONLY JSON.`

        let episodeData: EpisodeData
        let allScenes: SceneData[] = []

        try {
            // First attempt - try to get everything
            console.log('[Gen] Attempting full generation...')
            const result = await generateText(config, fullPrompt)

            const jsonMatch = result.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No JSON in response')
            }

            episodeData = JSON.parse(jsonMatch[0])
            allScenes = episodeData.scenes || []
            console.log('[Gen] Got', allScenes.length, 'scenes')

        } catch (error) {
            console.error('[Gen] Initial error:', error)
            return NextResponse.json({
                error: 'Không thể tạo episode. Vui lòng thử lại.',
                details: String(error)
            }, { status: 400 })
        }

        // Continue generating if we got fewer scenes than requested
        let attempts = 0
        const maxAttempts = 5

        while (allScenes.length < totalScenes && attempts < maxAttempts) {
            attempts++
            const startFrom = allScenes.length + 1
            const remaining = totalScenes - allScenes.length

            console.log(`[Continue] Attempt ${attempts}: Need ${remaining} more scenes from ${startFrom}`)

            const continuePrompt = `Continue Episode "${episodeData.title}" - generate scenes ${startFrom} to ${totalScenes}
CONTEXT: ${episodeData.synopsis}
STYLE: ${styleKeywords}
DIALOGUE: ${dialogueLangLabel.toUpperCase()} ONLY
${characterBible}

Generate ${remaining} more scenes continuing the story.
Return JSON array ONLY:
{"scenes": [{"order": ${startFrom}, "title": "Scene ${startFrom}", "dialogue": "...", "promptText": "...", "duration": 8}]}
Return ONLY JSON.`

            try {
                const continueResult = await generateText(config, continuePrompt)
                const contMatch = continueResult.match(/\{[\s\S]*\}/)

                if (contMatch) {
                    const contData = JSON.parse(contMatch[0])
                    const newScenes = contData.scenes || []
                    console.log('[Continue] Got', newScenes.length, 'more scenes')
                    allScenes.push(...newScenes)
                }
            } catch (contError) {
                console.error('[Continue] Error:', contError)
                break // Stop trying, use what we have
            }
        }

        // Check if we have any scenes
        if (allScenes.length === 0) {
            return NextResponse.json({
                error: 'Không thể tạo scenes. Vui lòng thử lại.',
                details: 'No scenes generated'
            }, { status: 400 })
        }

        console.log('[Final] Total scenes:', allScenes.length, 'of', totalScenes, 'requested')

        // Save to database
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
                    scenes: { orderBy: { order: 'asc' } }
                }
            })

            console.log('=== EPISODE CREATED ===', episode.id, '|', episode.scenes.length, 'scenes')

            return NextResponse.json({ success: true, episode })
        } catch (dbError) {
            console.error('DB Error:', dbError)
            return NextResponse.json({
                error: 'Lỗi lưu vào database',
                details: String(dbError)
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Lỗi tạo episode', details: String(error) }, { status: 500 })
    }
}

// GET: List episodes
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
            include: { _count: { select: { scenes: true } } },
            orderBy: { episodeNumber: 'asc' }
        })

        return NextResponse.json({ episodes })
    } catch (error) {
        console.error('List error:', error)
        return NextResponse.json({ error: 'Failed to load episodes' }, { status: 500 })
    }
}
