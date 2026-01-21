import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const { provider, apiKey, useExisting } = await request.json()

        let keyToTest = apiKey

        // If useExisting is true, get the key from database
        if (useExisting && session?.user?.id) {
            const settings = await prisma.userSettings.findUnique({
                where: { userId: session.user.id }
            })

            if (settings) {
                const keyMap: Record<string, string | null> = {
                    gemini: settings.geminiKey,
                    openai: settings.openaiKey,
                    deepseek: settings.deepseekKey,
                    anthropic: settings.anthropicKey
                }
                keyToTest = keyMap[provider]
            }
        }

        if (!keyToTest) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy API key' })
        }

        let success = false
        let error = ''

        switch (provider) {
            case 'gemini':
                try {
                    const genAI = new GoogleGenerativeAI(keyToTest)
                    // Use gemini-2.0-flash as the current model
                    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
                    await model.generateContent('Say hi')
                    success = true
                } catch (e: unknown) {
                    error = e instanceof Error ? e.message : 'Unknown error'
                    if (error.includes('API_KEY_INVALID')) {
                        error = 'API key không hợp lệ'
                    } else if (error.includes('not found')) {
                        error = 'Model không khả dụng, vui lòng thử model khác'
                    }
                }
                break

            case 'openai':
                try {
                    const res = await fetch('https://api.openai.com/v1/models', {
                        headers: { 'Authorization': `Bearer ${keyToTest}` }
                    })
                    success = res.ok
                    if (!res.ok) {
                        const data = await res.json()
                        error = data.error?.message || 'Invalid API key'
                    }
                } catch (e: unknown) {
                    error = e instanceof Error ? e.message : 'Connection failed'
                }
                break

            case 'deepseek':
                try {
                    const res = await fetch('https://api.deepseek.com/v1/models', {
                        headers: { 'Authorization': `Bearer ${keyToTest}` }
                    })
                    success = res.ok
                    if (!res.ok) error = 'Invalid API key'
                } catch (e: unknown) {
                    error = e instanceof Error ? e.message : 'Connection failed'
                }
                break

            case 'anthropic':
                try {
                    const res = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': keyToTest,
                            'anthropic-version': '2023-06-01'
                        },
                        body: JSON.stringify({
                            model: 'claude-3-haiku-20240307',
                            max_tokens: 10,
                            messages: [{ role: 'user', content: 'Hi' }]
                        })
                    })
                    // 200 = success, 400 = may be ok for minimal request, 401 = bad key
                    success = res.status === 200 || res.status === 400
                    if (res.status === 401) error = 'Invalid API key'
                } catch (e: unknown) {
                    error = e instanceof Error ? e.message : 'Connection failed'
                }
                break

            default:
                error = 'Unknown provider'
        }

        return NextResponse.json({ success, error })
    } catch (error) {
        console.error('Test key error:', error)
        return NextResponse.json({ success: false, error: 'Test failed' })
    }
}
