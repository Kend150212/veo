import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT: Update a character
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string; characterId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id, characterId } = await params
        const updates = await req.json()

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Update character
        const character = await prisma.channelCharacter.update({
            where: { id: characterId },
            data: {
                name: updates.name,
                role: updates.role,
                fullDescription: updates.fullDescription,
                appearance: updates.appearance,
                clothing: updates.clothing,
                skinTone: updates.skinTone,
                faceDetails: updates.faceDetails,
                hairDetails: updates.hairDetails,
                personality: updates.personality,
                voiceStyle: updates.voiceStyle,
                isMain: updates.isMain
            }
        })

        return NextResponse.json({ character })
    } catch (error) {
        console.error('Update character error:', error)
        return NextResponse.json({ error: 'Failed to update character' }, { status: 500 })
    }
}

// DELETE: Delete a character
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; characterId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id, characterId } = await params

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Delete character
        await prisma.channelCharacter.delete({
            where: { id: characterId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete character error:', error)
        return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 })
    }
}
