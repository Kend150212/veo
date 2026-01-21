import { z } from 'zod'

// User validation
export const loginSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
})

export const registerSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .max(100, 'Mật khẩu không được quá 100 ký tự'),
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(50, 'Tên không được quá 50 ký tự')
})

// Prompt validation
export const promptStructureSchema = z.object({
    subject: z.string().min(10, 'Chủ thể phải có ít nhất 10 ký tự').max(500),
    action: z.string().min(5, 'Hành động phải có ít nhất 5 ký tự').max(500),
    scene: z.string().max(500).optional(),
    camera: z.string().max(300).optional(),
    style: z.string().max(300).optional(),
    lighting: z.string().max(300).optional(),
    mood: z.string().max(200).optional(),
    audio: z.string().max(300).optional(),
    negative: z.string().max(500).optional()
})

export const savePromptSchema = z.object({
    title: z.string().min(1, 'Tiêu đề là bắt buộc').max(100),
    structure: promptStructureSchema,
    category: z.string().optional(),
    tags: z.array(z.string()).optional()
})

// Template validation
export const templateSchema = z.object({
    name: z.string().min(1).max(100),
    nameVi: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
    descriptionVi: z.string().max(500).optional(),
    category: z.enum(['cinematic', 'product', 'nature', 'scifi', 'romance', 'horror', 'music', 'other']),
    structure: promptStructureSchema,
    isPublic: z.boolean().default(true)
})

// Export options validation
export const exportOptionsSchema = z.object({
    format: z.enum(['text', 'json', 'api']),
    includeNegative: z.boolean().default(true),
    aspectRatio: z.enum(['16:9', '9:16', '1:1']).optional(),
    videoLength: z.number().min(1).max(60).optional(),
    resolution: z.enum(['720p', '1080p', '4K']).optional(),
    generateAudio: z.boolean().optional()
})

// AI suggestion request
export const aiSuggestionSchema = z.object({
    section: z.enum(['subject', 'action', 'scene', 'camera', 'style', 'lighting', 'mood', 'audio', 'negative']),
    currentContext: z.string().max(1000).optional(),
    genre: z.string().max(50).optional()
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type PromptStructureInput = z.infer<typeof promptStructureSchema>
export type SavePromptInput = z.infer<typeof savePromptSchema>
export type TemplateInput = z.infer<typeof templateSchema>
export type ExportOptionsInput = z.infer<typeof exportOptionsSchema>
export type AISuggestionInput = z.infer<typeof aiSuggestionSchema>
