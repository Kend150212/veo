// Prompt Section Types and Builder Logic

export interface PromptSection {
    id: string
    label: string
    labelVi: string
    value: string
    placeholder: string
    placeholderVi: string
    required: boolean
    order: number
}

export interface PromptStructure {
    subject: string
    action: string
    scene: string
    camera: string
    style: string
    lighting: string
    mood: string
    audio: string
    negative: string
}

export interface ExportOptions {
    format: 'text' | 'json' | 'api'
    includeNegative: boolean
    aspectRatio?: '16:9' | '9:16' | '1:1'
    videoLength?: number
    resolution?: '720p' | '1080p' | '4K'
    generateAudio?: boolean
}

// Default sections for the prompt builder
export const defaultSections: PromptSection[] = [
    {
        id: 'subject',
        label: 'Subject',
        labelVi: 'Chủ thể',
        value: '',
        placeholder: 'A seasoned detective with a weary expression, wearing a rumpled trench coat...',
        placeholderVi: 'Một thám tử dày dạn với vẻ mệt mỏi, mặc áo khoác dài nhàu nát...',
        required: true,
        order: 1
    },
    {
        id: 'action',
        label: 'Action',
        labelVi: 'Hành động',
        value: '',
        placeholder: 'striding purposefully through the rain, looking over his shoulder...',
        placeholderVi: 'bước đi đầy quyết tâm trong mưa, nhìn lại qua vai...',
        required: true,
        order: 2
    },
    {
        id: 'scene',
        label: 'Scene/Context',
        labelVi: 'Bối cảnh',
        value: '',
        placeholder: 'a neon-lit alley in a 1940s metropolis at midnight...',
        placeholderVi: 'con hẻm ánh đèn neon trong thành phố thập niên 1940 lúc nửa đêm...',
        required: true,
        order: 3
    },
    {
        id: 'camera',
        label: 'Cinematography',
        labelVi: 'Kỹ thuật quay',
        value: '',
        placeholder: 'low-angle tracking shot, slow dolly-in, shallow depth of field...',
        placeholderVi: 'góc quay thấp bám theo, zoom chậm, độ sâu trường ảnh nông...',
        required: false,
        order: 4
    },
    {
        id: 'style',
        label: 'Visual Style',
        labelVi: 'Phong cách hình ảnh',
        value: '',
        placeholder: 'film noir aesthetic, shot on 35mm film, high contrast...',
        placeholderVi: 'phong cách film noir, quay bằng phim 35mm, tương phản cao...',
        required: false,
        order: 5
    },
    {
        id: 'lighting',
        label: 'Lighting',
        labelVi: 'Ánh sáng',
        value: '',
        placeholder: 'dramatic chiaroscuro, neon reflections on wet pavement...',
        placeholderVi: 'chiaroscuro kịch tính, ánh neon phản chiếu trên mặt đường ướt...',
        required: false,
        order: 6
    },
    {
        id: 'mood',
        label: 'Mood/Atmosphere',
        labelVi: 'Không khí/Tâm trạng',
        value: '',
        placeholder: 'mysterious, tense, noir atmosphere...',
        placeholderVi: 'bí ẩn, căng thẳng, không khí noir...',
        required: false,
        order: 7
    },
    {
        id: 'audio',
        label: 'Audio',
        labelVi: 'Âm thanh',
        value: '',
        placeholder: '"Stay right there." SFX: rain, distant thunder, jazz music...',
        placeholderVi: '"Đứng yên đó." SFX: mưa, sấm xa, nhạc jazz...',
        required: false,
        order: 8
    },
    {
        id: 'negative',
        label: 'Negative Prompt',
        labelVi: 'Prompt phủ định',
        value: '',
        placeholder: 'blurry, distorted, low quality, flickering, cartoon, anime...',
        placeholderVi: 'mờ, méo, chất lượng thấp, nhấp nháy, hoạt hình, anime...',
        required: false,
        order: 9
    }
]

// Default negative prompts
export const defaultNegatives = {
    quality: 'blurry, low quality, low resolution, pixelated, grainy, jpeg artifacts, compression artifacts',
    motion: 'flickering, strobing, jittery, shaky, unstable, temporal noise, jerky motion',
    anatomy: 'distorted anatomy, deformed, mutated, extra limbs, fused fingers, malformed hands',
    face: 'distorted face, asymmetric face, crossed eyes, uncanny valley, morphing face',
    style: 'cartoon, anime, illustration, painting, sketch, digital art',
    unwanted: 'text, watermark, logo, signature, border, frame'
}

/**
 * Build a complete prompt from sections
 */
export function buildPrompt(structure: Partial<PromptStructure>): string {
    const parts: string[] = []

    if (structure.subject) {
        parts.push(structure.subject)
    }

    if (structure.action) {
        parts.push(structure.action)
    }

    if (structure.scene) {
        parts.push(`Setting: ${structure.scene}`)
    }

    if (structure.camera) {
        parts.push(`Camera: ${structure.camera}`)
    }

    if (structure.style) {
        parts.push(`Style: ${structure.style}`)
    }

    if (structure.lighting) {
        parts.push(`Lighting: ${structure.lighting}`)
    }

    if (structure.mood) {
        parts.push(`Mood: ${structure.mood}`)
    }

    if (structure.audio) {
        parts.push(`Audio: ${structure.audio}`)
    }

    return parts.join('. ').replace(/\.\./g, '.').trim()
}

