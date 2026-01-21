import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText, GENRES, SCRIPT_LANGUAGES } from '@/lib/ai-story'
import {
    generateStoryCombination,
    STORY_ARCHETYPES,
    STORY_SETTINGS,
    CHARACTER_TYPES,
    CONFLICT_TYPES,
    STORY_THEMES,
    EMOTIONAL_TONES,
    OPENING_HOOKS,
    getRandomElements
} from '@/lib/idea-bank'

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

        // Generate 3 UNIQUE random story combinations from Idea Bank
        const combo1 = generateStoryCombination()
        const combo2 = generateStoryCombination()
        const combo3 = generateStoryCombination()

        // Get additional random elements for variety
        const randomSettings = getRandomElements(STORY_SETTINGS, 5)
        const randomCharacters = getRandomElements(CHARACTER_TYPES, 5)
        const randomConflicts = getRandomElements(CONFLICT_TYPES, 5)

        // Content safety block
        const CONTENT_SAFETY = `
CONTENT SAFETY (MUST FOLLOW):
- Family-friendly content suitable for all ages
- NO violence, weapons, blood, gore
- NO adult content, nudity, suggestive material
- NO drugs, alcohol, smoking
- NO hate speech, discrimination
- NO scary, disturbing imagery
- Positive, uplifting, educational messaging
- NO MINORS/CHILDREN under 18 years old - ALL characters must be adults (18+)
- Never include children, teenagers, or minors in any scenes
- If story needs young characters, use animated/cartoon style for non-realistic depiction`

        const descriptionContext = description.trim()
            ? `USER'S DESCRIPTION/IDEA (combine with the random elements below):\n"${description.trim()}"\n\n`
            : ''

        // Build inspiration from random combinations
        const prompt = `You are a professional creative screenwriter creating FAMILY-FRIENDLY video content.

Generate exactly 3 WILDLY DIFFERENT creative story ideas for the genre: "${genreName}"
Language: ${languageName}
${descriptionContext}

USE THESE RANDOM STORY ELEMENTS AS INSPIRATION (mix and match creatively):

=== IDEA 1 SEED ===
- Story Structure: ${combo1.archetype.name} - ${combo1.archetype.description}
- Setting: ${combo1.setting.name} (${combo1.setting.keywords})
- Main Character: ${combo1.character.name} - ${combo1.character.background}
- Central Conflict: ${combo1.conflict.name} - ${combo1.conflict.description}
- Theme: ${combo1.theme.name} - ${combo1.theme.message}
- Emotional Tone: ${combo1.tone.name}
- Opening Hook Style: ${combo1.hook.name} - ${combo1.hook.description}

=== IDEA 2 SEED ===
- Story Structure: ${combo2.archetype.name} - ${combo2.archetype.description}
- Setting: ${combo2.setting.name} (${combo2.setting.keywords})
- Main Character: ${combo2.character.name} - ${combo2.character.background}
- Central Conflict: ${combo2.conflict.name} - ${combo2.conflict.description}
- Theme: ${combo2.theme.name} - ${combo2.theme.message}
- Emotional Tone: ${combo2.tone.name}
- Opening Hook Style: ${combo2.hook.name} - ${combo2.hook.description}

=== IDEA 3 SEED ===
- Story Structure: ${combo3.archetype.name} - ${combo3.archetype.description}
- Setting: ${combo3.setting.name} (${combo3.setting.keywords})
- Main Character: ${combo3.character.name} - ${combo3.character.background}
- Central Conflict: ${combo3.conflict.name} - ${combo3.conflict.description}
- Theme: ${combo3.theme.name} - ${combo3.theme.message}
- Emotional Tone: ${combo3.tone.name}
- Opening Hook Style: ${combo3.hook.name} - ${combo3.hook.description}

=== ADDITIONAL VARIETY OPTIONS ===
Settings to consider: ${randomSettings.map(s => s.name).join(', ')}
Character types: ${randomCharacters.map(c => c.name).join(', ')}
Possible conflicts: ${randomConflicts.map(c => c.name).join(', ')}

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
    }
]

REQUIREMENTS:
1. Each idea MUST use the random seeds provided - DO NOT ignore them
2. Idea 1: Use Idea 1 Seed elements creatively
3. Idea 2: Use Idea 2 Seed elements creatively  
4. Idea 3: Use Idea 3 Seed elements creatively
5. All ideas suitable for ${sceneCount} scenes
6. All in ${languageName}
7. Make each story COMPLETELY DIFFERENT - different settings, characters, tones
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
