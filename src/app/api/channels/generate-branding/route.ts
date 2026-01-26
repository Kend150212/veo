import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'

// POST: Generate complete YouTube channel branding (description, tags, logo prompts, banner prompts)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, niche, language = 'vi' } = await req.json()

        if (!name || !niche) {
            return NextResponse.json(
                { error: 'Vui lòng nhập tên kênh và chủ đề' },
                { status: 400 }
            )
        }

        const isVietnamese = language === 'vi'
        const langInstruction = isVietnamese 
            ? 'Tạo nội dung bằng TIẾNG VIỆT. Mô tả, tags có thể mix tiếng Anh cho SEO.'
            : 'Create content in ENGLISH. Description, tags should be in English with some Vietnamese keywords for SEO.'

        // Get AI config from user settings
        const aiConfig = await getAIConfigFromSettings(session.user.id)
        if (!aiConfig) {
            return NextResponse.json(
                { error: 'Vui lòng cấu hình API key trong Settings trước' },
                { status: 400 }
            )
        }

        // Generate comprehensive branding package
        const prompt = `Bạn là một chuyên gia branding và marketing YouTube hàng đầu. 
Hãy tạo TRỌN BỘ BRANDING cho kênh YouTube dựa trên thông tin:

🏷️ TÊN KÊNH HIỆN TẠI: ${name}
📌 CHỦ ĐỀ/NICHE: ${niche}
🌐 NGÔN NGỮ: ${isVietnamese ? 'Tiếng Việt' : 'English'}

⚠️ ${langInstruction}

Trả về JSON với format sau (QUAN TRỌNG: chỉ trả về JSON, không có text khác):

{
  "nameSuggestions": [
    {
      "name": "Tên kênh gợi ý 1 - hay hơn, catchy hơn, dễ nhớ",
      "reason": "Giải thích ngắn tại sao tên này hay"
    },
    {
      "name": "Tên kênh gợi ý 2 - khác biệt, unique",
      "reason": "Giải thích ngắn"
    },
    {
      "name": "Tên kênh gợi ý 3 - sáng tạo, viral potential",
      "reason": "Giải thích ngắn"
    }
  ],

  "description": "Mô tả kênh chi tiết 300-500 từ bằng tiếng Việt, bao gồm: giới thiệu kênh với slogan hấp dẫn, nội dung chính (bullet points), đối tượng khán giả, lịch đăng video, giá trị cam kết, call to action mời subscribe. Sử dụng emoji phù hợp. Format dễ đọc.",
  
  "tags": ["15-20 tags/keywords SEO phù hợp cho kênh, tiếng Việt và tiếng Anh mix"],
  
  "logoPrompts": [
    {
      "style": "Tên style (VD: Modern Minimalist)",
      "prompt": "Prompt chi tiết bằng tiếng Anh để tạo logo với AI image generator. Mô tả: concept, colors, typography style, icon elements, mood. 50-100 từ.",
      "description": "Mô tả ngắn bằng tiếng Việt về style logo này"
    },
    {
      "style": "Tên style 2",
      "prompt": "Prompt khác biệt cho logo option 2",
      "description": "Mô tả style 2"
    },
    {
      "style": "Tên style 3", 
      "prompt": "Prompt khác biệt cho logo option 3",
      "description": "Mô tả style 3"
    }
  ],
  
  "bannerPrompts": [
    {
      "style": "Tên style banner",
      "prompt": "Prompt chi tiết bằng tiếng Anh để tạo YouTube banner (2560x1440px). Mô tả: layout, background, elements, colors, mood, text placement area. 50-100 từ.",
      "description": "Mô tả ngắn bằng tiếng Việt"
    },
    {
      "style": "Tên style 2",
      "prompt": "Prompt banner option 2",
      "description": "Mô tả style 2"
    },
    {
      "style": "Tên style 3",
      "prompt": "Prompt banner option 3", 
      "description": "Mô tả style 3"
    }
  ],
  
  "channelKeywords": "Các keyword chính cho YouTube channel settings, cách nhau bởi dấu phẩy",
  
  "suggestedColors": {
    "primary": "#hexcolor - màu chủ đạo phù hợp với niche",
    "secondary": "#hexcolor - màu phụ",
    "accent": "#hexcolor - màu nhấn"
  },
  
  "targetAudience": {
    "ageRange": "VD: 18-35",
    "interests": ["sở thích 1", "sở thích 2"],
    "demographics": "Mô tả ngắn đối tượng"
  }
}

YÊU CẦU QUAN TRỌNG:
1. Logo prompts phải đa dạng styles: 1 modern/minimalist, 1 creative/artistic, 1 professional/corporate
2. Banner prompts phải đa dạng: 1 clean professional, 1 dynamic/energetic, 1 thematic/storytelling
3. Prompts phải BẰNG TIẾNG ANH và rất chi tiết để AI image generator hiểu
4. Mỗi prompt phải include: art style, color palette, composition, mood, specific elements
5. Tags phải SEO-friendly, mix tiếng Việt và Anh
6. Description phải hấp dẫn, có emoji, dễ copy vào YouTube

CHỈ TRẢ VỀ JSON, KHÔNG CÓ MARKDOWN HOẶC TEXT KHÁC.`

        const response = await generateText(aiConfig, prompt)
        
        // Parse JSON response
        let branding
        try {
            // Clean the response - remove markdown code blocks if present
            let cleanResponse = response.trim()
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
            }
            
            branding = JSON.parse(cleanResponse)
        } catch (parseError) {
            console.error('Failed to parse branding JSON:', parseError)
            console.error('Raw response:', response)
            
            // Return a basic structure if parsing fails
            return NextResponse.json({
                error: 'Không thể parse kết quả AI. Vui lòng thử lại.',
                rawResponse: response.substring(0, 500)
            }, { status: 500 })
        }

        return NextResponse.json({ 
            branding,
            success: true 
        })

    } catch (error) {
        console.error('Generate branding error:', error)
        return NextResponse.json(
            { error: 'Không thể tạo branding. Vui lòng thử lại.' },
            { status: 500 }
        )
    }
}
