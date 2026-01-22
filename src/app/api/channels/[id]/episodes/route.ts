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
    voiceover?: string
    duration?: number
    hookType?: string
}

interface EpisodeData {
    title: string
    synopsis: string
    storyOutline: string
    topicIdea: string
    scenes: SceneData[]
    // YouTube content
    youtubeTitle?: string
    youtubeDescription?: string
    youtubeTags?: string[]
    thumbnailPrompt?: string
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
        const {
            totalScenes = 10,
            useCharacters = true,
            selectedCharacterIds = [],
            selectedStyleId = null,
            mentionChannel = false,
            ctaMode = 'random',
            selectedCTAs = [],
            customContent = null,
            voiceOverMode = 'with_host'
        } = await req.json()

        // CTA options
        const CTA_MAP: Record<string, string> = {
            subscribe: 'Subscribe to the channel',
            like: 'Like this video',
            comment: 'Leave a comment',
            share: 'Share with friends',
            bell: 'Turn on notifications',
            watch_more: 'Watch more videos'
        }

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

        // Get visual style - use selected or channel default
        const styleId = selectedStyleId || channel.visualStyleId
        const visualStyle = styleId ? getStyleById(styleId) : null
        const styleKeywords = visualStyle?.promptKeywords || channel.visualStyleKeywords || 'cinematic, professional'

        // Parse knowledge base
        let knowledgeBase: { episodeIdeas?: { title: string; synopsis: string }[] } = {}
        try {
            knowledgeBase = channel.knowledgeBase ? JSON.parse(channel.knowledgeBase) : {}
        } catch { }

        const nextEpisodeNumber = channel._count.episodes + 1

        // Build character bible based on selection
        let characterBible = ''
        if (useCharacters && channel.characters.length > 0) {
            // Filter characters if specific ones selected
            const charsToUse = selectedCharacterIds.length > 0
                ? channel.characters.filter((c: { id: string }) => selectedCharacterIds.includes(c.id))
                : channel.characters

            if (charsToUse.length > 0) {
                characterBible = `\nCHARACTER BIBLE:\n${charsToUse.map((c: { name: string; role: string; fullDescription: string }) =>
                    `[${c.name}] - ${c.role}: ${c.fullDescription}`
                ).join('\n')}`
            }
        }

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
        console.log('Use Characters:', useCharacters, '| Selected:', selectedCharacterIds.length || 'all')
        console.log('Style:', styleId || 'default')
        console.log('Mention Channel:', mentionChannel, '| CTA Mode:', ctaMode)

        // Build channel mention instruction
        const channelMentionInstr = mentionChannel
            ? `IMPORTANT: Naturally mention the channel name "${channel.name}" 1-2 times in the script dialogue (opening or ending).`
            : 'Do NOT mention any channel name in the dialogue.'

        // Build CTA instruction
        let ctaInstruction = ''
        if (ctaMode === 'random') {
            ctaInstruction = 'Include 1-2 natural CTAs (subscribe, like, comment, share) at appropriate moments in the script.'
        } else if (selectedCTAs.length > 0) {
            const ctaTexts = selectedCTAs.map((id: string) => CTA_MAP[id] || id).join(', ')
            ctaInstruction = `Include these specific CTAs naturally in the script: ${ctaTexts}`
        } else {
            ctaInstruction = 'No CTA needed in this episode.'
        }

        // Build custom content instruction
        const customContentInstr = customContent
            ? `\n\n📋 USER PROVIDED CONTENT - CREATE SCRIPT BASED ON THIS:\n"""\n${customContent.substring(0, 3000)}\n"""\nIMPORTANT: The script MUST be based on the above content. Extract key points and create engaging scenes from it.`
            : ''

        // Build voice over mode instruction
        let voiceOverInstr = ''
        if (voiceOverMode === 'with_host') {
            voiceOverInstr = 'CONTENT TYPE: With host/character on screen speaking dialogue.'
        } else if (voiceOverMode === 'voice_over') {
            voiceOverInstr = `CONTENT TYPE: VOICE OVER NARRATION (no character on screen).
- Generate narration/script text in the "dialogue" field 
- The "promptText" should describe B-Roll visuals that match the narration
- NO character on screen, only visuals with voice over`
        } else {
            voiceOverInstr = `CONTENT TYPE: B-ROLL ONLY (pure visuals, no dialogue).
- The "dialogue" field should be empty or minimal ambient text
- Focus entirely on visual storytelling in "promptText"
- This is silent/music-only video`
        }

