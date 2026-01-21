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

        const { genre, language = 'vi', sceneCount = 10, description = '', visualStyle = '' } = await req.json()

        if (!genre) {
            return NextResponse.json({ error: 'Vui lòng chọn thể loại' }, { status: 400 })
        }

        const config = await getAIConfigFromSettings(session.user.id)
        if (!config) {
            return NextResponse.json({ error: 'Chưa cấu hình API key' }, { status: 400 })
        }

        // Get genre info
        const genreInfo = GENRES.find(g => g.id === genre)
        const genreName = genreInfo?.nameEn || genre
        const languageInfo = SCRIPT_LANGUAGES.find(l => l.id === language)
        const languageName = languageInfo?.nameEn || 'Vietnamese'

        // Special prompts for Jellytoon/Edutainment genres
        const isJellytoonGenre = ['jellytoon', 'edutainment', 'bio-adventure', 'health'].includes(genre)

        // Content safety block - append to all prompts
        const CONTENT_SAFETY = `

MANDATORY CONTENT SAFETY RULES (MUST FOLLOW):
- This is for FAMILY-FRIENDLY educational/entertainment content only
- NO violence, blood, gore, or injury descriptions
- NO weapons, fighting, or harmful actions
- NO adult content, nudity, or suggestive material
- NO drugs, alcohol, smoking, or substance references
- NO hate speech, discrimination, or offensive content
- NO scary, horror, or disturbing imagery
- All characters must wear APPROPRIATE, MODEST clothing
- Use POSITIVE, uplifting, and educational messaging
- Focus on HEALTHY lifestyle choices and behaviors
- Content suitable for ALL AGES including children
- Humor should be CLEAN and WHOLESOME
- Scientific accuracy for educational value`

        // Description context for personalized generation
        const descriptionContext = description.trim()
            ? `\nUSER'S STORY DESCRIPTION/IDEA (use this as the main direction):\n"${description.trim()}"\n`
            : ''

        // Visual style context
        const visualStyleContext = visualStyle.trim()
            ? `\nVISUAL STYLE (MUST APPLY TO ALL SCENES):\n${visualStyle.trim()}\n`
            : ''

        let prompt: string

        if (isJellytoonGenre) {
            // Specialized Jellytoon/Bio-Adventure prompt
            prompt = `You are an expert Pixar-style animation screenwriter creating FAMILY-FRIENDLY EDUTAINMENT content for all ages.

IMPORTANT: This content must be 100% safe and appropriate for children and families.
${descriptionContext}${visualStyleContext}
Create a COMPLETE dual-world Jellytoon video story about: ${genreName}

JELLYTOON STYLE REQUIREMENTS:
- Soft, squishy, jelly-like 3D characters with exaggerated expressions
- Vibrant candy-like colors with subsurface scattering (like gummy bears)
- Bouncy, elastic movements and physics
- Pixar-quality 3D rendering with 8K UHD, 9:16 vertical format
- Comedic timing with visual gags and slapstick humor

DUAL-WORLD STRUCTURE:
1. REAL WORLD: Main human character in everyday situations (kitchen, bathroom, gym, etc.)
2. BIO-SPACE: Inside the body where personified organs react to what happens in real world

REQUIRED BIO-SPACE CHARACTERS (pick 3-4):
- BIO_PULSE: Red heart character with top hat, dramatic personality
- BIO_TWINS: Cloud-shaped twin lungs with sneakers, athletic and encouraging
- BIO_GASTRO: Gelatinous stomach blob with chef hat, nervous and dramatic
- BIO_BRAIN: Glowing brain with glasses, intellectual but panicky
- BIO_LIVER: Purple liver character with lab coat, chemistry expert
- MOB_ENEMY: Whatever threatens health (germs, sugar crystals, capsaicin sparks, etc.)
- RESCUE_SQUAD: Chibi EMT white blood cells

Language: ${languageName}

Generate a JSON response with this structure:
{
    "title": "Catchy funny title in ${languageName}",
    "subject": "Main human character description (name, age, ethnicity, clothing color, distinguishing features)",
    "action": "Everyday activity that triggers internal body chaos",
    "scene": "Real world location with modern, hyper-realistic details",
    "mood": "Comedic, chaotic, educational",
    "style": "Jellytoon 3D, Pixar-style, 8K UHD, subsurface scattering, path-traced lighting",
    "storyOutline": "Detailed DUAL-WORLD story outline in ${languageName} (800-1200 words) alternating between Real World and Bio-Space scenes. Include ${sceneCount} scenes total. Each scene must specify location (Real World or Bio-Space). Include visual gags, comedic dialogue, and scientific accuracy.",
    "characters": [
        {
            "name": "MAIN CHARACTER name",
            "role": "protagonist",
            "fullDescription": "Detailed: age, ethnicity, skin tone, hair, clothing with specific colors and text, glasses if any"
        },
        {
            "name": "BIO_PULSE",
            "role": "supporting",
            "fullDescription": "Jellytoon red heart with tiny top hat, expressive eyes, dramatic personality, bouncy animation"
        },
        {
            "name": "BIO_GASTRO",
            "role": "supporting", 
            "fullDescription": "Gelatinous pink stomach blob with chef hat, golden spoon, nervous expressions, wobbly texture"
        },
        {
            "name": "MOB_ENEMY",
            "role": "antagonist",
            "fullDescription": "Whatever threatens health - describe specific appearance based on story"
        }
    ],
    "idea": {
        "title": "Story title",
        "logline": "One sentence: [Person] does [action], causing [Bio-Space chaos]",
        "tone": "Comedic, chaotic, educational fun",
        "visualStyle": "Jellytoon 3D, Pixar subsurface scattering, hyper-realistic real-world + candy-colored Bio-Space",
        "keyMoments": ["moment1 with visual gag", "moment2 with body reaction", "moment3 resolution"]
    },
    "technicalSpecs": {
        "format": "9:16 vertical, 8K UHD",
        "vfx": "Path-tracing, subsurface scattering, motion blur, light leaks",
        "audio": "Upbeat music, comedic SFX, expressive voice acting"
    }
}

REQUIREMENTS:
1. VERY FUNNY - Include visual gags, comedic timing, exaggerated reactions
2. DUAL-WORLD - Alternate between Real World and Bio-Space scenes
3. EDUCATIONAL - Accurately represent how the body works
4. JELLYTOON STYLE - Soft, squishy, bouncy, candy-colored characters
5. CHARACTER CONSISTENCY - Use the exact master character list in each scene
6. Generate exactly ${sceneCount} scenes alternating between worlds
${CONTENT_SAFETY}

Return ONLY valid JSON, no markdown or explanations.`
        } else {
            // Standard prompt for other genres
            prompt = `You are a professional screenwriter creating FAMILY-FRIENDLY video content.

IMPORTANT: All content must be appropriate for general audiences.
${descriptionContext}${visualStyleContext}
Create a COMPLETE video story for the genre: "${genreName}"

Language for dialogue/script: ${languageName}

Generate a JSON response with this structure:
{
    "title": "Catchy project title in ${languageName}",
    "subject": "Main character/subject description (physical appearance, clothing, personality)",
    "action": "Key actions and events",
    "scene": "Primary setting/location",
    "mood": "Overall emotional tone",
    "style": "Visual style (cinematic, documentary, etc)",
    "storyOutline": "Detailed story outline in ${languageName} (500-800 words) with opening hook, main storyline, climax, and resolution",
    "characters": [
        {
            "name": "Character name",
            "role": "protagonist|antagonist|supporting",
            "fullDescription": "One sentence with age, appearance, clothing, and distinguishing features"
        }
    ],
    "idea": {
        "title": "Story title",
        "logline": "One sentence story summary",
        "tone": "emotional tone",
        "visualStyle": "visual style description",
        "keyMoments": ["moment1", "moment2", "moment3"]
    }
}

REQUIREMENTS:
1. Be creative and original
2. Make the story engaging and visually compelling
3. Include 2-4 characters with distinct appearances
4. The outline should be detailed enough to generate ${sceneCount} scenes
5. All dialogue/script content should be in ${languageName}
6. Focus on visual storytelling suitable for AI video generation
${CONTENT_SAFETY}

Return ONLY valid JSON, no markdown or explanations.`
        }

        const result = await generateText(config, prompt)

        // Parse JSON from result
        let generated
        try {
            // Clean the response - remove markdown code blocks if present
            let cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            generated = JSON.parse(cleanResult)
        } catch (parseError) {
            console.error('JSON parse error:', result)
            return NextResponse.json({ error: 'AI không thể tạo nội dung. Vui lòng thử lại.' }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            generated: {
                ...generated,
                genre,
                language,
                sceneCount
            }
        })
    } catch (error) {
        console.error('Quick generate error:', error)
        return NextResponse.json({ error: 'Không thể tạo nội dung tự động' }, { status: 500 })
    }
}
