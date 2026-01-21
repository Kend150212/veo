// Multi-AI Provider Library for Story Generation
// Supports: Gemini, OpenAI, Deepseek, Anthropic

import { GoogleGenerativeAI } from '@google/generative-ai'

export type AIProvider = 'gemini' | 'openai' | 'deepseek' | 'anthropic'

export interface AIConfig {
    provider: AIProvider
    apiKey: string
    model?: string // User-selected model
}

export interface Character {
    name: string
    role: string
    fullDescription: string
    appearance?: string
    clothing?: string
    accessories?: string
    skinTone?: string       // Chi tiết màu da
    faceDetails?: string    // Chi tiết khuôn mặt
    hairDetails?: string    // Chi tiết kiểu tóc
    ageRange?: string       // Độ tuổi cụ thể (18+)
}

export interface ScenePrompt {
    order: number
    title: string
    promptText: string  // Inline, no line breaks
    hookType?: string
    duration: number
}

export interface StoryIdea {
    id: string
    title: string
    synopsis: string
    suggestedScenes: number
    tone: string
    hooks: string[]
}

// Video Hook Types
export const HOOK_TYPES = {
    opening: 'Opening hook - gây tò mò ngay từ đầu',
    cliffhanger: 'Cliffhanger - dừng ở điểm căng thẳng',
    reveal: 'Reveal - tiết lộ thông tin bất ngờ',
    twist: 'Plot twist - đảo ngược tình huống',
    tension: 'Tension build - tăng căng thẳng',
    payoff: 'Payoff - giải quyết tension',
    callback: 'Callback - nhắc lại cảnh trước',
    closing: 'Closing - kết thúc ấn tượng'
}

export const GENRE_CATEGORIES = [
    { id: 'all', name: 'Tất cả' },
    { id: 'film', name: 'Phim' },
    { id: 'social', name: 'Social Media' },
    { id: 'news', name: 'Tin tức' },
    { id: 'animation', name: 'Hoạt hình' },
    { id: 'theme', name: 'Theo chủ đề' }
]

// Supported languages for script/dialogue
export const SCRIPT_LANGUAGES = [
    { id: 'vi', name: 'Tiếng Việt', nameEn: 'Vietnamese' },
    { id: 'en', name: 'English', nameEn: 'English' },
    { id: 'zh', name: '中文', nameEn: 'Chinese' },
    { id: 'ja', name: '日本語', nameEn: 'Japanese' },
    { id: 'ko', name: '한국어', nameEn: 'Korean' },
    { id: 'es', name: 'Español', nameEn: 'Spanish' },
    { id: 'fr', name: 'Français', nameEn: 'French' },
    { id: 'de', name: 'Deutsch', nameEn: 'German' },
    { id: 'pt', name: 'Português', nameEn: 'Portuguese' },
    { id: 'ru', name: 'Русский', nameEn: 'Russian' },
    { id: 'th', name: 'ไทย', nameEn: 'Thai' },
    { id: 'id', name: 'Bahasa Indonesia', nameEn: 'Indonesian' }
]

