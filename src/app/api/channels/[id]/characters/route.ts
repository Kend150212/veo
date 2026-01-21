import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: Add character to channel
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
        const characterData = await req.json()

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        const character = await prisma.channelCharacter.create({
            data: {
                name: characterData.name,
                role: characterData.role || 'host',
                fullDescription: characterData.fullDescription,
                appearance: characterData.appearance,
                clothing: characterData.clothing,
                skinTone: characterData.skinTone,
                faceDetails: characterData.faceDetails,
                hairDetails: characterData.hairDetails,
                personality: characterData.personality,
                voiceStyle: characterData.voiceStyle,
                isMain: characterData.isMain || false,
                channelId: id
            }
        })

        return NextResponse.json({ character })
    } catch (error) {
        console.error('Add character error:', error)
        return NextResponse.json({ error: 'Failed to add character' }, { status: 500 })
    }
}

// GET: List characters for channel
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

        const characters = await prisma.channelCharacter.findMany({
            where: { channelId: id },
            orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }]
        })

        return NextResponse.json({ characters })
    } catch (error) {
        console.error('List characters error:', error)
        return NextResponse.json({ error: 'Failed to load characters' }, { status: 500 })
    }
}
