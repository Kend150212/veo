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
            voiceOverMode = 'with_host',
            voiceGender = 'auto',
            voiceTone = 'warm',
            categoryId = null  // Danh mục episode (tùy chọn)
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

        // Voice settings mapping
        const voiceGenderLabel = voiceGender === 'male' ? 'Male voice (giọng nam)' : voiceGender === 'female' ? 'Female voice (giọng nữ)' : 'any gender voice'
        const toneMap: Record<string, string> = {
            'warm': 'warm and friendly',
            'professional': 'professional and authoritative',
            'energetic': 'energetic and enthusiastic',
            'calm': 'calm and soothing',
            'serious': 'serious and news-like'
        }
        const voiceToneLabel = toneMap[voiceTone] || 'warm and friendly'

        // Build voice over mode instruction
        let voiceOverInstr = ''
        if (voiceOverMode === 'with_host') {
            voiceOverInstr = `CONTENT TYPE: With host/character on screen speaking dialogue.
CRITICAL - VOICE GENDER CONSISTENCY:
- Determine host gender from character description (woman/man, female/male, nữ/nam)
- Include "VOICE: Female voice (giọng nữ)" or "VOICE: Male voice (giọng nam)" at the END of EVERY promptText
- ALL scenes MUST use the SAME voice gender matching the host
- If host is female (woman, female, phụ nữ, cô gái): ALWAYS use "VOICE: Female voice (giọng nữ)"
- If host is male (man, male, nam, anh): ALWAYS use "VOICE: Male voice (giọng nam)"`
        } else if (voiceOverMode === 'voice_over') {
            voiceOverInstr = `CONTENT TYPE: VOICE OVER NARRATION (no character on screen).
- Generate narration/script text in the "voiceover" field 
- The "promptText" should describe B-Roll visuals that match the narration
- NO character on screen, only visuals with voice over
- VOICE SETTINGS: ${voiceGenderLabel}, ${voiceToneLabel} tone
- Include "VOICE: ${voiceGenderLabel}, ${voiceToneLabel}" at the end of each promptText`
        } else {
            voiceOverInstr = `CONTENT TYPE: B-ROLL ONLY (pure visuals, no dialogue).
- The "voiceover" field should be empty or minimal ambient text
- Focus entirely on visual storytelling in "promptText"
- This is silent/music-only video`
        }

        // Generate episode with YouTube content
        const fullPrompt = `Create Episode ${nextEpisodeNumber} with EXACTLY ${totalScenes} scenes for channel "${channel.name}"

CHANNEL INFO:
- Niche: ${channel.niche}
- Visual Style: ${styleKeywords}
- Language: ${dialogueLangLabel.toUpperCase()} ONLY

${characterBible || '(No host/characters for this episode)'}
${existingEpisodesSummary}
${customContentInstr}

🎬 ${voiceOverInstr}
📢 CHANNEL MENTION: ${channelMentionInstr}
📣 CTA: ${ctaInstruction}

═══════════════════════════════════════
EPISODE STRUCTURE (MUST FOLLOW):
═══════════════════════════════════════
• Opening (Scene 1-3): Host introduction + Hook question + Preview what viewers will learn
• Content Blocks (60% of scenes): Main content divided into clear sections with B-Roll
• Mid-video CTA (after 40%): Subscribe/Like reminder
• Tips/Insights (20% of scenes): Practical advice with specific examples
• Summary + Closing (Last 3-5 scenes): Key takeaways + Engage (comment question) + Goodbye

═══════════════════════════════════════
SCENE FORMAT (EVERY SCENE MUST HAVE):
═══════════════════════════════════════
{
    "order": number,
    "title": "Scene title",
    "duration": 8,
    "voiceover": "18-25 words narration in ${dialogueLangLabel}. Natural, conversational tone.",
    "promptText": "See format below"
}

PROMPTTEXT FORMAT (EXACT):
[VOICEOVER in ${dialogueLangLabel}: {voiceover text here}]. [${characterBible ? 'Character name: Full appearance description with clothing, expression, gesture' : 'Subject description'}]. ENVIRONMENT: {detailed location, set pieces, props}. CAMERA: {shot type}, {lens: 35mm/50mm/85mm}, {angle: eye-level/low/high}. LIGHTING: {type: soft/dramatic/natural}, {direction}, {color temperature}. STYLE: ${styleKeywords}. MOOD: {emotional tone}. AUDIO: {background sounds, music type}. LANGUAGE: Speak ${dialogueLangLabel} only.

═══════════════════════════════════════
EXAMPLE OF PERFECT SCENE:
═══════════════════════════════════════
{
    "order": 7,
    "title": "Thu nhập ngành nail",
    "duration": 8,
    "voiceover": "Thu nhập đa dạng. Thợ mới có lương cơ bản và tiền boa. Thợ lành nghề có thể kiếm từ 40,000 đến 70,000 đô la một năm.",
    "promptText": "[VOICEOVER in Vietnamese: Thu nhập đa dạng. Thợ mới có lương cơ bản và tiền boa. Thợ lành nghề có thể kiếm từ 40,000 đến 70,000 đô la một năm.]. [Visual representation of money, with a subtle graphic illustrating the income range: $40,000 - $70,000.]. ENVIRONMENT: Clean graphic design, easily readable. CAMERA: Static shot, clear and concise. LIGHTING: Bright, well-lit graphic. STYLE: ${styleKeywords}. MOOD: Informative and appealing. AUDIO: Upbeat, positive sound effect. LANGUAGE: Speak Vietnamese only."
}

═══════════════════════════════════════
CRITICAL RULES:
═══════════════════════════════════════
1. VOICEOVER = What host SAYS (natural, conversational)
2. PROMPTTEXT = Visual description for video AI (MUST include voiceover at start)
3. ${characterBible ? `⚠️⚠️⚠️ CHARACTER DESCRIPTION - ABSOLUTELY MANDATORY:
   - NEVER write just "[LEO_REAL]" or "[CHARACTER_NAME]" alone - this is WRONG!
   - NEVER write "A character" or any generic descriptions
   - ALWAYS include FULL DESCRIPTION every single time: [NAME: age, ethnicity, hair, outfit, accessories, expression, action]
   - ✅ CORRECT: [LEO_REAL: 25yo Hispanic male, short curly black hair, wearing mustard yellow hoodie with 'LEO' on it, silver glasses. He is sitting on the couch reading a book]
   - ❌ WRONG: [LEO_REAL] sitting on the couch
   - ❌ WRONG: [LEO_REAL] standing in his apartment
   - Copy the FULL character details from CHARACTER BIBLE into EVERY scene with that person
   - The video AI cannot see previous scenes, so REPEAT full description EVERY time` : 'Use detailed visual subjects'}
4. Mix Host scenes (60%) and B-Roll scenes (40%) for visual variety
5. B-Roll scenes = NO character, pure visual/animation/graphics only
6. Include SPECIFIC facts/numbers when discussing income, statistics
7. Smooth transitions between scenes
8. CTA scenes should feel natural, not forced
9. ALL text/voiceover in ${dialogueLangLabel.toUpperCase()} ONLY

Return JSON:
{
    "title": "Episode title in ${dialogueLangLabel}",
    "synopsis": "Brief summary",
    "storyOutline": "Story arc",
    "topicIdea": "Theme",
    "scenes": [... ${totalScenes} scenes ...],
    "youtubeTitle": "SEO title with hook (60 chars) in ${dialogueLangLabel}",
    "youtubeDescription": "Description with keywords (300-500 chars) in ${dialogueLangLabel}",
    "youtubeTags": ["tag1", "tag2", "...up to 15 tags"],
    "thumbnailPrompt": "Thumbnail with 3-8 HOOK WORDS overlay"
}

Generate ALL ${totalScenes} scenes. Return ONLY valid JSON.`

        let episodeData: EpisodeData = { title: '', synopsis: '', storyOutline: '', topicIdea: '', scenes: [] }
        let allScenes: SceneData[] = []

        try {
            console.log('[Gen] Generating episode...')
            const result = await generateText(config, fullPrompt)

            const jsonMatch = result.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No JSON in response')
            }

            // Sanitize JSON string to fix common issues
            let jsonStr = jsonMatch[0]
            // Remove control characters
            jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, ' ')
            // Remove trailing commas before } or ]
            jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1')

            let parseSuccess = false

            // Try 1: Direct parse
            try {
                episodeData = JSON.parse(jsonStr)
                parseSuccess = true
            } catch {
                console.log('[Gen] First parse failed, trying cleanup...')
            }

            // Try 2: More aggressive cleanup
            if (!parseSuccess) {
                try {
                    jsonStr = jsonMatch[0]
                        .replace(/[\x00-\x1F\x7F]/g, ' ')
                        .replace(/\n/g, ' ')
                        .replace(/\r/g, ' ')
                        .replace(/\t/g, ' ')
                        .replace(/,(\s*[}\]])/g, '$1')
                    episodeData = JSON.parse(jsonStr)
                    parseSuccess = true
                } catch {
                    console.log('[Gen] Second parse failed, trying scene extraction...')
                }
            }

            // Try 3: Extract scenes individually (last resort for long responses)
            if (!parseSuccess) {
                console.log('[Gen] Attempting individual scene extraction...')
                // Match individual scene objects
                const sceneMatches = result.matchAll(/\{[^{}]*"order"\s*:\s*\d+[^{}]*\}/g)
                const extractedScenes: SceneData[] = []

                for (const match of sceneMatches) {
                    try {
                        const sceneStr = match[0].replace(/[\x00-\x1F\x7F]/g, ' ')
                        const scene = JSON.parse(sceneStr) as SceneData
                        if (scene.order) {
                            extractedScenes.push(scene)
                        }
                    } catch {
                        // Skip invalid scenes
                    }
                }

                if (extractedScenes.length > 0) {
                    console.log('[Gen] Extracted', extractedScenes.length, 'scenes individually')
                    // Extract title and other metadata with regex
                    const titleMatch = result.match(/"title"\s*:\s*"([^"]+)"/)
                    episodeData = {
                        title: titleMatch?.[1] || `Episode ${nextEpisodeNumber}`,
                        synopsis: '',
                        storyOutline: '',
                        topicIdea: '',
                        scenes: extractedScenes.sort((a, b) => a.order - b.order)
                    }
                    parseSuccess = true
                }
            }

            if (!parseSuccess) {
                throw new Error('Could not parse JSON response after all attempts')
            }

            allScenes = episodeData.scenes || []
            console.log('[Gen] Got', allScenes.length, 'scenes')

        } catch (error) {
            console.error('[Gen] Error:', error)
            return NextResponse.json({
                error: 'Không thể tạo episode. AI trả về format không hợp lệ. Vui lòng thử với 20-30 scenes thay vì 50.',
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

⚠️⚠️⚠️ CRITICAL FORMAT RULES:
1. NEVER write just "[LEO_REAL]" or "[CHARACTER_NAME]" alone - ALWAYS include FULL description
2. ✅ CORRECT: [LEO_REAL: 25yo Hispanic male, short curly black hair, wearing mustard yellow hoodie with 'LEO' on it, silver glasses. He is doing something]
3. ❌ WRONG: [LEO_REAL] doing something
4. ❌ WRONG: INT. LOCATION screenplay format
5. Each scene must have: [VOICEOVER in ${dialogueLangLabel}: text]. [Character with FULL description OR B-Roll visual]. ENVIRONMENT: X. CAMERA: X. LIGHTING: X. STYLE: X. MOOD: X. AUDIO: X.

Generate ${remaining} more scenes (scene ${startFrom} to ${totalScenes}).
Return JSON: {"scenes": [{"order": ${startFrom}, "title": "Scene Title", "voiceover": "what is said", "promptText": "FULL formatted prompt with character descriptions", "duration": 8}]}
Return ONLY valid JSON.`

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
                    categoryId: categoryId || null,  // Danh mục episode
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
                            // Add language specification for voiceover
                            const langTag = dialogueLang === 'en' ? 'English' : 'Vietnamese'
                            const fullPrompt = voiceContent
                                ? `[VOICEOVER in ${langTag}: ${voiceContent}]. ${visualPrompt}. LANGUAGE: Speak ${langTag} only.`
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
