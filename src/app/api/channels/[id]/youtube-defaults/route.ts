import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Thumbnail Styles - 12 professional styles
export const THUMBNAIL_STYLES = [
    { id: 'bold_minimal', name: '🎯 Bold Minimal', desc: 'Nền solid màu đậm, text lớn bold, 1-2 màu chính, clean và eye-catching' },
    { id: 'face_focus', name: '😮 Face Focus', desc: 'Khuôn mặt host với biểu cảm mạnh (shocked, happy, curious) + text hook lớn' },
    { id: 'split_contrast', name: '⚡ Split Contrast', desc: 'Chia đôi màn hình before/after hoặc A vs B, màu tương phản mạnh' },
    { id: 'number_highlight', name: '🔢 Number Highlight', desc: 'Số lớn nổi bật ở giữa (Top 10, 5 Tips, 3 Secrets...), gradient background' },
    { id: 'mystery_dark', name: '🌑 Mystery Dark', desc: 'Theme tối, bí ẩn, spotlight single focus, suspenseful mood' },
    { id: 'bright_pop', name: '🌈 Bright Pop', desc: 'Màu sáng rực rỡ, vui tươi, năng động, nhiều màu sắc pop-art' },
    { id: 'cinematic_movie', name: '🎬 Cinematic Movie', desc: 'Poster phim style, dramatic lighting, epic composition' },
    { id: 'arrows_circles', name: '👉 Arrows & Circles', desc: 'Mũi tên đỏ, vòng tròn highlight chi tiết, "What is THIS?" style' },
    { id: 'text_overlay', name: '📝 Text Overlay', desc: 'Text lớn bold phủ 40-50% thumbnail, gradient overlay, clean look' },
    { id: 'reaction_style', name: '😱 Reaction Style', desc: 'Host với biểu cảm shocked/surprised, emoji overlays, borders' },
    { id: 'clean_professional', name: '💼 Clean Professional', desc: 'Sạch sẽ, chuyên nghiệp, corporate style, subtle colors' },
    { id: 'gaming_neon', name: '🎮 Gaming Neon', desc: 'Neon glow effects, cyberpunk vibes, dark background, glowing text' },
]

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id },
            select: {
                youtubeDefaults: true,
                thumbnailStyleId: true
            }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        let defaults = null
        if (channel.youtubeDefaults) {
            try {
                defaults = JSON.parse(channel.youtubeDefaults)
            } catch {
                defaults = null
            }
        }

        return NextResponse.json({
            defaults,
            thumbnailStyleId: channel.thumbnailStyleId,
            thumbnailStyles: THUMBNAIL_STYLES
        })
    } catch (error) {
        console.error('Get YouTube defaults error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const { defaults, thumbnailStyleId } = await req.json()

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Update channel
        await prisma.channel.update({
            where: { id },
            data: {
                youtubeDefaults: JSON.stringify(defaults),
                thumbnailStyleId: thumbnailStyleId || null
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Update YouTube defaults error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
