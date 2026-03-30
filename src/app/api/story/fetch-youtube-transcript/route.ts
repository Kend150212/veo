import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSubtitles } from 'youtube-caption-extractor'

function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ]
    for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) return match[1]
    }
    return null
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { url, lang } = await request.json() as { url: string; lang?: string }

        if (!url) {
            return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
        }

        const videoId = extractVideoId(url)
        if (!videoId) {
            return NextResponse.json({
                error: 'URL không hợp lệ. Vui lòng dùng link YouTube như: youtube.com/watch?v=... hoặc youtu.be/...'
            }, { status: 400 })
        }

        // Try requested language, then Vietnamese, then English
        const tryLangs = [lang, 'vi', 'en'].filter(Boolean) as string[]
        let subtitles: { text: string }[] | null = null
        let usedLang = ''

        for (const langCode of tryLangs) {
            try {
                const result = await getSubtitles({ videoID: videoId, lang: langCode })
                if (result && result.length > 0) {
                    subtitles = result
                    usedLang = langCode
                    break
                }
            } catch {
                // Try next language
            }
        }

        if (!subtitles || subtitles.length === 0) {
            return NextResponse.json({
                error: 'Video này không có phụ đề/captions. Bạn có thể paste transcript thủ công.'
            }, { status: 404 })
        }

        // Concatenate transcript
        const transcript = subtitles
            .map(s => s.text)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()

        return NextResponse.json({
            success: true,
            videoId,
            transcript,
            lang: usedLang,
            wordCount: transcript.split(' ').length,
            estimatedMinutes: Math.round(transcript.split(' ').length / 130) // ~130 words/min speaking
        })
    } catch (error) {
        console.error('Fetch YouTube transcript error:', error)
        return NextResponse.json({
            error: 'Không thể lấy transcript. Video có thể không có phụ đề hoặc bị giới hạn.'
        }, { status: 500 })
    }
}
