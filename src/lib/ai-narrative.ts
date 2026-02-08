// Narrative Script Generation Module
// B-roll Voiceover Style - Inspired by Anh Dư Leo storytelling format
// Use with narrative-templates.ts

import { getNarrativeTemplate, getTemplatePromptInstructions } from './narrative-templates'
import { generateText, type AIConfig } from './ai-story'

export interface NarrativeScriptInput {
    topic: string               // Chủ đề chính
    targetAudience?: string     // Đối tượng người xem
    keyPoints?: string[]        // Các điểm chính cần đề cập
    personalStory?: string      // Câu chuyện cá nhân (nếu có)
    duration: number            // Thời lượng video (giây)
    templateId: string          // ID của narrative template
    language?: string           // Ngôn ngữ (default: 'vi')
}

export interface NarrativeScriptSegment {
    phase: string              // ID của phase
    phaseName: string          // Tên phase
    percentage: number         // % thời lượng
    duration: number           // Thời lượng segment (giây)
    voiceover: string          // Lời thoại voiceover
    brollSuggestions: string[] // Gợi ý B-roll
}

export interface NarrativeScript {
    title: string
    totalDuration: number
    templateUsed: string
    segments: NarrativeScriptSegment[]
    fullScript: string         // Toàn bộ script liền mạch
}

// Generate narrative script using template
export async function generateNarrativeScript(
    config: AIConfig,
    input: NarrativeScriptInput
): Promise<NarrativeScript> {
    const template = getNarrativeTemplate(input.templateId)
    if (!template) {
        throw new Error(`Template not found: ${input.templateId}`)
    }

    const promptInstructions = getTemplatePromptInstructions(input.templateId)

    const prompt = `Bạn là một biên kịch video chuyên nghiệp. Hãy viết kịch bản voiceover cho video B-roll.

${promptInstructions}

THÔNG TIN VIDEO:
- Chủ đề: ${input.topic}
- Thời lượng: ${input.duration} giây
- Đối tượng: ${input.targetAudience || 'Người Việt trẻ 18-35 tuổi'}
${input.keyPoints ? `- Các điểm chính: ${input.keyPoints.join(', ')}` : ''}
${input.personalStory ? `- Câu chuyện cá nhân để tham khảo: ${input.personalStory}` : ''}

YÊU CẦU:
1. Viết lời thoại TỰ NHIÊN, như đang NÓI CHUYỆN với người xem
2. Mỗi segment phải có lời thoại phù hợp với thời lượng (khoảng 2-3 từ/giây)
3. Dùng GIỌNG ĐIỆU và MẪU CÂU như hướng dẫn ở trên
4. Thêm gợi ý B-roll phù hợp với nội dung từng đoạn

CẤU TRÚC OUTPUT (JSON):
{
    "title": "Tiêu đề video hấp dẫn",
    "segments": [
        {
            "phase": "hook",
            "phaseName": "Hook - Gây Tò Mò",
            "percentage": 5,
            "duration": ${Math.round(input.duration * 0.05)},
            "voiceover": "Lời thoại cho phần này...",
            "brollSuggestions": ["Gợi ý B-roll 1", "Gợi ý B-roll 2"]
        }
    ],
    "fullScript": "Toàn bộ lời thoại liền mạch..."
}

PHASES CẦN VIẾT (theo thứ tự):
${template.phases.map(p => `- ${p.id}: ${p.name} (${p.percentage}% = ~${Math.round(input.duration * p.percentage / 100)}s) - ${p.description}`).join('\n')}

Trả về CHỈ JSON, không có text khác.`

    const result = await generateText(config, prompt)

    try {
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            return {
                title: parsed.title || input.topic,
                totalDuration: input.duration,
                templateUsed: input.templateId,
                segments: parsed.segments || [],
                fullScript: parsed.fullScript || parsed.segments?.map((s: NarrativeScriptSegment) => s.voiceover).join('\n\n') || ''
            }
        }
    } catch (e) {
        console.error('Failed to parse narrative script:', e)
    }

    // Fallback: return empty structure
    return {
        title: input.topic,
        totalDuration: input.duration,
        templateUsed: input.templateId,
        segments: template.phases.map(p => ({
            phase: p.id,
            phaseName: p.name,
            percentage: p.percentage,
            duration: Math.round(input.duration * p.percentage / 100),
            voiceover: '',
            brollSuggestions: p.visualCues
        })),
        fullScript: ''
    }
}

// Generate B-roll prompt for each segment
export function generateBrollPrompts(
    segment: NarrativeScriptSegment,
    visualStyle: string
): string[] {
    return segment.brollSuggestions.map(suggestion =>
        `${suggestion}. Style: ${visualStyle}. Cinematic, high quality, professional footage. No text, no people talking to camera.`
    )
}

// Export narrative script as formatted text
export function formatNarrativeScript(script: NarrativeScript, format: 'text' | 'srt' | 'json'): string {
    switch (format) {
        case 'text':
            return script.segments.map(s =>
                `[${s.phaseName}] (${s.duration}s)\n${s.voiceover}\nB-roll: ${s.brollSuggestions.join(', ')}`
            ).join('\n\n---\n\n')

        case 'srt': {
            let srtContent = ''
            let currentTime = 0
            script.segments.forEach((s, idx) => {
                const startTime = formatSrtTime(currentTime)
                const endTime = formatSrtTime(currentTime + s.duration)
                srtContent += `${idx + 1}\n${startTime} --> ${endTime}\n${s.voiceover}\n\n`
                currentTime += s.duration
            })
            return srtContent
        }

        case 'json':
            return JSON.stringify(script, null, 2)

        default:
            return script.fullScript
    }
}

// Helper: Format time for SRT
function formatSrtTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.round((seconds % 1) * 1000)
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
}

// Convert narrative script to scene prompts for Veo
export function narrativeToScenePrompts(
    script: NarrativeScript,
    visualStyle: string
): { order: number; title: string; promptText: string; duration: number }[] {
    return script.segments.map((segment, idx) => ({
        order: idx + 1,
        title: segment.phaseName,
        promptText: `${segment.brollSuggestions[0] || 'Cinematic B-roll footage'}. ${visualStyle}. Professional documentary style. Mood: ${segment.phase}. High quality, cinematic lighting. No text overlays.`,
        duration: segment.duration
    }))
}