// Visual styles for video generation
export const VISUAL_STYLES = [
    {
        id: 'jellytoon',
        name: 'Jellytoon 3D',
        description: 'Soft, candy-like 3D animation',
        descriptionEn: 'Soft jelly-like 3D with subsurface scattering, Pixar-style',
        image: '/styles/jellytoon_style_1768952055356.png',
        promptKeywords: 'Jellytoon 3D, soft translucent jelly-like characters, candy colors, Pixar-style subsurface scattering, bouncy elastic physics'
    },
    {
        id: 'cinematic',
        name: 'Cinematic',
        description: 'Phong cách điện ảnh chuyên nghiệp',
        descriptionEn: 'Professional film-quality realistic',
        image: '/styles/cinematic_style_1768952069142.png',
        promptKeywords: 'Cinematic film quality, anamorphic lens, shallow depth of field, dramatic lighting, 35mm film grain'
    },
    {
        id: 'anime',
        name: 'Anime',
        description: 'Hoạt hình Nhật Bản',
        descriptionEn: 'Japanese animation style',
        image: '/styles/anime_style_1768952083280.png',
        promptKeywords: 'Anime style, large expressive eyes, cel-shading, vibrant colors, manga aesthetic, Studio Ghibli inspired'
    },
    {
        id: 'watercolor',
        name: 'Watercolor',
        description: 'Màu nước nghệ thuật',
        descriptionEn: 'Artistic watercolor painting',
        image: '/styles/watercolor_style_1768952096403.png',
        promptKeywords: 'Watercolor painting style, soft flowing colors, wet-on-wet technique, paper texture, impressionistic'
    },
    {
        id: 'pixel-art',
        name: 'Pixel Art',
        description: 'Retro 8-bit game',
        descriptionEn: 'Retro 8-bit gaming aesthetic',
        image: '/styles/pixel_art_style_1768952123243.png',
        promptKeywords: 'Pixel art, 8-bit retro gaming, blocky pixels, limited color palette, NES/SNES era graphics'
    },
    {
        id: 'comic',
        name: 'Comic Book',
        description: 'Truyện tranh Marvel/DC',
        descriptionEn: 'Bold comic book with halftone',
        image: '/styles/comic_book_style_1768952142765.png',
        promptKeywords: 'Comic book style, thick black outlines, Ben-Day dots, saturated primary colors, vintage Marvel/DC aesthetic'
    },
    {
        id: 'claymation',
        name: 'Claymation',
        description: 'Stop-motion đất sét',
        descriptionEn: 'Stop-motion clay animation',
        image: '/styles/claymation_style_1768952157135.png',
        promptKeywords: 'Claymation stop-motion, modeling clay texture, fingerprint details, Wallace and Gromit aesthetic, plasticine look'
    },
    {
        id: 'minimalist',
        name: 'Minimalist',
        description: 'Thiết kế phẳng tối giản',
        descriptionEn: 'Clean flat design',
        image: '/styles/minimalist_style_1768952170330.png',
        promptKeywords: 'Minimalist flat design, geometric shapes, limited color palette, 2D vector graphics, modern illustration'
    }
]

