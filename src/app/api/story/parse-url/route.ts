import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'

// Simple HTML to text converter
function htmlToText(html: string): string {
    // Remove script and style tags entirely
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

    // Convert common block elements to newlines
    text = text.replace(/<\/(p|div|h[1-6]|li|tr|br|article|section)>/gi, '\n')
    text = text.replace(/<(br|hr)[^>]*>/gi, '\n')

    // Remove all remaining HTML tags
    text = text.replace(/<[^>]+>/g, ' ')

    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
    text = text.replace(/&amp;/g, '&')
    text = text.replace(/&lt;/g, '<')
    text = text.replace(/&gt;/g, '>')
    text = text.replace(/&quot;/g, '"')
    text = text.replace(/&#39;/g, "'")

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ')
    text = text.replace(/\n\s*\n/g, '\n\n')

    return text.trim()
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }

        const body = await req.json()
        const { url } = body

        console.log('[Parse URL] Request for:', url)

        if (!url) {
            console.log('[Parse URL] No URL provided')
            return NextResponse.json({ error: 'Vui lòng nhập URL' }, { status: 400 })
        }

        // Validate URL format
        let parsedUrl: URL
        try {
            parsedUrl = new URL(url)
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                throw new Error('Invalid protocol')
            }
        } catch (e) {
            console.log('[Parse URL] Invalid URL:', url, e)
            return NextResponse.json({ error: 'URL không hợp lệ. Hãy đảm bảo URL bắt đầu bằng http:// hoặc https://' }, { status: 400 })
        }

        // Fetch the URL content
        let htmlContent: string
        try {
            console.log('[Parse URL] Fetching:', parsedUrl.href)
            const response = await fetch(parsedUrl.href, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8'
                },
                signal: AbortSignal.timeout(15000) // 15 second timeout
            })

            console.log('[Parse URL] Response status:', response.status)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            htmlContent = await response.text()
            console.log('[Parse URL] Content length:', htmlContent.length)
        } catch (error) {
            console.error('[Parse URL] Fetch error:', error)
            return NextResponse.json({
                error: 'Không thể tải trang web. Website có thể chặn bot hoặc không truy cập được. Hãy copy-paste nội dung trực tiếp.',
                details: String(error)
            }, { status: 400 })
        }

        // Convert HTML to text
        const textContent = htmlToText(htmlContent)
        console.log('[Parse URL] Text content length:', textContent.length)

        if (textContent.length < 50) {
            return NextResponse.json({
                error: 'Nội dung trang web quá ngắn hoặc không đọc được. Hãy copy-paste nội dung trực tiếp.',
                contentLength: textContent.length
            }, { status: 400 })
        }

        // Limit content length for AI processing
        const truncatedContent = textContent.slice(0, 8000)

        // Get AI config
        const config = await getAIConfigFromSettings(session.user.id)
        if (!config) {
            return NextResponse.json({ error: 'Chưa cấu hình API key' }, { status: 400 })
        }

        // Use AI to extract story elements
        const prompt = `Analyze this article content and extract elements for FAMILY-FRIENDLY video production:

ARTICLE CONTENT:
${truncatedContent}

Extract and return a JSON object with these fields:
{
    "subject": "main subject/character of the story",
    "action": "key actions happening in the story", 
    "scene": "main setting/location",
    "mood": "overall emotional tone",
    "style": "suggested visual style (cinematic, documentary, etc)",
    "suggestedGenre": "best matching genre (action/drama/documentary/etc)",
    "summary": "expanded Vietnamese summary of the story for video production (500-800 words)",
    "suggestedSceneCount": recommended number of scenes (8-50),
    "keyMoments": ["list", "of", "key", "visual", "moments"]
}

IMPORTANT:
- Write the summary in Vietnamese
- Be specific about visual elements
- Focus on elements that translate well to video

CONTENT SAFETY (MUST FOLLOW):
- All content must be family-friendly and suitable for all ages
- If the article contains violence, controversial, or sensitive topics, focus only on educational/informative aspects
- NO weapons, gore, adult content, or disturbing imagery in the summary
- Keep the tone positive and constructive
- If content cannot be made safe, return an error

- Return ONLY valid JSON, no markdown or explanations`

        const result = await generateText(config, prompt)

        // Parse JSON from result
        let extracted
        try {
            // Clean the response - remove markdown code blocks if present
            let cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            extracted = JSON.parse(cleanResult)
        } catch {
            console.error('JSON parse error:', result)
            return NextResponse.json({ error: 'Không thể phân tích nội dung. Vui lòng thử lại.' }, { status: 400 })
        }

        return NextResponse.json({
            extracted,
            sourceUrl: url,
            contentLength: textContent.length
        })
    } catch (error) {
        console.error('Parse URL error:', error)
        return NextResponse.json({ error: 'Không thể phân tích URL' }, { status: 500 })
    }
}
