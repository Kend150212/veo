import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'

// POST: Generate channel description using AI
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, niche } = await req.json()

        if (!name || !niche) {
            return NextResponse.json(
                { error: 'Vui lòng nhập tên kênh và chủ đề' },
                { status: 400 }
            )
        }

        // Get AI config from user settings
        const aiConfig = await getAIConfigFromSettings(session.user.id)
        if (!aiConfig) {
            return NextResponse.json(
                { error: 'Vui lòng cấu hình API key trong Settings trước' },
                { status: 400 }
            )
        }

        // Generate comprehensive channel description
        const prompt = `Bạn là một chuyên gia tư vấn YouTube với nhiều năm kinh nghiệm xây dựng kênh thành công.

Hãy tạo MÔ TẢ KÊNH YOUTUBE chi tiết và chuyên nghiệp dựa trên thông tin sau:

🏷️ TÊN KÊNH: ${name}
📌 CHỦ ĐỀ/NICHE: ${niche}

Yêu cầu mô tả phải bao gồm:

1. **GIỚI THIỆU KÊNH** (2-3 câu):
   - Slogan/tagline hấp dẫn
   - Mục đích và giá trị cốt lõi của kênh
   - Điểm khác biệt so với các kênh cùng chủ đề

2. **NỘI DUNG CHÍNH** (3-4 bullet points):
   - Các loại video sẽ đăng
   - Chủ đề cụ thể được đề cập
   - Định dạng video (giải thích, storytelling, phỏng vấn, v.v.)

3. **ĐỐI TƯỢNG KHÁN GIẢ** (2-3 bullet points):
   - Độ tuổi mục tiêu
   - Sở thích và nhu cầu
   - Lý do họ nên subscribe

4. **LỊCH ĐĂNG VIDEO** (1 câu):
   - Tần suất đăng video dự kiến
   - Ngày/giờ cố định (nếu có)

5. **GIÁ TRỊ CAM KẾT** (2-3 bullet points):
   - Khán giả sẽ học được gì
   - Lợi ích khi theo dõi kênh
   - Phong cách trình bày đặc trưng

6. **CALL TO ACTION** (1-2 câu):
   - Mời subscribe và bật chuông
   - Khuyến khích tương tác

FORMAT OUTPUT:
- Viết bằng tiếng Việt tự nhiên, thân thiện nhưng chuyên nghiệp
- Sử dụng emoji phù hợp để tăng visual appeal
- Độ dài khoảng 300-500 từ
- Format dễ đọc với các mục rõ ràng
- Phù hợp để copy trực tiếp vào phần "Giới thiệu" trên YouTube

Chỉ trả về nội dung mô tả, không cần giải thích thêm.`

        const description = await generateText(aiConfig, prompt)

        return NextResponse.json({ 
            description: description.trim(),
            success: true 
        })

    } catch (error) {
        console.error('Generate description error:', error)
        return NextResponse.json(
            { error: 'Không thể tạo mô tả. Vui lòng thử lại.' },
            { status: 500 }
        )
    }
}
