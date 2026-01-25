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

        // Prepare the request body for Imagen 3
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const requestBody: any = {
            instances: [
                {
                    prompt: prompt
                }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: aspectRatio,
                // If we have a reference image, use image-to-image mode
                ...(referenceImageBase64 && {
                    // For image editing/reference, we add the reference image
                    // Note: Imagen 3 supports different modes
                })
            }
        }

        // If reference image provided, we need to include it in the prompt description
        // because Imagen 3's standard API doesn't support direct image reference
        // We'll use the prompt to describe the product accurately based on AI analysis

        // Call Google Imagen 3 API
        // API endpoint for Imagen 3
        const imagenEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`

        const response = await fetch(imagenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                instances: [{ prompt }],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: aspectRatio,
                    personGeneration: "allow_adult", // Allow generating people
                    safetyFilterLevel: "block_few", // Less restrictive
                }
            })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Imagen API error:', errorData)
            
            // Try alternative endpoint format
            const altEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${apiKey}`
            
            const altResponse = await fetch(altEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    number_of_images: 1,
                    aspect_ratio: aspectRatio,
                    person_generation: "allow_adult",
                    safety_filter_level: "block_few",
                })
            })

            if (!altResponse.ok) {
                const altError = await altResponse.json().catch(() => ({}))
                console.error('Imagen Alt API error:', altError)
                return NextResponse.json({ 
                    error: `Imagen API error: ${altError.error?.message || 'Unknown error'}` 
                }, { status: 500 })
            }

            const altResult = await altResponse.json()
            const imageBase64 = altResult.generated_images?.[0]?.image?.image_bytes || 
                               altResult.predictions?.[0]?.bytesBase64Encoded

            if (imageBase64) {
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
            }
        }

        const result = await response.json()
        
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
