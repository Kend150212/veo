import { NextResponse } from 'next/server'
import { authenticateApiRequest } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// GET: Get channel details
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const channel = await prisma.channel.findFirst({
            where: { id, userId: auth.userId },
            include: {
                characters: true,
                episodes: {
                    include: {
                        scenes: { orderBy: { order: 'asc' } }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                _count: { select: { episodes: true, characters: true } }
            }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        return NextResponse.json({ channel })
    } catch (error) {
        console.error('Get channel error:', error)
        return NextResponse.json({ error: 'Failed to get channel' }, { status: 500 })
    }
}

// PUT: Update channel
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()

        // Verify ownership
        const existing = await prisma.channel.findFirst({
            where: { id, userId: auth.userId }
        })
        if (!existing) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        const channel = await prisma.channel.update({
            where: { id },
            data: {
                name: body.name ?? existing.name,
                niche: body.niche ?? existing.niche,
                description: body.description ?? existing.description,
                dialogueLanguage: body.dialogueLanguage ?? existing.dialogueLanguage,
                knowledgeBase: body.knowledgeBase ?? existing.knowledgeBase
            }
        })

        return NextResponse.json({ channel })
    } catch (error) {
        console.error('Update channel error:', error)
        return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 })
    }
}

// DELETE: Delete channel
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Verify ownership
        const existing = await prisma.channel.findFirst({
            where: { id, userId: auth.userId }
        })
        if (!existing) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        await prisma.channel.delete({ where: { id } })

        return NextResponse.json({ message: 'Channel deleted successfully' })
    } catch (error) {
        console.error('Delete channel error:', error)
        return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 })
    }
}