/**
 * Export prompt in different formats
 */
export function exportPrompt(
    structure: Partial<PromptStructure>,
    options: ExportOptions
): string {
    const promptText = buildPrompt(structure)

    switch (options.format) {
        case 'text':
            let textOutput = promptText
            if (options.includeNegative && structure.negative) {
                textOutput += `\n\nNegative: ${structure.negative}`
            }
            return textOutput

        case 'json':
            return JSON.stringify(
                {
                    prompt: promptText,
                    negative_prompt: options.includeNegative ? structure.negative : undefined,
                    structure: structure
                },
                null,
                2
            )

        case 'api':
            return JSON.stringify(
                {
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: promptText }]
                        }
                    ],
                    generation_config: {
                        video_length: options.videoLength || 8,
                        aspect_ratio: options.aspectRatio || '16:9',
                        generation_resolution: options.resolution || '1080p',
                        generate_audio: options.generateAudio ?? true,
                        negative_prompt: options.includeNegative ? structure.negative : undefined
                    }
                },
                null,
                2
            )

        default:
            return promptText
    }
}

/**
 * Parse a text prompt back to structure (basic parsing)
 */
export function parsePrompt(text: string): Partial<PromptStructure> {
    const structure: Partial<PromptStructure> = {}

    // Simple parsing based on keywords
    const lines = text.split(/[.\n]/).map(l => l.trim()).filter(Boolean)

    for (const line of lines) {
        const lowerLine = line.toLowerCase()

        if (lowerLine.startsWith('setting:') || lowerLine.startsWith('scene:')) {
            structure.scene = line.replace(/^(setting|scene):\s*/i, '')
        } else if (lowerLine.startsWith('camera:')) {
            structure.camera = line.replace(/^camera:\s*/i, '')
        } else if (lowerLine.startsWith('style:')) {
            structure.style = line.replace(/^style:\s*/i, '')
        } else if (lowerLine.startsWith('lighting:')) {
            structure.lighting = line.replace(/^lighting:\s*/i, '')
        } else if (lowerLine.startsWith('mood:')) {
            structure.mood = line.replace(/^mood:\s*/i, '')
        } else if (lowerLine.startsWith('audio:')) {
            structure.audio = line.replace(/^audio:\s*/i, '')
        } else if (lowerLine.startsWith('negative:')) {
            structure.negative = line.replace(/^negative:\s*/i, '')
        } else if (!structure.subject) {
            structure.subject = line
        } else if (!structure.action) {
            structure.action = line
        }
    }

    return structure
}

/**
 * Validate prompt structure
 */
export function validatePrompt(structure: Partial<PromptStructure>): {
    isValid: boolean
    errors: string[]
    warnings: string[]
} {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!structure.subject || structure.subject.length < 10) {
        errors.push('Subject is required and must be at least 10 characters')
    }

    if (!structure.action || structure.action.length < 5) {
        errors.push('Action is required and must be at least 5 characters')
    }

    // Warnings for missing optional but recommended fields
    if (!structure.camera) {
        warnings.push('Camera/Cinematography is recommended for better results')
    }

    if (!structure.lighting) {
        warnings.push('Lighting description is recommended')
    }

    if (!structure.negative) {
        warnings.push('Negative prompt is recommended to avoid artifacts')
    }

    // Check total length
    const totalLength = Object.values(structure).join(' ').length
    if (totalLength > 1500) {
        warnings.push(`Prompt is ${totalLength} characters, recommended max is 1500`)
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    }
}

/**
 * Quick fill presets for common scenarios
 */
export const quickFillPresets = {
    camera: {
        dramatic: 'low-angle shot, slow dolly-in, shallow depth of field',
        documentary: 'handheld, eye-level, natural movement',
        epic: 'wide establishing shot, crane movement, sweeping pan',
        intimate: 'close-up, static, shallow DOF with soft bokeh',
        action: 'tracking shot, dynamic angles, fast movements'
    },
    lighting: {
        golden: 'golden hour, warm sunlight, soft shadows',
        dramatic: 'harsh chiaroscuro, strong contrast, rim lighting',
        neon: 'neon lights, colorful reflections, cyberpunk glow',
        natural: 'soft diffused daylight, even illumination',
        moody: 'low-key lighting, deep shadows, single light source'
    },
    style: {
        cinematic: 'cinematic, photorealistic, film grain, 35mm',
        anime: 'Japanese anime style, vibrant colors, cel-shaded',
        noir: 'film noir, black and white, high contrast',
        documentary: 'documentary style, natural, authentic',
        fantasy: 'fantasy, ethereal, magical, dreamlike'
    },
    mood: {
        tense: 'tense, suspenseful, mysterious, ominous',
        peaceful: 'serene, calm, tranquil, contemplative',
        epic: 'epic, grandiose, majestic, awe-inspiring',
        romantic: 'romantic, tender, warm, intimate',
        dark: 'dark, foreboding, menacing, unsettling'
    }
}
