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

        const prompt = `Bạn là chuyên gia phân tích sản phẩm thời trang.

Hãy phân tích CHI TIẾT hình ảnh sản phẩm này và trả về JSON:

{
    "productType": "loại sản phẩm (áo, quần, váy, đầm, giày, túi, phụ kiện...)",
    "productSubtype": "loại chi tiết (croptop, sơ mi, jogger, sneaker...)",
    "color": "màu chính của sản phẩm",
    "colors": ["màu 1", "màu 2"], // tất cả màu có trong sản phẩm
    "material": "chất liệu ước đoán (cotton, ren, da, lụa, len, jean...)",
    "style": "phong cách (casual, formal, sexy, sporty, vintage, streetwear, elegant...)",
    "pattern": "họa tiết nếu có (trơn, kẻ sọc, hoa, chấm bi, logo...)",
    "features": ["đặc điểm 1", "đặc điểm 2"], // các đặc điểm nổi bật
    "suitableFor": ["dịp 1", "dịp 2"], // phù hợp cho dịp nào (đi làm, đi chơi, dự tiệc...)
    "seasonSuggestion": "mùa phù hợp (hè, đông, quanh năm...)",
    "targetAudience": "đối tượng (nữ trẻ, nam công sở, teen...)",
    "stylingTips": ["gợi ý phối đồ 1", "gợi ý phối đồ 2"],
    "promptKeywords": "English keywords for AI image generation, comma separated, detailed description of the exact clothing item for reference"
}

CHÚ Ý:
- promptKeywords phải MÔ TẢ CHÍNH XÁC sản phẩm trong hình để AI có thể tái tạo
- Bao gồm: loại đồ, màu sắc, chất liệu, chi tiết đặc biệt, kiểu dáng

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
