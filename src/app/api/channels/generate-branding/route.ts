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
            : `⚠️ CRITICAL - ENGLISH ONLY MODE ⚠️
ALL content MUST be in ENGLISH. Even if user input is in Vietnamese/other language:
- TRANSLATE the concept to English first
- Description: 100% ENGLISH (no Vietnamese text at all)
- Name suggestions: English names
- Tags: English keywords (can add 2-3 Vietnamese keywords at the end for local SEO)
- All explanations and reasons: ENGLISH
- Target audience: ENGLISH
ABSOLUTELY NO VIETNAMESE in the main description content!`

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
🌐 NGÔN NGỮ OUTPUT: ${isVietnamese ? 'TIẾNG VIỆT' : 'ENGLISH ONLY'}

${langInstruction}

${!isVietnamese ? `
🚨 REMINDER: User selected ENGLISH. 
- If the channel name/niche above is in Vietnamese, TRANSLATE the concept
- Generate EVERYTHING in English
- The description should read naturally in English, not translated Vietnamese
` : ''}

Trả về JSON với format sau (QUAN TRỌNG: chỉ trả về JSON, không có text khác):

{
  "nameSuggestions": [
    {
      "name": "${isVietnamese ? 'Tên kênh gợi ý 1 - hay hơn, catchy, dễ nhớ' : 'Suggested name 1 - catchy, memorable, English name'}",
      "reason": "${isVietnamese ? 'Giải thích ngắn tại sao tên này hay' : 'Brief explanation why this name is good (in English)'}"
    },
    {
      "name": "${isVietnamese ? 'Tên kênh gợi ý 2 - khác biệt, unique' : 'Suggested name 2 - unique, different (English)'}",
      "reason": "${isVietnamese ? 'Giải thích ngắn' : 'Brief explanation (English)'}"
    },
    {
      "name": "${isVietnamese ? 'Tên kênh gợi ý 3 - sáng tạo, viral potential' : 'Suggested name 3 - creative, viral potential (English)'}",
      "reason": "${isVietnamese ? 'Giải thích ngắn' : 'Brief explanation (English)'}"
    }
  ],

  "description": "${isVietnamese 
    ? 'Mô tả kênh chi tiết 300-500 từ bằng TIẾNG VIỆT, bao gồm: giới thiệu kênh với slogan hấp dẫn, nội dung chính (bullet points), đối tượng khán giả, lịch đăng video, giá trị cam kết, call to action mời subscribe. Sử dụng emoji phù hợp. Format dễ đọc.' 
    : 'Channel description 300-500 words in ENGLISH ONLY. Include: channel intro with catchy slogan, main content (bullet points), target audience, upload schedule, value proposition, call to action for subscribe. Use appropriate emojis. Easy to read format. DO NOT write in Vietnamese!'}",
  
  "tags": ["${isVietnamese ? '15-20 tags/keywords SEO, mix tiếng Việt và tiếng Anh' : '15-20 SEO tags/keywords in ENGLISH, can add 2-3 Vietnamese keywords at the end for local SEO'}"],
  
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
    "ageRange": "e.g., 18-35",
    "interests": ["${isVietnamese ? 'sở thích 1' : 'interest 1 in English'}", "${isVietnamese ? 'sở thích 2' : 'interest 2 in English'}"],
    "demographics": "${isVietnamese ? 'Mô tả ngắn đối tượng' : 'Brief audience description in ENGLISH'}"
  }
}

${isVietnamese ? `YÊU CẦU QUAN TRỌNG:
1. Logo prompts phải đa dạng styles: 1 modern/minimalist, 1 creative/artistic, 1 professional/corporate
2. Banner prompts phải đa dạng: 1 clean professional, 1 dynamic/energetic, 1 thematic/storytelling
3. Prompts phải BẰNG TIẾNG ANH và rất chi tiết để AI image generator hiểu
4. Mỗi prompt phải include: art style, color palette, composition, mood, specific elements
5. Tags phải SEO-friendly, mix tiếng Việt và Anh
6. Description phải hấp dẫn, có emoji, dễ copy vào YouTube` : `CRITICAL REQUIREMENTS:
1. Logo prompts: diverse styles - 1 modern/minimalist, 1 creative/artistic, 1 professional/corporate
2. Banner prompts: diverse - 1 clean professional, 1 dynamic/energetic, 1 thematic/storytelling
3. Image prompts MUST be in ENGLISH and very detailed for AI image generator
4. Each prompt must include: art style, color palette, composition, mood, specific elements
5. Tags: SEO-friendly, mostly ENGLISH (add 2-3 Vietnamese keywords for local SEO)
6. Description: MUST BE IN ENGLISH, engaging, with emojis, ready to copy to YouTube
7. ⚠️ FINAL CHECK: The "description" field MUST be 100% in English. NO Vietnamese text!`}

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
