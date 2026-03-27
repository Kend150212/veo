import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: List avatar shots for a channel
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

        // Check channel ownership
        const channel = await prisma.channel.findFirst({
            where: {
                id,
                members: { some: { userId: session.user.id } }
            },
            include: {
                characters: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Parse avatar shots from each character's metadata
        const avatarShots = channel.characters.map(char => {
            let shots: Record<string, unknown>[] = []
            try {
                const meta = char.metadata ? JSON.parse(char.metadata as string) : {}
                shots = meta.avatarShots || []
            } catch { shots = [] }

            return {
                characterId: char.id,
                characterName: char.name,
                fullDescription: char.fullDescription,
                appearance: char.appearance,
                shots
            }
        })

        return NextResponse.json({ avatarShots })

    } catch (error) {
        console.error('Avatar GET error:', error)
        return NextResponse.json({ error: 'Failed to load avatars' }, { status: 500 })
    }
}

// POST: Save a generated avatar shot
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
        const { characterId, shotType, outfit, background, mood, prompt, imageUrl } = await req.json()

        if (!characterId || !shotType) {
            return NextResponse.json({ error: 'characterId và shotType là bắt buộc' }, { status: 400 })
        }

        // Check channel ownership
        const channel = await prisma.channel.findFirst({
            where: {
                id,
                members: { some: { userId: session.user.id } }
            }
        })
        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Get the character
        const character = await prisma.character.findFirst({
            where: { id: characterId, channelId: id }
        })
        if (!character) {
            return NextResponse.json({ error: 'Character not found' }, { status: 404 })
        }

        // Add new shot to character metadata
        let meta: Record<string, unknown> = {}
        try {
            meta = character.metadata ? JSON.parse(character.metadata as string) : {}
        } catch { meta = {} }

        const shots = (meta.avatarShots as Record<string, unknown>[]) || []
        const newShot = {
            id: `shot_${Date.now()}`,
            shotType,
            outfit: outfit || 'default',
            background: background || 'studio_white',
            mood: mood || 'natural',
            prompt,
            imageUrl: imageUrl || null,
            createdAt: new Date().toISOString()
        }
        shots.unshift(newShot) // New shots first

        meta.avatarShots = shots

        await prisma.character.update({
            where: { id: characterId },
            data: { metadata: JSON.stringify(meta) }
        })

        return NextResponse.json({ success: true, shot: newShot })

    } catch (error) {
        console.error('Avatar POST error:', error)
        return NextResponse.json({ error: 'Failed to save avatar shot' }, { status: 500 })
    }
}

// DELETE: Remove an avatar shot
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
        const { characterId, shotId } = await req.json()

        const character = await prisma.character.findFirst({
            where: { id: characterId, channelId: id }
        })
        if (!character) {
            return NextResponse.json({ error: 'Character not found' }, { status: 404 })
        }

        let meta: Record<string, unknown> = {}
        try {
            meta = character.metadata ? JSON.parse(character.metadata as string) : {}
        } catch { meta = {} }

        const shots = ((meta.avatarShots as Record<string, unknown>[]) || []).filter(
            (s: Record<string, unknown>) => s.id !== shotId
        )
        meta.avatarShots = shots

        await prisma.character.update({
            where: { id: characterId },
            data: { metadata: JSON.stringify(meta) }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Avatar DELETE error:', error)
        return NextResponse.json({ error: 'Failed to delete shot' }, { status: 500 })
    }
}