export const GENRES = [
    // Film genres
    { id: 'action', name: 'Hành động', nameEn: 'Action', category: 'film' },
    { id: 'drama', name: 'Chính kịch', nameEn: 'Drama', category: 'film' },
    { id: 'horror', name: 'Kinh dị', nameEn: 'Horror', category: 'film' },
    { id: 'thriller', name: 'Ly kỳ', nameEn: 'Thriller', category: 'film' },
    { id: 'romance', name: 'Lãng mạn', nameEn: 'Romance', category: 'film' },
    { id: 'scifi', name: 'Khoa học viễn tưởng', nameEn: 'Sci-Fi', category: 'film' },
    { id: 'comedy', name: 'Hài hước', nameEn: 'Comedy', category: 'film' },
    { id: 'documentary', name: 'Tài liệu', nameEn: 'Documentary', category: 'film' },
    { id: 'fantasy', name: 'Giả tưởng', nameEn: 'Fantasy', category: 'film' },
    { id: 'mystery', name: 'Bí ẩn', nameEn: 'Mystery', category: 'film' },

    // Social Media
    { id: 'tiktok', name: 'TikTok/Reels', nameEn: 'TikTok', category: 'social' },
    { id: 'youtube', name: 'YouTube Short', nameEn: 'YouTube', category: 'social' },
    { id: 'vlog', name: 'Vlog', nameEn: 'Vlog', category: 'social' },
    { id: 'tutorial', name: 'Hướng dẫn', nameEn: 'Tutorial', category: 'social' },
    { id: 'review', name: 'Review', nameEn: 'Review', category: 'social' },
    { id: 'storytelling', name: 'Kể chuyện', nameEn: 'Storytelling', category: 'social' },

    // News
    { id: 'news', name: 'Tin tức', nameEn: 'News', category: 'news' },
    { id: 'breaking', name: 'Tin nóng', nameEn: 'Breaking News', category: 'news' },
    { id: 'interview', name: 'Phỏng vấn', nameEn: 'Interview', category: 'news' },
    { id: 'report', name: 'Phóng sự', nameEn: 'Report', category: 'news' },

    // Animation
    { id: 'anime', name: 'Anime', nameEn: 'Anime', category: 'animation' },
    { id: '3d-animation', name: '3D Animation', nameEn: '3D Animation', category: 'animation' },
    { id: 'cartoon', name: 'Hoạt hình trẻ em', nameEn: 'Cartoon', category: 'animation' },
    { id: 'motion-graphics', name: 'Motion Graphics', nameEn: 'Motion Graphics', category: 'animation' },
    { id: 'explainer', name: 'Explainer Video', nameEn: 'Explainer', category: 'animation' },
    { id: 'jellytoon', name: 'Jellytoon 3D', nameEn: 'Jellytoon', category: 'animation' },
    { id: 'edutainment', name: 'Edutainment Bio', nameEn: 'Edutainment', category: 'animation' },
    { id: 'bio-adventure', name: 'Bio-Adventure', nameEn: 'Bio-Adventure', category: 'animation' },

    // Themed
    { id: 'travel', name: 'Du lịch', nameEn: 'Travel', category: 'theme' },
    { id: 'food', name: 'Ẩm thực', nameEn: 'Food', category: 'theme' },
    { id: 'fashion', name: 'Thời trang', nameEn: 'Fashion', category: 'theme' },
    { id: 'tech', name: 'Công nghệ', nameEn: 'Technology', category: 'theme' },
    { id: 'music', name: 'Âm nhạc/MV', nameEn: 'Music', category: 'theme' },
    { id: 'sports', name: 'Thể thao', nameEn: 'Sports', category: 'theme' },
    { id: 'education', name: 'Giáo dục', nameEn: 'Education', category: 'theme' },
    { id: 'business', name: 'Kinh doanh', nameEn: 'Business', category: 'theme' },
    { id: 'lifestyle', name: 'Lifestyle', nameEn: 'Lifestyle', category: 'theme' },
    { id: 'health', name: 'Sức khỏe', nameEn: 'Health', category: 'theme' }
]

// Default models for each provider
const DEFAULT_MODELS = {
    gemini: 'gemini-2.0-flash',
    openai: 'gpt-4o-mini',
    deepseek: 'deepseek-chat',
    anthropic: 'claude-3-haiku-20240307'
}

// Generate text using the configured AI
export async function generateText(config: AIConfig, prompt: string): Promise<string> {
    const model = config.model || DEFAULT_MODELS[config.provider]

    if (config.provider === 'gemini') {
        const genAI = new GoogleGenerativeAI(config.apiKey)
        const genModel = genAI.getGenerativeModel({ model })
        const result = await genModel.generateContent(prompt)
        return result.response.text()
    }

    // OpenAI implementation
    if (config.provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 4000
            })
        })
        const data = await response.json()
        if (data.error) throw new Error(data.error.message)
        return data.choices[0].message.content
    }

    // Deepseek implementation
    if (config.provider === 'deepseek') {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 4000
            })
        })
        const data = await response.json()
        if (data.error) throw new Error(data.error.message)
        return data.choices[0].message.content
    }

    // Anthropic implementation
    if (config.provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                max_tokens: 4000,
                messages: [{ role: 'user', content: prompt }]
            })
        })
        const data = await response.json()
        if (data.error) throw new Error(data.error.message)
        return data.content[0].text
    }

    throw new Error(`Unsupported AI provider: ${config.provider}`)
}

