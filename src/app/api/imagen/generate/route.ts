import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const {
            prompt,
            referenceImageBase64,
            aspectRatio = '9:16',
            sceneId,
            model: requestedModel
        } = await req.json()

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

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

        // ============================================================
        // METHOD 1: Gemini with Reference Image
        // ============================================================
        if (referenceImageBase64) {
            console.log('[Image Gen] Using Gemini with reference image')
            const geminiModels = [
                'gemini-2.0-flash-preview-image-generation',
                'gemini-2.5-flash-preview-image-generation',
            ]
            for (const model of geminiModels) {
                try {
                    const cleanBase64 = referenceImageBase64.replace(/^data:image\/\w+;base64,/, '')
                    const refPrompt = `Reference image provided. Generate a new image: ${prompt}`
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                            body: JSON.stringify({
                                contents: [{
                                    role: 'user',
                                    parts: [
                                        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                                        { text: refPrompt }
                                    ]
                                }],
                                generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
                            })
                        }
                    )
                    if (response.ok) {
                        const result = await response.json()
                        for (const part of result.candidates?.[0]?.content?.parts || []) {
                            if (part.inlineData?.mimeType?.startsWith('image/')) {
                                imageBase64 = part.inlineData.data
                                console.log(`[Gemini] Success: ${model}`)
                                break
                            }
                        }
                        if (imageBase64) break
                    }
                } catch (err) {
                    console.error(`[Gemini ref] Error with ${model}:`, err)
                }
            }
        }

        // ============================================================
        // METHOD 2: Text-to-image (Imagen or Gemini)
        // ============================================================
        if (!imageBase64) {
            // Models supported via Google AI (generativelanguage.googleapis.com)
            const imagenModels = [
                'imagen-4.0-generate-001',
                'imagen-4.0-fast-generate-001',
            ]
            const geminiImageModels = [
                'gemini-2.0-flash-preview-image-generation',
                'gemini-flash',
            ]

            const isGeminiRequest = requestedModel && geminiImageModels.includes(requestedModel)

            if (isGeminiRequest) {
                // Gemini text-to-image path
                const modelId = requestedModel === 'gemini-flash'
                    ? 'gemini-2.0-flash-preview-image-generation'
                    : requestedModel
                console.log(`[Gemini] Direct request: ${modelId}`)
                try {
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                            body: JSON.stringify({
                                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                                generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
                            })
                        }
                    )
                    if (response.ok) {
                        const result = await response.json()
                        for (const part of result.candidates?.[0]?.content?.parts || []) {
                            if (part.inlineData?.mimeType?.startsWith('image/')) {
                                imageBase64 = part.inlineData.data
                                console.log(`[Gemini] Success: ${modelId}`)
                                break
                            }
                        }
                    }
                } catch (err) {
                    console.error('[Gemini text-to-image] Error:', err)
                }
            } else {
                // Imagen path — use requested model if valid, else auto-fallback
                const modelsToTry = requestedModel && imagenModels.includes(requestedModel)
                    ? [requestedModel]           // Use ONLY the requested model (no surprise fallback)
                    : imagenModels               // Auto mode: try all in order

                const cleanPrompt = `${prompt} STYLE: Pure photography. NEVER add ANY text, watermarks, logos, or overlays.`

                for (const modelName of modelsToTry) {
                    console.log(`[Imagen] Trying model: ${modelName}`)
                    try {
                        const response = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                                body: JSON.stringify({
                                    instances: [{ prompt: cleanPrompt }],
                                    parameters: {
                                        sampleCount: 1,
                                        aspectRatio,
                                        personGeneration: 'allow_adult',
                                    }
                                })
                            }
                        )
                        if (response.ok) {
                            const result = await response.json()
                            const b64 = result.predictions?.[0]?.bytesBase64Encoded
                                ?? result.generated_images?.[0]?.image?.image_bytes
                            if (b64) {
                                imageBase64 = b64
                                console.log(`[Imagen] Success with model: ${modelName}`)
                                break
                            }
                        } else {
                            const err = await response.json().catch(() => ({}))
                            console.error(`[Imagen] Model ${modelName} error:`, err?.error?.message || 'Unknown')
                        }
                    } catch (err) {
                        console.error(`[Imagen] Fetch error for ${modelName}:`, err)
                    }
                }

                // Gemini Flash as final fallback (only in auto mode)
                if (!imageBase64 && !requestedModel) {
                    console.log('[Image Gen] Trying Gemini Flash as last resort')
                    try {
                        const response = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                                body: JSON.stringify({
                                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                                    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
                                })
                            }
                        )
                        if (response.ok) {
                            const result = await response.json()
                            for (const part of result.candidates?.[0]?.content?.parts || []) {
                                if (part.inlineData?.mimeType?.startsWith('image/')) {
                                    imageBase64 = part.inlineData.data
                                    console.log('[Gemini Flash] Success as fallback')
                                    break
                                }
                            }
                        }
                    } catch (err) {
                        console.error('[Gemini Flash fallback] Error:', err)
                    }
                }
            }
        }

        if (!imageBase64) {
            return NextResponse.json(
                { error: 'Không thể tạo ảnh. Tất cả các model đều thất bại.' },
                { status: 500 }
            )
        }

        // sceneId path — still use JSON (internal use, small chance of large base64 issue)
        if (sceneId) {
            await prisma.episodeScene.update({
                where: { id: sceneId },
                data: { generatedImageUrl: `data:image/png;base64,${imageBase64}` }
            })
            return NextResponse.json({ success: true, imageBase64 })
        }

        // ✅ Return raw binary PNG — avoids multi-MB JSON parse failures on client
        const imageBuffer = Buffer.from(imageBase64, 'base64')
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': String(imageBuffer.length),
                'Cache-Control': 'no-store',
            }
        })

    } catch (error) {
        console.error('Generate image error:', error)
        return NextResponse.json(
            { error: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        )
    }
}
