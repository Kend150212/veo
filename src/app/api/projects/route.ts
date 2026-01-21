import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface CharacterInput {
    name: string
    role: string
    fullDescription: string
    appearance?: string
    clothing?: string
    accessories?: string
    personality?: string
    voiceStyle?: string
    skinTone?: string
    faceDetails?: string
    hairDetails?: string
}

// GET all projects for user
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const projects = await prisma.project.findMany({
            where: { userId: session.user.id },
            include: {
                _count: { select: { scenes: true } }
            },
            orderBy: { updatedAt: 'desc' }
        })

        return NextResponse.json({ projects })
    } catch (error) {
        console.error('Get projects error:', error)
        return NextResponse.json({ error: 'Failed to get projects' }, { status: 500 })
    }
}

// POST create new project
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            title,
            genre,
            visualStyle,
            selectedIdea,
            storyOutline,
            description,
            totalScenes,
            characters
        } = body

        // Create project
        const project = await prisma.project.create({
            data: {
                title,
                genre,
                visualStyle,
                selectedIdea,
                storyOutline,
                description,
                totalScenes: totalScenes || 10,
                status: 'draft',
                userId: session.user.id
            }
        })

        // Create characters if provided
        if (characters && Array.isArray(characters)) {
            for (const char of characters as CharacterInput[]) {
                if (char.name && char.fullDescription) {
                    await prisma.character.create({
                        data: {
                            name: char.name,
                            role: char.role || 'supporting',
                            fullDescription: char.fullDescription,
                            appearance: char.appearance,
                            clothing: char.clothing,
                            accessories: char.accessories,
                            personality: char.personality,
                            voiceStyle: char.voiceStyle,
                            projectId: project.id
                        }
                    })
                }
            }
        }

        return NextResponse.json({ project })
    } catch (error) {
        console.error('Create project error:', error)
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }
}
