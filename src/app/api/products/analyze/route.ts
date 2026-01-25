import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'

// POST: Analyze product image using Gemini Vision
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { imageBase64, mimeType = 'image/jpeg' } = await req.json()

        if (!imageBase64) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 })
        }

        // Get AI config (use Gemini for vision)
        const config = await getAIConfigFromSettings(session.user.id)
        if (!config) {
            return NextResponse.json({ error: 'Chưa cấu hình API key' }, { status: 400 })
        }

        // Use Gemini Vision to analyze the product
        const geminiApiKey = config.apiKey
        const model = 'gemini-2.0-flash' // Vision capable model

        const prompt = `Bạn là chuyên gia phân tích sản phẩm thời trang. NHIỆM VỤ QUAN TRỌNG: Mô tả sản phẩm CHI TIẾT NHẤT có thể để AI image generator có thể TÁI TẠO CHÍNH XÁC sản phẩm này.

Hãy phân tích SIÊU CHI TIẾT hình ảnh sản phẩm này và trả về JSON:

{
    "productType": "loại sản phẩm (áo, quần, váy, đầm, giày, túi, phụ kiện...)",
    "productSubtype": "loại chi tiết hơn (croptop tay ngắn, sơ mi cổ bẻ, jogger ống rộng...)",
    "color": "màu chính CHÍNH XÁC (không chỉ nói 'xanh' mà phải là 'xanh navy', 'xanh mint', 'xanh rêu'...)",
    "colorHex": "mã màu hex gần đúng (#XXXXXX)",
    "colors": ["màu 1 chi tiết", "màu 2 chi tiết"],
    "material": "chất liệu (cotton 100%, polyester, ren mỏng, da PU, lụa satin...)",
    "texture": "bề mặt/texture (mịn, bóng, nhám, có gân, xốp...)",
    "style": "phong cách (casual, formal, sexy, sporty, vintage, streetwear, elegant, minimalist...)",
    "pattern": "họa tiết chi tiết (trơn, kẻ sọc dọc nhỏ, hoa nhí, chấm bi lớn, logo chữ...)",
    "neckline": "cổ áo nếu là áo (cổ tròn, cổ V, cổ vuông, cổ bẻ, cổ cao...)",
    "sleeveType": "tay áo nếu có (tay ngắn, tay dài, tay lỡ, không tay, tay phồng...)",
    "length": "độ dài (croptop, ngang eo, dài qua hông, dài đến gối...)",
    "fit": "form dáng (ôm body, regular fit, oversize, slim fit, loose...)",
    "details": ["chi tiết 1 (nút, khóa, túi, viền...)", "chi tiết 2"],
    "features": ["đặc điểm nổi bật 1", "đặc điểm 2"],
    "suitableFor": ["dịp 1", "dịp 2"],
    "seasonSuggestion": "mùa phù hợp",
    "targetAudience": "đối tượng",
    "stylingTips": ["gợi ý phối đồ 1", "gợi ý phối đồ 2"],
    "exactDescription": "MÔ TẢ CHÍNH XÁC NHẤT bằng tiếng Anh, 1 câu dài mô tả TẤT CẢ đặc điểm của sản phẩm",
    "promptKeywords": "ENGLISH KEYWORDS - VERY DETAILED: exact garment type, exact color name, material, texture, neckline, sleeve type, fit, length, any patterns or prints, special details, overall style"
}

⚠️ QUAN TRỌNG:
- "exactDescription" phải là MỘT CÂU TIẾNG ANH mô tả CHÍNH XÁC sản phẩm, ví dụ: "A forest green cotton t-shirt with round neckline, short sleeves, relaxed fit, solid color, small white logo print on left chest"
- "promptKeywords" phải bao gồm TẤT CẢ chi tiết để AI image generator tái tạo ĐÚNG sản phẩm
- Màu sắc phải CỤ THỂ (không nói "xanh" mà phải "emerald green", "navy blue", "mint green"...)
- Nếu có họa tiết/logo, mô tả CHI TIẾT

Chỉ trả về JSON, không giải thích thêm.`

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 2000
                    }
                })
            }
        )

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Gemini Vision error:', errorData)
            return NextResponse.json({ 
                error: `Vision API error: ${errorData.error?.message || 'Unknown error'}` 
            }, { status: 500 })
        }

        const result = await response.json()
        const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text

        if (!textContent) {
            return NextResponse.json({ error: 'AI không thể phân tích hình' }, { status: 500 })
        }

        // Parse JSON from response
        let analysis
        try {
            const jsonMatch = textContent.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0])
            } else {
                throw new Error('No JSON found')
            }
        } catch (parseError) {
            console.error('Parse error:', parseError, 'Raw:', textContent)
            return NextResponse.json({ error: 'AI không thể phân tích. Thử lại.' }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            analysis
        })

    } catch (error) {
        console.error('Analyze product error:', error)
        return NextResponse.json({ 
            error: `Failed to analyze product: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 })
    }
}
