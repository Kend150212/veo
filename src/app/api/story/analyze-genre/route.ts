import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { analyzeGenre } from '@/lib/ai-story'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { subject, action, scene, mood } = body

        // Get AI config from user settings
        const aiConfig = await getAIConfigFromSettings(session.user.id)

        if (!aiConfig) {
            return NextResponse.json({
                error: 'Vui lòng cấu hình API key trong Cài đặt'
            }, { status: 400 })
        }

        const genres = await analyzeGenre(aiConfig, { subject, action, scene, mood })

        return NextResponse.json({ genres })
    } catch (error) {
        console.error('Analyze genre error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to analyze genre'
        }, { status: 500 })
    }
}
