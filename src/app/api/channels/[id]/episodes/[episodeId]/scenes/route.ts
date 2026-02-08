import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

// PUT - Update scenes (bulk reorder or single scene update)
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: channelId, episodeId } = await params
        const body = await request.json()

        // Verify ownership
        const channel = await prisma.channel.findFirst({
            where: { id: channelId, userId: session.user.id }
        })
        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Check if this is a reorder request
        if (body.reorder && Array.isArray(body.scenes)) {
            // Bulk reorder scenes
            const updatePromises = body.scenes.map((scene: { id: string; order: number }) =>
                prisma.episodeScene.update({
                    where: { id: scene.id },
                    data: { order: scene.order }
                })
            )
            await Promise.all(updatePromises)

            const updatedEpisode = await prisma.episode.findUnique({
                where: { id: episodeId },
                include: { scenes: { orderBy: { order: 'asc' } } }
            })

            return NextResponse.json(updatedEpisode)
        }

        // Single scene update
        if (body.sceneId) {
            const updatedScene = await prisma.episodeScene.update({
                where: { id: body.sceneId },
                data: {
                    title: body.title,
                    promptText: body.promptText,
                    duration: body.duration,
                    notes: body.notes,
                    isEdited: true
                }
            })
            return NextResponse.json(updatedScene)
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    } catch (error) {
        console.error('Error updating scenes:', error)
        return NextResponse.json({ error: 'Failed to update scenes' }, { status: 500 })
    }
}

// POST - Add new scene (with optional AI generation)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: channelId, episodeId } = await params
        const body = await request.json()

        // Verify ownership and get episode with scenes
        const channel = await prisma.channel.findFirst({
            where: { id: channelId, userId: session.user.id },
        })
        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        const episode = await prisma.episode.findUnique({
            where: { id: episodeId },
            include: { scenes: { orderBy: { order: 'asc' } } }
        })
        if (!episode) {
            return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
        }

        const insertPosition = body.insertAtOrder || (episode.scenes.length + 1)

        // Shift existing scenes
        const scenesToShift = episode.scenes.filter(s => s.order >= insertPosition)
        for (const scene of scenesToShift) {
            await prisma.episodeScene.update({
                where: { id: scene.id },
                data: { order: scene.order + 1 }
            })
        }

        // Check if AI generation is requested
        if (body.useAI && body.context) {
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '')
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

            // Get surrounding scenes for context
            const prevScene = episode.scenes.find(s => s.order === insertPosition - 1)
            const nextScene = episode.scenes.find(s => s.order === insertPosition)

            const prompt = `You are creating a NEW scene for a YouTube video script.

CHANNEL STYLE: ${channel.visualStyleKeywords || 'cinematic, photorealistic'}
EPISODE TOPIC: ${episode.title}

${prevScene ? `PREVIOUS SCENE (Scene ${prevScene.order}):
Title: ${prevScene.title}
PromptText: ${prevScene.promptText}` : 'This is the first scene.'}

${nextScene ? `NEXT SCENE (Scene ${nextScene.order}):
Title: ${nextScene.title}
PromptText: ${nextScene.promptText}` : 'This is the last scene.'}

USER REQUEST: ${body.context}

Generate a NEW scene that:
1. Fits smoothly between the previous and next scenes
2. Follows the same visual style and tone
3. Uses Vietnamese voiceover text

Return JSON format ONLY (no markdown):
{
  "title": "Scene title in Vietnamese",
  "promptText": "Detailed visual prompt with [VOICEOVER in Vietnamese: ...]. Include ENVIRONMENT, CAMERA, LIGHTING, STYLE, MOOD, AUDIO, PACING, LANGUAGE: Speak Vietnamese only. VOICE: consistent with other scenes.",
  "duration": 8
}
`

            const result = await model.generateContent(prompt)
            const responseText = result.response.text()

            // Parse AI response
            let aiScene
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/)
                if (jsonMatch) {
                    aiScene = JSON.parse(jsonMatch[0])
                }
            } catch (e) {
                console.error('Failed to parse AI response:', e)
            }

            if (aiScene) {
                const newScene = await prisma.episodeScene.create({
                    data: {
                        episode: { connect: { id: episodeId } },
                        order: insertPosition,
                        title: aiScene.title || `Scene ${insertPosition}`,
                        promptText: aiScene.promptText || '',
                        duration: aiScene.duration || 8,
                        isEdited: false
                    }
                })

                const updatedEpisode = await prisma.episode.findUnique({
                    where: { id: episodeId },
                    include: { scenes: { orderBy: { order: 'asc' } } }
                })

                return NextResponse.json({ scene: newScene, episode: updatedEpisode })
            }
        }

        // Manual scene creation (no AI)
        const newScene = await prisma.episodeScene.create({
            data: {
                episode: { connect: { id: episodeId } },
                order: insertPosition,
                title: body.title || `Scene ${insertPosition}`,
                promptText: body.promptText || '',
                duration: body.duration || 8,
                isEdited: false
            }
        })

        const updatedEpisode = await prisma.episode.findUnique({
            where: { id: episodeId },
            include: { scenes: { orderBy: { order: 'asc' } } }
        })

        return NextResponse.json({ scene: newScene, episode: updatedEpisode })
    } catch (error) {
        console.error('Error adding scene:', error)
        return NextResponse.json({ error: 'Failed to add scene' }, { status: 500 })
    }
}

// DELETE - Remove scene
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: channelId, episodeId } = await params
        const { searchParams } = new URL(request.url)
        const sceneId = searchParams.get('sceneId')

        if (!sceneId) {
            return NextResponse.json({ error: 'Scene ID required' }, { status: 400 })
        }

        // Verify ownership
        const channel = await prisma.channel.findFirst({
            where: { id: channelId, userId: session.user.id }
        })
        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Get scene order before deleting
        const sceneToDelete = await prisma.episodeScene.findUnique({
            where: { id: sceneId }
        })

        if (!sceneToDelete) {
            return NextResponse.json({ error: 'Scene not found' }, { status: 404 })
        }

        // Delete the scene
        await prisma.episodeScene.delete({
            where: { id: sceneId }
        })

        // Reorder remaining scenes
        const remainingScenes = await prisma.episodeScene.findMany({
            where: { episodeId: episodeId, order: { gt: sceneToDelete.order } },
            orderBy: { order: 'asc' }
        })

        for (const scene of remainingScenes) {
            await prisma.episodeScene.update({
                where: { id: scene.id },
                data: { order: scene.order - 1 }
            })
        }

        const updatedEpisode = await prisma.episode.findUnique({
            where: { id: episodeId },
            include: { scenes: { orderBy: { order: 'asc' } } }
        })

        return NextResponse.json(updatedEpisode)
    } catch (error) {
        console.error('Error deleting scene:', error)
        return NextResponse.json({ error: 'Failed to delete scene' }, { status: 500 })
    }
}