// Analyze input and suggest genres
export async function analyzeGenre(
    config: AIConfig,
    input: { subject: string; action: string; scene: string; mood: string }
): Promise<{ id: string; name: string; confidence: number }[]> {
    const prompt = `Analyze this video concept and suggest the 3 most suitable film genres:

Subject: ${input.subject}
Action: ${input.action}
Scene: ${input.scene}
Mood: ${input.mood}

Available genres: ${GENRES.map(g => g.nameEn).join(', ')}

Return ONLY a JSON array with format:
[{"id": "genre_id", "name": "Genre Name", "confidence": 0.85}]
Order by confidence descending. No explanation, just JSON.`

    const result = await generateText(config, prompt)
    try {
        const jsonMatch = result.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
    } catch (e) {
        console.error('Failed to parse genre response:', e)
    }

    // Fallback
    return [
        { id: 'drama', name: 'Drama', confidence: 0.7 },
        { id: 'action', name: 'Action', confidence: 0.5 }
    ]
}

// Generate 3 story ideas
export async function generateIdeas(
    config: AIConfig,
    input: {
        genre: string
        subject: string
        action: string
        scene: string
        mood: string
        style: string
    }
): Promise<StoryIdea[]> {
    const prompt = `You are a creative video director. Generate 3 unique and compelling story ideas for a ${input.genre} video.

Base concept:
- Subject: ${input.subject}
- Action: ${input.action}
- Scene: ${input.scene}
- Mood: ${input.mood}
- Style: ${input.style}

For each idea, provide:
1. A catchy title
2. A brief synopsis (2-3 sentences)
3. Suggested number of scenes (10-30)
4. Tone description
5. Key hooks to keep viewers engaged

CONTENT SAFETY RULES (MANDATORY):
- ALL characters MUST be 18 years old or older - NO minors, children, or teenagers
- If younger characters are needed, use animated/cartoon style or describe as "young adults" (18-25)
- Never include physical descriptions or situations involving anyone under 18
- Family-friendly content only

Return ONLY a JSON array with format:
[{
  "id": "1",
  "title": "Story Title",
  "synopsis": "Brief synopsis...",
  "suggestedScenes": 15,
  "tone": "Tense, mysterious, with moments of action",
  "hooks": ["Opening mystery", "Mid-reveal twist", "Cliffhanger ending"]
}]

Generate exactly 3 ideas, each unique and creative. No explanation, just JSON.`

    const result = await generateText(config, prompt)
    try {
        const jsonMatch = result.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
    } catch (e) {
        console.error('Failed to parse ideas response:', e)
    }

    return []
}

