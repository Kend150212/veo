import { NextResponse } from 'next/server'
import { authenticateApiRequest } from '@/lib/api-auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'
import { prisma } from '@/lib/prisma'
import { getStyleById } from '@/lib/channel-styles'
import { checkApiLimit, checkEpisodeLimit, incrementApiUsage, incrementEpisodeUsage } from '@/lib/subscription-guard'

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
    youtubeStrategies?: {
        titles: string[]
        description: string
        tags: string[]
        thumbnails: string[]
    }
}

/**
 * GET: List episodes for a channel
 * 
 * Returns all episodes with their scenes, ordered by creation date (newest first).
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!auth) {
            return NextResponse.json({
                error: 'Unauthorized',
                message: 'Provide x-api-key header with valid API key'
            }, { status: 401 })
        }

        // Check API limit for external API calls only
        if (auth.method === 'api-key') {
            const apiCheck = await checkApiLimit(auth.userId)
            if (!apiCheck.allowed) {
                return NextResponse.json({ error: apiCheck.error, code: 'LIMIT_EXCEEDED' }, { status: 403 })
            }
            await incrementApiUsage(auth.userId)
        }

        const { id: channelId } = await params

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
            where: { id: channelId, userId: auth.userId }
        })
        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        const episodes = await prisma.episode.findMany({
            where: { channelId },
            include: {
                scenes: { orderBy: { order: 'asc' } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({
            episodes,
            total: episodes.length,
            channelId
        })
    } catch (error) {
        console.error('List episodes error:', error)
        return NextResponse.json({ error: 'Failed to list episodes' }, { status: 500 })
    }
}

/**
 * POST: Create a new episode with AI-generated content
 * 
 * This endpoint uses AI to generate a complete video episode including:
 * - Episode title and synopsis
 * - Individual scene prompts for video generation
 * - Optional YouTube metadata (titles, description, tags)
 * 
 * The AI will analyze the channel's niche, style, and characters to create
 * content that matches the channel's brand.
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!auth) {
            return NextResponse.json({
                error: 'Unauthorized',
                message: 'Provide x-api-key header with valid API key'
            }, { status: 401 })
        }

        // Check episode limit
        const episodeCheck = await checkEpisodeLimit(auth.userId)
        if (!episodeCheck.allowed) {
            return NextResponse.json({ error: episodeCheck.error, code: 'LIMIT_EXCEEDED' }, { status: 403 })
        }

        // Check API limit for external API calls only
        if (auth.method === 'api-key') {
            const apiCheck = await checkApiLimit(auth.userId)
            if (!apiCheck.allowed) {
                return NextResponse.json({ error: apiCheck.error, code: 'LIMIT_EXCEEDED' }, { status: 403 })
            }
            await incrementApiUsage(auth.userId)
        }

        const { id: channelId } = await params

        // Parse request body with detailed documentation
        const body = await request.json()

        // Required field
        const topicIdea = body.topicIdea || body.topic || body.title
        if (!topicIdea) {
            return NextResponse.json({
                error: 'Missing required field: topicIdea',
                message: 'Provide the main topic or title for the episode',
                example: { topicIdea: 'The Mystery of the Bermuda Triangle' }
            }, { status: 400 })
        }

        // Optional parameters with defaults
        const {
            // Content options
            totalScenes = 10,                    // Number of scenes (5-20 recommended)
            customContent = null,                // Pre-scraped content to base episode on

            // Style options
            cinematicStyle = null,               // Visual style: cinematic_documentary, psychological_drama, etc.
            voiceOverMode = 'with_host',         // 'with_host' | 'narrator_only' | 'no_voice'
            voiceGender = 'auto',                // 'auto' | 'male' | 'female'
            voiceTone = 'warm',                  // 'warm' | 'energetic' | 'calm' | 'mysterious' | 'professional'

            // Character options
            useCharacters = true,                // Include channel's characters
            selectedCharacterIds = [],           // Specific character IDs to use
            adaptCharactersToScript = false,     // Let AI adjust characters to fit script

            // Organization
            categoryId = null,                   // Category ID for episode grouping

            // YouTube optimization
            generateYoutubeStrategies = true,    // Generate YT titles, description, tags

            // Advanced options
            visualHookEnabled = true,            // Dynamic visual hooks
            emotionalCurveEnabled = true,        // Emotional narrative arc
            musicMode = 'with_music',            // 'with_music' | 'ambient_only'
            mentionChannel = false,              // Mention channel name in content

            // Narrative options
            narrativeTemplateId = null,          // 'storytelling' | 'documentary' | 'tutorial' | 'review' | 'vlog'
            narrativeKeyPoints = [],             // Key points to cover
            narrativeWithHost = false            // Include host character in narrative
        } = body

        // Get channel with characters
        const channel = await prisma.channel.findFirst({
            where: { id: channelId, userId: auth.userId },
            include: {
                characters: true,
                episodes: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: { title: true, topicIdea: true }
                }
            }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Get AI configuration
        const aiConfig = await getAIConfigFromSettings(auth.userId)
        if (!aiConfig) {
            return NextResponse.json({
                error: 'AI not configured',
                message: 'Configure AI API keys in Settings first'
            }, { status: 400 })
        }

        // Get visual style if specified
        const visualStyle = cinematicStyle ? getStyleById(cinematicStyle) : null

        // Build characters context
        let charactersToUse = useCharacters ? channel.characters : []
        if (selectedCharacterIds.length > 0) {
            charactersToUse = channel.characters.filter(c => selectedCharacterIds.includes(c.id))
        }

        const charactersContext = charactersToUse.length > 0
            ? charactersToUse.map(c =>
                `- ${c.name} (${c.role}): ${c.personality}${c.appearance ? `, Appearance: ${c.appearance}` : ''}`
            ).join('\n')
            : ''

        // Build the AI prompt
        const prompt = buildEpisodePrompt({
            topicIdea,
            customContent,
            channel,
            totalScenes,
            cinematicStyle: visualStyle?.name || cinematicStyle,
            voiceOverMode,
            voiceGender,
            voiceTone,
            charactersContext,
            generateYoutubeStrategies,
            visualHookEnabled,
            emotionalCurveEnabled,
            musicMode,
            mentionChannel,
            narrativeTemplateId,
            narrativeKeyPoints,
            narrativeWithHost,
            dialogueLanguage: channel.dialogueLanguage || 'vi'
        })

        // Generate episode with AI
        const response = await generateText(aiConfig, prompt)

        // Get next episode number
        const lastEpisode = await prisma.episode.findFirst({
            where: { channelId },
            orderBy: { episodeNumber: 'desc' },
            select: { episodeNumber: true }
        })
        const episodeNumber = (lastEpisode?.episodeNumber || 0) + 1

        // Parse the AI response
        let episodeData: EpisodeData
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
            const jsonStr = jsonMatch ? jsonMatch[1] : response
            episodeData = JSON.parse(jsonStr)
        } catch {
            return NextResponse.json({
                error: 'AI response parsing failed',
                rawResponse: response.substring(0, 500)
            }, { status: 500 })
        }

        // Create episode in database
        const scenesData = episodeData.scenes.map((scene, index) => ({
            order: scene.order || index + 1,
            title: scene.title || `Scene ${index + 1}`,
            promptText: scene.promptText || '',
            dialogue: scene.dialogue || null,
            voiceover: scene.voiceover || null,
            duration: scene.duration || 8
        }))

        const episode = await prisma.episode.create({
            data: {
                episodeNumber,
                title: episodeData.title,
                synopsis: episodeData.synopsis || '',
                topicIdea,
                storyOutline: episodeData.storyOutline || '',
                totalScenes: scenesData.length,
                generatedScenes: scenesData.length,
                channelId,
                categoryId: categoryId || null,
                metadata: JSON.stringify({
                    cinematicStyle,
                    voiceOverMode,
                    voiceGender,
                    voiceTone,
                    youtubeStrategies: episodeData.youtubeStrategies,
                    generatedVia: 'api-v1',
                    authMethod: auth.method
                }),
                scenes: {
                    create: scenesData
                }
            }
        })

        // Get created scenes
        const createdScenes = await prisma.episodeScene.findMany({
            where: { episodeId: episode.id },
            orderBy: { order: 'asc' }
        })

        return NextResponse.json({
            success: true,
            episode: {
                id: episode.id,
                episodeNumber: episode.episodeNumber,
                title: episode.title,
                synopsis: episode.synopsis,
                scenesCount: createdScenes.length,
                scenes: createdScenes,
                youtubeStrategies: episodeData.youtubeStrategies
            },
            meta: {
                channelId,
                channelName: channel.name,
                generatedAt: new Date().toISOString(),
                settings: {
                    totalScenes,
                    cinematicStyle,
                    voiceOverMode
                }
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Create episode error:', error)
        return NextResponse.json({
            error: 'Failed to create episode',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

/**
 * Build the AI prompt for episode generation
 */
