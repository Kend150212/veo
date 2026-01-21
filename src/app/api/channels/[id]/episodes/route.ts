import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'
import { prisma } from '@/lib/prisma'
import { getStyleById } from '@/lib/channel-styles'

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

        // Get channel with characters
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id },
            include: {
                characters: true,
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
            ? `\n\nCHARACTER BIBLE (use VERBATIM in every scene):\n${channel.characters.map(c =>
                `[${c.name}] - ${c.role.toUpperCase()}:\n${c.fullDescription}`
            ).join('\n\n')}`
            : ''

        // AI Generate episode content
        const episodePrompt = `You are a professional YouTube content creator and scriptwriter for the channel: "${channel.name}"
NICHE: ${channel.niche}
${channel.targetAudience ? `TARGET AUDIENCE: ${channel.targetAudience}` : ''}
VISUAL STYLE: ${styleKeywords}
${characterBible}

Create Episode ${nextEpisodeNumber} with ${totalScenes} scenes.
${knowledgeBase.episodeIdeas && knowledgeBase.episodeIdeas.length > 0
                ? `\nInspired by these topic ideas (pick one or create similar):\n${knowledgeBase.episodeIdeas.map((e: { title: string; synopsis: string }, i: number) => `${i + 1}. ${e.title}: ${e.synopsis}`).join('\n')}`
                : ''}

IMPORTANT REQUIREMENTS:
1. STORY CONTINUITY: Create a coherent, flowing narrative where each scene logically follows the previous
2. ENVIRONMENT CONTINUITY: Maintain consistent setting/location descriptions across scenes. If scene moves to new location, describe the transition
3. DIALOGUE: Each scene MUST include natural dialogue (what characters say) that advances the story
4. CHARACTER ACTIONS: Describe what characters are doing, their expressions, body language

Generate a complete episode in JSON format:
{
    "title": "Catchy episode title in Vietnamese",
    "synopsis": "2-3 sentence episode summary",
    "storyOutline": "Detailed story arc: beginning -> development -> climax -> resolution",
    "topicIdea": "Main topic/theme of this episode",
    "mainLocation": "Primary setting for this episode",
    "scenes": [
        {
            "order": 1,
            "title": "Scene 1: Opening",
            "dialogue": "Character dialogue in Vietnamese for this scene (what they say)",
            "promptText": "[CHARACTER DESCRIPTION VERBATIM] [specific action and expression] in [detailed environment matching mainLocation]. Speaking: [key dialogue phrase]. Style: ${styleKeywords}. Camera: [camera movement]. Lighting: [lighting]. Mood: [emotional tone]. Negative: flickering, blurry, distorted",
            "duration": 8,
            "hookType": "opening",
            "environmentDetails": "Detailed description of the scene's environment/setting"
        }
    ]
}

CRITICAL RULES:
1. Generate EXACTLY ${totalScenes} scenes that form a COMPLETE STORY with beginning, middle, and end
2. If channel has characters, include their FULL DESCRIPTION VERBATIM at the start of each promptText
3. Every promptText MUST include the visual style keywords: "${styleKeywords}"
4. DIALOGUE is MANDATORY - each scene must have meaningful dialogue that fits the story
5. ENVIRONMENT must be consistent - describe the same location consistently or clearly show transitions
6. Scene flow must be SEAMLESS - each scene should naturally connect to the next
7. promptText should describe character actions, expressions, and speaking the dialogue
8. All text in Vietnamese
9. Create engaging content appropriate for YouTube

Return ONLY valid JSON, no markdown.`

        const result = await generateText(config, episodePrompt)

        // Parse response
        let episodeData
        try {
            const jsonMatch = result.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                episodeData = JSON.parse(jsonMatch[0])
            } else {
                throw new Error('No JSON found')
            }
        } catch (parseError) {
            console.error('Parse error:', parseError)
            return NextResponse.json({ error: 'AI không thể tạo episode. Thử lại.' }, { status: 400 })
        }

        // Create episode in database
        const episode = await prisma.episode.create({
            data: {
                episodeNumber: nextEpisodeNumber,
                title: episodeData.title || `Episode ${nextEpisodeNumber}`,
                synopsis: episodeData.synopsis,
                storyOutline: episodeData.storyOutline,
                topicIdea: episodeData.topicIdea,
                totalScenes: totalScenes,
                generatedScenes: episodeData.scenes?.length || 0,
                status: episodeData.scenes?.length > 0 ? 'completed' : 'draft',
                channelId: id,
                scenes: {
                    create: (episodeData.scenes || []).map((scene: {
                        order: number;
                        title?: string;
                        promptText: string;
                        duration?: number;
                        hookType?: string;
                    }) => ({
                        order: scene.order,
                        title: scene.title,
                        promptText: scene.promptText,
                        duration: scene.duration || 8,
                        hookType: scene.hookType
                    }))
                }
            },
            include: {
                scenes: {
                    orderBy: { order: 'asc' }
                }
            }
        })

        return NextResponse.json({
            success: true,
            episode
        })

    } catch (error) {
        console.error('Generate episode error:', error)
        return NextResponse.json({ error: 'Failed to generate episode' }, { status: 500 })
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
