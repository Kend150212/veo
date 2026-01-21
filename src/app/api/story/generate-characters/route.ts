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
    skinTone: string        // Chi tiết màu da
    faceDetails: string     // Chi tiết khuôn mặt
    hairDetails: string     // Chi tiết kiểu tóc
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

        const prompt = `Bạn là chuyên gia xây dựng nhân vật cho video/phim. Tạo mô tả SIÊU CHI TIẾT cho từng nhân vật.

${context}

Dựa trên nội dung trên, hãy:
1. Đề xuất số lượng nhân vật phù hợp (${suggestCount ? suggestCount : 'từ 2-5 nhân vật'})
2. Tạo mô tả CHI TIẾT TUYỆT ĐỐI cho từng nhân vật

QUY TẮC AN TOÀN NỘI DUNG (BẮT BUỘC):
- TẤT CẢ nhân vật PHẢI từ 18 tuổi trở lên
- KHÔNG tạo nhân vật là trẻ em, thiếu niên, hoặc người chưa thành niên
- Tuổi tối thiểu cho mọi nhân vật là 18 tuổi
- Nếu cần nhân vật trẻ, hãy mô tả là "người trưởng thành trẻ tuổi" (18-25 tuổi)

YÊU CẦU CHI TIẾT CHO MỖI NHÂN VẬT:
- name: Tên nhân vật
- role: protagonist (chính), antagonist (phản diện), supporting (phụ), extra (phụ họa)
- fullDescription: MỘT CÂU HOÀN CHỈNH bao gồm TẤT CẢ thông tin visual bên dưới - đây là "Character Bible" sẽ được dùng VERBATIM ở MỌI SCENE
- appearance: Mô tả chi tiết (tuổi chính xác 18+, chiều cao cm, vóc dáng cụ thể, đặc điểm riêng biệt)
- skinTone: Màu da CHI TIẾT (ví dụ: da trắng sứ, da trắng kem, da bánh mật, da nâu đậm, da olive...)
- faceDetails: Chi tiết khuôn mặt (hình dáng: oval/tròn/trái xoan/vuông, đặc điểm: nốt ruồi, sẹo, nếp nhăn, lúm đồng tiền, râu...)
- hairDetails: Kiểu tóc CHI TIẾT (độ dài cm, kiểu: bob/layer/pixie/undercut, màu: nâu hạt dẻ/đen nhánh/vàng platinum, texture: thẳng/xoăn/gợn sóng)
- clothing: Trang phục MẶC ĐỊNH chi tiết (từng item, màu sắc cụ thể, chất liệu, hoa văn, phụ kiện kèm theo)
- personality: Tính cách, phong thái, cách đi đứng

QUAN TRỌNG VỀ fullDescription:
- Đây PHẢI là câu mô tả ĐẦY ĐỦ có thể copy-paste trực tiếp vào EVERY video prompt
- fullDescription = appearance + skinTone + faceDetails + hairDetails + clothing
- Ví dụ: "Một người đàn ông 35 tuổi cao 1m78, vóc dáng athletic, da bánh mật, khuôn mặt vuông góc cạnh với râu quai nón, tóc đen ngắn 3cm cắt undercut gọn gàng, mặc áo sơ mi trắng cotton bỏ ngoài quần jeans xanh đậm, đeo đồng hồ thể thao màu đen"

Trả về ĐÚNG JSON array, không giải thích:
[{
  "name": "Tên",
  "role": "protagonist",
  "fullDescription": "Mô tả SIÊU CHI TIẾT một câu hoàn chỉnh như ví dụ trên",
  "appearance": "35 tuổi, cao 1m78, vóc dáng athletic, vai rộng",
  "skinTone": "Da bánh mật sáng, đều màu",
  "faceDetails": "Khuôn mặt vuông góc cạnh, mắt nâu sâu, lông mày đậm, râu quai nón cắt tỉa gọn",
  "hairDetails": "Tóc đen ngắn 3cm, kiểu undercut, chải ngược gọn gàng",
  "clothing": "Áo sơ mi trắng cotton slim-fit bỏ ngoài quần, quần jeans xanh đậm straight-cut, đeo đồng hồ thể thao Casio màu đen",
  "personality": "Điềm tĩnh, thông minh, đi đứng tự tin"
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
