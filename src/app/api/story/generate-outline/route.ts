import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateStoryOutline, type StoryIdea, type Character } from '@/lib/ai-story'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { idea, userDescription, sceneCount, characters } = body as {
            idea: StoryIdea
            userDescription?: string
            sceneCount: number
            characters: Character[]
        }

        // Get AI config from user settings
        const aiConfig = await getAIConfigFromSettings(session.user.id)

        if (!aiConfig) {
            return NextResponse.json({
                error: 'Vui lòng cấu hình API key trong Cài đặt'
            }, { status: 400 })
        }

        const outline = await generateStoryOutline(aiConfig, {
            idea,
            userDescription,
            sceneCount,
            characters
        })

        return NextResponse.json({ outline })
    } catch (error) {
        console.error('Generate outline error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to generate outline'
        }, { status: 500 })
    }
}
