import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Get a specific continuity style
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string; styleId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: channelId, styleId } = await params

        const style = await prisma.continuityStyle.findFirst({
            where: {
                id: styleId,
                channelId,
                channel: { userId: session.user.id }
            },
            include: {
                _count: { select: { episodes: true } }
            }
        })

        if (!style) {
            return NextResponse.json({ error: 'Style not found' }, { status: 404 })
        }

        return NextResponse.json({ style })
    } catch (error) {
        console.error('Get continuity style error:', error)
        return NextResponse.json({ error: 'Failed to load style' }, { status: 500 })
    }
}

// PUT: Update a continuity style
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string; styleId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: channelId, styleId } = await params
        const body = await req.json()

        // Verify ownership
        const existing = await prisma.continuityStyle.findFirst({
            where: {
                id: styleId,
                channelId,
                channel: { userId: session.user.id }
            }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Style not found' }, { status: 404 })
        }

        const {
            name,
            subjectDefault,
            palette,
            environment,
            lighting,
            cameraStyle,
            visualStyle,
            audioMood,
            setAsDefault
        } = body

        const style = await prisma.continuityStyle.update({
            where: { id: styleId },
            data: {
                name: name ?? existing.name,
                subjectDefault: subjectDefault ?? existing.subjectDefault,
                palette: palette ?? existing.palette,
                environment: environment ?? existing.environment,
                lighting: lighting ?? existing.lighting,
                cameraStyle: cameraStyle ?? existing.cameraStyle,
                visualStyle: visualStyle ?? existing.visualStyle,
                audioMood: audioMood ?? existing.audioMood
            }
        })

        // Update default if requested
        if (setAsDefault) {
            await prisma.channel.update({
                where: { id: channelId },
                data: { defaultContinuityStyleId: styleId }
            })
        }

        return NextResponse.json({ style })
    } catch (error) {
        console.error('Update continuity style error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: `Failed to update style: ${errorMessage}` }, { status: 500 })
    }
}

// DELETE: Delete a continuity style
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; styleId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: channelId, styleId } = await params

        // Verify ownership
        const existing = await prisma.continuityStyle.findFirst({
            where: {
                id: styleId,
                channelId,
                channel: { userId: session.user.id }
            }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Style not found' }, { status: 404 })
        }

        // If this is the default style, clear the default
        const channel = await prisma.channel.findFirst({
            where: { id: channelId }
        })

        if (channel?.defaultContinuityStyleId === styleId) {
            await prisma.channel.update({
                where: { id: channelId },
                data: { defaultContinuityStyleId: null }
            })
        }

        // Delete the style (episodes will have their continuityStyleId set to null via onDelete: SetNull)
        await prisma.continuityStyle.delete({
            where: { id: styleId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete continuity style error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: `Failed to delete style: ${errorMessage}` }, { status: 500 })
    }
}
