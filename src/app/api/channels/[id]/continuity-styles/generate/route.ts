import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

// POST: AI Generate continuity style based on channel niche
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: channelId } = await params
        const body = await req.json()
        const { styleHint, characterHint } = body

        // Get user's API key from settings
        const settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id }
        })

        const apiKey = settings?.geminiKey || process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'Vui lòng cấu hình Gemini API Key trong Settings' }, { status: 400 })
        }

        const genAI = new GoogleGenerativeAI(apiKey)

        // Get channel with details
        const channel = await prisma.channel.findFirst({
            where: { id: channelId, userId: session.user.id },
            include: {
                characters: { where: { isMain: true }, take: 2 }
            }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        // Build context from channel
        const characterContext = channel.characters.length > 0
            ? `Main characters: ${channel.characters.map(c => `${c.name} (${c.role}): ${c.fullDescription}`).join('; ')}`
            : ''

        const prompt = `You are an expert cinematographer and video production designer. Create a Continuity Style for a YouTube channel.

Channel Information:
- Name: ${channel.name}
- Niche: ${channel.niche}
- Description: ${channel.description || 'Not provided'}
- Visual Style ID: ${channel.visualStyleId || 'Not specified'}
${characterContext}
${styleHint ? `- User's style hint: ${styleHint}` : ''}
${characterHint ? `- Character hint: ${characterHint}` : ''}

Generate a comprehensive Continuity Style that will ensure visual consistency across all videos. Return a JSON object with these fields:

{
  "name": "A creative name for this style (in Vietnamese)",
  "subjectDefault": "Default subject description if characters exist, null if no characters",
  "palette": "Color palette description: list 4-6 colors with descriptive names",
  "environment": "Default environment/setting description",
  "lighting": "Lighting style description: source, quality, mood",
  "cameraStyle": "Camera work description: movements, angles, techniques",
  "visualStyle": "Overall visual style: genre, mood, references",
  "audioMood": "Suggested audio/sound mood description"
}

Return ONLY the JSON object, no markdown formatting.`

        const result = await model.generateContent(prompt)
        const responseText = result.response.text().trim()

        // Parse JSON response
        let styleData
        try {
            // Clean up potential markdown code blocks
            const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim()
            styleData = JSON.parse(cleanJson)
        } catch {
            console.error('Failed to parse AI response:', responseText)
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
        }

        return NextResponse.json({
            generatedStyle: styleData,
            message: 'Style generated successfully. Review and save when ready.'
        })
    } catch (error) {
        console.error('Generate continuity style error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: `Failed to generate style: ${errorMessage}` }, { status: 500 })
    }
}
