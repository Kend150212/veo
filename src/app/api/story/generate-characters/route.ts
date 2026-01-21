import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface CharacterSuggestion {
    name: string
    role: 'protagonist' | 'antagonist' | 'supporting' | 'extra'
    fullDescription: string
    appearance: string
    clothing: string
    personality: string
}

// Generate text using AI
async function generateWithAI(apiKey: string, model: string, prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey)
    const genModel = genAI.getGenerativeModel({ model })
    const result = await genModel.generateContent(prompt)
    return result.response.text()
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { idea, genre, storyOutline, articleContent, suggestCount } = body

        // Get AI config
        const aiConfig = await getAIConfigFromSettings(session.user.id)
        if (!aiConfig) {
            return NextResponse.json({
                error: 'Vui lòng cấu hình API key trong Cài đặt'
            }, { status: 400 })
        }

        // Build context from either story idea or article content
        const context = articleContent
            ? `Nội dung bài viết/tài liệu:\n${articleContent}`
            : `Ý tưởng: ${idea?.title || ''}\nTóm tắt: ${idea?.synopsis || ''}\nThể loại: ${genre || ''}\nNội dung: ${storyOutline || ''}`

        const prompt = `Bạn là chuyên gia xây dựng nhân vật cho video/phim.

${context}

Dựa trên nội dung trên, hãy:
1. Đề xuất số lượng nhân vật phù hợp (${suggestCount ? suggestCount : 'từ 2-5 nhân vật'})
2. Tạo mô tả chi tiết cho từng nhân vật

Yêu cầu cho mỗi nhân vật:
- name: Tên nhân vật
- role: protagonist (chính), antagonist (phản diện), supporting (phụ), extra (phụ họa)
- fullDescription: Mô tả đầy đủ 1 câu để dùng trong prompt (bao gồm tuổi, ngoại hình, trang phục, đặc điểm nhận dạng)
- appearance: Chi tiết ngoại hình (tuổi, chiều cao, vóc dáng, tóc, mắt, da)
- clothing: Trang phục mặc định
- personality: Tính cách, phong thái

QUAN TRỌNG: fullDescription phải là MỘT CÂU hoàn chỉnh có thể copy-paste trực tiếp vào video prompt.

Trả về ĐÚNG JSON array, không giải thích:
[{
  "name": "Tên",
  "role": "protagonist",
  "fullDescription": "Một người đàn ông 35 tuổi với khuôn mặt góc cạnh, tóc đen ngắn, mặc áo vest xám, đeo kính gọng vàng",
  "appearance": "35 tuổi, cao 1m75, vóc dáng athletic, tóc đen ngắn, mắt nâu sâu",
  "clothing": "Áo vest xám, sơ mi trắng, quần tây đen",
  "personality": "Điềm tĩnh, thông minh, quyết đoán"
}]`

        const result = await generateWithAI(aiConfig.apiKey, aiConfig.model || 'gemini-2.0-flash', prompt)

        // Parse JSON from response
        const jsonMatch = result.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            const characters: CharacterSuggestion[] = JSON.parse(jsonMatch[0])
            return NextResponse.json({
                characters,
                suggestedCount: characters.length
            })
        }

        return NextResponse.json({ error: 'Không thể parse kết quả' }, { status: 500 })
    } catch (error) {
        console.error('Generate characters error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to generate characters'
        }, { status: 500 })
    }
}