function buildEpisodePrompt(options: {
    topicIdea: string
    customContent: string | null
    channel: { name: string; niche: string; knowledgeBase?: string | null; dialogueLanguage?: string }
    totalScenes: number
    cinematicStyle: string | null
    voiceOverMode: string
    voiceGender: string
    voiceTone: string
    charactersContext: string
    generateYoutubeStrategies: boolean
    visualHookEnabled: boolean
    emotionalCurveEnabled: boolean
    musicMode: string
    mentionChannel: boolean
    narrativeTemplateId: string | null
    narrativeKeyPoints: string[]
    narrativeWithHost: boolean
    dialogueLanguage: string
}): string {
    const {
        topicIdea,
        customContent,
        channel,
        totalScenes,
        cinematicStyle,
        voiceOverMode,
        voiceGender,
        voiceTone,
        charactersContext,
        generateYoutubeStrategies,
        visualHookEnabled,
        emotionalCurveEnabled,
        musicMode,
        mentionChannel,
        dialogueLanguage
    } = options

    return `You are a professional video script writer. Create a ${totalScenes}-scene video episode.

CHANNEL INFO:
- Name: ${channel.name}
- Niche: ${channel.niche}
${channel.knowledgeBase ? `- Brand Guidelines: ${channel.knowledgeBase.substring(0, 500)}` : ''}
${mentionChannel ? '- Mention the channel name naturally in the script' : ''}

TOPIC: ${topicIdea}
${customContent ? `\nCONTENT TO ADAPT:\n${customContent.substring(0, 3000)}` : ''}

STYLE REQUIREMENTS:
- Cinematic Style: ${cinematicStyle || 'documentary'}
- Voice Over: ${voiceOverMode}
- Voice Gender: ${voiceGender}
- Voice Tone: ${voiceTone}
- Music: ${musicMode}
- Dialogue Language: ${dialogueLanguage === 'vi' ? 'Vietnamese' : 'English'}
${visualHookEnabled ? '- Include strong visual hooks in first 3 scenes' : ''}
${emotionalCurveEnabled ? '- Build emotional arc throughout the episode' : ''}

${charactersContext ? `CHARACTERS TO INCLUDE:\n${charactersContext}\n` : ''}

OUTPUT FORMAT (JSON):
\`\`\`json
{
  "title": "Compelling episode title",
  "synopsis": "2-3 sentence summary",
  "storyOutline": "Brief story structure",
  "scenes": [
    {
      "order": 1,
      "title": "Scene title",
      "promptText": "[VOICEOVER: Narrator speaks here...] ENVIRONMENT: Describe the visual scene for video generation. CAMERA: Camera movement. STYLE: Visual style notes.",
      "dialogue": "Any dialogue between characters",
      "voiceover": "Narrator script for this scene",
      "duration": 8
    }
  ]${generateYoutubeStrategies ? `,
  "youtubeStrategies": {
    "titles": ["Title option 1", "Title option 2", "Title option 3"],
    "description": "YouTube video description with timestamps",
    "tags": ["tag1", "tag2", "tag3", "...up to 15 tags"]
  }` : ''}
}
\`\`\`

Create exactly ${totalScenes} scenes. Each scene's promptText should be detailed enough for AI video generation (Veo, Sora, etc).`
}

/**
 * DELETE: Delete an episode
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: channelId } = await params
        const url = new URL(request.url)
        const episodeId = url.searchParams.get('episodeId')

        if (!episodeId) {
            return NextResponse.json({
                error: 'Missing episodeId query parameter',
                example: 'DELETE /api/v1/channels/{channelId}/episodes?episodeId={episodeId}'
            }, { status: 400 })
        }

        // Verify ownership
        const episode = await prisma.episode.findFirst({
            where: {
                id: episodeId,
                channel: { id: channelId, userId: auth.userId }
            }
        })

        if (!episode) {
            return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
        }

        await prisma.episode.delete({ where: { id: episodeId } })

        return NextResponse.json({
            success: true,
            message: 'Episode deleted successfully',
            deletedId: episodeId
        })
    } catch (error) {
        console.error('Delete episode error:', error)
        return NextResponse.json({ error: 'Failed to delete episode' }, { status: 500 })
    }
}
