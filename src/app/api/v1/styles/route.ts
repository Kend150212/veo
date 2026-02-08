import { NextResponse } from 'next/server'
import { authenticateApiRequest } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// Cinematic Styles from page.tsx
const CINEMATIC_STYLES = [
    { id: 'cinematic_documentary', name: 'Cinematic Documentary', nameVi: 'Phim tài liệu điện ảnh' },
    { id: 'psychological_drama', name: 'Psychological Drama', nameVi: 'Kịch tâm lý' },
    { id: 'sitcom_comedy', name: 'Sitcom / Narrative Comedy', nameVi: 'Hài kịch tình huống' },
    { id: 'mystery_horror', name: 'Mystery Horror', nameVi: 'Kinh dị bí ẩn' },
    { id: 'commercial_storytelling', name: 'High-end Commercial Storytelling', nameVi: 'Quảng cáo kể chuyện' },
    { id: 'bio_futuristic', name: 'Bio-Futuristic Visual Journey', nameVi: 'Hành trình tương lai sinh học' },
    { id: 'food_animation', name: 'Anthropomorphic Food Animation', nameVi: 'Hoạt hình thực phẩm nhân hóa' },
    { id: 'food_drama', name: 'Food Drama / Food Wars', nameVi: 'Kịch tính ẩm thực' },
    { id: 'high_end_fashion', name: 'High-End Fashion Film', nameVi: 'Phim thời trang cao cấp' },
    { id: 'avatar_epic', name: 'Avatar Epic Sci-Fi', nameVi: 'Phim khoa học viễn tưởng hùng vĩ' },
    { id: 'marvel_action', name: 'Marvel-style Action', nameVi: 'Phim hành động Marvel' },
    { id: 'romance_cinematic', name: 'Romance Cinematic', nameVi: 'Phim tình cảm lãng mạn' },
    { id: 'fast_furious', name: 'Fast & Furious Style', nameVi: 'Phong cách Fast & Furious' }
]

const CONTENT_TYPES = [
    { id: 'roast_comedy', name: 'Roast Comedy', icon: '🔥' },
    { id: 'reaction_commentary', name: 'Reaction / Commentary', icon: '😱' },
    { id: 'educational_sassy', name: 'Giáo dục với thái độ', icon: '🙄' },
    { id: 'gossip_tea', name: 'Gossip / Tea Spilling', icon: '☕' },
    { id: 'chaos_comedy', name: 'Chaos Comedy', icon: '🤪' },
    { id: 'horror_survival', name: 'Kinh dị sinh tồn', icon: '😱' },
    { id: 'mystery_detective', name: 'Bí ẩn / Thám tử', icon: '🔍' }
]

const NARRATIVE_TEMPLATES = [
    { id: 'storytelling', name: 'Storytelling - Kể chuyện hấp dẫn' },
    { id: 'documentary', name: 'Documentary - Phóng sự tài liệu' },
    { id: 'tutorial', name: 'Tutorial - Hướng dẫn chi tiết' },
    { id: 'review', name: 'Review - Đánh giá sản phẩm' },
    { id: 'vlog', name: 'Vlog Style - Nhật ký cá nhân' }
]

// GET: List all available styles and content types
export async function GET(request: Request) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Visual styles are stored in channel-styles.ts, not database
        const visualStyles: { id: string, name: string }[] = []

        return NextResponse.json({
            cinematicStyles: CINEMATIC_STYLES,
            contentTypes: CONTENT_TYPES,
            narrativeTemplates: NARRATIVE_TEMPLATES,
            visualStyles,
            voiceOverModes: [
                { id: 'with_host', name: 'Có người dẫn' },
                { id: 'narrator_only', name: 'Chỉ thuyết minh' },
                { id: 'no_voice', name: 'Không giọng nói' }
            ],
            voiceGenders: ['auto', 'male', 'female'],
            voiceTones: ['warm', 'energetic', 'calm', 'mysterious', 'professional'],
            dialogueLanguages: ['vi', 'en']
        })
    } catch (error) {
        console.error('Get styles error:', error)
        return NextResponse.json({ error: 'Failed to get styles' }, { status: 500 })
    }
}
