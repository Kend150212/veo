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

// Generate all scene prompts in batches
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
    const scenes: ScenePrompt[] = []
    const hooks = distributeHooks(input.sceneCount)
    const batchSize = 10 // Generate 10 scenes at a time

    // Build character bible string (Verbatim rule)
    const characterBible = input.characters.map(c =>
        `[${c.name}]: ${c.fullDescription}`
    ).join(' | ')

    for (let batchStart = 0; batchStart < input.sceneCount; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, input.sceneCount)
        const batchSceneNumbers = Array.from(
            { length: batchEnd - batchStart },
            (_, i) => batchStart + i + 1
        )

        const hookAssignments = batchSceneNumbers.map(num =>
            hooks[num] ? `Scene ${num}: ${hooks[num]} hook` : `Scene ${num}: regular`
        ).join(', ')

        const prompt = `Generate video prompts for scenes ${batchStart + 1} to ${batchEnd} of ${input.sceneCount}.

STORY OUTLINE:
${input.storyOutline}

GENRE: ${input.genre}
STYLE: ${input.style}
DURATION PER SCENE: ${input.duration} seconds

CHARACTER BIBLE (use EXACTLY these descriptions for consistency):
${characterBible || 'No specific characters'}

HOOK ASSIGNMENTS:
${hookAssignments}

RULES:
1. Each prompt must be ONE LINE, no line breaks
2. Include character descriptions VERBATIM in each scene they appear
3. Use professional cinematography terms (camera angles, movements, lighting)
4. Each scene should flow naturally from the previous
5. Include DIALOGUE/ACTIONS: Add character speeches in quotes, e.g. "This is the beginning." spoken by the detective
6. For dialogue scenes, include: who speaks, what they say (short), their expression/emotion
7. Opening hook: start with action or mystery
8. Include negative prompts at the end: "Negative: flickering, blurry, distorted, low quality"

DIALOGUE FORMAT EXAMPLES:
- "Run!" shouted by the hero with determined expression
- The woman whispers "I know the truth" while looking away
- Close-up of man saying "We need to leave now" with serious face

Return a JSON array:
[{
  "order": 1,
  "title": "Scene 1: Opening",
  "promptText": "Full prompt in ONE LINE with character descriptions, action, DIALOGUE if any, setting, camera, style, lighting, mood. Negative: flickering, blurry, distorted",
  "hookType": "opening",
  "duration": ${input.duration}
}]

Generate scenes ${batchStart + 1} to ${batchEnd}. Return ONLY JSON array.`

        try {
            const result = await generateText(config, prompt)
            const jsonMatch = result.match(/\[[\s\S]*\]/)

            if (jsonMatch) {
                const batchScenes = JSON.parse(jsonMatch[0]) as ScenePrompt[]
                scenes.push(...batchScenes)
            }
        } catch (e) {
            console.error(`Failed to generate batch ${batchStart + 1}-${batchEnd}:`, e)
        }

        if (onProgress) {
            onProgress(scenes.length, input.sceneCount)
        }

        // Small delay between batches to avoid rate limits
        if (batchEnd < input.sceneCount) {
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
    }

    return scenes
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
