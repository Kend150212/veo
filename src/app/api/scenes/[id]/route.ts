import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PATCH update scene
export async function PATCH(
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
        const { promptText, title, duration, notes } = body

        // Verify ownership through project
        const scene = await prisma.scene.findFirst({
            where: { id },
            include: { project: true }
        })

        if (!scene || scene.project.userId !== session.user.id) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        // Update scene
        const updated = await prisma.scene.update({
            where: { id },
            data: {
                promptText: promptText ?? scene.promptText,
                title: title !== undefined ? title : scene.title,
                duration: duration ?? scene.duration,
                notes: notes !== undefined ? notes : scene.notes,
                isEdited: true
            }
        })

        return NextResponse.json({ scene: updated })
    } catch (error) {
        console.error('Update scene error:', error)
        return NextResponse.json({ error: 'Failed to update scene' }, { status: 500 })
    }
}

// DELETE scene
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

        // Verify ownership through project
        const scene = await prisma.scene.findFirst({
            where: { id },
            include: { project: true }
        })

        if (!scene || scene.project.userId !== session.user.id) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        await prisma.scene.delete({ where: { id } })

        // Update project scene count
        await prisma.project.update({
            where: { id: scene.projectId },
            data: {
                generatedScenes: { decrement: 1 }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete scene error:', error)
        return NextResponse.json({ error: 'Failed to delete scene' }, { status: 500 })
    }
}
