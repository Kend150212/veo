import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'
import { prisma } from '@/lib/prisma'
import { getStyleById } from '@/lib/channel-styles'

// POST: Regenerate episode with new content
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id, episodeId } = await params

        // Get channel with characters
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id },
            include: { characters: true }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Get existing episode
        const existingEpisode = await prisma.episode.findFirst({
            where: { id: episodeId, channelId: id }
        })

        if (!existingEpisode) {
            return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
        }

        // Get AI config
        const config = await getAIConfigFromSettings(session.user.id)
        if (!config) {
            return NextResponse.json({ error: 'Chưa cấu hình API key' }, { status: 400 })
        }

        // Get visual style
        const visualStyle = channel.visualStyleId ? getStyleById(channel.visualStyleId) : null
        const styleKeywords = visualStyle?.promptKeywords || channel.visualStyleKeywords || 'cinematic, professional'

        // Build character bible
        const characterBible = channel.characters.length > 0
            ? `\n\nCHARACTER BIBLE (use VERBATIM in every scene):\n${channel.characters.map(c =>
                `[${c.name}] - ${c.role.toUpperCase()}:\n${c.fullDescription}`
            ).join('\n\n')}`
            : ''

        // Dialogue language
        const dialogueLang = channel.dialogueLanguage || 'vi'
        const langInstruction = dialogueLang === 'en'
            ? 'ALL dialogue and spoken text MUST be in ENGLISH. Do NOT mix Vietnamese and English.'
            : 'ALL dialogue and spoken text MUST be in VIETNAMESE (tiếng Việt). Do NOT mix English and Vietnamese.'
        const dialogueLangLabel = dialogueLang === 'en' ? 'English' : 'Vietnamese'

        const totalScenes = existingEpisode.totalScenes

        // Generate new content
        const episodePrompt = `You are a professional YouTube content creator and scriptwriter for the channel: "${channel.name}"
NICHE: ${channel.niche}
VISUAL STYLE: ${styleKeywords}
DIALOGUE LANGUAGE: ${dialogueLangLabel.toUpperCase()}
${characterBible}

REGENERATE Episode ${existingEpisode.episodeNumber} with ${totalScenes} scenes.
Create a COMPLETELY NEW and DIFFERENT story from before. Be creative and original.

IMPORTANT REQUIREMENTS:
1. STORY CONTINUITY: Create a coherent, flowing narrative
2. ENVIRONMENT CONTINUITY: Maintain consistent settings
3. DIALOGUE: Each scene MUST include natural dialogue
4. LANGUAGE CONSISTENCY: ${langInstruction}

Generate in JSON format:
{
    "title": "Catchy episode title",
    "synopsis": "2-3 sentence summary",
    "storyOutline": "Story arc outline",
    "topicIdea": "Main topic",
    "scenes": [
        {
            "order": 1,
            "title": "Scene 1",
            "dialogue": "Character dialogue in ${dialogueLangLabel}",
            "promptText": "[CHARACTER DESCRIPTION] [action] in [setting]. Speaking: [dialogue]. Style: ${styleKeywords}. Camera: [details]. Lighting: [details]. Mood: [mood]. Negative: flickering, blurry",
            "duration": 8
        }
    ]
}

CRITICAL: Generate EXACTLY ${totalScenes} scenes. ${langInstruction}

Return ONLY valid JSON, no markdown.`

        console.log('Regenerating episode:', existingEpisode.episodeNumber)
        const result = await generateText(config, episodePrompt)

        let episodeData
        try {
            const jsonMatch = result.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                episodeData = JSON.parse(jsonMatch[0])
            } else {
                throw new Error('No JSON found')
            }
        } catch {
            return NextResponse.json({ error: 'AI không thể tạo lại. Thử lại.' }, { status: 400 })
        }

        if (!episodeData.scenes || episodeData.scenes.length === 0) {
            return NextResponse.json({ error: 'AI tạo không có scenes. Thử lại.' }, { status: 400 })
        }

        // Delete old scenes
        await prisma.episodeScene.deleteMany({
            where: { episodeId }
        })

        // Update episode with new content
        const updatedEpisode = await prisma.episode.update({
            where: { id: episodeId },
            data: {
                title: episodeData.title || existingEpisode.title,
                synopsis: episodeData.synopsis || '',
                storyOutline: episodeData.storyOutline || '',
                topicIdea: episodeData.topicIdea || '',
                generatedScenes: episodeData.scenes.length,
                scenes: {
                    create: episodeData.scenes.map((scene: {
                        order?: number;
                        title?: string;
                        promptText?: string;
                        dialogue?: string;
                        duration?: number;
                    }, index: number) => ({
                        order: scene.order || index + 1,
                        title: scene.title || `Scene ${index + 1}`,
                        promptText: scene.promptText || scene.dialogue || 'Scene prompt',
                        duration: scene.duration || 8
                    }))
                }
            },
            include: {
                scenes: { orderBy: { order: 'asc' } }
            }
        })

        console.log('Episode regenerated:', updatedEpisode.id)

        return NextResponse.json({
            success: true,
            episode: updatedEpisode
        })

    } catch (error) {
        console.error('Regenerate episode error:', error)
        return NextResponse.json({ error: 'Failed to regenerate episode' }, { status: 500 })
    }
}
