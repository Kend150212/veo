import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: Generate image using Gemini (with reference image support) or Imagen
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

        // Get user's Gemini API key
        const settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id }
        })

        const apiKey = settings?.geminiKey
        if (!apiKey) {
            return NextResponse.json({ 
                error: 'Chưa cấu hình Google API Key. Vào Settings để thêm.' 
            }, { status: 400 })
        }

        let imageBase64: string | null = null

        // ============================================
        // METHOD 1: Use Gemini with Reference Image (PREFERRED)
        // ============================================
        if (referenceImageBase64) {
            console.log('[Image Gen] Using Gemini with reference image')
            
            // Gemini models that support image generation with image input
            const geminiModels = [
                'gemini-2.0-flash-preview-image-generation',
                'gemini-2.5-flash-preview-image-generation'
            ]

            for (const model of geminiModels) {
                console.log(`[Gemini] Trying model: ${model}`)
                
                try {
                    // Clean the base64 data
                    const cleanBase64 = referenceImageBase64.replace(/^data:image\/\w+;base64,/, '')
                    
                    // Build prompt with reference instruction
                    const referencePrompt = `You are creating an image for a fashion showcase video.

REFERENCE PRODUCT IMAGE: I am providing you with the EXACT product image. You MUST recreate this EXACT clothing item in the generated image.

TASK: Generate an image where a fashion model is wearing the EXACT same clothing item shown in the reference image. 
- The clothing MUST be identical: same color, same style, same material, same pattern, same design
- Do NOT change ANY detail of the clothing
- The model should be posing naturally

SCENE DESCRIPTION: ${prompt}

CRITICAL RULES:
- NO text, NO watermarks, NO graphics on the image
- Pure photography style, clean visual
- Vertical format ${aspectRatio}
- The clothing item MUST match the reference image EXACTLY`

                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [
                                        { text: referencePrompt },
                                        {
                                            inline_data: {
                                                mime_type: 'image/jpeg',
                                                data: cleanBase64
                                            }
                                        }
                                    ]
                                }],
                                generationConfig: {
                                    temperature: 0.4,
                                    responseModalities: ["TEXT", "IMAGE"]
                                }
                            })
                        }
                    )

                    if (response.ok) {
                        const result = await response.json()
                        
                        // Find the image part in the response
                        const parts = result.candidates?.[0]?.content?.parts || []
                        for (const part of parts) {
                            if (part.inlineData?.mimeType?.startsWith('image/')) {
                                imageBase64 = part.inlineData.data
                                console.log(`[Gemini] Success with model: ${model}`)
                                break
                            }
                        }
                        
                        if (imageBase64) break
                    } else {
                        const errorData = await response.json().catch(() => ({}))
                        console.error(`[Gemini] Model ${model} error:`, errorData.error?.message || 'Unknown')
                    }
                } catch (err) {
                    console.error(`[Gemini] Error with ${model}:`, err)
                }
            }
        }

        // ============================================
        // METHOD 2: Fallback to Imagen (text-only)
        // ============================================
        if (!imageBase64) {
            console.log('[Image Gen] Falling back to Imagen (no reference)')
            
            const imagenModels = [
                'imagen-3.0-generate-002',
                'imagen-3.0-generate-001', 
                'imagen-4.0-generate-001',
                'imagen-4.0-fast-generate-001'
            ]

            for (const modelName of imagenModels) {
                const imagenEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict`
                
                console.log(`[Imagen] Trying model: ${modelName}`)

                try {
                    const cleanPrompt = `${prompt} STYLE: Pure photography, clean visual. NEVER add ANY text, watermarks, logos, captions, or graphic overlays on the image.`
                    
                    const response = await fetch(imagenEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-goog-api-key': apiKey,
                        },
                        body: JSON.stringify({
                            instances: [{ prompt: cleanPrompt }],
                            parameters: {
                                sampleCount: 1,
                                aspectRatio: aspectRatio,
                                personGeneration: "allow_adult",
                            }
                        })
                    })

                    if (response.ok) {
                        const result = await response.json()
                        imageBase64 = result.predictions?.[0]?.bytesBase64Encoded ||
                                     result.generated_images?.[0]?.image?.image_bytes
                        if (imageBase64) {
                            console.log(`[Imagen] Success with model: ${modelName}`)
                            break
                        }
                    } else {
                        const errorData = await response.json().catch(() => ({}))
                        console.error(`[Imagen] Model ${modelName} error:`, errorData.error?.message || 'Unknown')
                    }
                } catch (fetchError) {
                    console.error(`[Imagen] Fetch error for ${modelName}:`, fetchError)
                }
            }
        }

        // ============================================
        // Check result
        // ============================================
        if (!imageBase64) {
            return NextResponse.json({ 
                error: 'Không thể tạo ảnh. Tất cả các model đều thất bại.' 
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
