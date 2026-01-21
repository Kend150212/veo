import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null

export type SuggestionSection =
    | 'subject' | 'action' | 'scene' | 'camera'
    | 'style' | 'lighting' | 'mood' | 'audio' | 'negative'

const sectionPrompts: Record<SuggestionSection, string> = {
    subject: 'Generate a detailed subject description for a video. Include physical appearance, clothing, and distinctive features.',
    action: 'Generate a vivid action description with dynamic verbs and adverbs.',
    scene: 'Generate a detailed scene/environment description including location, time, weather, and background elements.',
    camera: 'Generate professional cinematography instructions including camera angle, movement, and lens type.',
    style: 'Generate visual style descriptions including artistic style, era, and film references.',
    lighting: 'Generate lighting descriptions including light source, quality, color temperature, and shadows.',
    mood: 'Generate mood and atmosphere descriptions.',
    audio: 'Generate audio descriptions including dialogue (in quotes), sound effects, and ambient sounds.',
    negative: 'Generate a list of negative prompts to avoid common artifacts and unwanted elements.'
}

export async function generateSuggestion(
    section: SuggestionSection,
    context?: string,
    genre?: string
): Promise<string> {
    if (!genAI) {
        throw new Error('Gemini API key not configured')
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    let prompt = sectionPrompts[section]

    if (genre) {
        prompt += ` The genre is: ${genre}.`
    }

    if (context) {
        prompt += ` Context from other sections: ${context}`
    }

    prompt += ' Keep the response concise (under 100 words) and in English. Return only the description, no explanations.'

    try {
        const result = await model.generateContent(prompt)
        const response = result.response
        return response.text().trim()
    } catch (error) {
        console.error('Gemini API error:', error)
        throw new Error('Failed to generate suggestion')
    }
}

export async function enhancePrompt(
    currentPrompt: string
): Promise<string> {
    if (!genAI) {
        throw new Error('Gemini API key not configured')
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Enhance this video generation prompt to be more cinematic and detailed. 
Keep the same core idea but add more visual details, camera directions, and atmosphere.
Keep it under 300 words.

Original prompt:
${currentPrompt}

Enhanced prompt:`

    try {
        const result = await model.generateContent(prompt)
        const response = result.response
        return response.text().trim()
    } catch (error) {
        console.error('Gemini API error:', error)
        throw new Error('Failed to enhance prompt')
    }
}

export function isAIConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY
}
