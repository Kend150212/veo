import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'
import { prisma } from '@/lib/prisma'

// POST: Generate detailed character description using AI
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const { 
            name, 
            role, 
            personality,
            gender,
            ageRange,
            style // visual style like anime, pixar, realistic, etc.
        } = await req.json()

        if (!name) {
            return NextResponse.json({ error: 'Tên nhân vật là bắt buộc' }, { status: 400 })
        }

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Get AI config
        const config = await getAIConfigFromSettings(session.user.id)
        if (!config) {
            return NextResponse.json({ error: 'Chưa cấu hình API key' }, { status: 400 })
        }

        const genderVi = gender === 'female' ? 'nữ' : gender === 'male' ? 'nam' : 'không xác định'
        const ageVi = ageRange || '25-35 tuổi'
        const roleVi = role === 'host' ? 'Host chính' : role === 'sidekick' ? 'Nhân vật phụ' : role === 'mascot' ? 'Mascot' : role || 'Host'
        const styleVi = style || 'Pixar 3D Animation'

        const prompt = `Bạn là chuyên gia thiết kế nhân vật (Character Designer) cho video YouTube/Animation.

Hãy tạo MÔ TẢ NHÂN VẬT CỰC KỲ CHI TIẾT cho mục đích tạo video AI nhất quán.

📋 THÔNG TIN ĐẦU VÀO:
- Tên: ${name}
- Vai trò: ${roleVi}
- Giới tính: ${genderVi}
- Độ tuổi: ${ageVi}
- Phong cách visual: ${styleVi}
- Tính cách: ${personality || 'Thân thiện, chuyên nghiệp'}
- Chủ đề kênh: ${channel.niche}

📐 YÊU CẦU MÔ TẢ CHI TIẾT (QUAN TRỌNG - để đồng bộ nhân vật qua các scene):

1. 👤 KHUÔN MẶT (Face):
   - Hình dạng khuôn mặt (oval, tròn, vuông, trái tim...)
   - Màu da và đặc điểm da (tone, có tàn nhang/nốt ruồi không)
   - Đôi mắt: màu mắt, hình dạng, lông mày
   - Mũi: hình dạng, kích thước
   - Miệng/môi: màu sắc, độ dày
   - Tai: hình dạng, có khuyên không

2. 💇 TÓC (Hair):
   - Kiểu tóc chi tiết (dài/ngắn, thẳng/xoăn, cách cắt)
   - Màu tóc chính xác (có highlight không)
   - Cách tạo kiểu (buộc, xõa, rẽ ngôi...)

3. 👕 TRANG PHỤC (Outfit):
   - Trang phục chính/mặc định
   - Màu sắc và chất liệu
   - Phụ kiện (đồng hồ, nhẫn, vòng tay, kính...)
   - Giày dép

4. 🎭 ĐẶC ĐIỂM NHẬN DẠNG (Distinctive Features):
   - 2-3 đặc điểm nổi bật nhất để nhận ra ngay
   - Thói quen cử chỉ/biểu cảm đặc trưng
   - Điểm khác biệt so với nhân vật thông thường

5. 📏 DÁNG NGƯỜI (Body):
   - Chiều cao ước lượng (cao/trung bình/thấp)
   - Dáng người (mảnh khảnh, bình thường, đầy đặn, cơ bắp)
   - Tư thế đứng/ngồi đặc trưng

6. 🎨 STYLE KEYWORDS (cho AI video):
   - 10-15 keywords tiếng Anh mô tả nhân vật cho Sora/Runway/Veo

📝 FORMAT OUTPUT (JSON):
{
    "fullDescription": "Mô tả đầy đủ bằng tiếng Việt, 200-300 từ, chi tiết từng phần...",
    "appearance": "Mô tả ngoại hình ngắn gọn 50 từ",
    "faceDetails": "Chi tiết khuôn mặt",
    "hairDetails": "Chi tiết tóc",
    "clothing": "Trang phục mặc định",
    "skinTone": "Màu da",
    "bodyType": "Dáng người",
    "distinctiveFeatures": ["Đặc điểm 1", "Đặc điểm 2", "Đặc điểm 3"],
    "styleKeywords": "English keywords for AI video generation, comma separated",
    "voiceStyle": "Giọng nói đặc trưng"
}

⚠️ QUAN TRỌNG:
- Mô tả phải CỤ THỂ, không mơ hồ (VD: "tóc nâu đậm bob cut ngang vai" thay vì "tóc đẹp")
- Phù hợp với ${styleVi} style
- Có thể dùng trực tiếp trong AI video prompt
- Đảm bảo nhất quán qua tất cả các scene

Chỉ trả về JSON, không giải thích thêm.`

        const result = await generateText(config, prompt)

        // Parse AI response
        let characterData
        try {
            const jsonMatch = result.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                characterData = JSON.parse(jsonMatch[0])
            } else {
                throw new Error('No JSON found')
            }
        } catch (parseError) {
            console.error('Parse error:', parseError, 'Raw result:', result)
            return NextResponse.json({ error: 'AI không thể tạo mô tả. Thử lại.' }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            character: {
                name,
                role,
                personality,
                ...characterData
            }
        })

    } catch (error) {
        console.error('Generate character error:', error)
        return NextResponse.json({ error: 'Failed to generate character' }, { status: 500 })
    }
}