        // Generate episode with YouTube content
        const fullPrompt = `Create Episode ${nextEpisodeNumber} with ${totalScenes} scenes for channel "${channel.name}"
NICHE: ${channel.niche}
VISUAL STYLE: ${styleKeywords}
DIALOGUE LANGUAGE: ${dialogueLangLabel.toUpperCase()}
${characterBible || '(No host/characters for this episode)'}
${existingEpisodesSummary}
${customContentInstr}

🎬 ${voiceOverInstr}

📢 CHANNEL MENTION: ${channelMentionInstr}
📣 CTA: ${ctaInstruction}

IMPORTANT - EACH SCENE MUST HAVE DETAILED PROMPT:
Return JSON with this EXACT structure:
{
    "title": "Episode title in ${dialogueLangLabel}",
    "synopsis": "Brief summary",
    "storyOutline": "Story arc",
    "topicIdea": "Theme",
    "scenes": [
        {
            "order": 1,
            "title": "Scene title",
            "duration": 8,
            "voiceover": "REQUIRED: 18-25 words narration/dialogue in ${dialogueLangLabel}. This is what the host SAYS.",
            "promptText": "DETAILED VISUAL DESCRIPTION - Must include ALL of these elements:\\n- SUBJECT: ${characterBible ? 'Full character description (appearance, clothing, expression, pose)' : 'Main subject with full visual details'}\\n- ACTION: What is happening, gestures, movements\\n- ENVIRONMENT: Location details, set pieces, props\\n- CAMERA: Movement type (dolly/pan/static/tracking), lens (24mm/35mm/50mm/85mm), angle (eye-level/high/low)\\n- LIGHTING: Type (natural/studio/cinematic), direction, shadows, color temperature\\n- STYLE: ${styleKeywords}\\n- MOOD: Emotional tone\\n- AUDIO: Background sounds, SFX"
        }
    ],
    "youtubeTitle": "SEO-optimized title with hook (60 chars max) in ${dialogueLangLabel}",
    "youtubeDescription": "Engaging description with keywords (300-500 chars) in ${dialogueLangLabel}",
    "youtubeTags": ["tag1", "tag2", "...up to 15 tags"],
    "thumbnailPrompt": "Thumbnail description with 3-8 HOOK WORDS as text overlay"
}

EXAMPLE OF GOOD SCENE promptText:
"${characterBible ? '[Full host description: Vietnamese woman, 28 years old, long black hair, wearing professional blue blazer, warm smile, confident posture]' : 'Close-up of'} standing at modern news desk, gesturing towards floating graphics showing energy bills. CAMERA: Slow dolly in, 35mm lens, eye-level. LIGHTING: Soft studio key light from left, fill light, warm 5600K. ENVIRONMENT: Professional studio with LED screens, minimal decoration. STYLE: ${styleKeywords}. MOOD: Informative yet warm. AUDIO: Soft ambient office sounds, subtle news music."

CRITICAL RULES:
1. voiceover field = WHAT HOST SAYS (dialogue/narration script)
2. promptText field = VISUAL DESCRIPTION for AI video generation
3. ${characterBible ? 'Include FULL character appearance in EVERY scene promptText' : 'Use descriptive visual subjects'}
4. Include camera, lighting, environment details in EVERY promptText
5. ALL dialogue/voiceover must be in ${dialogueLangLabel.toUpperCase()}

Generate ALL ${totalScenes} scenes with RICH DETAILED prompts. Return ONLY valid JSON.`

        let episodeData: EpisodeData
        let allScenes: SceneData[] = []

        try {
            console.log('[Gen] Generating episode...')
            const result = await generateText(config, fullPrompt)

            const jsonMatch = result.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No JSON in response')
            }

            episodeData = JSON.parse(jsonMatch[0])
            allScenes = episodeData.scenes || []
            console.log('[Gen] Got', allScenes.length, 'scenes')

        } catch (error) {
            console.error('[Gen] Error:', error)
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

            console.log(`[Continue] Need ${remaining} more scenes from ${startFrom}`)

            const continuePrompt = `Continue Episode "${episodeData.title}" - generate scenes ${startFrom} to ${totalScenes}
CONTEXT: ${episodeData.synopsis}
STYLE: ${styleKeywords}
DIALOGUE: ${dialogueLangLabel.toUpperCase()} ONLY
${characterBible}

Generate ${remaining} more scenes.
Return JSON: {"scenes": [{"order": ${startFrom}, "title": "Scene ${startFrom}", "dialogue": "...", "promptText": "...", "duration": 8}]}
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
                break
            }
        }

        if (allScenes.length === 0) {
            return NextResponse.json({
                error: 'Không thể tạo scenes. Vui lòng thử lại.',
                details: 'No scenes generated'
            }, { status: 400 })
        }

        console.log('[Final] Total scenes:', allScenes.length)

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
                    // Store YouTube content in metadata field (as JSON)
                    metadata: JSON.stringify({
                        youtubeTitle: episodeData.youtubeTitle || '',
                        youtubeDescription: episodeData.youtubeDescription || '',
                        youtubeTags: episodeData.youtubeTags || [],
                        thumbnailPrompt: episodeData.thumbnailPrompt || '',
                        styleUsed: styleId || channel.visualStyleId || 'default',
                        charactersUsed: useCharacters ? (selectedCharacterIds.length || 'all') : 'none'
                    }),
                    scenes: {
                        create: allScenes.map((scene, index) => {
                            // Combine voiceover/dialogue into promptText for complete scene info
                            const voiceContent = scene.voiceover || scene.dialogue || ''
                            const visualPrompt = scene.promptText || 'Scene visual description'
                            const fullPrompt = voiceContent
                                ? `[VOICEOVER: ${voiceContent}]\n\n${visualPrompt}`
                                : visualPrompt

                            return {
                                order: scene.order || index + 1,
                                title: scene.title || `Scene ${index + 1}`,
                                promptText: fullPrompt,
                                duration: scene.duration || 8,
                                hookType: scene.hookType || null
                            }
                        })
                    }
                },
                include: {
                    scenes: { orderBy: { order: 'asc' } }
                }
            })

            console.log('=== EPISODE CREATED ===', episode.id)

            // Parse metadata back for response
            const metadata = episode.metadata ? JSON.parse(episode.metadata as string) : {}

            return NextResponse.json({
                success: true,
                episode: {
                    ...episode,
                    youtubeTitle: metadata.youtubeTitle,
                    youtubeDescription: metadata.youtubeDescription,
                    youtubeTags: metadata.youtubeTags,
                    thumbnailPrompt: metadata.thumbnailPrompt
                }
            })
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
