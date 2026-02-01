import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: List all continuity styles for a channel
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: channelId } = await params

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
            where: { id: channelId, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        const styles = await prisma.continuityStyle.findMany({
            where: { channelId },
            include: {
                _count: { select: { episodes: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({
            styles,
            defaultStyleId: channel.defaultContinuityStyleId
        })
    } catch (error) {
        console.error('List continuity styles error:', error)
        return NextResponse.json({ error: 'Failed to load styles' }, { status: 500 })
    }
}

// POST: Create new continuity style
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: channelId } = await params
        const body = await req.json()

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

        // Validate required fields
        if (!name || !palette || !lighting || !cameraStyle || !visualStyle) {
            return NextResponse.json({
                error: 'Missing required fields: name, palette, lighting, cameraStyle, visualStyle'
            }, { status: 400 })
        }

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
            where: { id: channelId, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Create the style
        const style = await prisma.continuityStyle.create({
            data: {
                name,
                subjectDefault: subjectDefault || null,
                palette,
                environment: environment || null,
                lighting,
                cameraStyle,
                visualStyle,
                audioMood: audioMood || null,
                channelId
            }
        })

        // Set as default if requested or if it's the first style
        if (setAsDefault || !channel.defaultContinuityStyleId) {
            await prisma.channel.update({
                where: { id: channelId },
                data: { defaultContinuityStyleId: style.id }
            })
        }

        return NextResponse.json({ style })
    } catch (error) {
        console.error('Create continuity style error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: `Failed to create style: ${errorMessage}` }, { status: 500 })
    }
}
