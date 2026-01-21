import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'
import { prisma } from '@/lib/prisma'

// DELETE: Delete an episode
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id, episodeId } = await params

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Delete episode (scenes will cascade delete)
        await prisma.episode.delete({
            where: { id: episodeId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete episode error:', error)
        return NextResponse.json({ error: 'Failed to delete episode' }, { status: 500 })
    }
}

// POST: Translate episode dialogue to another language
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
        const { action, targetLanguage } = await req.json()

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Get episode with scenes
        const episode = await prisma.episode.findFirst({
            where: { id: episodeId, channelId: id },
            include: { scenes: { orderBy: { order: 'asc' } } }
        })

        if (!episode) {
            return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
        }

        // Get AI config
        const config = await getAIConfigFromSettings(session.user.id)
        if (!config) {
            return NextResponse.json({ error: 'Chưa cấu hình API key' }, { status: 400 })
        }

        if (action === 'translate') {
            // Translate all scenes
            const targetLangLabel = targetLanguage === 'en' ? 'English' : 'Vietnamese (tiếng Việt)'
            const sourceLangLabel = targetLanguage === 'en' ? 'Vietnamese' : 'English'

            const translatePrompt = `You are a professional translator. Translate the following video script scenes from ${sourceLangLabel} to ${targetLangLabel}.

IMPORTANT RULES:
1. Keep ALL visual descriptions, camera directions, style keywords in ENGLISH (do not translate these)
2. ONLY translate the DIALOGUE/SPOKEN parts (the words characters say)
3. Maintain the same tone, emotion, and meaning
4. Return ONLY valid JSON array

Current scenes:
${JSON.stringify(episode.scenes.map(s => ({
                id: s.id,
                order: s.order,
                title: s.title,
                promptText: s.promptText
            })), null, 2)}

Return JSON array with translated promptText for each scene:
[
    {
        "id": "scene_id",
        "promptText": "translated prompt with dialogue in ${targetLangLabel}"
    }
]

Return ONLY valid JSON array, no markdown.`

            const result = await generateText(config, translatePrompt)

            let translatedScenes
            try {
                const jsonMatch = result.match(/\[[\s\S]*\]/)
                if (jsonMatch) {
                    translatedScenes = JSON.parse(jsonMatch[0])
                } else {
                    throw new Error('No JSON found')
                }
            } catch {
                return NextResponse.json({ error: 'AI không thể dịch. Thử lại.' }, { status: 400 })
            }

            // Update scenes with translated text
            for (const ts of translatedScenes) {
                if (ts.id && ts.promptText) {
                    await prisma.episodeScene.update({
                        where: { id: ts.id },
                        data: { promptText: ts.promptText }
                    })
                }
            }

            // Update channel dialogue language
            await prisma.channel.update({
                where: { id },
                data: { dialogueLanguage: targetLanguage }
            })

            return NextResponse.json({
                success: true,
                message: `Đã dịch sang ${targetLangLabel}`,
                translatedCount: translatedScenes.length
            })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error) {
        console.error('Episode action error:', error)
        return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
    }
}
