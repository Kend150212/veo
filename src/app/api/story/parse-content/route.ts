import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Extract story elements from article content
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
        const { content } = body // Article content or any text

        if (!content || content.length < 50) {
            return NextResponse.json({
                error: 'Vui lòng nhập nội dung ít nhất 50 ký tự'
            }, { status: 400 })
        }

        // Get AI config
        const aiConfig = await getAIConfigFromSettings(session.user.id)
        if (!aiConfig) {
            return NextResponse.json({
                error: 'Vui lòng cấu hình API key trong Cài đặt'
            }, { status: 400 })
        }

        const prompt = `Phân tích nội dung sau và trích xuất các thông tin để tạo video:

CONTENT:
${content}

Hãy trích xuất:
1. subject: Chủ thể chính của video (nhân vật, sự vật)
2. action: Hành động chính diễn ra
3. scene: Bối cảnh, địa điểm
4. mood: Không khí, cảm xúc
5. style: Phong cách hình ảnh phù hợp
6. suggestedGenre: Thể loại phù hợp nhất
7. summary: Tóm tắt nội dung để làm video (2-3 câu)
8. suggestedSceneCount: Số cảnh đề xuất (dựa trên độ dài nội dung)
9. keyElements: Các yếu tố quan trọng cần giữ lại

Trả về ĐÚNG JSON object, không giải thích:
{
  "subject": "mô tả chủ thể",
  "action": "hành động chính",
  "scene": "bối cảnh",
  "mood": "không khí",
  "style": "cinematic, realistic, etc",
  "suggestedGenre": "action/drama/documentary/etc",
  "summary": "tóm tắt nội dung",
  "suggestedSceneCount": 15,
  "keyElements": ["yếu tố 1", "yếu tố 2"]
}`

        const result = await generateWithAI(aiConfig.apiKey, aiConfig.model || 'gemini-2.0-flash', prompt)

        // Parse JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            const extracted = JSON.parse(jsonMatch[0])
            return NextResponse.json({ extracted })
        }

        return NextResponse.json({ error: 'Không thể parse kết quả' }, { status: 500 })
    } catch (error) {
        console.error('Parse content error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to parse content'
        }, { status: 500 })
    }
}
