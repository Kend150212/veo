import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { imageUrl, productInfo, productLink } = await req.json()

        if (!imageUrl && !productInfo) {
            return NextResponse.json({ error: 'Vui lòng cung cấp thông tin sản phẩm hoặc URL hình ảnh' }, { status: 400 })
        }

        const config = await getAIConfigFromSettings(session.user.id)
        if (!config) {
            return NextResponse.json({ error: 'Chưa cấu hình API key' }, { status: 400 })
        }

        const genAI = new GoogleGenerativeAI(config.apiKey)

        let prompt: string
        let imageParts: { inlineData: { data: string; mimeType: string } }[] = []

        // If image URL provided, fetch and analyze image
        if (imageUrl) {
            try {
                const imageResponse = await fetch(imageUrl)
                if (!imageResponse.ok) {
                    return NextResponse.json({ error: 'Không thể tải hình ảnh từ URL' }, { status: 400 })
                }
                const imageBuffer = await imageResponse.arrayBuffer()
                const base64 = Buffer.from(imageBuffer).toString('base64')
                const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'

                imageParts = [{
                    inlineData: { data: base64, mimeType }
                }]

                prompt = `Analyze this product image for video advertising. Provide:

1. Product name (best guess from image)
2. Detailed description (what it is, what it looks like)
3. Key features/benefits (3-5 points that could be highlighted in ads)
4. Target audience (who would want this product)

${productInfo ? `Additional info from user: ${productInfo}` : ''}
${productLink ? `Product purchase link: ${productLink}` : ''}

Return ONLY valid JSON in this format:
{
    "name": "Product Name",
    "description": "One sentence description of the product",
    "features": ["Feature 1", "Feature 2", "Feature 3"],
    "targetAudience": "Who this product is for"
}

No explanation, just JSON.`
            } catch (error) {
                console.error('Error fetching image:', error)
                return NextResponse.json({ error: 'Không thể tải hình ảnh' }, { status: 400 })
            }
        } else {
            // Text-only analysis
            prompt = `Analyze this product/service information for video advertising:

"${productInfo}"

${productLink ? `Product link: ${productLink}` : ''}

Provide a structured analysis:
1. Product/service name
2. Clear description
3. Key features/benefits (3-5 points for ads)
4. Target audience

Return ONLY valid JSON in this format:
{
    "name": "Product Name",
    "description": "One sentence description",
    "features": ["Feature 1", "Feature 2", "Feature 3"],
    "targetAudience": "Who this product is for"
}

No explanation, just JSON.`
        }

        // Use vision-capable model if image is provided
        const model = genAI.getGenerativeModel({
            model: imageParts.length > 0 ? 'gemini-2.0-flash' : (config.model || 'gemini-2.0-flash')
        })

        const result = imageParts.length > 0
            ? await model.generateContent([prompt, ...imageParts])
            : await model.generateContent(prompt)

        const text = result.response.text()

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/)

        if (jsonMatch) {
            try {
                const product = JSON.parse(jsonMatch[0])
                return NextResponse.json({ product })
            } catch (parseError) {
                console.error('JSON parse error:', parseError)
                return NextResponse.json({ error: 'Không thể phân tích kết quả AI' }, { status: 400 })
            }
        }

        return NextResponse.json({ error: 'AI không trả về kết quả hợp lệ' }, { status: 400 })

    } catch (error) {
        console.error('Analyze product error:', error)
        return NextResponse.json({ error: 'Lỗi phân tích sản phẩm' }, { status: 500 })
    }
}
