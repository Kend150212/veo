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

// Vietnamese speech rate: ~130-150 words/minute
const WORDS_PER_SECOND = 2.2

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
        // ~1 segment per 2.5 minutes, minimum 5, maximum 60
        const estimatedSegments = Math.min(60, Math.max(5, Math.round(durationMinutes / 2.5)))
        const totalTargetWords = Math.round(body.duration * WORDS_PER_SECOND)
        const wordsPerSegment = Math.round(totalTargetWords / estimatedSegments)
        const secPerSegment = Math.round(body.duration / estimatedSegments)

        const channelVoiceGuide = body.channelVoice
            ? `\nGIỌNG VĂN KÊNH:\n${body.channelVoice}\n`
            : `\nGIỌNG VĂN MẶC ĐỊNH:\n- Thân mật, tự nhiên, như đang kể chuyện cho bạn bè nghe\n- Xưng hô gần gũi\n- Câu ngắn gọn, dễ nghe\n`

        // For very long transcripts, send full text but instruct AI to process the whole thing
        // Most modern models support 128k+ context so we send full transcript up to 100k chars
        const transcriptText = body.transcript.length > 100000
            ? body.transcript.substring(0, 100000) + '\n[Phần còn lại của transcript đã bị cắt do giới hạn độ dài]'
            : body.transcript

        const prompt = `Bạn là biên kịch video chuyên nghiệp. Nhiệm vụ: rewrite TOÀN BỘ transcript bên dưới thành kịch bản video của kênh này.

VIDEO DURATION: ${durationMinutes} phút (${body.duration} giây)
TARGET OUTPUT: ${totalTargetWords} từ tổng cộng (tốc độ đọc tiếng Việt ~${Math.round(WORDS_PER_SECOND * 60)} từ/phút)
SỐ SEGMENTS: ${estimatedSegments} đoạn (~${wordsPerSegment} từ mỗi đoạn, ~${secPerSegment}s mỗi đoạn)

${channelVoiceGuide}

NGUYÊN TẮC REWRITE BẮT BUỘC:

1. LỌC BỎ HOÀN TOÀN (không để lại dấu vết):
   - Intro kênh, tên kênh/host gốc, lời chào kênh ("Chào mừng các bạn đến kênh...", "Mình là...")
   - Kêu subscribe, like, share, bật chuông, đăng ký kênh
   - Thông tin liên hệ kênh gốc: email, zalo, facebook, số điện thoại
   - Outro/cảm ơn/lời kết kiểu kênh gốc ("Cảm ơn các bạn đã xem...", "Hẹn gặp lại...")
   - Quảng bá kênh gốc, tên kênh, thương hiệu kênh gốc

2. GIỮ NGUYÊN VÀ MỞ RỘNG:
   - TOÀN BỘ chi tiết câu chuyện: sự kiện, tình tiết, nhân vật, địa điểm, thời gian
   - Cảm xúc, không khí câu chuyện
   - Mọi chi tiết quan trọng dù nhỏ — KHÔNG được lược bỏ tình tiết
   - Nếu transcript ngắn hơn target, hãy mở rộng chi tiết để đủ độ dài

3. REWRITE:
   - Viết lại bằng giọng văn kênh mình
   - Làm mượt: loại um/ừ/à/này nọ lặp, câu ngập ngừng, lắp bắp
   - Chia thành ĐÚNG ${estimatedSegments} segments
   - MỖI SEGMENT PHẢI CÓ KHOẢNG ${wordsPerSegment} TỪ — KHÔNG được viết đoạn ngắn hơn 50% target
   - Thêm gợi ý B-roll sáng tạo phù hợp nội dung từng đoạn

⚠️ QUAN TRỌNG VỀ ĐỘ DÀI:
- Tổng output phải đạt ~${totalTargetWords} từ
- Mỗi segment phải có voiceover ~${wordsPerSegment} từ (không phải tóm tắt, phải là văn kể chuyện đầy đủ)
- Nếu transcript gốc có nhiều chi tiết → giữ tất cả, không tóm tắt
- Nếu transcript gốc ít chi tiết hơn target → bổ sung mô tả, cảm xúc, không khí để đủ độ dài

TRANSCRIPT GỐC:
---
${transcriptText}
---

OUTPUT FORMAT (JSON duy nhất, không có text khác trước hoặc sau):
{
  "title": "Tiêu đề hấp dẫn cho câu chuyện này",
  "segments": [
    {
      "phase": "segment_1",
      "phaseName": "Mở đầu / Hook",
      "percentage": ${Math.round(100 / estimatedSegments)},
      "duration": ${secPerSegment},
      "voiceover": "Lời dẫn đầy đủ ~${wordsPerSegment} từ đã được rewrite...",
      "brollSuggestions": ["Gợi ý B-roll sáng tạo 1", "Gợi ý B-roll sáng tạo 2", "Gợi ý B-roll sáng tạo 3"]
    }
  ],
  "fullScript": "Toàn bộ ${totalTargetWords} từ kịch bản liền mạch đã được rewrite..."
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

                return NextResponse.json({
                    script,
                    stats: {
                        inputWords: body.transcript.split(/\s+/).length,
                        targetWords: totalTargetWords,
                        segments: script.segments.length,
                        durationMinutes
                    }
                })
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
