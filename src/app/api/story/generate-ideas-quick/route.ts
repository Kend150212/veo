import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText, GENRES, SCRIPT_LANGUAGES } from '@/lib/ai-story'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }

        const { genre, language = 'vi', description = '', sceneCount = 10 } = await req.json()

        if (!genre) {
            return NextResponse.json({ error: 'Vui lòng chọn thể loại' }, { status: 400 })
        }

        const config = await getAIConfigFromSettings(session.user.id)
        if (!config) {
            return NextResponse.json({ error: 'Chưa cấu hình API key' }, { status: 400 })
        }

        const genreInfo = GENRES.find(g => g.id === genre)
        const genreName = genreInfo?.nameEn || genre
        const languageInfo = SCRIPT_LANGUAGES.find(l => l.id === language)
        const languageName = languageInfo?.nameEn || 'Vietnamese'

        // Content safety block
        const CONTENT_SAFETY = `
CONTENT SAFETY (MUST FOLLOW):
- Family-friendly content suitable for all ages
- NO violence, weapons, blood, gore
- NO adult content, nudity, suggestive material
- NO drugs, alcohol, smoking
- NO hate speech, discrimination
- NO scary, disturbing imagery
- Positive, uplifting, educational messaging`

        const descriptionContext = description.trim()
            ? `USER'S DESCRIPTION/IDEA (use this as the main inspiration):\n"${description.trim()}"\n\n`
            : ''

        const prompt = `You are a professional creative screenwriter creating FAMILY-FRIENDLY video content.

Generate exactly 3 DIFFERENT creative story ideas for the genre: "${genreName}"
Language: ${languageName}
${descriptionContext}
Each idea should be UNIQUE and approach the theme from a different angle.

Return a JSON array with exactly 3 ideas:
[
    {
        "title": "Catchy title in ${languageName}",
        "logline": "One sentence summary (max 100 characters)",
        "tone": "Emotional tone (e.g., comedic, dramatic, heartwarming)",
        "visualStyle": "Visual style (e.g., cinematic, animation, documentary)",
        "hook": "Opening hook to grab attention",
        "keyMoments": ["moment1", "moment2", "moment3"],
        "targetAudience": "Who this appeals to"
    },
    {
        "title": "...",
        ...
    },
    {
        "title": "...",
        ...
    }
]

REQUIREMENTS:
1. Each idea must be DISTINCTLY DIFFERENT in approach
2. Idea 1: More conventional/safe approach
3. Idea 2: Creative/unexpected angle  
4. Idea 3: Bold/innovative concept
5. All ideas suitable for ${sceneCount} scenes
6. All in ${languageName}
${CONTENT_SAFETY}

Return ONLY valid JSON array, no markdown or explanations.`

        const result = await generateText(config, prompt)

        let ideas
        try {
            let cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            ideas = JSON.parse(cleanResult)
        } catch (parseError) {
            console.error('JSON parse error:', result)
            return NextResponse.json({ error: 'AI không thể tạo ý tưởng. Vui lòng thử lại.' }, { status: 400 })
        }

        if (!Array.isArray(ideas) || ideas.length === 0) {
            return NextResponse.json({ error: 'Không thể tạo ý tưởng' }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            ideas: ideas.slice(0, 3),
            genre,
            language
        })
    } catch (error) {
        console.error('Generate ideas quick error:', error)
        return NextResponse.json({ error: 'Không thể tạo ý tưởng' }, { status: 500 })
    }
}
