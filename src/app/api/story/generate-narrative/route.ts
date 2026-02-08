import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateNarrativeScript, type NarrativeScriptInput } from '@/lib/ai-narrative'
import { getNarrativeTemplateSummaries } from '@/lib/narrative-templates'

// GET: List available narrative templates
export async function GET() {
    try {
        const templates = getNarrativeTemplateSummaries()
        return NextResponse.json({ templates })
    } catch (error) {
        console.error('Get templates error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to get templates'
        }, { status: 500 })
    }
}

// POST: Generate narrative script
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json() as NarrativeScriptInput

        // Validate required fields
        if (!body.topic || !body.duration || !body.templateId) {
            return NextResponse.json({
                error: 'Missing required fields: topic, duration, templateId'
            }, { status: 400 })
        }

        // Get AI config from user settings
        const aiConfig = await getAIConfigFromSettings(session.user.id)

        if (!aiConfig) {
            return NextResponse.json({
                error: 'Vui lòng cấu hình API key trong Cài đặt'
            }, { status: 400 })
        }

        const script = await generateNarrativeScript(aiConfig, {
            topic: body.topic,
            targetAudience: body.targetAudience,
            keyPoints: body.keyPoints,
            personalStory: body.personalStory,
            duration: body.duration,
            templateId: body.templateId,
            language: body.language || 'vi'
        })

        return NextResponse.json({ script })
    } catch (error) {
        console.error('Generate narrative script error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to generate narrative script'
        }, { status: 500 })
    }
}
