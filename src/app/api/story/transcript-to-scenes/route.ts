import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'
import { prisma } from '@/lib/prisma'
import { getStyleById } from '@/lib/channel-styles'

// Vietnamese speech rate: ~130 words/minute = 2.2 words/second
const WORDS_PER_SECOND_VI = 2.2

interface TranscriptToScenesInput {
    transcript: string
    duration: number            // total video duration in seconds
    channelId: string
    channelVoice?: string       // optional channel voice/tone description
    selectedStyleId?: string    // visual style override
    separateVoice?: boolean     // split voiceover from promptText
    narrativeTemplateId?: string // 'ghost-story-broll' etc.
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json() as TranscriptToScenesInput

        if (!body.transcript || body.transcript.trim().length < 100) {
            return NextResponse.json({ error: 'Transcript quá ngắn.' }, { status: 400 })
        }
        if (!body.duration || body.duration < 30) {
            return NextResponse.json({ error: 'Thời lượng tối thiểu 30 giây.' }, { status: 400 })
        }
        if (!body.channelId) {
            return NextResponse.json({ error: 'channelId là bắt buộc.' }, { status: 400 })
        }

        // Load channel for style + character info
        const channel = await prisma.channel.findFirst({
            where: { id: body.channelId, userId: session.user.id },
            include: { characters: true, _count: { select: { episodes: true } } }
        })
        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        const aiConfig = await getAIConfigFromSettings(session.user.id)
        if (!aiConfig) {
            return NextResponse.json({ error: 'Vui lòng cấu hình API key trong Cài đặt' }, { status: 400 })
        }

        // Visual style
        const styleId = body.selectedStyleId || channel.visualStyleId
        const visualStyle = styleId ? getStyleById(styleId) : null
        const styleKeywords = visualStyle?.promptKeywords || channel.visualStyleKeywords || 'cinematic, B-roll, professional'

        // Scene count: ~1 scene per 30s, min 5, max 80
        const sceneCount = Math.min(80, Math.max(5, Math.round(body.duration / 30)))
        const secPerScene = Math.round(body.duration / sceneCount)
        const totalTargetWords = Math.round(body.duration * WORDS_PER_SECOND_VI)
        const wordsPerScene = Math.round(totalTargetWords / sceneCount)

        // Channel voice guide
        const channelVoiceGuide = body.channelVoice
            ? `\nGIỌNG VĂN KÊNH: ${body.channelVoice}\n`
            : `\nGIỌNG VĂN MẶC ĐỊNH: Thân mật, tự nhiên, kể chuyện gần gũi, câu ngắn gọn dễ nghe.\n`

        // Ghost story specific instructions
        const isGhostStory = body.narrativeTemplateId === 'ghost-story-broll'
        const ghostStoryInstr = isGhostStory ? `
PHONG CÁCH KỂ CHUYỆN MA (BẮT BUỘC):
- Giọng điềm tĩnh, chậm rãi, như kể chuyện ban đêm
- KHÔNG dùng từ "ma" trực tiếp — dùng: "thứ đó", "nó", "hình bóng", "sự hiện diện"
- Xen kẽ câu DÀI (miêu tả không khí) và câu RẤT NGẮN (tạo shock)
- Chi tiết dân gian Việt: bàn thờ, nhang khói, đêm Rằm, ngã ba đường, cô hồn
- Kết thúc mở — để lại dư âm, không giải thích hết
B-ROLL CHO TRUYỆN MA: cảnh đêm khuya, địa điểm bỏ hoang, ánh nến, bóng đổ, gương, sương mù
` : ''

        // Transcript (cap at 100k chars for context window)
        const transcriptText = body.transcript.length > 100000
            ? body.transcript.substring(0, 100000) + '\n[Transcript bị cắt do giới hạn độ dài]'
            : body.transcript

        const separateVoice = body.separateVoice ?? false

        const prompt = `Bạn là biên kịch video chuyên nghiệp. Hãy chuyển đổi TOÀN BỘ transcript bên dưới thành ${sceneCount} scenes hoàn chỉnh cho video ${Math.round(body.duration / 60)} phút.

VIDEO: ${Math.round(body.duration / 60)} phút | ${sceneCount} scenes | ~${secPerScene}s/scene
TARGET VOICEOVER: ~${totalTargetWords} từ tổng (~${wordsPerScene} từ/scene)
VISUAL STYLE: ${styleKeywords}
${channelVoiceGuide}
${ghostStoryInstr}

NGUYÊN TẮC BẮT BUỘC:

1. LỌC BỎ HOÀN TOÀN:
   - Intro kênh gốc, tên host gốc, lời chào kênh ("Chào mừng các bạn đến kênh X...")
   - Kêu like/subscribe/share/bật chuông kênh gốc
   - Thông tin liên hệ kênh gốc (email, zalo, fb, sđt)
   - Outro kênh gốc ("Cảm ơn đã xem, hẹn gặp lại...")

2. GIỮ NGUYÊN VÀ MỞ RỘNG:
   - Toàn bộ tình tiết câu chuyện, sự kiện, nhân vật, địa điểm
   - Mọi chi tiết cảm xúc và không khí
   - Nếu transcript ngắn hơn target → mở rộng miêu tả, không khí để đủ độ dài

3. OUTPUT MỖI SCENE PHẢI CÓ:
   - promptText: Mô tả hình ảnh B-roll theo style "${styleKeywords}", BẮT BUỘC ~${secPerScene}s, KHÔNG có voiceover text trong này${separateVoice ? '' : ' (trừ khi separateVoice=false thì kết hợp voiceover cuối promptText)'}
   - voiceover: Lời dẫn ~${wordsPerScene} từ viết lại bằng giọng kênh mình — KHÔNG được dưới 50% target
   - duration: ${secPerScene}

TRANSCRIPT GỐC:
---
${transcriptText}
---

OUTPUT FORMAT (JSON duy nhất, không có text khác trước hoặc sau JSON):
{
  "title": "Tiêu đề hấp dẫn cho câu chuyện",
  "synopsis": "Tóm tắt 1-2 câu",
  "scenes": [
    {
      "order": 1,
      "title": "Tên scene ngắn",
      "promptText": "Mô tả B-roll chi tiết theo style, ~${secPerScene}s. ${styleKeywords}. Camera: [góc quay]. Lighting: [ánh sáng]. Atmosphere: [không khí].",
      "voiceover": "Lời dẫn đầy đủ ~${wordsPerScene} từ...",
      "duration": ${secPerScene}
    }
  ],
  "fullScript": "Toàn bộ voiceover ghép lại liền mạch"
}`

        const result = await generateText(aiConfig, prompt)

        try {
            const jsonMatch = result.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                const nextEpisodeNumber = channel._count.episodes + 1

                return NextResponse.json({
                    title: parsed.title || 'Kịch bản từ transcript',
                    synopsis: parsed.synopsis || '',
                    scenes: parsed.scenes || [],
                    fullScript: parsed.fullScript || '',
                    episodeNumber: nextEpisodeNumber,
                    stats: {
                        inputWords: body.transcript.split(/\s+/).length,
                        targetWords: totalTargetWords,
                        sceneCount: parsed.scenes?.length || 0,
                        durationMinutes: Math.round(body.duration / 60)
                    }
                })
            }
        } catch (e) {
            console.error('Failed to parse transcript-to-scenes result:', e)
        }

        return NextResponse.json({
            error: 'AI không thể xử lý transcript. Vui lòng thử lại.'
        }, { status: 500 })

    } catch (error) {
        console.error('transcript-to-scenes error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Lỗi không xác định'
        }, { status: 500 })
    }
}
