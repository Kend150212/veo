import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lines, targetLanguage, targetLanguageName } = await req.json()

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
        return NextResponse.json({ error: 'lines is required' }, { status: 400 })
    }
    if (!targetLanguage) {
        return NextResponse.json({ error: 'targetLanguage is required' }, { status: 400 })
    }

    const aiConfig = await getAIConfigFromSettings(session.user.id)
    if (!aiConfig) {
        return NextResponse.json({ error: 'AI chưa được cấu hình. Hãy thêm API key trong Settings.' }, { status: 500 })
    }

    // Build numbered list for the AI to translate
    const numberedList = lines
        .map((line: string, i: number) => `[${i + 1}] ${line}`)
        .join('\n')

    const prompt = `You are a professional translator and voiceover scriptwriter.
Translate the following numbered voiceover/narration lines to ${targetLanguageName || targetLanguage}.

Rules:
- Keep the same tone, emotion, and pacing as the original
- Use natural, spoken language (not formal/written)
- Keep each translation roughly the same length in terms of speaking time
- Return ONLY a JSON array of translated strings in the same order
- Do NOT include the numbering in your output
- Do NOT add any explanation

Source lines:
${numberedList}

Return format (JSON array only, no markdown, no explanation):
["translated line 1", "translated line 2", ...]`

    try {
        const result = await generateText(aiConfig, prompt)

        // Parse JSON array from response
        const jsonMatch = result.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
            throw new Error('AI did not return a valid JSON array')
        }
        const translated: string[] = JSON.parse(jsonMatch[0])

        return NextResponse.json({ translated })
    } catch (error) {
        console.error('[Translate] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Translation failed' },
            { status: 500 }
        )
    }
}
