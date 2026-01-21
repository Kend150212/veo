import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateIdeas } from '@/lib/ai-story'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { genre, subject, action, scene, mood, style } = body

        // Get AI config from user settings
        const aiConfig = await getAIConfigFromSettings(session.user.id)

        if (!aiConfig) {
            return NextResponse.json({
                error: 'Vui lòng cấu hình API key trong Cài đặt'
            }, { status: 400 })
        }

        const ideas = await generateIdeas(aiConfig, { genre, subject, action, scene, mood, style })

        return NextResponse.json({ ideas })
    } catch (error) {
        console.error('Generate ideas error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to generate ideas'
        }, { status: 500 })
    }
}
