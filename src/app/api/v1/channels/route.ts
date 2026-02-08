import { NextResponse } from 'next/server'
import { authenticateApiRequest } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// GET: List all channels for authenticated user
export async function GET(request: Request) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized. Provide x-api-key header or valid session.' }, { status: 401 })
        }

        const channels = await prisma.channel.findMany({
            where: { userId: auth.userId },
            include: {
                _count: {
                    select: { episodes: true, characters: true }
                },
                characters: {
                    select: { id: true, name: true, role: true, isMain: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        })

        return NextResponse.json({
            channels,
            meta: {
                total: channels.length,
                authMethod: auth.method
            }
        })
    } catch (error) {
        console.error('List channels error:', error)
        return NextResponse.json({ error: 'Failed to load channels' }, { status: 500 })
    }
}

// POST: Create new channel
export async function POST(request: Request) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, niche, description, dialogueLanguage } = body

        if (!name || !niche) {
            return NextResponse.json({
                error: 'Missing required fields',
                required: ['name', 'niche'],
                optional: ['description', 'dialogueLanguage']
            }, { status: 400 })
        }

        const channel = await prisma.channel.create({
            data: {
                name,
                niche,
                description: description || null,
                dialogueLanguage: dialogueLanguage || 'vi',
                userId: auth.userId
            },
            include: {
                characters: true,
                _count: { select: { episodes: true } }
            }
        })

        return NextResponse.json({
            channel,
            message: 'Channel created successfully'
        }, { status: 201 })
    } catch (error) {
        console.error('Create channel error:', error)
        return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 })
    }
}
