import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CHANNEL_STYLES } from '@/lib/channel-styles'
import { uploadToShareMyImage } from '@/lib/sharemyimage'

// POST: Generate preview images for channel styles (Admin only)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if admin
        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (user?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { styleIds, apiKey: userApiKey } = await req.json()

        // Use user's API key or env
        const apiKey = userApiKey || process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'API Key required' }, { status: 400 })
        }

        // Filter styles to generate
        const stylesToGenerate = styleIds
            ? CHANNEL_STYLES.filter(s => styleIds.includes(s.id))
            : CHANNEL_STYLES

        const results: Array<{
            id: string
            name: string
            status: 'success' | 'error'
            imageUrl?: string
            error?: string
        }> = []

        for (const style of stylesToGenerate) {
            console.log(`[StylePreview] Generating for: ${style.id}`)

            try {
                // Build a prompt for this style
                const prompt = buildStylePreviewPrompt(style)

                // Generate image using Imagen API
                const imageBase64 = await generateWithImagen(prompt, apiKey)

                if (!imageBase64) {
                    results.push({
                        id: style.id,
                        name: style.name,
                        status: 'error',
                        error: 'Failed to generate image'
                    })
                    continue
                }

                // Upload to ShareMyImage
                const uploaded = await uploadToShareMyImage(
                    imageBase64,
                    `Style Preview: ${style.name}`
                )

                results.push({
                    id: style.id,
                    name: style.name,
                    status: 'success',
                    imageUrl: uploaded.url
                })

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000))

            } catch (error) {
                console.error(`[StylePreview] Error for ${style.id}:`, error)
                results.push({
                    id: style.id,
                    name: style.name,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        }

        // Count successes
        const successCount = results.filter(r => r.status === 'success').length

        return NextResponse.json({
            success: true,
            results,
            summary: {
                total: stylesToGenerate.length,
                success: successCount,
                failed: stylesToGenerate.length - successCount
            }
        })

    } catch (error) {
        console.error('Generate style previews error:', error)
        return NextResponse.json({
            error: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 })
    }
}

/**
 * Build a preview prompt for a style
 */
function buildStylePreviewPrompt(style: typeof CHANNEL_STYLES[0]): string {
    const baseScene = style.hasCharacters
        ? 'A person standing confidently, facing the camera, in a natural setting.'
        : 'A beautiful scenic landscape or abstract composition.'

    return `${baseScene}

Visual style: ${style.promptKeywords}

REQUIREMENTS:
- Aspect ratio: 16:9 landscape format
- High quality, detailed render
- No text, watermarks, or overlays
- Showcase the visual style clearly
- Professional presentation quality`
}

/**
 * Generate image using Imagen API
 */
async function generateWithImagen(prompt: string, apiKey: string): Promise<string | null> {
    const imagenModels = [
        'imagen-3.0-generate-002',
        'imagen-3.0-generate-001'
    ]

    for (const modelName of imagenModels) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': apiKey,
                    },
                    body: JSON.stringify({
                        instances: [{ prompt }],
                        parameters: {
                            sampleCount: 1,
                            aspectRatio: '16:9',
                            personGeneration: 'allow_adult',
                        }
                    })
                }
            )

            if (response.ok) {
                const result = await response.json()
                const imageBase64 = result.predictions?.[0]?.bytesBase64Encoded
                if (imageBase64) {
                    console.log(`[Imagen] Success with ${modelName}`)
                    return imageBase64
                }
            } else {
                const errorData = await response.json().catch(() => ({}))
                console.error(`[Imagen] ${modelName} error:`, errorData.error?.message)
            }
        } catch (err) {
            console.error(`[Imagen] Fetch error for ${modelName}:`, err)
        }
    }

    return null
}

// GET: List all styles with their current preview status
export async function GET() {
    try {
        const styles = CHANNEL_STYLES.map(style => ({
            id: style.id,
            name: style.name,
            nameVi: style.nameVi,
            category: style.category,
            hasPreview: !!style.previewImage,
            previewImage: style.previewImage || null
        }))

        return NextResponse.json({ styles })
    } catch (error) {
        console.error('List styles error:', error)
        return NextResponse.json({ error: 'Failed to list styles' }, { status: 500 })
    }
}
