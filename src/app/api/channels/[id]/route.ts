import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Channel detail with episodes
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

        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id },
            include: {
                characters: true,
                episodes: {
                    include: {
                        scenes: {
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { episodeNumber: 'asc' }
                }
            }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        return NextResponse.json({ channel })
    } catch (error) {
        console.error('Get channel error:', error)
        return NextResponse.json({ error: 'Failed to load channel' }, { status: 500 })
    }
}

// PUT: Update channel settings
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const updates = await req.json()

        // Verify ownership
        const existing = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        const channel = await prisma.channel.update({
            where: { id },
            data: {
                name: updates.name,
                niche: updates.niche,
                knowledgeBase: updates.knowledgeBase,
                targetAudience: updates.targetAudience,
                contentStyle: updates.contentStyle,
                visualStyleId: updates.visualStyleId,
                visualStyleKeywords: updates.visualStyleKeywords,
                hasCharacters: updates.hasCharacters,
                suggestedCharCount: updates.suggestedCharCount,
                trendingChannels: updates.trendingChannels
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
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Verify ownership
        const existing = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        await prisma.channel.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete channel error:', error)
        return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 })
    }
}
