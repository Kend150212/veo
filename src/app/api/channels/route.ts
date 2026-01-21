import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: List all channels for user
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const channels = await prisma.channel.findMany({
            where: { userId: session.user.id },
            include: {
                _count: {
                    select: { episodes: true, characters: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        })

        return NextResponse.json({ channels })
    } catch (error) {
        console.error('List channels error:', error)
        return NextResponse.json({ error: 'Failed to load channels' }, { status: 500 })
    }
}

// POST: Create new channel
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, niche } = await req.json()

        if (!name || !niche) {
            return NextResponse.json({ error: 'Vui lòng nhập tên kênh và ngách' }, { status: 400 })
        }

        const channel = await prisma.channel.create({
            data: {
                name,
                niche,
                userId: session.user.id
            }
        })

        return NextResponse.json({ channel })
    } catch (error) {
        console.error('Create channel error:', error)
        return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 })
    }
}
