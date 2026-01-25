import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const { mainTopic, episodeCount, channelNiche } = await req.json()

        if (!mainTopic || !episodeCount) {
            return NextResponse.json({ error: 'Missing mainTopic or episodeCount' }, { status: 400 })
        }

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Get AI config
        const config = await getAIConfigFromSettings(session.user.id)
        if (!config) {
            return NextResponse.json({ error: 'Chưa cấu hình API key' }, { status: 400 })
        }

        const prompt = `Bạn là chuyên gia lên kịch bản video YouTube.

CHỦ ĐỀ CHÍNH: ${mainTopic}
NGÁCH KÊNH: ${channelNiche || 'General'}
SỐ EPISODE CẦN TẠO: ${episodeCount}

YÊU CẦU:
1. Tạo ${episodeCount} ý tưởng episode liên quan đến chủ đề "${mainTopic}"
2. Các episode phải có SỰ LIÊN KẾT logic với nhau (có thể là series, progression, hoặc các góc nhìn khác nhau)
3. Mỗi episode phải có mô tả ngắn gọn nhưng đủ chi tiết (1-2 dòng)
4. Tạo tên danh mục phù hợp cho series này

Trả về JSON với format:
{
    "categoryName": "Tên danh mục phù hợp cho series",
    "ideas": [
        "Episode 1: Mô tả chi tiết...",
        "Episode 2: Mô tả chi tiết...",
        ...
    ]
}

QUAN TRỌNG: Trả về ONLY valid JSON, không có text khác.`

        const result = await generateText(config, prompt)

        // Parse JSON response
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 })
        }

        try {
            const data = JSON.parse(jsonMatch[0])
            return NextResponse.json({
                categoryName: data.categoryName || mainTopic,
                ideas: data.ideas || []
            })
        } catch (e) {
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
        }
    } catch (error) {
        console.error('Generate bulk ideas error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
