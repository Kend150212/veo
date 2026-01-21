import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET user settings
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id }
        })

        if (settings) {
            return NextResponse.json({
                settings: {
                    preferredAI: settings.preferredAI,
                    geminiModel: (settings as Record<string, unknown>).geminiModel || 'gemini-2.0-flash',
                    openaiModel: (settings as Record<string, unknown>).openaiModel || 'gpt-4o-mini',
                    deepseekModel: (settings as Record<string, unknown>).deepseekModel || 'deepseek-chat',
                    anthropicModel: (settings as Record<string, unknown>).anthropicModel || 'claude-3-haiku-20240307',
                    defaultSceneLength: settings.defaultSceneLength,
                    defaultAspectRatio: settings.defaultAspectRatio,
                    language: settings.language,
                    // Indicate which keys exist (for UI)
                    _hasGeminiKey: !!settings.geminiKey,
                    _hasOpenaiKey: !!settings.openaiKey,
                    _hasDeepseekKey: !!settings.deepseekKey,
                    _hasAnthropicKey: !!settings.anthropicKey
                }
            })
        }

        return NextResponse.json({ settings: null })
    } catch (error) {
        console.error('Get settings error:', error)
        return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
    }
}

// POST update settings
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Get existing settings
        const existing = await prisma.userSettings.findUnique({
            where: { userId: session.user.id }
        })

        // Build update data - only update keys if provided (not empty/undefined)
        const updateData: Record<string, unknown> = {
            preferredAI: body.preferredAI || existing?.preferredAI || 'gemini',
            defaultSceneLength: body.defaultSceneLength || existing?.defaultSceneLength || 8,
            defaultAspectRatio: body.defaultAspectRatio || existing?.defaultAspectRatio || '16:9',
            language: body.language || existing?.language || 'vi',
        }

        // Only update API keys if new values are provided
        if (body.geminiKey && body.geminiKey.length > 10) {
            updateData.geminiKey = body.geminiKey
        }
        if (body.openaiKey && body.openaiKey.length > 10) {
            updateData.openaiKey = body.openaiKey
        }
        if (body.deepseekKey && body.deepseekKey.length > 10) {
            updateData.deepseekKey = body.deepseekKey
        }
        if (body.anthropicKey && body.anthropicKey.length > 10) {
            updateData.anthropicKey = body.anthropicKey
        }

        // Update model selections
        if (body.geminiModel) updateData.geminiModel = body.geminiModel
        if (body.openaiModel) updateData.openaiModel = body.openaiModel
        if (body.deepseekModel) updateData.deepseekModel = body.deepseekModel
        if (body.anthropicModel) updateData.anthropicModel = body.anthropicModel

        const settings = await prisma.userSettings.upsert({
            where: { userId: session.user.id },
            update: updateData,
            create: {
                ...updateData,
                userId: session.user.id,
                geminiKey: body.geminiKey || null,
                openaiKey: body.openaiKey || null,
                deepseekKey: body.deepseekKey || null,
                anthropicKey: body.anthropicKey || null,
            } as Record<string, unknown>
        })

        return NextResponse.json({ success: true, settings })
    } catch (error) {
        console.error('Update settings error:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
