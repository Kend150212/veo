import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: Generate image using Google Imagen 3
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { 
            prompt,
            referenceImageBase64, // Base64 của hình sản phẩm reference
            aspectRatio = '9:16', // Default vertical for TikTok/Reels
            sceneId // Optional: lưu vào scene nếu có
        } = await req.json()

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        // Get user's Gemini API key (same key works for Imagen)
        const settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id }
        })

        const apiKey = settings?.geminiKey
        if (!apiKey) {
            return NextResponse.json({ 
                error: 'Chưa cấu hình Google API Key. Vào Settings để thêm.' 
            }, { status: 400 })
        }

        // Note: referenceImageBase64 is included in the prompt description by the frontend
        // because Imagen's standard API doesn't support direct image reference
        void referenceImageBase64 // Acknowledge unused variable

        // Call Google Imagen API
        // Try Imagen 3 first, then fall back to Imagen 4 if available
        const modelsToTry = [
            'imagen-3.0-generate-002',
            'imagen-3.0-generate-001', 
            'imagen-4.0-generate-001',
            'imagen-4.0-fast-generate-001'
        ]

        let result = null
        let lastError = null

        for (const modelName of modelsToTry) {
            const imagenEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict`
            
            console.log(`[Imagen] Trying model: ${modelName}`)

            try {
                const response = await fetch(imagenEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': apiKey, // Correct header format
                    },
                    body: JSON.stringify({
                        instances: [{ prompt }],
                        parameters: {
                            sampleCount: 1,
                            aspectRatio: aspectRatio,
                            personGeneration: "allow_adult",
                        }
                    })
                })

                if (response.ok) {
                    result = await response.json()
                    console.log(`[Imagen] Success with model: ${modelName}`)
                    break
                } else {
                    const errorData = await response.json().catch(() => ({}))
                    console.error(`[Imagen] Model ${modelName} error:`, errorData.error?.message || 'Unknown')
                    lastError = errorData
                }
            } catch (fetchError) {
                console.error(`[Imagen] Fetch error for ${modelName}:`, fetchError)
                lastError = { error: { message: String(fetchError) } }
            }
        }

        if (!result) {
            return NextResponse.json({ 
                error: `Imagen API error: ${lastError?.error?.message || 'All models failed'}` 
            }, { status: 500 })
        }
        
        // Extract base64 image from response
        const imageBase64 = result.predictions?.[0]?.bytesBase64Encoded ||
                           result.generated_images?.[0]?.image?.image_bytes

        if (!imageBase64) {
            console.error('No image in response:', result)
            return NextResponse.json({ 
                error: 'Không thể tạo ảnh. API không trả về hình.' 
            }, { status: 500 })
        }

        // Save to scene if sceneId provided
        if (sceneId) {
            await prisma.episodeScene.update({
                where: { id: sceneId },
                data: { generatedImageUrl: `data:image/png;base64,${imageBase64}` }
            })
        }

        return NextResponse.json({
            success: true,
            imageBase64: imageBase64,
            imageUrl: `data:image/png;base64,${imageBase64}`
        })

    } catch (error) {
        console.error('Generate image error:', error)
        return NextResponse.json({ 
            error: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 })
    }
}
