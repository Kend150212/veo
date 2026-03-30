import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'
import type { NarrativeScript, NarrativeScriptSegment } from '@/lib/ai-narrative'

interface RewriteTranscriptInput {
    transcript: string
    duration: number            // seconds
    channelVoice?: string       // optional: describe channel tone/style
    templateId?: string         // optional: narrative template to follow
    language?: string
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json() as RewriteTranscriptInput

        if (!body.transcript || body.transcript.trim().length < 100) {
            return NextResponse.json({
                error: 'Transcript quá ngắn. Vui lòng paste đủ nội dung.'
            }, { status: 400 })
        }

        if (!body.duration || body.duration < 30) {
            return NextResponse.json({
                error: 'Vui lòng nhập thời lượng video (tối thiểu 30 giây)'
            }, { status: 400 })
        }

        const aiConfig = await getAIConfigFromSettings(session.user.id)
        if (!aiConfig) {
            return NextResponse.json({
                error: 'Vui lòng cấu hình API key trong Cài đặt'
            }, { status: 400 })
        }

        const durationMinutes = Math.round(body.duration / 60)
        const estimatedSegments = Math.max(5, Math.round(body.duration / 60))
        const language = body.language || 'vi'

        const channelVoiceGuide = body.channelVoice
            ? `\nGIỌNG VĂN KÊNH MÀY:\n${body.channelVoice}\n`
            : `\nGIỌNG VĂN MẶC ĐỊNH:\n- Thân mật, tự nhiên, như đang kể chuyện cho bạn bè nghe\n- Xưng hô gần gũi\n- Câu ngắn gọn, dễ nghe\n`

        const prompt = `Bạn là biên kịch video chuyên nghiệp. Nhiệm vụ: rewrite transcript bên dưới thành kịch bản video của kênh này.

${channelVoiceGuide}

NGUYÊN TẮC REWRITE BẮT BUỘC:
1. LỌC BỎ HOÀN TOÀN (không để lại dấu vết):
   - Intro kênh, tên kênh/host gốc, lời chào kênh
   - Kêu subscribe, like, share, bật chuông, đăng ký
   - Thông tin liên hệ: email, zalo, facebook, số điện thoại
   - Outro/cảm ơn/lời kết của kênh gốc
   - Bất kỳ nội dung quảng bá kênh gốc nào

2. GIỮ NGUYÊN:
   - Toàn bộ nội dung câu chuyện, sự kiện, tình tiết
   - Tên nhân vật trong câu chuyện (không phải host)
   - Chi tiết địa điểm, thời gian, diễn biến
   - Cảm xúc và không khí câu chuyện

3. REWRITE:
   - Viết lại bằng giọng văn kênh mình (xem hướng dẫn trên)
   - Làm mượt câu: loại um/ừ/à/này nọ lặp, câu ngập ngừng
   - Chia thành ${estimatedSegments} segments (~${Math.round(body.duration / estimatedSegments)}s mỗi đoạn)
   - Thêm gợi ý B-roll phù hợp nội dung từng đoạn

TRANSCRIPT GỐC:
---
${body.transcript.substring(0, 15000)}${body.transcript.length > 15000 ? '\n[...transcript tiếp tục...]' : ''}
---

OUTPUT FORMAT (JSON duy nhất, không có text khác):
{
  "title": "Tiêu đề hấp dẫn cho câu chuyện này",
  "segments": [
    {
      "phase": "segment_1",
      "phaseName": "Mở đầu / Hook",
      "percentage": 10,
      "duration": ${Math.round(body.duration * 0.1)},
      "voiceover": "Lời dẫn đã được rewrite...",
      "brollSuggestions": ["Gợi ý B-roll 1", "Gợi ý B-roll 2"]
    }
  ],
  "fullScript": "Toàn bộ kịch bản liền mạch đã được rewrite..."
}`

        const result = await generateText(aiConfig, prompt)

        try {
            const jsonMatch = result.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])

                const script: NarrativeScript = {
                    title: parsed.title || 'Kịch bản từ transcript',
                    totalDuration: body.duration,
                    templateUsed: body.templateId || 'rewrite-transcript',
                    segments: (parsed.segments || []) as NarrativeScriptSegment[],
                    fullScript: parsed.fullScript || parsed.segments?.map((s: NarrativeScriptSegment) => s.voiceover).join('\n\n') || ''
                }

                return NextResponse.json({ script })
            }
        } catch (e) {
            console.error('Failed to parse rewrite result:', e)
        }

        return NextResponse.json({
            error: 'AI không thể rewrite transcript. Vui lòng thử lại.'
        }, { status: 500 })

    } catch (error) {
        console.error('Rewrite transcript error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Không thể rewrite transcript'
        }, { status: 500 })
    }
}