// Generate or expand story outline
export async function generateStoryOutline(
    config: AIConfig,
    input: {
        idea: StoryIdea
        userDescription?: string
        sceneCount: number
        characters: Character[]
    }
): Promise<string> {
    const characterList = input.characters.map(c =>
        `- ${c.name} (${c.role}): ${c.fullDescription}`
    ).join('\n')

    const prompt = `Create a detailed story outline for a video with ${input.sceneCount} scenes.

Story Idea: ${input.idea.title}
Synopsis: ${input.idea.synopsis}
Tone: ${input.idea.tone}
${input.userDescription ? `User's vision: ${input.userDescription}` : ''}

Characters:
${characterList || 'No specific characters defined yet'}

CONTENT SAFETY RULES (MANDATORY):
- ALL characters MUST be adults (18+ years old)
- NO children, minors, or teenagers in any scenes
- If story needs younger characters, describe them as "young adults" (18-25 years old)
- Family-friendly content only

Create an engaging story outline that:
1. Has a strong opening hook to grab attention in first 3 seconds
2. Maintains tension and interest throughout
3. Includes strategic reveals and mini-cliffhangers
4. Has a satisfying or intriguing ending

Return a narrative outline in Vietnamese, paragraph format, describing the story arc from beginning to end. Keep it under 500 words.`

    return await generateText(config, prompt)
}

// Distribute hooks across scenes
function distributeHooks(sceneCount: number): Record<number, string> {
    const hooks: Record<number, string> = {}

    // Always have opening and closing hooks
    hooks[1] = 'opening'
    hooks[sceneCount] = 'closing'

    // Mid-point twist
    const midPoint = Math.floor(sceneCount / 2)
    hooks[midPoint] = 'twist'

    // 2/3 point reveal
    const twoThirds = Math.floor(sceneCount * 2 / 3)
    hooks[twoThirds] = 'reveal'

    // Distribute tension and cliffhangers
    if (sceneCount > 10) {
        hooks[Math.floor(sceneCount / 4)] = 'tension'
        hooks[Math.floor(sceneCount * 3 / 4)] = 'cliffhanger'
    }

    // Add callbacks for longer videos
    if (sceneCount > 20) {
        hooks[Math.floor(sceneCount * 0.8)] = 'callback'
    }

    return hooks
}

// Generate all scene prompts - tries full request first, batches on token limit
export async function generateScenes(
    config: AIConfig,
    input: {
        storyOutline: string
        sceneCount: number
        characters: Character[]
        genre: string
        style: string
        duration: number
    },
    onProgress?: (current: number, total: number) => void
): Promise<ScenePrompt[]> {
    const hooks = distributeHooks(input.sceneCount)

    // Build comprehensive character bible with ALL visual details
    const characterBible = input.characters.map(c => {
        const details = [
            c.fullDescription,
            c.appearance ? `Appearance: ${c.appearance}` : '',
            c.clothing ? `Clothing: ${c.clothing}` : '',
            c.skinTone ? `Skin: ${c.skinTone}` : '',
            c.faceDetails ? `Face: ${c.faceDetails}` : '',
            c.hairDetails ? `Hair: ${c.hairDetails}` : '',
            c.accessories ? `Accessories: ${c.accessories}` : ''
        ].filter(Boolean).join(', ')
        return `[${c.name}]: ${details}`
    }).join(' || ')

    // Helper function to build prompt for a range of scenes
    const buildPrompt = (startScene: number, endScene: number, totalScenes: number) => {
        const sceneNumbers = Array.from(
            { length: endScene - startScene + 1 },
            (_, i) => startScene + i
        )

        const hookAssignments = sceneNumbers.map(num =>
            hooks[num] ? `Scene ${num}: ${hooks[num]} hook` : `Scene ${num}: regular`
        ).join(', ')

        return `Generate video prompts for scenes ${startScene} to ${endScene} of ${totalScenes}.

STORY OUTLINE:
${input.storyOutline}

GENRE: ${input.genre}
VISUAL STYLE (MANDATORY FOR ALL SCENES): ${input.style}

STYLE ENFORCEMENT RULES (CRITICAL):
- EVERY scene MUST use the exact visual style: "${input.style}"
- Include the style keywords "${input.style}" in EVERY promptText
- Do NOT mix styles (e.g., no anime in cinematic project, no realistic in cartoon project)
- The style must appear AFTER character description in each prompt
- Maintain 100% style consistency across ALL scenes

DURATION PER SCENE: ${input.duration} seconds
UNIQUE ID: ${Date.now()}-${Math.random().toString(36).substring(7)}

CHARACTER BIBLE (COPY VERBATIM - use EXACTLY these descriptions):
${characterBible || 'No specific characters'}

CHARACTER CONSISTENCY RULES (CRITICAL):
- EVERY character that appears in a scene MUST have their FULL description from CHARACTER BIBLE
- Copy EXACTLY: name, age, skin tone, face details, hair, clothing, accessories
- NEVER abbreviate or shorten character descriptions
- If a character appears, use 100% of their bible description verbatim
- Consistent appearance across ALL scenes is MANDATORY

HOOK ASSIGNMENTS:
${hookAssignments}

STORY UNIQUENESS REQUIREMENTS:
- Create a COMPLETELY NEW and ORIGINAL story
- Use fresh, unique locations and plot elements
- Avoid common clichés and predictable story beats
- Be inventive with camera angles, lighting, and visual compositions

CONTENT SAFETY RULES (MANDATORY):
- ALL characters MUST be adults (18+ years old) - NO EXCEPTIONS
- Never describe or depict minors, children, or teenagers
- If a younger appearance is needed, use "young adult 18-25 years old"
- Family-friendly content only

PROMPT FORMAT RULES:
1. Each prompt must be ONE LINE, no line breaks
2. Format: "[CHARACTER FULL DESCRIPTION] doing [ACTION] in [SETTING]. Style: ${input.style}. Camera: [CAMERA DETAILS]. Lighting: [LIGHTING]. Mood: [MOOD]. Dialogue: [IF ANY]. Negative: flickering, blurry, distorted, children, minors"
3. Character descriptions MUST be copied VERBATIM from CHARACTER BIBLE
4. Use professional cinematography terms
5. Each scene should flow naturally from the previous
6. Include DIALOGUE in quotes if characters speak
7. Generate EXACTLY ${endScene - startScene + 1} scenes (from scene ${startScene} to ${endScene})

DIALOGUE FORMAT:
- "Run!" shouted by [CHARACTER NAME] with determined expression
- [CHARACTER NAME] whispers "I know the truth" while looking away

Return a JSON array with EXACTLY ${endScene - startScene + 1} scenes:
[{
  "order": ${startScene},
  "title": "Scene ${startScene}: Opening",
  "promptText": "[Full character description verbatim] [action] in [setting]. Style: ${input.style}. Camera: [details]. Lighting: [details]. Mood: [mood]. Negative: flickering, blurry, distorted, children, minors",
  "hookType": "opening",
  "duration": ${input.duration}
}]

Generate scenes ${startScene} to ${endScene}. Return ONLY valid JSON array.`
    }

    // Helper function to generate scenes for a range with retry on smaller batches
    const MAX_RETRIES = 3

    const generateScenesForRange = async (
        startScene: number,
        endScene: number,
        totalScenes: number,
        retryCount: number = 0
    ): Promise<ScenePrompt[]> => {
        const scenesNeeded = endScene - startScene + 1

        try {
            const prompt = buildPrompt(startScene, endScene, totalScenes)
            const result = await generateText(config, prompt)
            const jsonMatch = result.match(/\[[\s\S]*\]/)

            if (jsonMatch) {
                const scenes = JSON.parse(jsonMatch[0]) as ScenePrompt[]
                // Verify we got the right number of scenes
                if (scenes.length >= scenesNeeded) {
                    return scenes.slice(0, scenesNeeded)
                }
                // If we got fewer scenes, try to get the missing ones
                if (scenes.length > 0 && scenes.length < scenesNeeded) {
                    console.log(`Got ${scenes.length} scenes, needed ${scenesNeeded}. Fetching missing...`)
                    const lastScene = scenes[scenes.length - 1]
                    const nextStart = (lastScene?.order || startScene + scenes.length - 1) + 1
                    if (nextStart <= endScene) {
                        await new Promise(resolve => setTimeout(resolve, 300)) // Small delay
                        const moreScenes = await generateScenesForRange(nextStart, endScene, totalScenes, 0)
                        return [...scenes, ...moreScenes]
                    }
                    return scenes
                }
            }

            // If parsing failed or no scenes, retry or throw
            if (retryCount < MAX_RETRIES) {
                console.log(`Parse failed for scenes ${startScene}-${endScene}, retrying (${retryCount + 1}/${MAX_RETRIES})...`)
                await new Promise(resolve => setTimeout(resolve, 1000)) // Wait before retry
                return generateScenesForRange(startScene, endScene, totalScenes, retryCount + 1)
            }
            throw new Error('Failed to parse scenes after retries')

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)

            // Check if it's a token limit or context length error
            const isTokenError = errorMessage.toLowerCase().includes('token') ||
                errorMessage.toLowerCase().includes('context') ||
                errorMessage.toLowerCase().includes('length') ||
                errorMessage.toLowerCase().includes('too long') ||
                errorMessage.toLowerCase().includes('maximum')

            // If not a token error and we can still retry, do so
            if (!isTokenError && retryCount < MAX_RETRIES) {
                console.log(`Error generating scenes ${startScene}-${endScene}, retrying (${retryCount + 1}/${MAX_RETRIES})...`)
                await new Promise(resolve => setTimeout(resolve, 1000))
                return generateScenesForRange(startScene, endScene, totalScenes, retryCount + 1)
            }

            // If batch size is 1 and still failing, try one more time then give up
            if (scenesNeeded === 1) {
                if (retryCount < MAX_RETRIES) {
                    console.log(`Single scene ${startScene} failed, final retry...`)
                    await new Promise(resolve => setTimeout(resolve, 1500))
                    return generateScenesForRange(startScene, endScene, totalScenes, retryCount + 1)
                }
                console.error(`Failed to generate scene ${startScene} after all retries`)
                return []
            }

            // Split into smaller batches and retry
            const midPoint = Math.floor((startScene + endScene) / 2)
            console.log(`Splitting batch: ${startScene}-${endScene} into ${startScene}-${midPoint} and ${midPoint + 1}-${endScene}`)

            const firstHalf = await generateScenesForRange(startScene, midPoint, totalScenes, 0)
            await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between batches
            const secondHalf = await generateScenesForRange(midPoint + 1, endScene, totalScenes, 0)

            return [...firstHalf, ...secondHalf]
        }
    }

    // Try to generate all scenes at once, will auto-batch on failure
    console.log(`Generating ${input.sceneCount} scenes...`)
    let scenes = await generateScenesForRange(1, input.sceneCount, input.sceneCount, 0)

    // Check for missing scenes and try to regenerate them
    if (scenes.length < input.sceneCount) {
        console.log(`Got ${scenes.length}/${input.sceneCount} scenes, checking for missing...`)

        // Find which scene numbers are missing
        const existingOrders = new Set(scenes.map(s => s.order))
        const missingScenes: number[] = []
        for (let i = 1; i <= input.sceneCount; i++) {
            if (!existingOrders.has(i)) {
                missingScenes.push(i)
            }
        }

        // Try to regenerate missing scenes one by one
        if (missingScenes.length > 0) {
            console.log(`Missing scenes: ${missingScenes.join(', ')}. Regenerating...`)
            for (const sceneNum of missingScenes) {
                try {
                    const missingScene = await generateScenesForRange(sceneNum, sceneNum, input.sceneCount, 0)
                    if (missingScene.length > 0) {
                        scenes = [...scenes, ...missingScene]
                    }
                    await new Promise(resolve => setTimeout(resolve, 300))
                } catch (err) {
                    console.error(`Failed to regenerate scene ${sceneNum}:`, err)
                }
            }
        }
    }

    if (onProgress) {
        onProgress(scenes.length, input.sceneCount)
    }

    // Sort by order and return
    return scenes.sort((a, b) => a.order - b.order)
}

// Format scenes for export
export function formatScenesForExport(
    scenes: ScenePrompt[],
    format: 'text' | 'json' | 'api'
): string {
    switch (format) {
        case 'text':
            // Each scene as "Scene X: prompt" on one line, separated by empty line
            return scenes.map(s =>
                `Scene ${s.order}: ${s.promptText}`
            ).join('\n\n')

        case 'json':
            return JSON.stringify(scenes, null, 2)

        case 'api':
            // Veo API format for each scene
            return scenes.map(s => JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: s.promptText }]
                }],
                generation_config: {
                    video_length: s.duration,
                    aspect_ratio: '16:9',
                    generation_resolution: '1080p',
                    generate_audio: true
                }
            })).join('\n\n')

        default:
            return scenes.map(s => s.promptText).join('\n\n')
    }
}
