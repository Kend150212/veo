import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }

        const { shortDescription, genre, context } = await req.json()

        if (!shortDescription || shortDescription.length < 10) {
            return NextResponse.json({ error: 'Mô tả quá ngắn, cần ít nhất 10 ký tự' }, { status: 400 })
        }

        const config = await getAIConfigFromSettings(session.user.id)
        if (!config) {
            return NextResponse.json({ error: 'Chưa cấu hình API key' }, { status: 400 })
        }

        const prompt = `You are a professional screenplay writer creating FAMILY-FRIENDLY video content.

Given this SHORT description/idea:
"${shortDescription}"

${genre ? `Genre: ${genre}` : ''}
${context ? `Additional context: ${context}` : ''}

Expand this into a DETAILED story outline for video production. Include:

1. **Opening Hook** - How to grab viewer attention in the first 3 seconds
2. **Main Story Arc** - The core narrative with clear beginning, middle, climax, and resolution
3. **Key Visual Moments** - Specific scenes that will have strong visual impact
4. **Character Actions/Emotions** - What characters do and feel at key moments
5. **Transitions** - How scenes connect visually and narratively
6. **Closing Impact** - How to end memorably

IMPORTANT:
- Write in Vietnamese
- Be specific about visual elements (camera angles, lighting, colors)
- Include sensory details that translate well to video
- Make it between 500-1000 words
- Structure it so each paragraph can become a scene

CONTENT SAFETY (MUST FOLLOW):
- Family-friendly content only, suitable for all ages
- NO violence, weapons, blood, or injury descriptions
- NO adult content, nudity, or suggestive material
- NO drugs, alcohol, or substance references
- NO scary or disturbing imagery
- Keep content positive, uplifting, and educational

Output the expanded story only, no extra commentary.`

        const result = await generateText(config, prompt)

        return NextResponse.json({
            expanded: result.trim(),
            wordCount: result.split(/\s+/).length
        })
    } catch (error) {
        console.error('Expand description error:', error)
        return NextResponse.json({ error: 'Không thể mở rộng mô tả' }, { status: 500 })
    }
}
