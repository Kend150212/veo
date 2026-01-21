import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'
import { prisma } from '@/lib/prisma'
import { CHANNEL_STYLES } from '@/lib/channel-styles'

// POST: Analyze niche and search YouTube trends
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const { youtubeApiKey } = await req.json()

        // Get channel
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

        // Step 1: Search YouTube for trending videos in this niche
        let trendingChannels: { title: string, channelTitle: string, viewCount: string, thumbnail: string }[] = []

        if (youtubeApiKey) {
            try {
                const searchQuery = encodeURIComponent(channel.niche)
                const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&order=viewCount&maxResults=10&key=${youtubeApiKey}`

                const ytResponse = await fetch(ytUrl)
                const ytData = await ytResponse.json()

                if (ytData.items && ytData.items.length > 0) {
                    // Get video statistics
                    const videoIds = ytData.items.map((item: { id: { videoId: string } }) => item.id.videoId).join(',')
                    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${youtubeApiKey}`
                    const statsResponse = await fetch(statsUrl)
                    const statsData = await statsResponse.json()

                    trendingChannels = statsData.items?.map((item: {
                        snippet: { title: string; channelTitle: string; thumbnails: { medium: { url: string } } };
                        statistics: { viewCount: string }
                    }) => ({
                        title: item.snippet.title,
                        channelTitle: item.snippet.channelTitle,
                        viewCount: item.statistics.viewCount,
                        thumbnail: item.snippet.thumbnails.medium.url
                    })) || []
                }
            } catch (ytError) {
                console.error('YouTube API error:', ytError)
                // Continue without YouTube data
            }
        }

        // Step 2: AI analyze niche and create knowledge base
        const trendingContext = trendingChannels.length > 0
            ? `\n\nYouTube Trending Videos for this niche:\n${trendingChannels.map((v, i) =>
                `${i + 1}. "${v.title}" by ${v.channelTitle} (${parseInt(v.viewCount).toLocaleString()} views)`
            ).join('\n')}`
            : ''

        const stylesList = CHANNEL_STYLES.map(s => `- ${s.name}: ${s.description}`).join('\n')

        const analysisPrompt = `You are a YouTube content strategist analyzing a niche for video production.

NICHE: "${channel.niche}"
${trendingContext}

Analyze this niche and provide a comprehensive knowledge base in JSON format:

{
    "nicheKeywords": ["keyword1", "keyword2", ...], // 10-15 relevant keywords
    "targetAudience": {
        "demographics": "Age, gender, interests",
        "painPoints": ["problem1", "problem2"],
        "desires": ["want1", "want2"]
    },
    "contentStrategy": {
        "bestTopics": ["topic1", "topic2", ...], // 10 popular topics
        "contentHooks": ["hook1", "hook2", ...], // 5 viral hooks
        "uploadFrequency": "suggested frequency",
        "idealVideoLength": "duration recommendation"
    },
    "visualRecommendation": {
        "suggestedStyleId": "one of: doodle, digital-illustration, anime, cartoon-2d, pixar-3d, cinematic, etc.",
        "hasCharacters": true/false, // Should this niche use characters?
        "suggestedCharCount": 0-3, // If characters, how many?
        "characterSuggestions": [ // If hasCharacters is true
            {
                "name": "Character name",
                "role": "host/sidekick/mascot",
                "description": "Brief character concept"
            }
        ]
    },
    "episodeIdeas": [ // 5 episode ideas
        {
            "title": "Episode title",
            "synopsis": "2-3 sentence summary",
            "hook": "Viral hook for this episode"
        }
    ],
    "competitorInsights": "Analysis of what works in this niche from trending videos"
}

Available visual styles:
${stylesList}

Return ONLY valid JSON, no markdown or explanations.`

        const result = await generateText(config, analysisPrompt)

        // Parse AI response
        let analysis
        try {
            const jsonMatch = result.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0])
            } else {
                throw new Error('No JSON found')
            }
        } catch (parseError) {
            console.error('Parse error:', parseError)
            return NextResponse.json({ error: 'AI không thể phân tích. Thử lại.' }, { status: 400 })
        }

        // Step 3: Update channel with analysis
        const updatedChannel = await prisma.channel.update({
            where: { id },
            data: {
                nicheKeywords: JSON.stringify(analysis.nicheKeywords || []),
                knowledgeBase: JSON.stringify(analysis),
                targetAudience: JSON.stringify(analysis.targetAudience),
                contentStyle: JSON.stringify(analysis.contentStrategy),
                trendingChannels: JSON.stringify(trendingChannels),
                visualStyleId: analysis.visualRecommendation?.suggestedStyleId,
                hasCharacters: analysis.visualRecommendation?.hasCharacters ?? true,
                suggestedCharCount: analysis.visualRecommendation?.suggestedCharCount ?? 1
            }
        })

        return NextResponse.json({
            success: true,
            analysis,
            trendingChannels,
            channel: updatedChannel
        })

    } catch (error) {
        console.error('Analyze niche error:', error)
        return NextResponse.json({ error: 'Failed to analyze niche' }, { status: 500 })
    }
}
