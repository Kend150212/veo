import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateScenes, type Character } from '@/lib/ai-story'
import { getAIConfigFromSettings } from '@/lib/ai-config'

// GET project by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const project = await prisma.project.findFirst({
            where: {
                id,
                userId: session.user.id
            },
            include: {
                scenes: { orderBy: { order: 'asc' } },
                characters: true
            }
        })

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        return NextResponse.json({ project })
    } catch (error) {
        console.error('Get project error:', error)
        return NextResponse.json({ error: 'Failed to get project' }, { status: 500 })
    }
}

// POST generate scenes for project
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Get project with characters
        const project = await prisma.project.findFirst({
            where: { id, userId: session.user.id },
            include: { characters: true }
        })

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        // Get AI config from user settings (includes model selection)
        const aiConfig = await getAIConfigFromSettings(session.user.id)

        if (!aiConfig) {
            return NextResponse.json({
                error: 'Vui lòng cấu hình API key trong Cài đặt'
            }, { status: 400 })
        }

        // Get default scene settings
        const settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id }
        })

        // Delete existing scenes before regenerating
        await prisma.scene.deleteMany({
            where: { projectId: id }
        })

        // Update project status to generating
        await prisma.project.update({
            where: { id },
            data: { status: 'generating' }
        })

        // Convert Prisma characters to library format
        const characters: Character[] = project.characters.map(c => ({
            name: c.name,
            role: c.role,
            fullDescription: c.fullDescription,
            appearance: c.appearance || undefined,
            clothing: c.clothing || undefined,
            accessories: c.accessories || undefined
        }))

        // Generate scenes
        const scenes = await generateScenes(aiConfig, {
            storyOutline: project.storyOutline || project.description || '',
            sceneCount: project.totalScenes,
            characters,
            genre: project.genre,
            style: 'cinematic, photorealistic',
            duration: settings?.defaultSceneLength || 8
        })

        // Save scenes to database
        for (const scene of scenes) {
            await prisma.scene.create({
                data: {
                    order: scene.order,
                    title: scene.title,
                    promptText: scene.promptText,
                    hookType: scene.hookType,
                    duration: scene.duration,
                    projectId: project.id
                }
            })
        }

        // Update project status
        await prisma.project.update({
            where: { id },
            data: {
                status: 'completed',
                generatedScenes: scenes.length
            }
        })

        return NextResponse.json({
            success: true,
            scenesGenerated: scenes.length
        })
    } catch (error) {
        console.error('Generate scenes error:', error)

        // Update project status to error
        const { id } = await params
        await prisma.project.update({
            where: { id },
            data: { status: 'error' }
        }).catch(() => { })

        return NextResponse.json({ error: 'Failed to generate scenes' }, { status: 500 })
    }
}

// PUT update project
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { title, description, genre, storyOutline, totalScenes, characters } = body

        // Check project ownership
        const project = await prisma.project.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        // Update project
        const updatedProject = await prisma.project.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(genre && { genre }),
                ...(storyOutline !== undefined && { storyOutline }),
                ...(totalScenes && { totalScenes })
            }
        })

        // Update characters if provided
        if (characters && Array.isArray(characters)) {
            // Delete existing characters
            await prisma.character.deleteMany({
                where: { projectId: id }
            })

            // Create new characters
            for (const char of characters) {
                if (char.name && char.fullDescription) {
                    await prisma.character.create({
                        data: {
                            name: char.name,
                            role: char.role || 'supporting',
                            fullDescription: char.fullDescription,
                            appearance: char.appearance || null,
                            clothing: char.clothing || null,
                            accessories: char.accessories || null,
                            projectId: id
                        }
                    })
                }
            }
        }

        return NextResponse.json({ success: true, project: updatedProject })
    } catch (error) {
        console.error('Update project error:', error)
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    }
}

// DELETE project
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        await prisma.project.delete({
            where: {
                id,
                userId: session.user.id
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete project error:', error)
        return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
    }
}

