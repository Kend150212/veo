'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { motion } from 'framer-motion'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    ArrowLeft,
    Plus,
    Film,
    Users,
    Sparkles,
    Loader2,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Copy,
    Download,
    Edit2,
    Settings,
    Tv,
    Check,
    Globe,
    RefreshCw,
    Trash2,
    Wand2,
    GripVertical,
    AlertTriangle,
    X,
    Camera
} from 'lucide-react'
import toast from 'react-hot-toast'
import { CHANNEL_STYLES, STYLE_CATEGORIES, getStylesByCategory } from '@/lib/channel-styles'
import { getNarrativeTemplateSummaries } from '@/lib/narrative-templates'
import StyleSelectorModal from '@/components/StyleSelectorModal'

// Cinematic Film Styles for Hollywood mode
const CINEMATIC_STYLES = [
    {
        id: 'cinematic_documentary',
        name: 'Cinematic Documentary',
        nameVi: 'Phim tài liệu điện ảnh',
        description: 'Sự kết hợp giữa Host (người thật) và CGI/B-Roll hoành tráng',
        visualLanguage: 'Ánh sáng tự nhiên, góc quay rộng (Wide Shot), camera mượt mà (Dolly/Orbit)',
        useCase: 'Lịch sử, khoa học, khám phá vũ trụ',
        icon: '🎥',
        promptKeywords: 'documentary style, natural lighting, wide establishing shots, smooth dolly movements, orbit camera, epic B-roll, narrator presence, educational yet cinematic'
    },
    {
        id: 'psychological_drama',
        name: 'Psychological Drama',
        nameVi: 'Kịch tính tâm lý',
        description: 'Tập trung vào nội tâm, sự cô độc, và những quyết định quan trọng',
        visualLanguage: 'Tương phản sáng tối (Chiaroscuro), góc nghiêng (Dutch Angle), đặc tả cực cận',
        useCase: 'Phim ngắn, câu chuyện truyền cảm hứng, bi kịch',
        icon: '🎭',
        promptKeywords: 'psychological drama, chiaroscuro lighting, dutch angle, extreme close-ups, sweat droplets, eye reflections, internal conflict, moody atmosphere, shadows and highlights'
    },
    {
        id: 'sitcom_comedy',
        name: 'Sitcom / Narrative Comedy',
        nameVi: 'Hài kịch tình huống',
        description: 'Nhịp độ nhanh, đối thoại liên tục, tình huống trớ trêu',
        visualLanguage: 'Ánh sáng rực rỡ (High-key), góc quay trung (Medium shot), màu sắc tươi sáng',
        useCase: 'Series đời thường, vlog cặp đôi, tình huống hài hước Gen Z',
        icon: '😂',
        promptKeywords: 'sitcom style, high-key bright lighting, colorful vibrant scenes, medium shots for character interaction, quick cuts, comedic timing, expressive reactions'
    },
    {
        id: 'horror_thriller',
        name: 'Horror / Supernatural Thriller',
        nameVi: 'Kinh dị / Giật gân',
        description: 'Tạo sự sợ hãi, tò mò qua những thứ không nhìn rõ',
        visualLanguage: 'Ánh sáng mờ ảo (Low-key), hiệu ứng khói/haze, âm thanh vòm (Spatial Audio)',
        useCase: 'Khám phá bí ẩn, tâm linh, truyền thuyết đô thị',
        icon: '👻',
        promptKeywords: 'horror atmosphere, low-key lighting, fog and haze effects, deep shadows, unseen threats, spatial audio cues, creaking sounds, jump scare potential, eerie silence'
    },
    {
        id: 'commercial_storytelling',
        name: 'High-end Commercial Storytelling',
        nameVi: 'Quảng cáo kể chuyện',
        description: 'Giải quyết vấn đề (Problem/Solution) một cách nhân văn',
        visualLanguage: 'Đặc tả sản phẩm lộng lẫy, bối cảnh sạch sẽ hiện đại, chuyển cảnh mượt mà',
        useCase: 'Tiếp thị liên kết, giới thiệu sản phẩm cao cấp, Branding cá nhân',
        icon: '✨',
        promptKeywords: 'commercial cinematic, product macro shots, clean modern backgrounds, smooth transitions, problem-solution narrative, aspirational lifestyle, premium quality feel'
    },
    {
        id: 'bio_cgi_explainer',
        name: 'Bio-CGI / Educational Explainer',
        nameVi: 'Diễn họa sinh học',
        description: 'Biến những thứ siêu nhỏ thành một vũ trụ kỳ ảo',
        visualLanguage: 'Màu sắc Neon (Cyberpunk), ánh sáng phát quang sinh học, góc quay bay xuyên qua',
        useCase: 'Giải thích cơ chế cơ thể, tâm lý học, công nghệ tương lai',
        icon: '🧬',
        promptKeywords: 'bio-CGI visualization, neon cyberpunk colors, bioluminescence effects, fly-through camera, microscopic world made epic, DNA strands, neural networks, futuristic technology'
    },
    {
        id: 'food_animation',
        name: 'Anthropomorphic Food Animation',
        nameVi: 'Hoạt hình thực phẩm nhân hóa',
        description: 'Rau củ, trái cây trở thành nhân vật với cảm xúc và tính cách - SIÊU VIRAL!',
        visualLanguage: '3D Pixar-style, màu sắc tươi sáng, biểu cảm phóng đại, bối cảnh nhà bếp',
        useCase: 'Mẹo nấu ăn, dinh dưỡng, sự thật thực phẩm, giáo dục trẻ em, viral content',
        icon: '🥕',
        promptKeywords: 'anthropomorphic food characters, 3D Pixar-style animation, vegetables and fruits with human faces, exaggerated expressions, kitchen environment, cooking scenes, bright colorful lighting, cute food characters with emotions, comedic reactions'
    },
    {
        id: 'food_drama',
        name: 'Food Drama / Food Wars',
        nameVi: 'Kịch tính ẩm thực',
        description: 'Thực phẩm tham gia vào các tình huống kịch tính, đối đầu, cạnh tranh',
        visualLanguage: 'Dramatic lighting, góc quay action, hiệu ứng năng lượng, slow motion',
        useCase: 'So sánh thực phẩm, battle giữa các món, drama ẩm thực viral',
        icon: '⚔️',
        promptKeywords: 'food battle drama, anthropomorphic ingredients fighting, dramatic showdown, energy effects around food, arena-style kitchen, intense expressions, action camera angles, epic food confrontation, winner loser dynamics'
    },
    {
        id: 'high_end_fashion',
        name: 'High-End Fashion Film',
        nameVi: 'Phim thời trang cao cấp (Longchamp Style)',
        description: 'Quảng cáo thời trang cao cấp với yếu tố SIÊU THỰC - môi trường biến đổi, chuyển cảnh mượt mà',
        visualLanguage: 'Golden hour, FPV drone, seamless morphing, surreal transitions, nature reclaiming city',
        useCase: 'Thời trang cao cấp, quảng cáo thương hiệu, visual art film, fashion campaign',
        icon: '✨',
        promptKeywords: 'high fashion film, surreal transitions, seamless morphing, golden hour, Haussmann architecture, Paris rooftops, drone shots, FPV tracking, dreamcore aesthetic, environment transformation, portal transitions, volumetric lighting, 8K photorealistic'
    },
    {
        id: 'avatar_epic',
        name: 'Avatar Epic Sci-Fi',
        nameVi: 'Phim khoa học viễn tưởng hùng vĩ (Avatar Style)',
        description: 'Thế giới ngoài hành tinh hùng vĩ với cảnh quan IMAX, sinh vật phát sáng, núi bay',
        visualLanguage: 'Bioluminescent, floating mountains, alien flora, IMAX scale, spiritual glow, Pandora aesthetic',
        useCase: 'Sci-Fi epic, fantasy worlds, alien planets, spiritual journeys',
        icon: '🌌',
        promptKeywords: 'Avatar style, Pandora aesthetic, bioluminescent world, floating mountains, epic landscapes, alien flora fauna, IMAX cinematography, James Cameron epic scale'
    },
    {
        id: 'marvel_superhero',
        name: 'Marvel Superhero Action',
        nameVi: 'Phim siêu anh hùng Marvel',
        description: 'Action đỉnh cao với hero landing, power effects, team assembly shots, epic battles',
        visualLanguage: '360° hero shots, speed ramping, power effects, CGI destruction, dramatic poses',
        useCase: 'Superhero stories, action sequences, team dynamics, villain confrontations',
        icon: '🦸',
        promptKeywords: 'Marvel Cinematic Universe, superhero action, hero landing, power effects, team assembly, villain confrontation, epic battle, dramatic lighting'
    },
    {
        id: 'romance_cinematic',
        name: 'Romance Cinematic',
        nameVi: 'Phim tình cảm lãng mạn',
        description: 'Câu chuyện tình yêu đầy cảm xúc với golden hour, bokeh đẹp, khoảnh khắc thân mật',
        visualLanguage: 'Golden hour, soft focus, bokeh, intimate close-ups, rain kiss, slow-motion',
        useCase: 'Love stories, romantic drama, emotional journeys, wedding films',
        icon: '💕',
        promptKeywords: 'romantic drama, love story, golden hour romance, soft focus, bokeh, intimate moments, rain kiss, airport reunion, emotional close-ups'
    },
    {
        id: 'fast_furious_action',
        name: 'Fast & Furious Action',
        nameVi: 'Phim hành động tốc độ',
        description: 'Đua xe, rượt đuổi, NOS, drift, stunts không tưởng - FAMILY!',
        visualLanguage: 'Speed blur, NOS flames, drift smoke, night neon, low angle cars, explosion',
        useCase: 'Street racing, car chases, heist action, high-speed stunts',
        icon: '🏎️',
        promptKeywords: 'Fast and Furious style, street racing, car chases, NOS boost, drift racing, explosions, impossible stunts, muscle cars, night neon'
    }
]

// Fashion Background Options
const FASHION_BACKGROUNDS = [
    { id: 'fitting_room', name: 'Phòng thử đồ', icon: '👗', keywords: 'clothing store fitting room, multiple mirrors, warm lighting, hanging clothes rack visible, retail boutique interior' },
    { id: 'bedroom_lifestyle', name: 'Phòng ngủ lifestyle', icon: '🛏️', keywords: 'cozy bedroom interior, aesthetic room decor, natural window light, minimal furniture, lifestyle photography backdrop' },
    { id: 'closet_wardrobe', name: 'Tủ quần áo', icon: '🚪', keywords: 'walk-in closet, organized wardrobe, hanging clothes, shoe shelves, fashion influencer aesthetic' },
    { id: 'studio_white', name: 'Studio trắng', icon: '⬜', keywords: 'white photo studio background, professional lighting, clean minimalist backdrop, fashion photography studio' },
    { id: 'studio_ring_light', name: 'Studio ring light', icon: '💡', keywords: 'ring light studio setup, beauty influencer lighting, soft even illumination, content creator room' },
    { id: 'cafe_outdoor', name: 'Quán café / Outdoor', icon: '☕', keywords: 'aesthetic cafe interior, outdoor street style, urban background, lifestyle location, natural daylight' },
    { id: 'mirror_selfie', name: 'Gương selfie', icon: '🪞', keywords: 'full body mirror, mirror selfie style, smartphone visible in reflection, bathroom or bedroom mirror, OOTD photo' },
    { id: 'custom', name: 'Tùy chỉnh', icon: '✏️', keywords: '' }
]

// Content type configurations (for non-cinematic modes)
const CONTENT_TYPE_INFO: Record<string, { name: string; description: string; icon: string; tips: string[] }> = {
    'roast_comedy': {
        name: 'Roast Comedy',
        description: 'Nhân vật ROAST, chọc tức, thách thức khán giả - Gây tranh cãi = VIRAL!',
        icon: '🔥',
        tips: [
            '"Bạn còn đang xem video này à? Chắc rảnh lắm nhỉ?"',
            '"Tôi cá là bạn đang nằm trên giường lướt video"',
            '"Comment đi, tôi biết bạn muốn cãi rồi đấy"',
            '"Share cho đứa bạn ngu ngu của bạn xem đi"'
        ]
    },
    'breaking_4th_wall': {
        name: 'Phá vỡ bức tường thứ 4',
        description: 'Nhân vật BIẾT họ đang trong video, nói chuyện trực tiếp với khán giả',
        icon: '👀',
        tips: [
            'Nhìn thẳng vào camera và wink',
            '"Đừng nói với ai nhé" *thì thầm*',
            '"Tôi thấy bạn chưa subscribe đấy"',
            '*something happens* *nhìn camera như trong The Office*'
        ]
    },
    'reaction_commentary': {
        name: 'Reaction / Commentary',
        description: 'Xem và phản ứng với nội dung, bình luận sắc sảo',
        icon: '😱',
        tips: [
            'Split screen hoặc Picture-in-Picture',
            'Biểu cảm exaggerated: shocked, cringing',
            'Opinions mạnh, không ngại controversial'
        ]
    },
    'educational_sassy': {
        name: 'Giáo dục với thái độ',
        description: '"Bạn không biết điều này thật à?" - Dạy với thái độ sassy',
        icon: '🙄',
        tips: [
            '"Wow, still believing that myth?"',
            'Slow, condescending clap',
            'Eye roll cực dramatic',
            '"Let me educate you real quick"'
        ]
    },
    'gen_z_meme': {
        name: 'Gen Z Meme Culture',
        description: 'Absurd, ironic, chaotic energy - "Bruh" moment',
        icon: '💀',
        tips: [
            'Random zoom bất ngờ',
            '"No cap", "Fr fr", "Slay", "It\'s giving..."',
            'Anti-humor (not funny = funny)',
            'Skull emoji energy 💀'
        ]
    },
    'chaos_unhinged': {
        name: 'Chaotic / Năng lượng điên',
        description: '"This is fine" 🔥 while everything burns',
        icon: '🤪',
        tips: [
            'Situation escalates out of control',
            'Forced smile while panicking',
            '"I\'m fine" while clearly not fine',
            'Fire in background, keep smiling'
        ]
    },
    'horror_survival': {
        name: 'Kinh dị sinh tồn',
        description: 'Nhân vật cố THOÁT KHỎI nguy hiểm - Tension cao!',
        icon: '😱',
        tips: [
            'Dark, low-key lighting',
            'POV từ góc nạn nhân',
            'Running/chasing scenes',
            'Jump scare moments'
        ]
    },
    'romance_drama': {
        name: 'Tình cảm lãng mạn',
        description: 'Câu chuyện tình yêu - Cảm động hoặc bi kịch',
        icon: '💕',
        tips: [
            'Warm, golden hour lighting',
            'Eye contact moments, slow motion',
            'Love confession scenes',
            'Can be sweet OR tragic ending'
        ]
    },
    'mystery_detective': {
        name: 'Bí ẩn / Thám tử',
        description: 'Điều tra, khám phá bí mật, twist endings',
        icon: '🔍',
        tips: [
            'Noir lighting, shadows',
            'Clue reveals, "aha!" moments',
            'Evidence boards with red strings',
            'Dramatic twist endings'
        ]
    },
    'villain_origin': {
        name: 'Nguồn gốc phản diện',
        description: 'Tại sao nhân vật trở thành "ác" - Đồng cảm với villain',
        icon: '😈',
        tips: [
            'Tragic backstory reveals',
            '"They made me this way"',
            'Before (innocent) vs After (villain)',
            'Transformation sequence'
        ]
    },
    'underdog_triumph': {
        name: 'Kẻ yếu vươn lên',
        description: 'Từ bị coi thường → chứng minh giá trị!',
        icon: '🏆',
        tips: [
            'Start: bị coi thường',
            'Training montage, struggling',
            'PROVE THEM WRONG moment',
            'Shocked faces of doubters'
        ]
    },
    'food_animation': {
        name: 'Thực phẩm nhân hóa',
        description: 'Rau củ, trái cây có cảm xúc và tính cách - SIÊU VIRAL!',
        icon: '🍔',
        tips: [
            '3D Pixar-style animation',
            'Vegetables/fruits with human faces',
            'Kitchen environment',
            'Comedic reactions'
        ]
    },
    'food_drama': {
        name: 'Food Wars / Kịch tính ẩm thực',
        description: 'Thực phẩm battle, đối đầu, cạnh tranh',
        icon: '⚔️',
        tips: [
            '"Thực phẩm nào tốt hơn?"',
            'Energy auras xung quanh',
            'Arena/Sân đấu trong nhà bếp',
            'Victory celebration'
        ]
    },
    'asmr_satisfying': {
        name: 'ASMR / Satisfying',
        description: 'Âm thanh êm dịu, hình ảnh thỏa mãn, relax',
        icon: '🎧',
        tips: [
            'Extreme close-up, macro shots',
            'Slow motion textures',
            'Focus on SOUNDS: crisp, crunchy, sizzling',
            'Relaxing, meditative atmosphere'
        ]
    },
    'fashion_showcase': {
        name: 'Fashion Showcase',
        description: 'Thử đồ, quảng cáo thời trang - Virtual Model mặc sản phẩm của bạn!',
        icon: '👗',
        tips: [
            '1. Upload hình sản phẩm → AI tự phân tích',
            '2. Nhập giá, khuyến mãi → AI tạo script',
            '3. Click "Tạo ảnh" mỗi scene → Imagen 3 tạo ảnh',
            '4. Download ảnh → Dùng cho video AI'
        ]
    },
    'one_shot': {
        name: 'One Shot',
        description: 'Một cảnh quay liên tục không cắt, camera di chuyển từ siêu rộng đến cực macro',
        icon: '🎥',
        tips: [
            'Single continuous shot - NO CUTS, seamless flow',
            'Dynamic camera movement: slow for emotional, fast for action',
            'Wide to macro transitions: ultra-wide establishing → extreme close-up details',
            'Camera techniques: dolly, zoom, orbit, crane, tracking',
            'Pacing varies with content: slow reveal, fast chase, gradual zoom',
            'Create visual interest through framing and movement, not cuts'
        ]
    },
    'narrative_storytelling': {
        name: 'Kể Chuyện (B-roll Voiceover)',
        description: 'Kể chuyện cá nhân, vấn đề xã hội với 100% B-roll - Phong cách Anh Dư Leo',
        icon: '📖',
        tips: [
            'Hook mạnh: Tuyên bố kết quả ấn tượng ngay đầu',
            'Giọng thân mật như đang tâm sự với người xem',
            'Dùng số liệu cụ thể tăng độ tin cậy',
            'Cấu trúc: Hook → Bối cảnh → Khó khăn → Kết quả → Lời khuyên',
            '100% B-roll với voiceover, không có nhân vật xuất hiện'
        ]
    },
    'educational_explainer': {
        name: 'Giải Thích Giáo Dục (Explainer)',
        description: 'Giải thích kiến thức, khái niệm với data và story hook - Phong cách Lóng, Vietcetera',
        icon: '🎓',
        tips: [
            'Hook bằng câu chuyện thú vị/fairytale element',
            'Giải thích khái niệm từ cơ bản đến chi tiết',
            'Dùng nhiều data, thống kê, so sánh quốc tế',
            'Chia sẻ kinh nghiệm cá nhân xen kẽ',
            'Kết thúc với tips thực tiễn và CTA'
        ]
    },
    'cinematic_film_script': {
        name: 'Kịch Bản Phim Điện Ảnh 8K',
        description: 'Kịch bản phim Netflix/Hollywood chuyên nghiệp - Lời thoại tự nhiên, AI quyết định scene nào cần thoại',
        icon: '🎬',
        tips: [
            '📽️ 8K Ultra HD photorealistic - Chất lượng điện ảnh',
            '🎭 Lời thoại TỰ NHIÊN - Không phải scene nào cũng có thoại',
            '🌈 Auto Color Grading theo cảm xúc scene',
            '❌ NO FILTERS, NO OVERLAYS - Video sạch 100%',
            '👥 Nhân vật nhất quán - Mô tả đầy đủ mỗi scene',
            '🎯 AI tự quyết định: Thoại/Im lặng/Âm thanh môi trường'
        ]
    },
    'kol_solo_storyteller': {
        name: 'KOL Solo Storyteller',
        description: 'Host ngồi trong 1 phòng kể chuyện trước camera - Như Dưa Leo, KOL nói chuyện trực tiếp',
        icon: '🎙️',
        tips: [
            '🎤 100% Host trước camera - KHÔNG có B-Roll',
            '😊 Biểu cảm phong phú: cười, nghiêm túc, bất ngờ, thì thầm',
            '👐 Cử chỉ tay tự nhiên khi kể chuyện',
            '📍 Cùng 1 bối cảnh phòng xuyên suốt',
            '🎯 Thu hút bằng giọng kể, ánh mắt và energy'
        ]
    }
}

interface EpisodeScene {
    id: string
    order: number
    title: string | null
    promptText: string
    duration: number
    hookType: string | null
    generatedImageUrl?: string | null
}

interface Episode {
    id: string
    episodeNumber: number
    title: string
    synopsis: string | null
    status: string
    totalScenes: number
    generatedScenes: number
    scenes: EpisodeScene[]
    categoryId: string | null
    metadata: string | null
}

interface EpisodeCategory {
    id: string
    name: string
    description: string | null
    color: string
    order: number
    _count?: { episodes: number }
}

interface ChannelCharacter {
    id: string
    name: string
    role: string
    fullDescription: string
    personality?: string // Tính cách nhân vật
    isMain: boolean
    gender?: string
    ageRange?: string
    appearance?: string
    faceDetails?: string
    hairDetails?: string
    clothing?: string
    skinTone?: string
    styleKeywords?: string
    voiceStyle?: string
}

interface Channel {
    id: string
    name: string
    niche: string
    visualStyleId: string | null
    visualStyleKeywords: string | null
    hasCharacters: boolean
    knowledgeBase: string | null
    dialogueLanguage: string
    characters: ChannelCharacter[]
    episodes: Episode[]
    categories?: EpisodeCategory[]
}

export default function ChannelDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { data: session } = useSession()
    const router = useRouter()

    const [channel, setChannel] = useState<Channel | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [sceneCount, setSceneCount] = useState(10)
    const [expandedEpisode, setExpandedEpisode] = useState<string | null>(null)
    const [showYoutubeStrategies, setShowYoutubeStrategies] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    // Character management
    const [showAddCharacter, setShowAddCharacter] = useState(false)
    const [editingCharacter, setEditingCharacter] = useState<ChannelCharacter | null>(null)
    const [newCharacter, setNewCharacter] = useState({
        name: '',
        role: 'host',
        fullDescription: '',
        personality: '',
        isMain: false,
        gender: 'female',
        ageRange: '25-35',
        faceDetails: '',
        hairDetails: '',
        clothing: '',
        skinTone: '',
        styleKeywords: ''
    })
    const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false)
    const [showKnowledge, setShowKnowledge] = useState(false)
    const [expandedNiche, setExpandedNiche] = useState(false)
    const [setupCollapsed, setSetupCollapsed] = useState(false) // Collapsible setup panel

    // Episode creation options
    const [useCharacters, setUseCharacters] = useState(true)
    const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([])
    const [adaptCharactersToScript, setAdaptCharactersToScript] = useState(false) // AI tự điều chỉnh nhân vật
    const [selectedStyleId, setSelectedStyleId] = useState<string>('')
    const [showStyleModal, setShowStyleModal] = useState(false)
    const [mentionChannel, setMentionChannel] = useState(false)
    const [ctaMode, setCtaMode] = useState<'random' | 'select' | 'disabled'>('random')
    const [selectedCTAs, setSelectedCTAs] = useState<string[]>([])
    const [voiceOverMode, setVoiceOverMode] = useState<
        'with_host' | 'voice_over' | 'broll_only' | 'host_dynamic_env' | 'host_storyteller' | 'cinematic_film' |
        'roast_comedy' | 'reaction_commentary' | 'asmr_satisfying' | 'horror_survival' | 'romance_drama' |
        'gen_z_meme' | 'educational_sassy' | 'mystery_detective' | 'breaking_4th_wall' | 'villain_origin' |
        'underdog_triumph' | 'chaos_unhinged' | 'food_animation' | 'food_drama' | 'fashion_showcase' | 'one_shot' |
        'narrative_storytelling' | 'cinematic_film_script' | 'kol_solo_storyteller'
    >('with_host')

    // Fashion showcase product state
    const [productImage, setProductImage] = useState<string>('')
    const [productImageBase64, setProductImageBase64] = useState<string>('')
    const [productAnalysis, setProductAnalysis] = useState<{
        productType?: string
        productSubtype?: string
        color?: string
        colorHex?: string
        colors?: string[]
        material?: string
        texture?: string
        style?: string
        pattern?: string
        neckline?: string
        sleeveType?: string
        length?: string
        fit?: string
        details?: string[]
        features?: string[]
        suitableFor?: string[]
        seasonSuggestion?: string
        targetAudience?: string
        promptKeywords?: string
        exactDescription?: string
        stylingTips?: string[]
    } | null>(null)
    const [isAnalyzingProduct, setIsAnalyzingProduct] = useState(false)
    const [productInfo, setProductInfo] = useState({
        name: '',
        price: '',
        salePrice: '',
        promotion: ''
    })

    // Image generation state
    const [generatingImageForScene, setGeneratingImageForScene] = useState<string | null>(null)

    // Fashion background state (saved to channel)
    const [fashionBackground, setFashionBackground] = useState('fitting_room')
    const [customBackground, setCustomBackground] = useState('')
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
    const [backgroundImageBase64, setBackgroundImageBase64] = useState<string | null>(null)

    // Multiple product images (different angles)
    const [productImages, setProductImages] = useState<{ file: File, base64: string, name: string }[]>([])

    // Fashion Preview Images (generated BEFORE script)
    const [fashionPreviewImages, setFashionPreviewImages] = useState<{ url: string, prompt: string }[]>([])
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
    const [fashionSceneCount, setFashionSceneCount] = useState(6)

    // Fashion mode: Use own images (don't generate, just create script)
    const [useOwnImages, setUseOwnImages] = useState(true) // Default: user has their own images

    // Download image helper function
    const downloadImage = (dataUrl: string, filename: string) => {
        // Convert data URL to blob
        const arr = dataUrl.split(',')
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
        }
        const blob = new Blob([u8arr], { type: mime })

        // Create download link
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    // Handle background image upload
    const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            const base64 = reader.result as string
            setBackgroundImageBase64(base64)
            setBackgroundImage(base64)
            setFashionBackground('uploaded') // Special value for uploaded image
        }
        reader.readAsDataURL(file)
    }

    // Handle multiple product images upload
    const handleMultiProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const newImages: { file: File, base64: string, name: string }[] = []

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.readAsDataURL(file)
            })
            newImages.push({ file, base64, name: file.name })
        }

        setProductImages(prev => [...prev, ...newImages])

        // Set first image as main product image if not set
        if (newImages.length > 0 && !productImageBase64) {
            setProductImageBase64(newImages[0].base64)
            setProductImage(newImages[0].base64)
        }
    }

    // Remove product image
    const removeProductImage = (index: number) => {
        setProductImages(prev => prev.filter((_, i) => i !== index))
    }

    // Generate Fashion Preview Images (BEFORE creating script)
    const handleGenerateFashionPreviews = async () => {
        if (!productImageBase64) {
            toast.error('Vui lòng upload ảnh sản phẩm trước')
            return
        }

        setIsGeneratingPreview(true)
        setFashionPreviewImages([])

        // Get background description
        let backgroundDesc = ''
        const selectedBg = FASHION_BACKGROUNDS.find(bg => bg.id === fashionBackground)
        if (fashionBackground === 'uploaded' && backgroundImageBase64) {
            backgroundDesc = 'fitting room with mirrors and warm lighting'
        } else if (fashionBackground === 'custom' && customBackground) {
            backgroundDesc = customBackground
        } else if (selectedBg) {
            backgroundDesc = selectedBg.keywords
        }

        // Get product description - VERY DETAILED
        const productDesc = productAnalysis?.exactDescription || productAnalysis?.promptKeywords || ''
        const productColor = productAnalysis?.color || ''
        const productType = productAnalysis?.productType || 'dress'
        const productMaterial = productAnalysis?.material || ''

        // Build EXACT product specification
        const exactProduct = productDesc
            ? `EXACT CLOTHING FROM REFERENCE IMAGE: ${productDesc}. Color: ${productColor}. Material: ${productMaterial}.`
            : `The exact clothing item shown in the reference image.`

        // Get character description if selected
        let characterDesc = 'A beautiful Asian female fashion model'
        if (useCharacters && channel?.characters && channel.characters.length > 0) {
            const mainChar = (selectedCharacterIds.length === 0 || selectedCharacterIds.includes('all'))
                ? channel.characters.find((c: ChannelCharacter) => c.isMain) || channel.characters[0]
                : channel.characters.find((c: ChannelCharacter) => selectedCharacterIds.includes(c.id))

            if (mainChar) {
                characterDesc = mainChar.fullDescription || `${mainChar.name}, ${mainChar.appearance || ''}`
            }
        }

        // Define scene types for fashion showcase - WITH STRICT PRODUCT REFERENCE
        const sceneTypes = [
            { type: 'intro', prompt: `${characterDesc} standing confidently in ${backgroundDesc}. Full body shot. The model is wearing ${exactProduct} Friendly smile, waving at camera.` },
            { type: 'front', prompt: `${characterDesc} posing front view in ${backgroundDesc}. Full body shot. The model is wearing ${exactProduct} Standing naturally with hands on hips.` },
            { type: 'side', prompt: `${characterDesc} posing side profile in ${backgroundDesc}. Full body shot. The model is wearing ${exactProduct} Elegant pose showing the outfit.` },
            { type: 'back', prompt: `${characterDesc} showing back view in ${backgroundDesc}. Full body shot. The model is wearing ${exactProduct} Looking over shoulder at camera.` },
            { type: 'detail', prompt: `${characterDesc} showing clothing details in ${backgroundDesc}. Medium shot. The model is wearing ${exactProduct} Touching the fabric to show quality.` },
            { type: 'spin', prompt: `${characterDesc} doing a graceful spin in ${backgroundDesc}. Full body shot. The model is wearing ${exactProduct} Dynamic twirl pose, outfit visible.` },
            { type: 'cta', prompt: `${characterDesc} making heart gesture in ${backgroundDesc}. Full body shot. The model is wearing ${exactProduct} Smiling warmly at camera.` },
            { type: 'price', prompt: `${characterDesc} giving thumbs up in ${backgroundDesc}. Full body shot. The model is wearing ${exactProduct} Excited, happy expression.` },
        ]

        const selectedScenes = sceneTypes.slice(0, fashionSceneCount)
        const generated: { url: string, prompt: string }[] = []

        // Build the reference instruction
        const referenceInstruction = `
CRITICAL INSTRUCTION: You MUST recreate the EXACT clothing item from the reference image I'm providing.
- The clothing must be IDENTICAL: same color (${productColor}), same style, same design
- DO NOT create a different outfit - use the EXACT one from the reference
- The reference image shows a ${productType} - recreate THIS EXACT item
- NO text, NO watermarks, NO graphics on the image
- iPhone quality photo, vertical 9:16 format
- FIXED camera angle like a livestream tripod shot`

        try {
            for (let i = 0; i < selectedScenes.length; i++) {
                const scene = selectedScenes[i]
                toast.loading(`Đang tạo ảnh ${i + 1}/${selectedScenes.length}...`, { id: 'fashion-preview' })

                const fullPrompt = scene.prompt + referenceInstruction

                const res = await fetch('/api/imagen/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: fullPrompt,
                        referenceImageBase64: productImageBase64,
                        aspectRatio: '9:16'
                    })
                })

                if (res.ok) {
                    const data = await res.json()
                    generated.push({ url: data.imageUrl, prompt: scene.prompt })
                } else {
                    const err = await res.json()
                    console.error('Failed to generate scene', i, err)
                    generated.push({ url: '', prompt: scene.prompt + ' (FAILED)' })
                }
            }

            setFashionPreviewImages(generated)
            toast.success(`Đã tạo ${generated.filter(g => g.url).length}/${selectedScenes.length} ảnh!`, { id: 'fashion-preview' })
        } catch (error) {
            console.error('Fashion preview error:', error)
            toast.error('Lỗi tạo ảnh preview', { id: 'fashion-preview' })
        } finally {
            setIsGeneratingPreview(false)
        }
    }
    const [cinematicStyle, setCinematicStyle] = useState<string>('cinematic_documentary') // Style cho mode điện ảnh

    // Voice settings (for voice_over mode)
    const [voiceGender, setVoiceGender] = useState<'male' | 'female' | 'auto'>('auto')
    const [voiceTone, setVoiceTone] = useState<'auto' | 'warm' | 'professional' | 'energetic' | 'calm' | 'serious' | 'dramatic'>('auto')

    // Storyteller B-Roll option
    const [storytellerBrollEnabled, setStorytellerBrollEnabled] = useState(false)

    // Narrative Storytelling options
    const [narrativeTemplateId, setNarrativeTemplateId] = useState('personal-journey-broll')
    const [narrativeTopic, setNarrativeTopic] = useState('')
    const [narrativeKeyPoints, setNarrativeKeyPoints] = useState('')
    const [narrativeWithHost, setNarrativeWithHost] = useState(false) // false = 100% B-roll, true = có host dẫn chuyện
    const [narrativeHostId, setNarrativeHostId] = useState<string>('') // ID nhân vật được chọn làm host
    const narrativeTemplates = getNarrativeTemplateSummaries()

    // Advanced Episode Features
    const [visualHookEnabled, setVisualHookEnabled] = useState(true)
    const [emotionalCurveEnabled, setEmotionalCurveEnabled] = useState(true)
    const [spatialAudioEnabled, setSpatialAudioEnabled] = useState(true)
    const [musicMode, setMusicMode] = useState<'with_music' | 'ambient_only'>('with_music') // Nhạc nền hoặc chỉ âm thanh môi trường
    const [dialogueDensityMin, setDialogueDensityMin] = useState(12)
    const [dialogueDensityMax, setDialogueDensityMax] = useState(18)

    // Cinematic film script specific states
    const [cinematicCameraStyles, setCinematicCameraStyles] = useState<string[]>(['dynamic_angles'])
    const [cinematicSceneCount, setCinematicSceneCount] = useState(8)

    // KOL Solo Storyteller specific states
    const [kolRoomDescription, setKolRoomDescription] = useState('')
    const [kolRoomPreset, setKolRoomPreset] = useState<string>('custom')
    const [kolHostMode, setKolHostMode] = useState<'channel_character' | 'custom' | 'ai_generate'>('channel_character')
    const [kolCustomHost, setKolCustomHost] = useState('')
    const [kolSelectedCharacterIds, setKolSelectedCharacterIds] = useState<string[]>([])
    const [kolSavedRoomTemplates, setKolSavedRoomTemplates] = useState<{ name: string, description: string }[]>([])
    const [kolNewTemplateName, setKolNewTemplateName] = useState('')
    const [kolShowSaveTemplate, setKolShowSaveTemplate] = useState(false)
    const [kolShowChannelName, setKolShowChannelName] = useState(true)
    const [kolChannelNameMode, setKolChannelNameMode] = useState<'channel' | 'custom'>('channel')
    const [kolCustomChannelText, setKolCustomChannelText] = useState('')
    const [kolHostInteractions, setKolHostInteractions] = useState<string[]>([])
    const [kolContentStyle, setKolContentStyle] = useState<string>('dua_leo')

    // KOL Room Presets
    const KOL_ROOM_PRESETS: Record<string, { name: string; description: string; icon: string }> = {
        'modern_studio': {
            name: 'Studio Hiện Đại',
            description: 'Phòng studio sáng sủa, tường trắng với đèn LED RGB phía sau, bàn gỗ sáng với micro podcast Silver, cốc cà phê, laptop MacBook Pro. Ghế ergonomic đen. Softbox lighting bên trái, fill light bên phải. Backdrop sạch sẽ, chuyên nghiệp.',
            icon: '🎙️'
        },
        'cozy_bedroom': {
            name: 'Phòng Ngủ Ấm Cúng',
            description: 'Phòng ngủ ấm cúng, tường gạch exposed brick, fairy lights treo lung tung, kệ sách gỗ phía sau đầy sách. Ngồi trên giường với chăn dày, gối tựa lưng. Đèn bàn warm light, nến thơm. Không khí intimate, gần gũi.',
            icon: '🛋️'
        },
        'dark_gaming': {
            name: 'Gaming Room Tối',
            description: 'Phòng gaming tối, đèn LED strip màu tím/xanh neon viền tường và bàn. 2 màn hình gaming phía sau, bàn phím cơ RGB. Ghế gaming đỏ-đen. Poster anime/game trên tường. Ánh sáng chính từ key light phía trước, ambient neon xung quanh.',
            icon: '🎮'
        },
        'cafe_vibe': {
            name: 'Góc Café',
            description: 'Góc café nhỏ xinh, tường gỗ rustic, cây xanh nhỏ trên kệ. Bàn gỗ tròn nhỏ với ly cà phê latte art, cuốn sổ tay leather. Ghế gỗ vintage. Ánh sáng tự nhiên từ cửa sổ bên trái, warm tone. Tiệm café mờ ảo phía sau.',
            icon: '☕'
        },
        'minimalist_white': {
            name: 'Minimalist Trắng',
            description: 'Phòng minimalist toàn trắng, tường trắng sạch, bàn trắng đơn giản chỉ có micro và 1 cây xanh nhỏ. Ghế trắng. Ring light phía trước tạo ánh sáng đều. Nền trắng clean, focus hoàn toàn vào host. Phong cách Apple-like.',
            icon: '⬜'
        },
        'outdoor_balcony': {
            name: 'Ban Công / Ngoài Trời',
            description: 'Ban công mở, view thành phố phía sau mờ ảo (bokeh). Ghế mây, bàn nhỏ với ly trà, cây xanh xung quanh. Ánh sáng tự nhiên golden hour, gió nhẹ lay tóc. Không khí thoáng đãng, tự do.',
            icon: '🌅'
        },
        'podcast_pro': {
            name: 'Podcast Studio Pro',
            description: 'Studio podcast chuyên nghiệp, tường cách âm foam đen, 2 micro boom arm đối diện nhau, mixer audio trên bàn, headphone treo. Đèn spotlight từ trên, LED logo kênh phát sáng phía sau. Cực kỳ pro, như Joe Rogan studio.',
            icon: '🎧'
        },
        'library_scholar': {
            name: 'Thư Viện / Phòng Đọc',
            description: 'Phòng đọc sách cổ điển, tường kệ sách gỗ tối đầy sách leather-bound, bàn gỗ mahogany với đèn đọc sách xanh lá. Ghế da nâu. Ánh sáng ấm từ đèn bàn, atmosphere học thuật, sang trọng.',
            icon: '📚'
        }
    }

    // Load saved KOL room templates from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('kol_room_templates')
            if (saved) {
                try { setKolSavedRoomTemplates(JSON.parse(saved)) } catch { }
            }
        }
    }, [])

    // Auto-set dialogue density for KOL mode
    useEffect(() => {
        if (voiceOverMode === 'kol_solo_storyteller') {
            setDialogueDensityMin(18)
            setDialogueDensityMax(21)
        }
    }, [voiceOverMode])
    // Native Ad Insertion
    const [adEnabled, setAdEnabled] = useState(false)
    const [adProductInfo, setAdProductInfo] = useState('')
    const [productImageUrl, setProductImageUrl] = useState('')
    const [productLink, setProductLink] = useState('')
    const [isAnalyzingAdProduct, setIsAnalyzingAdProduct] = useState(false)
    const [analyzedProduct, setAnalyzedProduct] = useState<{
        name: string
        description: string
        features: string[]
        targetAudience: string
    } | null>(null)
    const [selectedAdStyles, setSelectedAdStyles] = useState<string[]>([])
    const [adSceneCount, setAdSceneCount] = useState(2)

    const AD_STYLES = [
        { id: 'testimonial', label: '🎭 Testimonial', desc: 'Host dùng & recommend' },
        { id: 'story', label: '📖 Story', desc: 'Lồng ghép câu chuyện' },
        { id: 'educational', label: '🔍 Educational', desc: 'Dạy + mention' },
        { id: 'problem_solution', label: '🤔 Problem-Solution', desc: 'Vấn đề → Giải pháp' },
        { id: 'feature', label: '⭐ Feature', desc: 'Highlight tính năng' },
        { id: 'soft_cta', label: '🎁 Soft CTA', desc: 'CTA nhẹ nhàng' },
        { id: 'broll', label: '🎬 B-Roll', desc: 'Visual showcase' },
        { id: 'casual', label: '💬 Casual', desc: 'Mention tự nhiên' },
    ]

    // Bulk Create Episodes
    const [showBulkCreate, setShowBulkCreate] = useState(false)
    const [bulkEpisodes, setBulkEpisodes] = useState<{ description: string; categoryId: string }[]>([])
    const [bulkCategoryId, setBulkCategoryId] = useState('')
    const [bulkNewDescription, setBulkNewDescription] = useState('')
    const [bulkGenerating, setBulkGenerating] = useState(false)
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 })
    // Auto mode states
    const [bulkMode, setBulkMode] = useState<'manual' | 'auto'>('manual')
    const [autoMainTopic, setAutoMainTopic] = useState('')
    const [autoEpisodeCount, setAutoEpisodeCount] = useState(5)
    const [autoGeneratingIdeas, setAutoGeneratingIdeas] = useState(false)
    const [autoCategoryName, setAutoCategoryName] = useState('')


    // Category management
    const [categories, setCategories] = useState<EpisodeCategory[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)  // For episode creation
    const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null)  // For filtering episodes
    const [showCategoryModal, setShowCategoryModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState<EpisodeCategory | null>(null)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryColor, setNewCategoryColor] = useState('#6366f1')

    // Bulk selection for episodes
    const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<string[]>([])
    const [showBulkMoveModal, setShowBulkMoveModal] = useState(false)

    // Scene Editor states
    const [editingSceneData, setEditingSceneData] = useState<{
        episodeId: string
        scene: EpisodeScene
    } | null>(null)
    const [sceneEditorTitle, setSceneEditorTitle] = useState('')
    const [sceneEditorPromptText, setSceneEditorPromptText] = useState('')
    const [sceneEditorDuration, setSceneEditorDuration] = useState(8)
    const [savingScene, setSavingScene] = useState(false)
    const [deletingSceneId, setDeletingSceneId] = useState<string | null>(null)

    // Add New Scene states
    const [addingSceneToEpisode, setAddingSceneToEpisode] = useState<string | null>(null)
    const [newSceneContext, setNewSceneContext] = useState('')
    const [newScenePosition, setNewScenePosition] = useState(0)
    const [addingSceneWithAI, setAddingSceneWithAI] = useState(false)

    // Quality warnings type
    type QualityWarning = {
        type: 'duplicate' | 'prompt_long' | 'filler'
        sceneIds: string[]
        message: string
    }

    // Drag-drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Quality check function
    const analyzeSceneQuality = (scenes: EpisodeScene[]): QualityWarning[] => {
        const warnings: QualityWarning[] = []

        // 1. Duplicate content detection (simplified - check for same voiceover)
        for (let i = 0; i < scenes.length; i++) {
            for (let j = i + 1; j < scenes.length; j++) {
                const text1 = scenes[i].promptText.toLowerCase()
                const text2 = scenes[j].promptText.toLowerCase()
                // Check if VOICEOVER content is duplicated
                const vo1 = text1.match(/\[voiceover[^\]]*:\s*([^\]]+)\]/i)?.[1] || ''
                const vo2 = text2.match(/\[voiceover[^\]]*:\s*([^\]]+)\]/i)?.[1] || ''
                if (vo1 && vo2 && vo1.length > 20 && vo1 === vo2) {
                    warnings.push({
                        type: 'duplicate',
                        sceneIds: [scenes[i].id, scenes[j].id],
                        message: `Scene ${scenes[i].order} và ${scenes[j].order} có nội dung trùng lặp`
                    })
                }
            }
        }

        // 2. PromptText too long (>2000 chars suggests redundancy)
        for (const scene of scenes) {
            if ((scene.promptText?.length || 0) > 2000) {
                warnings.push({
                    type: 'prompt_long',
                    sceneIds: [scene.id],
                    message: `Scene ${scene.order}: PromptText quá dài (${scene.promptText.length} ký tự, nên <2000)`
                })
            }
        }

        // 3. Sparse/filler content detection
        const fillerPhrases = ['như đã nói', 'như vậy đó', 'tóm lại là', 'nói chung là']
        for (const scene of scenes) {
            if (fillerPhrases.some(p => scene.promptText?.toLowerCase().includes(p))) {
                warnings.push({
                    type: 'filler',
                    sceneIds: [scene.id],
                    message: `Scene ${scene.order}: Có thể là scene thừa/lấp chỗ`
                })
            }
        }

        return warnings
    }

    // Episode Analytics function
    type EpisodeAnalytics = {
        totalScenes: number
        estimatedDuration: number
        avgSceneDuration: number
        structureBreakdown: {
            intro: { count: number; percent: number }
            content: { count: number; percent: number }
            cta: { count: number; percent: number }
        }
        longestScene: EpisodeScene | null
        shortestScene: EpisodeScene | null
    }

    const analyzeEpisode = (scenes: EpisodeScene[]): EpisodeAnalytics => {
        if (scenes.length === 0) {
            return {
                totalScenes: 0,
                estimatedDuration: 0,
                avgSceneDuration: 0,
                structureBreakdown: {
                    intro: { count: 0, percent: 0 },
                    content: { count: 0, percent: 0 },
                    cta: { count: 0, percent: 0 }
                },
                longestScene: null,
                shortestScene: null
            }
        }

        const totalScenes = scenes.length
        const estimatedDuration = scenes.reduce((sum, s) => sum + (s.duration || 8), 0)
        const avgSceneDuration = estimatedDuration / totalScenes

        // Structure breakdown: Intro (first 1-2), Content (middle), CTA (last 1-2)
        const introCount = Math.min(2, Math.ceil(totalScenes * 0.15))
        const ctaCount = Math.min(2, Math.ceil(totalScenes * 0.15))
        const contentCount = totalScenes - introCount - ctaCount

        const sortedByDuration = [...scenes].sort((a, b) => (b.duration || 8) - (a.duration || 8))

        return {
            totalScenes,
            estimatedDuration,
            avgSceneDuration: Math.round(avgSceneDuration * 10) / 10,
            structureBreakdown: {
                intro: { count: introCount, percent: Math.round((introCount / totalScenes) * 100) },
                content: { count: contentCount, percent: Math.round((contentCount / totalScenes) * 100) },
                cta: { count: ctaCount, percent: Math.round((ctaCount / totalScenes) * 100) }
            },
            longestScene: sortedByDuration[0] || null,
            shortestScene: sortedByDuration[sortedByDuration.length - 1] || null
        }
    }

    // Character Consistency Checker
    type CharacterWarning = {
        sceneId: string
        sceneOrder: number
        type: 'missing_host' | 'outfit_change' | 'appearance_mismatch'
        message: string
    }

    const checkCharacterConsistency = (scenes: EpisodeScene[], characters: ChannelCharacter[]): CharacterWarning[] => {
        const warnings: CharacterWarning[] = []

        // Find main host character
        const hostChar = characters.find(c => c.role === 'host' && c.isMain)
        if (!hostChar) return warnings

        const hostNameLower = hostChar.name.toLowerCase()
        const hostClothing = hostChar.clothing?.toLowerCase() || ''
        const hostAppearance = hostChar.appearance?.toLowerCase() || ''

        for (const scene of scenes) {
            const promptLower = scene.promptText?.toLowerCase() || ''

            // Check if scene should have host but doesn't mention them
            const mentionsHost = promptLower.includes(hostNameLower) ||
                promptLower.includes('host') ||
                promptLower.includes('người dẫn')

            if (!mentionsHost && scene.order > 1 && scene.order < scenes.length) {
                // Middle scenes should typically have host
                // Skip this check - not all scenes need host
            }

            if (mentionsHost) {
                // Check clothing consistency
                if (hostClothing && hostClothing.length > 3) {
                    const clothingKeywords = hostClothing.split(/[,\s]+/).filter(k => k.length > 3)
                    const hasClothingMention = clothingKeywords.some(k => promptLower.includes(k))

                    if (!hasClothingMention && promptLower.includes('wearing')) {
                        warnings.push({
                            sceneId: scene.id,
                            sceneOrder: scene.order,
                            type: 'outfit_change',
                            message: `Scene ${scene.order}: Host outfit có thể khác với mô tả chuẩn`
                        })
                    }
                }

                // Check appearance consistency
                if (hostAppearance && hostAppearance.length > 3) {
                    const appearanceKeywords = hostAppearance.split(/[,\s]+/).filter(k => k.length > 3)
                    const hasAppearanceMention = appearanceKeywords.some(k => promptLower.includes(k))

                    if (!hasAppearanceMention) {
                        // Soft warning - appearance should be consistent
                        // Only warn if prompt has different appearance description
                        const hasOtherAppearance = promptLower.includes('hair') ||
                            promptLower.includes('face') ||
                            promptLower.includes('tóc') ||
                            promptLower.includes('mặt')

                        if (hasOtherAppearance) {
                            warnings.push({
                                sceneId: scene.id,
                                sceneOrder: scene.order,
                                type: 'appearance_mismatch',
                                message: `Scene ${scene.order}: Ngoại hình Host có thể không khớp với profile`
                            })
                        }
                    }
                }
            }
        }

        return warnings
    }

    // Custom content input
    const [customContent, setCustomContent] = useState('')
    const [contentUrl, setContentUrl] = useState('')
    const [isLoadingUrl, setIsLoadingUrl] = useState(false)

    const CTA_OPTIONS = [
        { id: 'subscribe', label: '🔔 Subscribe', text: 'Đăng ký kênh' },
        { id: 'like', label: '👍 Like', text: 'Thích video' },
        { id: 'comment', label: '💬 Comment', text: 'Bình luận' },
        { id: 'share', label: '📤 Share', text: 'Chia sẻ' },
        { id: 'bell', label: '🔔 Bell', text: 'Bật chuông thông báo' },
        { id: 'watch_more', label: '▶️ Xem thêm', text: 'Xem video khác' },
    ]

    const truncateText = (text: string, maxLength: number = 100) => {
        if (text.length <= maxLength) return text
        return text.substring(0, maxLength).trim() + '...'
    }

    useEffect(() => {
        fetchChannel()
    }, [id])

    const fetchChannel = async () => {
        try {
            const res = await fetch(`/api/channels/${id}`)
            const data = await res.json()
            if (data.channel) {
                setChannel(data.channel)
                // Fetch categories after channel loads
                fetchCategories()
            } else {
                toast.error('Không tìm thấy kênh')
                router.push('/dashboard/channels')
            }
        } catch (error) {
            toast.error('Lỗi tải kênh')
        } finally {
            setIsLoading(false)
        }
    }

    // Category management functions
    const fetchCategories = async () => {
        try {
            const res = await fetch(`/api/channels/${id}/categories`)
            const data = await res.json()
            if (data.categories) {
                setCategories(data.categories)
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Vui lòng nhập tên danh mục')
            return
        }

        try {
            const res = await fetch(`/api/channels/${id}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCategoryName.trim(),
                    color: newCategoryColor
                })
            })

            if (res.ok) {
                toast.success('Đã tạo danh mục')
                setNewCategoryName('')
                setNewCategoryColor('#6366f1')
                setShowCategoryModal(false)
                fetchCategories()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Không thể tạo danh mục')
            }
        } catch (error) {
            toast.error('Lỗi tạo danh mục')
        }
    }

    const handleDeleteCategory = async (categoryId: string) => {
        if (!confirm('Xóa danh mục này? Các episode sẽ được chuyển về "Chưa phân loại"')) return

        try {
            const res = await fetch(`/api/channels/${id}/categories?categoryId=${categoryId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success('Đã xóa danh mục')
                fetchCategories()
                fetchChannel()
            } else {
                toast.error('Không thể xóa danh mục')
            }
        } catch (error) {
            toast.error('Lỗi xóa danh mục')
        }
    }

    // Bulk episode actions
    const handleBulkMove = async (toCategoryId: string | null) => {
        if (selectedEpisodeIds.length === 0) return

        try {
            // Update each selected episode's category
            const promises = selectedEpisodeIds.map(episodeId =>
                fetch(`/api/channels/${id}/episodes/${episodeId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ categoryId: toCategoryId })
                })
            )

            await Promise.all(promises)
            toast.success(`Đã di chuyển ${selectedEpisodeIds.length} episode`)
            setSelectedEpisodeIds([])
            setShowBulkMoveModal(false)
            fetchChannel()
        } catch (error) {
            toast.error('Lỗi di chuyển episodes')
        }
    }

    const handleBulkDelete = async () => {
        if (selectedEpisodeIds.length === 0) return
        if (!confirm(`Xóa ${selectedEpisodeIds.length} episode đã chọn? Không thể hoàn tác!`)) return

        try {
            const promises = selectedEpisodeIds.map(episodeId =>
                fetch(`/api/channels/${id}/episodes/${episodeId}`, {
                    method: 'DELETE'
                })
            )

            await Promise.all(promises)
            toast.success(`Đã xóa ${selectedEpisodeIds.length} episode`)
            setSelectedEpisodeIds([])
            fetchChannel()
        } catch (error) {
            toast.error('Lỗi xóa episodes')
        }
    }

    const toggleEpisodeSelection = (episodeId: string) => {
        setSelectedEpisodeIds(prev =>
            prev.includes(episodeId)
                ? prev.filter(id => id !== episodeId)
                : [...prev, episodeId]
        )
    }

    const selectAllEpisodes = () => {
        const visibleEpisodes = filterCategoryId === null
            ? channel?.episodes || []
            : filterCategoryId === 'uncategorized'
                ? (channel?.episodes || []).filter(e => !e.categoryId)
                : (channel?.episodes || []).filter(e => e.categoryId === filterCategoryId)

        setSelectedEpisodeIds(visibleEpisodes.map(e => e.id))
    }

    // Parse URL to extract content
    const handleParseUrl = async () => {
        if (!contentUrl.trim()) {
            toast.error('Vui lòng nhập URL')
            return
        }

        setIsLoadingUrl(true)
        try {
            const res = await fetch('/api/story/parse-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: contentUrl })
            })

            const data = await res.json()
            if (data.extracted?.summary) {
                setCustomContent(data.extracted.summary)
                toast.success('Đã lấy nội dung từ URL!')
                setContentUrl('')
            } else if (data.error) {
                toast.error(data.error)
            } else {
                toast.error('Không thể lấy nội dung từ URL')
            }
        } catch {
            toast.error('Lỗi kết nối')
        } finally {
            setIsLoadingUrl(false)
        }
    }

    // Analyze product for Native Ad
    const handleAnalyzeProduct = async () => {
        if (!productImageUrl && !adProductInfo) {
            toast.error('Vui lòng nhập thông tin sản phẩm hoặc URL hình ảnh')
            return
        }
        setIsAnalyzingAdProduct(true)
        try {
            const res = await fetch('/api/channels/analyze-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: productImageUrl,
                    productInfo: adProductInfo,
                    productLink
                })
            })
            const data = await res.json()
            if (data.product) {
                setAnalyzedProduct(data.product)
                toast.success('Đã phân tích sản phẩm thành công!')
            } else {
                toast.error(data.error || 'Không thể phân tích sản phẩm')
            }
        } catch {
            toast.error('Lỗi phân tích sản phẩm')
        } finally {
            setIsAnalyzingAdProduct(false)
        }
    }

    // Build content string for fashion showcase
    const buildFashionContent = () => {
        const parts = []

        // MODE indicator
        if (useOwnImages) {
            parts.push('⚠️ CHẾ ĐỘ: NGƯỜI DÙNG TỰ CÓ ẢNH/VIDEO')
            parts.push('→ KHÔNG mô tả nhân vật/ngoại hình trong promptText')
            parts.push('→ KHÔNG mô tả background/môi trường trong promptText')
            parts.push('→ CHỈ tập trung vào: hành động, lời thoại, thông tin sản phẩm')
            parts.push('')
        }

        // Product info
        if (productInfo.name) parts.push(`🏷️ Tên sản phẩm: ${productInfo.name}`)
        if (productInfo.price) parts.push(`💰 Giá gốc: ${productInfo.price}`)
        if (productInfo.salePrice) parts.push(`🔥 Giá sale: ${productInfo.salePrice}`)
        if (productInfo.promotion) parts.push(`🎁 Khuyến mãi: ${productInfo.promotion}`)

        // Background info - ONLY when NOT using own images
        if (!useOwnImages) {
            const selectedBg = FASHION_BACKGROUNDS.find(bg => bg.id === fashionBackground)
            if (selectedBg) {
                parts.push('')
                parts.push('🏠 BACKGROUND CỐ ĐỊNH (BẮT BUỘC DÙNG TRONG MỌI SCENE):')
                parts.push(`- Loại: ${selectedBg.name}`)
                if (fashionBackground === 'custom' && customBackground) {
                    parts.push(`- Mô tả: ${customBackground}`)
                    parts.push(`- Keywords: ${customBackground}`)
                } else {
                    parts.push(`- Keywords: ${selectedBg.keywords}`)
                }
                parts.push('⚠️ QUAN TRỌNG: Tất cả scene PHẢI có cùng background này!')
            }
        }

        // AI Analysis - Product details
        if (productAnalysis) {
            parts.push('')
            parts.push('🤖 AI PHÂN TÍCH SẢN PHẨM:')

            // Exact description
            if (productAnalysis.exactDescription) {
                parts.push(`👗 Mô tả: ${productAnalysis.exactDescription}`)
            }

            if (productAnalysis.productType) parts.push(`- Loại: ${productAnalysis.productType} ${productAnalysis.productSubtype ? `(${productAnalysis.productSubtype})` : ''}`)
            if (productAnalysis.color) parts.push(`- Màu: ${productAnalysis.color}`)
            if (productAnalysis.material) parts.push(`- Chất liệu: ${productAnalysis.material}`)
            if (productAnalysis.pattern) parts.push(`- Họa tiết: ${productAnalysis.pattern}`)
            if (productAnalysis.fit) parts.push(`- Form dáng: ${productAnalysis.fit}`)
            if (productAnalysis.style) parts.push(`- Style: ${productAnalysis.style}`)

            if (productAnalysis.stylingTips?.length) {
                parts.push('')
                parts.push('💡 Gợi ý phối đồ:')
                productAnalysis.stylingTips.forEach((tip: string, i: number) => {
                    parts.push(`${i + 1}. ${tip}`)
                })
            }
        }

        // Visual style - ONLY when AI generates images
        if (!useOwnImages) {
            parts.push('')
            parts.push('📸 VISUAL STYLE: iPhone camera quality, vertical 9:16, TikTok/Reels style')
        }

        return parts.length > 0 ? parts.join('\n') : null
    }

    const handleGenerateEpisode = async () => {
        setIsGenerating(true)
        try {
            const res = await fetch(`/api/channels/${id}/episodes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    totalScenes: sceneCount,
                    useCharacters,
                    selectedCharacterIds: useCharacters ? selectedCharacterIds : [],
                    adaptCharactersToScript,
                    selectedStyleId: selectedStyleId || null,
                    mentionChannel,
                    ctaMode,
                    selectedCTAs: ctaMode === 'select' ? selectedCTAs : [],
                    customContent: voiceOverMode === 'fashion_showcase'
                        ? buildFashionContent()
                        : (customContent.trim() || null),
                    voiceOverMode,
                    // Fashion showcase specific
                    fashionProduct: voiceOverMode === 'fashion_showcase' ? {
                        ...productInfo,
                        imageBase64: productImageBase64,
                        analysis: productAnalysis
                    } : null,
                    cinematicStyle: voiceOverMode === 'cinematic_film' ? cinematicStyle : null,
                    voiceGender: voiceOverMode === 'voice_over' ? voiceGender : 'auto',
                    voiceTone: voiceOverMode === 'voice_over' ? voiceTone : 'warm',
                    categoryId: selectedCategoryId,
                    // Advanced Episode Features
                    visualHookEnabled,
                    emotionalCurveEnabled,
                    spatialAudioEnabled,
                    musicMode,
                    dialogueDensityMin,
                    dialogueDensityMax,
                    // Native Ad Insertion
                    adEnabled,
                    productInfo: adEnabled ? adProductInfo : null,
                    productImageUrl: adEnabled ? productImageUrl : null,
                    productLink: adEnabled ? productLink : null,
                    analyzedProduct: adEnabled ? analyzedProduct : null,
                    selectedAdStyles: adEnabled ? selectedAdStyles : [],
                    adSceneCount: adEnabled ? adSceneCount : 2,
                    // Storyteller B-Roll option
                    storytellerBrollEnabled: voiceOverMode === 'host_storyteller' ? storytellerBrollEnabled : false,
                    // Narrative Storytelling options
                    narrativeTemplateId: voiceOverMode === 'narrative_storytelling' ? narrativeTemplateId : null,
                    narrativeKeyPoints: voiceOverMode === 'narrative_storytelling' && narrativeKeyPoints.trim()
                        ? narrativeKeyPoints.split(',').map(s => s.trim()).filter(Boolean)
                        : null,
                    narrativeWithHost: voiceOverMode === 'narrative_storytelling' ? narrativeWithHost : false,
                    narrativeHostId: voiceOverMode === 'narrative_storytelling' && narrativeWithHost && narrativeHostId ? narrativeHostId : null,
                    // KOL Solo Storyteller options
                    kolRoomDescription: voiceOverMode === 'kol_solo_storyteller' ? kolRoomDescription : null,
                    kolHostMode: voiceOverMode === 'kol_solo_storyteller' ? kolHostMode : null,
                    kolCustomHost: voiceOverMode === 'kol_solo_storyteller' && kolHostMode === 'custom' ? kolCustomHost : null,
                    kolSelectedCharacterIds: voiceOverMode === 'kol_solo_storyteller' && kolHostMode === 'channel_character' ? kolSelectedCharacterIds : [],
                    kolChannelName: voiceOverMode === 'kol_solo_storyteller' && kolShowChannelName
                        ? (kolChannelNameMode === 'custom' && kolCustomChannelText ? kolCustomChannelText : channel?.name)
                        : null,
                    kolHostInteractions: voiceOverMode === 'kol_solo_storyteller' ? kolHostInteractions : [],
                    kolContentStyle: voiceOverMode === 'kol_solo_storyteller' ? kolContentStyle : null
                })
            })

            const data = await res.json()
            if (data.episode) {
                toast.success(`Đã tạo Episode ${data.episode.episodeNumber}!`)
                fetchChannel()
                setExpandedEpisode(data.episode.id)
                setCustomContent('') // Clear after success
            } else {
                toast.error(data.error || 'Không thể tạo episode')
            }
        } catch (error) {
            toast.error('Lỗi tạo episode')
        } finally {
            setIsGenerating(false)
        }
    }

    // Bulk Generate Episodes
    const handleBulkGenerate = async () => {
        if (bulkEpisodes.length === 0) {
            toast.error('Vui lòng thêm ít nhất 1 episode')
            return
        }

        setBulkGenerating(true)
        setBulkProgress({ current: 0, total: bulkEpisodes.length })

        for (let i = 0; i < bulkEpisodes.length; i++) {
            const ep = bulkEpisodes[i]
            setBulkProgress({ current: i + 1, total: bulkEpisodes.length })

            try {
                const res = await fetch(`/api/channels/${id}/episodes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        totalScenes: sceneCount,
                        categoryId: ep.categoryId || null,
                        customContent: ep.description,
                        selectedStyleId,
                        useCharacters,
                        selectedCharacterIds,
                        adaptCharactersToScript,
                        voiceOverMode,
                        cinematicStyle: voiceOverMode === 'cinematic_film' ? cinematicStyle : null,
                        voiceGender,
                        voiceTone,
                        visualHookEnabled,
                        emotionalCurveEnabled,
                        spatialAudioEnabled,
                        musicMode,
                        dialogueDensityMin,
                        dialogueDensityMax,
                        storytellerBrollEnabled: voiceOverMode === 'host_storyteller' ? storytellerBrollEnabled : false
                    })
                })

                const data = await res.json()
                if (data.episode) {
                    toast.success(`✅ Episode ${i + 1}/${bulkEpisodes.length}: ${data.episode.title}`)
                } else {
                    toast.error(`❌ Episode ${i + 1}: ${data.error || 'Lỗi'}`)
                }
            } catch (error) {
                toast.error(`❌ Episode ${i + 1}: Lỗi kết nối`)
            }

            // Small delay between episodes
            if (i < bulkEpisodes.length - 1) {
                await new Promise(r => setTimeout(r, 1000))
            }
        }

        setBulkGenerating(false)
        setShowBulkCreate(false)
        setBulkEpisodes([])
        fetchChannel()
        toast.success(`🎉 Đã tạo xong ${bulkEpisodes.length} episodes!`)
    }

    // Auto Generate Episode Ideas from Topic
    const handleAutoGenerateIdeas = async () => {
        if (!autoMainTopic.trim()) {
            toast.error('Vui lòng nhập chủ đề chính')
            return
        }

        setAutoGeneratingIdeas(true)
        try {
            const res = await fetch(`/api/channels/${id}/generate-bulk-ideas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mainTopic: autoMainTopic,
                    episodeCount: autoEpisodeCount,
                    channelNiche: channel?.niche
                })
            })

            const data = await res.json()
            if (data.ideas && data.ideas.length > 0) {
                // Set category name
                setAutoCategoryName(data.categoryName || autoMainTopic)

                // Set episodes
                setBulkEpisodes(data.ideas.map((idea: string) => ({
                    description: idea,
                    categoryId: '' // Will be set when generating
                })))

                toast.success(`✅ Đã tạo ${data.ideas.length} ý tưởng episodes!`)
            } else {
                toast.error(data.error || 'Không thể tạo ý tưởng')
            }
        } catch (error) {
            toast.error('Lỗi khi tạo ý tưởng')
        } finally {
            setAutoGeneratingIdeas(false)
        }
    }

    // Modified bulk generate to create category first (for auto mode)
    const handleBulkGenerateWithCategory = async () => {
        if (bulkEpisodes.length === 0) {
            toast.error('Vui lòng thêm ít nhất 1 episode')
            return
        }

        setBulkGenerating(true)
        setBulkProgress({ current: 0, total: bulkEpisodes.length })

        let categoryId = bulkCategoryId

        // Auto create category if in auto mode and have category name
        if (bulkMode === 'auto' && autoCategoryName.trim() && !categoryId) {
            try {
                const catRes = await fetch(`/api/channels/${id}/categories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: autoCategoryName.trim() })
                })
                const catData = await catRes.json()
                if (catData.category) {
                    categoryId = catData.category.id
                    toast.success(`📁 Đã tạo danh mục: ${autoCategoryName}`)
                }
            } catch (e) {
                console.error('Failed to create category')
            }
        }

        for (let i = 0; i < bulkEpisodes.length; i++) {
            const ep = bulkEpisodes[i]
            setBulkProgress({ current: i + 1, total: bulkEpisodes.length })

            try {
                const res = await fetch(`/api/channels/${id}/episodes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        totalScenes: sceneCount,
                        categoryId: categoryId || ep.categoryId || null,
                        customContent: ep.description,
                        selectedStyleId,
                        useCharacters,
                        selectedCharacterIds,
                        adaptCharactersToScript,
                        voiceOverMode,
                        cinematicStyle: voiceOverMode === 'cinematic_film' ? cinematicStyle : null,
                        voiceGender,
                        voiceTone,
                        visualHookEnabled,
                        emotionalCurveEnabled,
                        spatialAudioEnabled,
                        musicMode,
                        dialogueDensityMin,
                        dialogueDensityMax,
                        storytellerBrollEnabled: voiceOverMode === 'host_storyteller' ? storytellerBrollEnabled : false
                    })
                })

                const data = await res.json()
                if (data.episode) {
                    toast.success(`✅ Episode ${i + 1}/${bulkEpisodes.length}: ${data.episode.title}`)
                } else {
                    toast.error(`❌ Episode ${i + 1}: ${data.error || 'Lỗi'}`)
                }
            } catch (error) {
                toast.error(`❌ Episode ${i + 1}: Lỗi kết nối`)
            }

            if (i < bulkEpisodes.length - 1) {
                await new Promise(r => setTimeout(r, 1000))
            }
        }

        setBulkGenerating(false)
        setShowBulkCreate(false)
        setBulkEpisodes([])
        setAutoMainTopic('')
        setAutoCategoryName('')
        fetchChannel()
        fetchCategories()
        toast.success(`🎉 Đã tạo xong ${bulkEpisodes.length} episodes!`)
    }


    const handleCopyEpisode = async (episode: Episode) => {
        const text = episode.scenes.map(s =>
            `Scene ${s.order}: ${s.promptText}`
        ).join('\n\n')

        await navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success('Đã copy tất cả scenes')
        setTimeout(() => setCopied(false), 2000)
    }

    const handleUpdateLanguage = async (lang: string) => {
        try {
            await fetch(`/api/channels/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dialogueLanguage: lang })
            })
            // Update local state
            if (channel) {
                setChannel({ ...channel, dialogueLanguage: lang })
            }
            toast.success(lang === 'vi' ? 'Đã chuyển sang Tiếng Việt' : 'Switched to English')
        } catch {
            toast.error('Lỗi cập nhật ngôn ngữ')
        }
    }

    const handleToggleCharacters = async (hasCharacters: boolean) => {
        try {
            await fetch(`/api/channels/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hasCharacters })
            })
            if (channel) {
                setChannel({ ...channel, hasCharacters })
            }
            toast.success(hasCharacters ? 'Đã bật nhân vật' : 'Đã tắt nhân vật')
        } catch {
            toast.error('Lỗi cập nhật')
        }
    }

    const handleDeleteCharacter = async (characterId: string) => {
        if (!confirm('Xóa nhân vật này?')) return
        try {
            await fetch(`/api/channels/${id}/characters/${characterId}`, {
                method: 'DELETE'
            })
            toast.success('Đã xóa nhân vật')
            fetchChannel()
        } catch {
            toast.error('Lỗi xóa nhân vật')
        }
    }

    // Handle product image upload for fashion showcase
    const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Convert to base64
        const reader = new FileReader()
        reader.onload = async (event) => {
            const base64 = event.target?.result as string
            setProductImage(base64)
            setProductImageBase64(base64)

            // Auto-analyze the product
            setIsAnalyzingProduct(true)
            try {
                const res = await fetch('/api/products/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageBase64: base64,
                        mimeType: file.type
                    })
                })

                if (res.ok) {
                    const data = await res.json()
                    setProductAnalysis(data.analysis)
                    toast.success('Đã phân tích sản phẩm!')
                } else {
                    const err = await res.json()
                    toast.error(err.error || 'Lỗi phân tích')
                }
            } catch (error) {
                console.error('Analyze error:', error)
                toast.error('Lỗi phân tích sản phẩm')
            } finally {
                setIsAnalyzingProduct(false)
            }
        }
        reader.readAsDataURL(file)
    }

    // Generate image for a scene using Imagen 3
    const handleGenerateSceneImage = async (sceneId: string, promptText: string) => {
        setGeneratingImageForScene(sceneId)
        try {
            // Build enhanced prompt with EXACT product description FIRST
            let enhancedPrompt = ''

            // PUT PRODUCT DESCRIPTION FIRST (highest priority for AI)
            if (productAnalysis?.exactDescription) {
                enhancedPrompt = `THE MODEL IS WEARING: ${productAnalysis.exactDescription}. `
            }
            if (productAnalysis?.promptKeywords) {
                enhancedPrompt += `EXACT CLOTHING DETAILS: ${productAnalysis.promptKeywords}. `
            }

            // Then add the scene prompt
            enhancedPrompt += promptText

            // Add background info
            const selectedBg = FASHION_BACKGROUNDS.find(bg => bg.id === fashionBackground)
            if (fashionBackground === 'uploaded' && backgroundImageBase64) {
                enhancedPrompt += '. Background: custom uploaded background.'
            } else if (fashionBackground === 'custom' && customBackground) {
                enhancedPrompt += `. Background: ${customBackground}.`
            } else if (selectedBg) {
                enhancedPrompt += `. Background: ${selectedBg.keywords}.`
            }

            // CRITICAL: No text or graphics on image
            enhancedPrompt += ' IMPORTANT: NO TEXT, NO WATERMARKS, NO GRAPHICS, NO LOGOS, NO CAPTIONS on the image. Pure visual only, clean image.'

            // CRITICAL: Fixed camera angle like livestream
            enhancedPrompt += ' FIXED CAMERA ANGLE: Static tripod shot, full body frame, model centered. NO zoom, NO camera movement, NO angle change. Same framing as a livestream.'

            // Add photography style for realism
            enhancedPrompt += ' iPhone camera quality on tripod, ring light, 9:16 vertical format.'

            const res = await fetch('/api/imagen/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: enhancedPrompt,
                    referenceImageBase64: productImageBase64,
                    aspectRatio: '9:16', // Vertical for TikTok/Reels
                    sceneId: sceneId
                })
            })

            if (res.ok) {
                const data = await res.json()
                toast.success('Đã tạo ảnh thành công!')
                // Refresh to get updated scene with image
                fetchChannel()
                return data.imageUrl
            } else {
                const err = await res.json()
                toast.error(err.error || 'Lỗi tạo ảnh')
            }
        } catch (error) {
            console.error('Generate image error:', error)
            toast.error('Lỗi tạo ảnh')
        } finally {
            setGeneratingImageForScene(null)
        }
    }

    const handleSaveCharacter = async () => {
        try {
            if (editingCharacter) {
                // Update existing
                await fetch(`/api/channels/${id}/characters/${editingCharacter.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newCharacter)
                })
                toast.success('Đã cập nhật nhân vật')
            } else {
                // Create new
                await fetch(`/api/channels/${id}/characters`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newCharacter)
                })
                toast.success('Đã thêm nhân vật')
            }
            setShowAddCharacter(false)
            setEditingCharacter(null)
            setNewCharacter({ name: '', role: 'host', fullDescription: '', personality: '', isMain: false, gender: 'female', ageRange: '25-35', faceDetails: '', hairDetails: '', clothing: '', skinTone: '', styleKeywords: '' })
            fetchChannel()
        } catch {
            toast.error('Lỗi lưu nhân vật')
        }
    }

    // Generate detailed character description using AI
    const handleGenerateCharacterDetails = async () => {
        if (!newCharacter.name) {
            toast.error('Vui lòng nhập tên nhân vật trước')
            return
        }

        setIsGeneratingCharacter(true)
        try {
            const res = await fetch(`/api/channels/${id}/characters/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCharacter.name,
                    role: newCharacter.role,
                    personality: newCharacter.personality,
                    gender: newCharacter.gender || 'female',
                    ageRange: newCharacter.ageRange || '25-35',
                    style: channel?.visualStyleId || 'pixar-3d'
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Lỗi tạo mô tả')
            }

            const data = await res.json()
            setNewCharacter(prev => ({
                ...prev,
                fullDescription: data.character.fullDescription || '',
                faceDetails: data.character.faceDetails || '',
                hairDetails: data.character.hairDetails || '',
                clothing: data.character.clothing || '',
                skinTone: data.character.skinTone || '',
                styleKeywords: data.character.styleKeywords || ''
            }))
            toast.success('Đã tạo mô tả chi tiết!')
        } catch (error) {
            console.error('Generate character error:', error)
            toast.error(error instanceof Error ? error.message : 'Lỗi tạo mô tả nhân vật')
        } finally {
            setIsGeneratingCharacter(false)
        }
    }

    // When editing, populate form
    const handleEditCharacter = (char: ChannelCharacter) => {
        setEditingCharacter(char)
        setNewCharacter({
            name: char.name,
            role: char.role,
            fullDescription: char.fullDescription,
            personality: char.personality || '',
            isMain: char.isMain,
            gender: char.gender || 'female',
            ageRange: char.ageRange || '25-35',
            faceDetails: char.faceDetails || '',
            hairDetails: char.hairDetails || '',
            clothing: char.clothing || '',
            skinTone: char.skinTone || '',
            styleKeywords: char.styleKeywords || ''
        })
        setShowAddCharacter(true)
    }
    const handleTranslateEpisode = async (episodeId: string, targetLang: string) => {
        setActionLoading(episodeId)
        try {
            const res = await fetch(`/api/channels/${id}/episodes/${episodeId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'translate', targetLanguage: targetLang })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                fetchChannel()
            } else {
                toast.error(data.error || 'Lỗi dịch')
            }
        } catch {
            toast.error('Lỗi dịch episode')
        } finally {
            setActionLoading(null)
        }
    }

    const handleRegenerateEpisode = async (episodeId: string) => {
        if (!confirm('Tạo lại sẽ thay thế toàn bộ nội dung. Tiếp tục?')) return
        setActionLoading(episodeId)
        try {
            const res = await fetch(`/api/channels/${id}/episodes/${episodeId}/regenerate`, {
                method: 'POST'
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Đã tạo lại episode!')
                fetchChannel()
            } else {
                toast.error(data.error || 'Lỗi tạo lại')
            }
        } catch {
            toast.error('Lỗi tạo lại episode')
        } finally {
            setActionLoading(null)
        }
    }

    // Scene Editor handlers
    const handleOpenSceneEditor = (episodeId: string, scene: EpisodeScene) => {
        setEditingSceneData({ episodeId, scene })
        setSceneEditorTitle(scene.title || '')
        setSceneEditorPromptText(scene.promptText)
        setSceneEditorDuration(scene.duration)
    }

    const handleSaveScene = async () => {
        if (!editingSceneData) return
        setSavingScene(true)
        try {
            const res = await fetch(`/api/channels/${id}/episodes/${editingSceneData.episodeId}/scenes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sceneId: editingSceneData.scene.id,
                    title: sceneEditorTitle,
                    promptText: sceneEditorPromptText,
                    duration: sceneEditorDuration
                })
            })
            if (res.ok) {
                toast.success('Đã lưu scene!')
                setEditingSceneData(null)
                fetchChannel()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Lỗi lưu scene')
            }
        } catch {
            toast.error('Lỗi lưu scene')
        } finally {
            setSavingScene(false)
        }
    }

    const handleDeleteScene = async (episodeId: string, sceneId: string) => {
        if (!confirm('Xóa scene này? Không thể hoàn tác.')) return
        setDeletingSceneId(sceneId)
        try {
            const res = await fetch(`/api/channels/${id}/episodes/${episodeId}/scenes?sceneId=${sceneId}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                toast.success('Đã xóa scene!')
                fetchChannel()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Lỗi xóa scene')
            }
        } catch {
            toast.error('Lỗi xóa scene')
        } finally {
            setDeletingSceneId(null)
        }
    }

    const handleAddSceneWithAI = async (episodeId: string) => {
        if (!newSceneContext.trim()) {
            toast.error('Nhập mô tả cho scene mới')
            return
        }
        setAddingSceneWithAI(true)
        try {
            const res = await fetch(`/api/channels/${id}/episodes/${episodeId}/scenes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    useAI: true,
                    context: newSceneContext,
                    insertAtOrder: newScenePosition || undefined
                })
            })
            if (res.ok) {
                toast.success('Đã tạo scene mới!')
                setAddingSceneToEpisode(null)
                setNewSceneContext('')
                setNewScenePosition(0)
                fetchChannel()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Lỗi tạo scene')
            }
        } catch {
            toast.error('Lỗi tạo scene')
        } finally {
            setAddingSceneWithAI(false)
        }
    }

    const handleDragEnd = async (event: DragEndEvent, episodeId: string, scenes: EpisodeScene[]) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = scenes.findIndex(s => s.id === active.id)
        const newIndex = scenes.findIndex(s => s.id === over.id)

        if (oldIndex === -1 || newIndex === -1) return

        const reorderedScenes = arrayMove(scenes, oldIndex, newIndex)

        // Update order values
        const updates = reorderedScenes.map((scene, index) => ({
            id: scene.id,
            order: index + 1
        }))

        try {
            const res = await fetch(`/api/channels/${id}/episodes/${episodeId}/scenes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reorder: true,
                    scenes: updates
                })
            })
            if (res.ok) {
                toast.success('Đã sắp xếp lại scenes!')
                fetchChannel()
            } else {
                toast.error('Lỗi sắp xếp scenes')
            }
        } catch {
            toast.error('Lỗi sắp xếp scenes')
        }
    }

    const handleDeleteEpisode = async (episodeId: string) => {
        if (!confirm('Xóa episode này? Không thể hoàn tác.')) return
        setActionLoading(episodeId)
        try {
            const res = await fetch(`/api/channels/${id}/episodes/${episodeId}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Đã xóa episode')
                setExpandedEpisode(null)
                fetchChannel()
            } else {
                toast.error(data.error || 'Lỗi xóa')
            }
        } catch {
            toast.error('Lỗi xóa episode')
        } finally {
            setActionLoading(null)
        }
    }

    // Sortable Scene Card Component
    const SortableSceneCard = ({
        scene,
        episodeId,
        warnings,
        onEdit,
        onDelete,
        onGenerateImage,
        isDeleting,
        isGeneratingImage,
        downloadImage
    }: {
        scene: EpisodeScene
        episodeId: string
        warnings: QualityWarning[]
        onEdit: () => void
        onDelete: () => void
        onGenerateImage: () => void
        isDeleting: boolean
        isGeneratingImage: boolean
        downloadImage: (url: string, filename: string) => void
    }) => {
        const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id })

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
        }

        return (
            <div
                ref={setNodeRef}
                style={style}
                className={`px-4 py-3 border-b border-[var(--border-subtle)] last:border-0 ${isDragging ? 'bg-[var(--bg-tertiary)]' : ''}`}
            >
                <div className="flex items-center gap-2 mb-2">
                    {/* Drag Handle */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)]"
                        title="Kéo để sắp xếp"
                    >
                        <GripVertical className="w-4 h-4" />
                    </button>

                    <span className="font-medium text-sm flex-1">
                        Scene {scene.order}: {scene.title}
                        {warnings.length > 0 && (
                            <span className="ml-2 text-yellow-400" title={warnings.map(w => w.message).join('\n')}>
                                ⚠️
                            </span>
                        )}
                    </span>

                    <div className="flex items-center gap-1">
                        <span className="text-xs text-[var(--text-muted)]">{scene.duration}s</span>

                        {/* Edit Button */}
                        <button
                            onClick={onEdit}
                            className="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
                            title="Chỉnh sửa scene"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                            onClick={onDelete}
                            disabled={isDeleting}
                            className="p-1 hover:bg-red-500/20 rounded text-[var(--text-muted)] hover:text-red-400 disabled:opacity-50"
                            title="Xóa scene"
                        >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>

                        {/* Generate Image Button */}
                        <button
                            onClick={onGenerateImage}
                            disabled={isGeneratingImage}
                            className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 rounded text-xs text-white flex items-center gap-1"
                            title="Tạo ảnh bằng Google Imagen 3"
                        >
                            {isGeneratingImage ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Đang tạo...</>
                            ) : (
                                <>🖼️ Tạo ảnh</>
                            )}
                        </button>
                    </div>
                </div>

                <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--bg-primary)] rounded p-2 mono max-h-32 overflow-y-auto">
                    {scene.promptText}
                </pre>

                {/* Show generated image if exists */}
                {scene.generatedImageUrl && (
                    <div className="mt-2 p-2 bg-[var(--bg-tertiary)] rounded">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-green-400">✅ Ảnh đã tạo</span>
                            <button
                                onClick={() => downloadImage(scene.generatedImageUrl!, `scene-${scene.order}.png`)}
                                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                            >
                                ⬇️ Download
                            </button>
                        </div>
                        <img
                            src={scene.generatedImageUrl}
                            alt={`Scene ${scene.order}`}
                            className="max-h-40 rounded mx-auto cursor-pointer"
                            onClick={() => window.open(scene.generatedImageUrl!, '_blank')}
                            title="Click để xem ảnh lớn"
                        />
                    </div>
                )}
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
            </div>
        )
    }

    if (!channel) return null

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/channels')}
                        className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Tv className="w-6 h-6 text-[var(--accent-primary)]" />
                            {channel.name}
                        </h1>
                        <div className="mt-2">
                            <p className="text-sm text-[var(--text-secondary)]">
                                {expandedNiche ? channel.niche : truncateText(channel.niche, 100)}
                            </p>
                            {channel.niche.length > 100 && (
                                <button
                                    onClick={() => setExpandedNiche(!expandedNiche)}
                                    className="text-xs text-[var(--accent-primary)] hover:underline mt-1 flex items-center gap-1"
                                >
                                    {expandedNiche ? (
                                        <>
                                            <ChevronUp className="w-3 h-3" />
                                            Thu gọn
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-3 h-3" />
                                            Xem thêm
                                        </>
                                    )}
                                </button>
                            )}
                            {channel.visualStyleId && (
                                <span className="tag tag-accent text-xs mt-2 inline-block">{channel.visualStyleId}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push(`/dashboard/channels/${id}/avatar`)}
                        className="btn-secondary flex items-center gap-2 text-purple-400 hover:text-purple-300"
                        title="Avatar Studio"
                    >
                        <Camera className="w-4 h-4" />
                        Avatar Studio
                    </button>
                    <button
                        onClick={() => setSetupCollapsed(!setupCollapsed)}
                        className="btn-secondary flex items-center gap-2"
                        title={setupCollapsed ? 'Mở rộng Setup' : 'Thu gọn Setup'}
                    >
                        {setupCollapsed ? (
                            <>
                                <ChevronRight className="w-4 h-4" />
                                Setup
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4" />
                                Thu gọn
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/channels/${id}/settings`)}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        Cài đặt
                    </button>
                </div>
            </div>

            {/* Collapsible Setup Section */}
            {!setupCollapsed && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="glass-card p-4 text-center">
                            <Film className="w-6 h-6 mx-auto mb-2 text-[var(--accent-primary)]" />
                            <p className="text-2xl font-bold">{channel.episodes.length}</p>
                            <p className="text-xs text-[var(--text-muted)]">Episodes</p>
                        </div>
                        <div className="glass-card p-4 text-center">
                            <Users className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                            <p className="text-2xl font-bold">{channel.characters.length}</p>
                            <p className="text-xs text-[var(--text-muted)]">Nhân vật</p>
                        </div>
                        <div className="glass-card p-4 text-center">
                            <Sparkles className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                            <p className="text-2xl font-bold">
                                {channel.episodes.reduce((sum, ep) => sum + ep.scenes.length, 0)}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">Tổng scenes</p>
                        </div>
                    </div>

                    {/* Channel Knowledge Base - Collapsible */}
                    {channel.knowledgeBase && (
                        <div className="glass-card p-4 mb-6">
                            <button
                                onClick={() => setShowKnowledge(!showKnowledge)}
                                className="w-full flex items-center justify-between"
                            >
                                <h3 className="font-semibold flex items-center gap-2">
                                    📚 Mô tả kênh & Knowledge Base
                                </h3>
                                {showKnowledge ? (
                                    <ChevronDown className="w-5 h-5" />
                                ) : (
                                    <ChevronRight className="w-5 h-5" />
                                )}
                            </button>
                            {showKnowledge && (
                                <div className="mt-3 text-sm text-[var(--text-secondary)] max-h-[300px] overflow-y-auto bg-[var(--bg-primary)] p-3 rounded-lg whitespace-pre-wrap">
                                    {channel.knowledgeBase}
                                </div>
                            )}
                            {!showKnowledge && (
                                <p className="mt-2 text-xs text-[var(--text-muted)]">
                                    Bấm để xem chi tiết mô tả kênh
                                </p>
                            )}
                        </div>
                    )}
                    <div className="glass-card p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Nhân vật xuyên suốt ({channel.characters.length})
                            </h3>
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={channel.hasCharacters}
                                        onChange={(e) => handleToggleCharacters(e.target.checked)}
                                        className="w-4 h-4 rounded"
                                    />
                                    Sử dụng nhân vật
                                </label>
                                {channel.hasCharacters && (
                                    <button
                                        onClick={() => setShowAddCharacter(true)}
                                        className="btn-secondary text-sm flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Thêm
                                    </button>
                                )}
                            </div>
                        </div>

                        {channel.hasCharacters && channel.characters.length > 0 && (
                            <div className="space-y-2">
                                {channel.characters.map(char => (
                                    <div key={char.id} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                                {char.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{char.name}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{char.role} {char.isMain && '• Main'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingCharacter(char)
                                                    setShowAddCharacter(true)
                                                }}
                                                className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCharacter(char.id)}
                                                className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {channel.hasCharacters && channel.characters.length === 0 && (
                            <p className="text-sm text-[var(--text-muted)] text-center py-4">
                                Chưa có nhân vật. Bấm "Thêm" để tạo nhân vật mới.
                            </p>
                        )}

                        {!channel.hasCharacters && (
                            <p className="text-sm text-[var(--text-muted)] text-center py-2">
                                Không sử dụng nhân vật - tạo nội dung không có nhân vật cụ thể.
                            </p>
                        )}
                    </div>

                    {/* Add/Edit Character Modal */}
                    {showAddCharacter && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                                <h3 className="font-semibold mb-4">
                                    {editingCharacter ? 'Chỉnh sửa nhân vật' : 'Thêm nhân vật mới'}
                                </h3>
                                <div className="space-y-4">
                                    {/* Name & Role Row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Tên nhân vật *</label>
                                            <input
                                                type="text"
                                                value={newCharacter.name}
                                                onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                                                className="input-field"
                                                placeholder="VD: Minh"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Vai trò *</label>
                                            <input
                                                type="text"
                                                value={newCharacter.role}
                                                onChange={(e) => setNewCharacter({ ...newCharacter, role: e.target.value })}
                                                className="input-field"
                                                placeholder="VD: Host chính..."
                                            />
                                        </div>
                                    </div>

                                    {/* Gender & Age Row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Giới tính</label>
                                            <select
                                                value={newCharacter.gender || 'female'}
                                                onChange={(e) => setNewCharacter({ ...newCharacter, gender: e.target.value })}
                                                className="input-field"
                                            >
                                                <option value="female">👩 Nữ</option>
                                                <option value="male">👨 Nam</option>
                                                <option value="other">🧑 Khác</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Độ tuổi</label>
                                            <select
                                                value={newCharacter.ageRange || '25-35'}
                                                onChange={(e) => setNewCharacter({ ...newCharacter, ageRange: e.target.value })}
                                                className="input-field"
                                            >
                                                <option value="5-12">👶 Trẻ em (5-12)</option>
                                                <option value="13-17">🧒 Thiếu niên (13-17)</option>
                                                <option value="18-24">🧑 Trẻ (18-24)</option>
                                                <option value="25-35">👤 Trưởng thành (25-35)</option>
                                                <option value="36-50">👨 Trung niên (36-50)</option>
                                                <option value="50+">👴 Lớn tuổi (50+)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Personality */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">🎭 Tính cách nhân vật</label>
                                        <textarea
                                            value={newCharacter.personality}
                                            onChange={(e) => setNewCharacter({ ...newCharacter, personality: e.target.value })}
                                            className="input-field min-h-[60px]"
                                            placeholder="VD: Vui vẻ, hài hước, hay đùa. Nói nhanh, thích dùng từ lóng Gen Z..."
                                        />
                                    </div>

                                    {/* AI Generate Button */}
                                    <button
                                        onClick={handleGenerateCharacterDetails}
                                        disabled={isGeneratingCharacter || !newCharacter.name}
                                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition"
                                    >
                                        {isGeneratingCharacter ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Đang tạo mô tả chi tiết...
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 className="w-4 h-4" />
                                                ✨ AI Tạo mô tả chi tiết (tóc, mắt, trang phục...)
                                            </>
                                        )}
                                    </button>

                                    {/* Full Description */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            📝 Mô tả đầy đủ * {newCharacter.fullDescription && <span className="text-green-400 text-xs">(Đã có)</span>}
                                        </label>
                                        <textarea
                                            value={newCharacter.fullDescription}
                                            onChange={(e) => setNewCharacter({ ...newCharacter, fullDescription: e.target.value })}
                                            className="input-field min-h-[120px]"
                                            placeholder="Nhấn nút AI ở trên để tự động tạo mô tả chi tiết, hoặc nhập thủ công..."
                                        />
                                    </div>

                                    {/* Show additional details if generated */}
                                    {newCharacter.hairDetails && (
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="p-2 bg-[var(--bg-tertiary)] rounded">
                                                <span className="text-[var(--text-muted)]">💇 Tóc: </span>
                                                <span>{newCharacter.hairDetails}</span>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-tertiary)] rounded">
                                                <span className="text-[var(--text-muted)]">👤 Mặt: </span>
                                                <span>{newCharacter.faceDetails}</span>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-tertiary)] rounded">
                                                <span className="text-[var(--text-muted)]">👕 Outfit: </span>
                                                <span>{newCharacter.clothing}</span>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-tertiary)] rounded">
                                                <span className="text-[var(--text-muted)]">🎨 Da: </span>
                                                <span>{newCharacter.skinTone}</span>
                                            </div>
                                        </div>
                                    )}

                                    {newCharacter.styleKeywords && (
                                        <div className="p-2 bg-[var(--bg-tertiary)] rounded text-xs">
                                            <span className="text-[var(--text-muted)]">🏷️ AI Keywords: </span>
                                            <span className="text-purple-400">{newCharacter.styleKeywords}</span>
                                        </div>
                                    )}

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={newCharacter.isMain}
                                            onChange={(e) => setNewCharacter({ ...newCharacter, isMain: e.target.checked })}
                                        />
                                        Nhân vật chính
                                    </label>
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <button
                                        onClick={handleSaveCharacter}
                                        disabled={!newCharacter.name || !newCharacter.fullDescription}
                                        className="btn-primary flex-1"
                                    >
                                        {editingCharacter ? 'Lưu thay đổi' : 'Thêm nhân vật'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAddCharacter(false)
                                            setEditingCharacter(null)
                                            setNewCharacter({ name: '', role: 'host', fullDescription: '', personality: '', isMain: false, gender: 'female', ageRange: '25-35', faceDetails: '', hairDetails: '', clothing: '', skinTone: '', styleKeywords: '' })
                                        }}
                                        className="btn-secondary"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Generate New Episode */}
                    <div className="glass-card p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Tạo Episode Mới</h3>
                            <button
                                onClick={() => setShowBulkCreate(true)}
                                className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition flex items-center gap-1"
                            >
                                📦 Bulk Create
                            </button>
                        </div>

                        {/* Category Selector for new episode */}
                        {categories.length > 0 && (
                            <div className="mb-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                <label className="block text-sm font-medium mb-2">📁 Chọn Danh mục</label>
                                <select
                                    value={selectedCategoryId || ''}
                                    onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                                    className="input-field w-full"
                                >
                                    <option value="">Chưa phân loại</option>
                                    {categories.map(cat => {
                                        const catCount = channel.episodes.filter(e => e.categoryId === cat.id).length
                                        return (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name} ({catCount} episodes)
                                            </option>
                                        )
                                    })}
                                </select>
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    {selectedCategoryId
                                        ? `Episode tiếp theo: #${(channel.episodes.filter(e => e.categoryId === selectedCategoryId).length) + 1} trong danh mục này`
                                        : `Episode tiếp theo: #${(channel.episodes.filter(e => !e.categoryId).length) + 1} (chưa phân loại)`
                                    }
                                </p>
                            </div>
                        )}

                        {/* Content Input Section */}
                        <div className="mb-4 p-4 bg-[var(--bg-tertiary)] rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium">📝 Nội dung / Mô tả (tùy chọn)</label>
                                <span className="text-xs text-[var(--text-muted)]">
                                    Để AI tạo script dựa trên nội dung này
                                </span>
                            </div>

                            {/* URL Import */}
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="url"
                                    placeholder="Nhập URL bài viết để lấy nội dung..."
                                    value={contentUrl}
                                    onChange={(e) => setContentUrl(e.target.value)}
                                    className="input-field flex-1 text-sm"
                                />
                                <button
                                    onClick={handleParseUrl}
                                    disabled={isLoadingUrl || !contentUrl.trim()}
                                    className="btn-secondary px-4 text-sm flex items-center gap-1"
                                >
                                    {isLoadingUrl ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Globe className="w-4 h-4" />
                                    )}
                                    Lấy nội dung
                                </button>
                            </div>

                            {/* Custom Content Textarea */}
                            <textarea
                                placeholder="Hoặc nhập mô tả/nội dung bạn muốn tạo script...&#10;&#10;Ví dụ: Tạo video về 5 mẹo tiết kiệm tiền cho sinh viên..."
                                value={customContent}
                                onChange={(e) => setCustomContent(e.target.value)}
                                rows={4}
                                className="input-field w-full text-sm resize-none"
                            />
                            {customContent && (
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-[var(--accent-primary)]">
                                        ✓ AI sẽ tạo script dựa trên nội dung này
                                    </span>
                                    <button
                                        onClick={() => setCustomContent('')}
                                        className="text-xs text-[var(--text-muted)] hover:text-red-400"
                                    >
                                        Xóa nội dung
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Row 1: Scene count, Language */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Số cảnh</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={sceneCount}
                                    onChange={(e) => setSceneCount(parseInt(e.target.value) || 0)}
                                    onBlur={(e) => {
                                        const val = parseInt(e.target.value) || 10
                                        setSceneCount(Math.max(1, val))
                                    }}
                                    className="input-field w-full"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    ~{Math.round(sceneCount * 8 / 60)} phút
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Ngôn ngữ</label>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleUpdateLanguage('vi')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition flex-1 ${channel.dialogueLanguage === 'vi'
                                            ? 'bg-[var(--accent-primary)] text-white'
                                            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                            }`}
                                    >
                                        🇻🇳 VI
                                    </button>
                                    <button
                                        onClick={() => handleUpdateLanguage('en')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition flex-1 ${channel.dialogueLanguage === 'en'
                                            ? 'bg-[var(--accent-primary)] text-white'
                                            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                            }`}
                                    >
                                        🇺🇸 EN
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Visual Style</label>
                                <button
                                    type="button"
                                    onClick={() => setShowStyleModal(true)}
                                    className="input-field w-full text-left flex items-center justify-between hover:border-[var(--accent-primary)] transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        {selectedStyleId ? (
                                            <>
                                                {CHANNEL_STYLES.find(s => s.id === selectedStyleId)?.previewImage && (
                                                    <img
                                                        src={CHANNEL_STYLES.find(s => s.id === selectedStyleId)?.previewImage}
                                                        alt=""
                                                        className="w-8 h-8 rounded object-cover"
                                                    />
                                                )}
                                                {CHANNEL_STYLES.find(s => s.id === selectedStyleId)?.nameVi || selectedStyleId}
                                            </>
                                        ) : (
                                            <>🎨 Chọn Visual Style...</>
                                        )}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </button>
                                <StyleSelectorModal
                                    isOpen={showStyleModal}
                                    onClose={() => setShowStyleModal(false)}
                                    onSelect={(id) => setSelectedStyleId(id || '')}
                                    selectedStyleId={selectedStyleId}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Loại nội dung</label>
                                <select
                                    value={voiceOverMode}
                                    onChange={(e) => {
                                        const mode = e.target.value as typeof voiceOverMode
                                        setVoiceOverMode(mode)
                                        // Modes that use characters
                                        const characterModes = [
                                            'with_host', 'host_dynamic_env', 'host_storyteller', 'cinematic_film',
                                            'roast_comedy', 'reaction_commentary', 'horror_survival', 'romance_drama',
                                            'gen_z_meme', 'educational_sassy', 'mystery_detective', 'breaking_4th_wall',
                                            'villain_origin', 'underdog_triumph', 'chaos_unhinged', 'food_animation', 'food_drama',
                                            'fashion_showcase', 'silent_life', 'virtual_companion', 'cozy_aesthetic', 'one_shot'
                                        ]
                                        setUseCharacters(characterModes.includes(mode))

                                        // Fashion Showcase: Auto-disable ALL advanced features
                                        if (mode === 'fashion_showcase') {
                                            setVisualHookEnabled(false)
                                            setEmotionalCurveEnabled(false)
                                            setSpatialAudioEnabled(false)
                                            setMentionChannel(false)
                                        }
                                    }}
                                    className="input-field w-full"
                                >
                                    <optgroup label="📹 Cơ bản">
                                        <option value="with_host">👤 Có Host/Nhân vật</option>
                                        <option value="voice_over">🎙️ Voice Over (Thuyết minh)</option>
                                        <option value="broll_only">🎬 B-Roll only (không lời)</option>
                                        <option value="host_dynamic_env">🌍 Host 100% + Môi trường động</option>
                                        <option value="host_storyteller">🎭 Host Kể Chuyện (Elements sinh động)</option>
                                        <option value="one_shot">🎥 One Shot (Một cảnh liên tục)</option>
                                        <option value="kol_solo_storyteller">🎙️ KOL Solo (Ngồi kể chuyện trước camera)</option>
                                    </optgroup>
                                    <optgroup label="🎬 Điện ảnh">
                                        <option value="cinematic_film">🎬 Điện Ảnh Hollywood</option>
                                        <option value="cinematic_film_script">🎬 Kịch Bản Phim 8K (Thoại tự nhiên)</option>
                                    </optgroup>
                                    <optgroup label="🔥 VIRAL - Tương tác mạnh">
                                        <option value="roast_comedy">🔥 Roast Comedy (Chọc tức khán giả)</option>
                                        <option value="breaking_4th_wall">👀 Phá vỡ bức tường thứ 4</option>
                                        <option value="reaction_commentary">😱 Reaction / Commentary</option>
                                        <option value="educational_sassy">🙄 Giáo dục với thái độ (Sassy)</option>
                                        <option value="gen_z_meme">💀 Gen Z Meme Culture</option>
                                        <option value="chaos_unhinged">🤪 Chaotic / Năng lượng điên</option>
                                    </optgroup>
                                    <optgroup label="🎭 Kịch tính / Drama">
                                        <option value="horror_survival">😱 Kinh dị sinh tồn</option>
                                        <option value="romance_drama">💕 Tình cảm lãng mạn</option>
                                        <option value="mystery_detective">🔍 Bí ẩn / Thám tử</option>
                                        <option value="villain_origin">😈 Nguồn gốc phản diện</option>
                                        <option value="underdog_triumph">🏆 Kẻ yếu vươn lên</option>
                                    </optgroup>
                                    <optgroup label="🍕 Thực phẩm nhân hóa (VIRAL)">
                                        <option value="food_animation">🍔 Thực phẩm nhân hóa</option>
                                        <option value="food_drama">⚔️ Food Wars / Kịch tính ẩm thực</option>
                                    </optgroup>
                                    <optgroup label="🎧 Đặc biệt">
                                        <option value="asmr_satisfying">🎧 ASMR / Satisfying</option>
                                    </optgroup>
                                    <optgroup label="📖 Kể Chuyện / Storytelling">
                                        <option value="narrative_storytelling">📖 Kể Chuyện B-roll (Phong cách Anh Dư Leo)</option>
                                        <option value="educational_explainer">🎓 Giải Thích Giáo Dục (Phong cách Lóng)</option>
                                    </optgroup>
                                    <optgroup label="🌸 Slice of Life / Healing">
                                        <option value="silent_life">🌸 Silent Life (Cuộc sống thầm lặng)</option>
                                        <option value="virtual_companion">☕ Virtual Companion (Bạn đồng hành)</option>
                                        <option value="cozy_aesthetic">🏠 Cozy Aesthetic (Không gian ấm cúng)</option>
                                    </optgroup>
                                    <optgroup label="👗 E-Commerce / Thời trang">
                                        <option value="fashion_showcase">👗 Fashion Showcase (Thử đồ)</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        {/* Fashion Showcase - Product Upload UI */}
                        {voiceOverMode === 'fashion_showcase' && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-lg">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <span className="text-xl">👗</span>
                                    Fashion Showcase
                                </h4>

                                {/* Mode Toggle */}
                                <div className="mb-4 p-3 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm">📷 Bạn đã có sẵn ảnh/video?</p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {useOwnImages
                                                ? 'Chỉ tạo kịch bản, không mô tả nhân vật/background'
                                                : 'AI sẽ tạo ảnh preview cho bạn'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setUseOwnImages(!useOwnImages)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${useOwnImages
                                            ? 'bg-green-500 text-white'
                                            : 'bg-purple-500 text-white'
                                            }`}
                                    >
                                        {useOwnImages ? '✅ Có, tôi tự có ảnh' : '🎨 AI tạo ảnh'}
                                    </button>
                                </div>

                                {/* Product Image Upload */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">📸 Hình ảnh sản phẩm (để AI phân tích)</label>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleProductImageUpload}
                                                className="hidden"
                                                id="product-image-upload"
                                            />
                                            <label
                                                htmlFor="product-image-upload"
                                                className="block w-full p-4 border-2 border-dashed border-pink-500/30 rounded-lg cursor-pointer hover:border-pink-500/60 transition text-center"
                                            >
                                                {productImage ? (
                                                    <img
                                                        src={productImage}
                                                        alt="Product"
                                                        className="max-h-32 mx-auto rounded"
                                                    />
                                                ) : (
                                                    <div className="text-[var(--text-muted)]">
                                                        <p className="text-2xl mb-2">📷</p>
                                                        <p className="text-sm">Upload ảnh sản phẩm</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>

                                        {/* AI Analysis Result */}
                                        {isAnalyzingProduct && (
                                            <div className="flex-1 flex items-center justify-center">
                                                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                                                <span className="ml-2 text-sm">Đang phân tích...</span>
                                            </div>
                                        )}

                                        {productAnalysis && !isAnalyzingProduct && (
                                            <div className="flex-1 p-3 bg-[var(--bg-tertiary)] rounded-lg text-sm">
                                                <p className="font-medium text-pink-400 mb-2">🤖 AI Phân tích:</p>

                                                {/* Exact Description - Most Important */}
                                                {productAnalysis.exactDescription && (
                                                    <div className="mb-2 p-2 bg-green-500/10 border border-green-500/30 rounded">
                                                        <p className="text-xs text-white">{productAnalysis.exactDescription}</p>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                                    <p><span className="text-[var(--text-muted)]">Loại:</span> {productAnalysis.productType} {productAnalysis.productSubtype && `(${productAnalysis.productSubtype})`}</p>
                                                    <p><span className="text-[var(--text-muted)]">Màu:</span> {productAnalysis.color}</p>
                                                    <p><span className="text-[var(--text-muted)]">Chất liệu:</span> {productAnalysis.material}</p>
                                                    <p><span className="text-[var(--text-muted)]">Style:</span> {productAnalysis.style}</p>
                                                    {productAnalysis.pattern && <p><span className="text-[var(--text-muted)]">Họa tiết:</span> {productAnalysis.pattern}</p>}
                                                    {productAnalysis.fit && <p><span className="text-[var(--text-muted)]">Form:</span> {productAnalysis.fit}</p>}
                                                </div>

                                                {productAnalysis.promptKeywords && (
                                                    <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                                                        <p className="text-[var(--text-muted)] text-xs mb-1">🏷️ Keywords cho Imagen:</p>
                                                        <p className="text-xs text-purple-300 bg-purple-500/10 p-1 rounded">{productAnalysis.promptKeywords}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Product Info */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block text-xs text-[var(--text-muted)] mb-1">Tên sản phẩm</label>
                                        <input
                                            type="text"
                                            value={productInfo.name}
                                            onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })}
                                            placeholder="VD: Áo croptop ren trắng"
                                            className="input-field text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-[var(--text-muted)] mb-1">Giá gốc</label>
                                        <input
                                            type="text"
                                            value={productInfo.price}
                                            onChange={(e) => setProductInfo({ ...productInfo, price: e.target.value })}
                                            placeholder="VD: 350.000đ"
                                            className="input-field text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-[var(--text-muted)] mb-1">Giá sale (nếu có)</label>
                                        <input
                                            type="text"
                                            value={productInfo.salePrice}
                                            onChange={(e) => setProductInfo({ ...productInfo, salePrice: e.target.value })}
                                            placeholder="VD: 199.000đ"
                                            className="input-field text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-[var(--text-muted)] mb-1">Khuyến mãi</label>
                                        <input
                                            type="text"
                                            value={productInfo.promotion}
                                            onChange={(e) => setProductInfo({ ...productInfo, promotion: e.target.value })}
                                            placeholder="VD: Freeship + Tặng quà"
                                            className="input-field text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Background & Multi-Image - Only needed when AI generates images */}
                                {!useOwnImages && (<>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-2">🏠 Background cố định (cho AI tạo ảnh)</label>

                                        {/* Upload Background Option */}
                                        <div className="mb-3 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                            <label className="block text-xs font-medium mb-2 text-purple-400">📷 Upload ảnh Background của bạn</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleBackgroundImageUpload}
                                                className="text-xs file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-purple-500/20 file:text-purple-400 hover:file:bg-purple-500/30"
                                            />
                                            {backgroundImage && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <img src={backgroundImage} alt="Background" className="w-20 h-12 object-cover rounded" />
                                                    <span className="text-xs text-green-400">✓ Background đã upload</span>
                                                    <button
                                                        onClick={() => { setBackgroundImage(null); setBackgroundImageBase64(null); setFashionBackground('fitting_room'); }}
                                                        className="text-xs text-red-400 hover:text-red-300"
                                                    >
                                                        ✕ Xóa
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs text-[var(--text-muted)] mb-2">Hoặc chọn preset:</p>
                                        <div className="grid grid-cols-4 gap-2 mb-2">
                                            {FASHION_BACKGROUNDS.map(bg => (
                                                <button
                                                    key={bg.id}
                                                    onClick={() => setFashionBackground(bg.id)}
                                                    className={`p-2 rounded-lg border-2 text-center transition ${fashionBackground === bg.id && !backgroundImage
                                                        ? 'border-pink-500 bg-pink-500/20'
                                                        : 'border-[var(--border-color)] hover:border-pink-500/50'
                                                        }`}
                                                >
                                                    <span className="text-xl">{bg.icon}</span>
                                                    <p className="text-xs mt-1">{bg.name}</p>
                                                </button>
                                            ))}
                                        </div>

                                        {fashionBackground === 'custom' && !backgroundImage && (
                                            <input
                                                type="text"
                                                value={customBackground}
                                                onChange={(e) => setCustomBackground(e.target.value)}
                                                placeholder="Mô tả background của bạn (VD: Cửa hàng thời trang cao cấp, đèn vàng ấm áp)"
                                                className="input-field text-sm w-full mt-2"
                                            />
                                        )}

                                        <p className="text-xs text-[var(--text-muted)] mt-2">
                                            📌 Background này sẽ được sử dụng NHẤT QUÁN trong tất cả các scene
                                        </p>
                                    </div>

                                    {/* Multiple Product Images (Different Angles) - For AI image generation */}
                                    <div className="mb-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <label className="block text-sm font-medium mb-2 text-pink-400">📐 Ảnh sản phẩm nhiều góc (để AI tạo chính xác hơn)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleMultiProductImageUpload}
                                            className="text-xs file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-pink-500/20 file:text-pink-400 hover:file:bg-pink-500/30 mb-2"
                                        />
                                        <p className="text-xs text-[var(--text-muted)] mb-2">
                                            💡 Upload nhiều góc: trước, sau, detail, tag... để AI hiểu sản phẩm tốt hơn
                                        </p>

                                        {productImages.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {productImages.map((img, idx) => (
                                                    <div key={idx} className="relative group">
                                                        <img
                                                            src={img.base64}
                                                            alt={`Product ${idx + 1}`}
                                                            className={`w-16 h-16 object-cover rounded cursor-pointer ${idx === 0 ? 'ring-2 ring-pink-500' : ''}`}
                                                            onClick={() => { setProductImageBase64(img.base64); setProductImage(img.base64); }}
                                                            title={idx === 0 ? 'Ảnh chính' : 'Click để chọn làm ảnh chính'}
                                                        />
                                                        <button
                                                            onClick={() => removeProductImage(idx)}
                                                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white opacity-0 group-hover:opacity-100 transition"
                                                        >
                                                            ×
                                                        </button>
                                                        {idx === 0 && <span className="absolute -bottom-1 left-0 right-0 text-center text-[8px] text-pink-400 bg-[var(--bg-primary)] rounded">Chính</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>)}

                                {/* Step 3: Generate Preview Images - ONLY when NOT using own images */}
                                {!useOwnImages && (<>
                                    <div className="mb-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                                        <h5 className="font-medium text-green-400 mb-3 flex items-center gap-2">
                                            <span>🎨</span>
                                            Tạo ảnh Preview (AI tạo ảnh model mặc sản phẩm)
                                        </h5>

                                        <div className="flex items-center gap-4 mb-3">
                                            <div>
                                                <label className="text-xs text-[var(--text-muted)]">Số ảnh cần tạo:</label>
                                                <select
                                                    value={fashionSceneCount}
                                                    onChange={(e) => setFashionSceneCount(Number(e.target.value))}
                                                    className="ml-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-2 py-1 text-sm"
                                                >
                                                    <option value={4}>4 ảnh</option>
                                                    <option value={6}>6 ảnh</option>
                                                    <option value={8}>8 ảnh</option>
                                                </select>
                                            </div>

                                            <button
                                                onClick={handleGenerateFashionPreviews}
                                                disabled={!productImageBase64 || isGeneratingPreview}
                                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 rounded-lg text-sm font-medium flex items-center gap-2"
                                            >
                                                {isGeneratingPreview ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Đang tạo ảnh...
                                                    </>
                                                ) : (
                                                    <>
                                                        🖼️ Tạo {fashionSceneCount} ảnh Preview
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <p className="text-xs text-[var(--text-muted)]">
                                            AI sẽ tạo ảnh model mặc sản phẩm của bạn. Sau đó kịch bản sẽ được tạo dựa trên các ảnh này.
                                        </p>
                                    </div>

                                    {/* Preview Images Grid */}
                                    {fashionPreviewImages.length > 0 && (
                                        <div className="mb-4 p-4 bg-[var(--bg-tertiary)] rounded-lg">
                                            <h5 className="font-medium text-purple-400 mb-3 flex items-center gap-2">
                                                <span>✨</span>
                                                Ảnh Preview đã tạo ({fashionPreviewImages.filter(i => i.url).length}/{fashionPreviewImages.length})
                                            </h5>

                                            <div className="grid grid-cols-4 gap-3">
                                                {fashionPreviewImages.map((img, idx) => (
                                                    <div key={idx} className="relative group">
                                                        {img.url ? (
                                                            <>
                                                                <img
                                                                    src={img.url}
                                                                    alt={`Preview ${idx + 1}`}
                                                                    className="w-full aspect-[9/16] object-cover rounded-lg cursor-pointer"
                                                                    onClick={() => window.open(img.url, '_blank')}
                                                                />
                                                                <button
                                                                    onClick={() => downloadImage(img.url, `fashion-scene-${idx + 1}.png`)}
                                                                    className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                                                                >
                                                                    ⬇️
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <div className="w-full aspect-[9/16] bg-red-500/20 rounded-lg flex items-center justify-center">
                                                                <span className="text-red-400 text-xs">❌ Failed</span>
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-center mt-1 text-[var(--text-muted)]">Scene {idx + 1}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <p className="text-xs text-green-400 mt-3">
                                                ✅ Ảnh đã tạo xong! Bây giờ bạn có thể tạo kịch bản bên dưới.
                                            </p>
                                        </div>
                                    )}
                                </>)}

                                {/* Simple mode: Just script creation */}
                                {useOwnImages && (
                                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                        <p className="text-sm text-green-400">
                                            ✅ <strong>Chế độ đơn giản:</strong> AI sẽ tạo kịch bản dựa trên thông tin sản phẩm.
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)] mt-1">
                                            Kịch bản sẽ chỉ bao gồm: lời thoại, hành động/pose, thông tin sản phẩm.
                                            KHÔNG mô tả nhân vật/background (vì bạn tự có ảnh).
                                        </p>
                                    </div>
                                )}

                                <p className="text-xs text-[var(--text-muted)]">
                                    💡 {useOwnImages ? 'Upload sản phẩm → Nhập thông tin → Tạo kịch bản' : 'Upload sản phẩm → Chọn background → Tạo ảnh → Tạo kịch bản'}
                                </p>
                            </div>
                        )}

                        {/* Content Type Tips (for viral content types) */}
                        {CONTENT_TYPE_INFO[voiceOverMode] && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <span className="text-3xl">{CONTENT_TYPE_INFO[voiceOverMode].icon}</span>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-lg">{CONTENT_TYPE_INFO[voiceOverMode].name}</h4>
                                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                                            {CONTENT_TYPE_INFO[voiceOverMode].description}
                                        </p>
                                        <div className="mt-3">
                                            <p className="text-xs font-medium text-amber-400 mb-2">💡 Ví dụ / Tips:</p>
                                            <ul className="space-y-1">
                                                {CONTENT_TYPE_INFO[voiceOverMode].tips.map((tip, i) => (
                                                    <li key={i} className="text-xs text-[var(--text-muted)] flex items-start gap-2">
                                                        <span className="text-green-400">•</span>
                                                        <span>{tip}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* KOL Solo Storyteller Settings */}
                        {voiceOverMode === 'kol_solo_storyteller' && (
                            <div className="mb-4 space-y-4">
                                {/* Room/Environment Selection */}
                                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                                    <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                                        <span className="text-xl">🏠</span>
                                        Môi trường / Căn phòng
                                    </label>

                                    {/* Room Presets */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                        {Object.entries(KOL_ROOM_PRESETS).map(([key, preset]) => (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    setKolRoomPreset(key)
                                                    setKolRoomDescription(preset.description)
                                                }}
                                                className={`p-2 rounded-lg text-xs text-center transition flex flex-col items-center gap-1 ${kolRoomPreset === key
                                                    ? 'bg-purple-500/30 border border-purple-500 text-white'
                                                    : 'bg-[var(--bg-secondary)] border border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                                                    }`}
                                            >
                                                <span className="text-lg">{preset.icon}</span>
                                                <span>{preset.name}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Saved Templates */}
                                    {kolSavedRoomTemplates.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-xs text-[var(--text-muted)] mb-2">💾 Template đã lưu:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {kolSavedRoomTemplates.map((tmpl, i) => (
                                                    <div key={i} className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setKolRoomPreset('saved_' + i)
                                                                setKolRoomDescription(tmpl.description)
                                                            }}
                                                            className={`px-3 py-1 rounded-lg text-xs transition ${kolRoomPreset === 'saved_' + i
                                                                ? 'bg-blue-500/30 border border-blue-500 text-white'
                                                                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                                                                }`}
                                                        >
                                                            📁 {tmpl.name}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const updated = kolSavedRoomTemplates.filter((_, idx) => idx !== i)
                                                                setKolSavedRoomTemplates(updated)
                                                                localStorage.setItem('kol_room_templates', JSON.stringify(updated))
                                                            }}
                                                            className="text-red-400 hover:text-red-300 text-xs"
                                                            title="Xóa template"
                                                        >✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Custom Room Button */}
                                    <button
                                        onClick={() => {
                                            setKolRoomPreset('custom')
                                            setKolRoomDescription('')
                                        }}
                                        className={`w-full mb-3 px-3 py-2 rounded-lg text-sm transition ${kolRoomPreset === 'custom' && !kolRoomDescription
                                            ? 'bg-green-500/30 border border-green-500 text-white'
                                            : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                                            }`}
                                    >
                                        ✏️ Tự mô tả môi trường
                                    </button>

                                    {/* Room Description Textarea */}
                                    <textarea
                                        value={kolRoomDescription}
                                        onChange={(e) => {
                                            setKolRoomDescription(e.target.value)
                                            if (!Object.keys(KOL_ROOM_PRESETS).includes(kolRoomPreset) && !kolRoomPreset.startsWith('saved_')) {
                                                setKolRoomPreset('custom')
                                            }
                                        }}
                                        placeholder="Mô tả môi trường chi tiết... VD: Phòng studio nhỏ, tường xám, đèn LED tím phía sau, bàn gỗ đen với micro Silver, cốc cà phê..."
                                        className="input-field w-full h-24 text-sm"
                                    />

                                    {/* Save Template */}
                                    <div className="mt-2 flex items-center gap-2">
                                        {!kolShowSaveTemplate ? (
                                            <button
                                                onClick={() => setKolShowSaveTemplate(true)}
                                                disabled={!kolRoomDescription.trim()}
                                                className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                💾 Lưu template này
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2 flex-1">
                                                <input
                                                    type="text"
                                                    value={kolNewTemplateName}
                                                    onChange={(e) => setKolNewTemplateName(e.target.value)}
                                                    placeholder="Tên template..."
                                                    className="input-field flex-1 text-xs"
                                                />
                                                <button
                                                    onClick={() => {
                                                        if (kolNewTemplateName.trim() && kolRoomDescription.trim()) {
                                                            const updated = [...kolSavedRoomTemplates, { name: kolNewTemplateName.trim(), description: kolRoomDescription }]
                                                            setKolSavedRoomTemplates(updated)
                                                            localStorage.setItem('kol_room_templates', JSON.stringify(updated))
                                                            setKolNewTemplateName('')
                                                            setKolShowSaveTemplate(false)
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                                >Lưu</button>
                                                <button
                                                    onClick={() => { setKolShowSaveTemplate(false); setKolNewTemplateName('') }}
                                                    className="text-xs text-[var(--text-muted)]"
                                                >Hủy</button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Channel Name in Background */}
                                    <div className="mt-3 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-medium flex items-center gap-1.5">
                                                <span>📺</span> Tên hiển thị ở background
                                            </label>
                                            <button
                                                onClick={() => setKolShowChannelName(!kolShowChannelName)}
                                                className={`relative w-10 h-5 rounded-full transition-colors ${kolShowChannelName ? 'bg-green-500' : 'bg-gray-600'}`}
                                            >
                                                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${kolShowChannelName ? 'left-5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                        {kolShowChannelName && (
                                            <div>
                                                <div className="flex gap-2 mb-2">
                                                    <button
                                                        onClick={() => setKolChannelNameMode('channel')}
                                                        className={`flex-1 px-2 py-1.5 rounded-lg text-xs transition ${kolChannelNameMode === 'channel'
                                                            ? 'bg-green-500/30 border border-green-500 text-white'
                                                            : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
                                                    >
                                                        📺 Dùng tên kênh
                                                    </button>
                                                    <button
                                                        onClick={() => setKolChannelNameMode('custom')}
                                                        className={`flex-1 px-2 py-1.5 rounded-lg text-xs transition ${kolChannelNameMode === 'custom'
                                                            ? 'bg-green-500/30 border border-green-500 text-white'
                                                            : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
                                                    >
                                                        ✏️ Nhập text khác
                                                    </button>
                                                </div>
                                                {kolChannelNameMode === 'channel' ? (
                                                    <p className="text-xs text-green-400">
                                                        ✅ Tên kênh <strong>&quot;{channel?.name}&quot;</strong> sẽ hiển thị ở background (LED sign / poster phía sau host)
                                                    </p>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={kolCustomChannelText}
                                                        onChange={(e) => setKolCustomChannelText(e.target.value)}
                                                        placeholder="Nhập text hiển thị ở background... VD: TECH REVIEW, STORY TIME, v.v."
                                                        className="input-field w-full text-sm"
                                                    />
                                                )}
                                            </div>
                                        )}
                                        {!kolShowChannelName && (
                                            <p className="text-xs text-[var(--text-muted)]">🚫 Không hiển thị text ở background</p>
                                        )}
                                    </div>
                                </div>

                                {/* Host Selection */}
                                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg">
                                    <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                                        <span className="text-xl">👤</span>
                                        Host / Người dẫn chương trình
                                    </label>

                                    <div className="flex gap-2 mb-3">
                                        <button
                                            onClick={() => setKolHostMode('channel_character')}
                                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${kolHostMode === 'channel_character'
                                                ? 'bg-blue-500/30 border border-blue-500 text-white'
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                                                }`}
                                        >
                                            👥 Dùng nhân vật kênh
                                        </button>
                                        <button
                                            onClick={() => setKolHostMode('custom')}
                                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${kolHostMode === 'custom'
                                                ? 'bg-blue-500/30 border border-blue-500 text-white'
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                                                }`}
                                        >
                                            ✏️ Mô tả custom
                                        </button>
                                        <button
                                            onClick={() => setKolHostMode('ai_generate')}
                                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${kolHostMode === 'ai_generate'
                                                ? 'bg-blue-500/30 border border-blue-500 text-white'
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                                                }`}
                                        >
                                            🤖 AI tự tạo
                                        </button>
                                    </div>

                                    {kolHostMode === 'channel_character' && (
                                        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                            {channel?.characters && channel.characters.length > 0 ? (
                                                <div>
                                                    <p className="text-xs text-[var(--text-muted)] mb-2">Chọn nhân vật làm host (có thể chọn nhiều):</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {channel.characters.map((char: ChannelCharacter) => (
                                                            <button
                                                                key={char.id}
                                                                onClick={() => {
                                                                    setKolSelectedCharacterIds(prev =>
                                                                        prev.includes(char.id)
                                                                            ? prev.filter(id => id !== char.id)
                                                                            : [...prev, char.id]
                                                                    )
                                                                }}
                                                                className={`px-3 py-2 rounded-lg text-xs transition flex items-center gap-2 ${kolSelectedCharacterIds.includes(char.id)
                                                                    ? 'bg-blue-500/30 border border-blue-500 text-white'
                                                                    : kolSelectedCharacterIds.length === 0
                                                                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300'
                                                                        : 'bg-[var(--bg-secondary)] border border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                                                                    }`}
                                                            >
                                                                {char.isMain && <span className="text-amber-400">⭐</span>}
                                                                <span className="font-medium">{char.name}</span>
                                                                <span className="text-[var(--text-muted)]">({char.role})</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-[var(--text-muted)] mt-2">
                                                        {kolSelectedCharacterIds.length === 0
                                                            ? '✅ Sẽ sử dụng nhân vật chính (⭐) làm host'
                                                            : kolSelectedCharacterIds.length === 1
                                                                ? `✅ Host: ${channel.characters.find((c: ChannelCharacter) => c.id === kolSelectedCharacterIds[0])?.name || 'Đã chọn'}`
                                                                : `✅ ${kolSelectedCharacterIds.length} nhân vật - Host chính + khách mời trong video`}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-amber-400">⚠️ Kênh chưa có nhân vật. Vào cài đặt kênh để tạo nhân vật, hoặc chọn &quot;Mô tả custom&quot; / &quot;AI tự tạo&quot;.</p>
                                            )}
                                        </div>
                                    )}

                                    {kolHostMode === 'custom' && (
                                        <textarea
                                            value={kolCustomHost}
                                            onChange={(e) => setKolCustomHost(e.target.value)}
                                            placeholder="Mô tả host... VD: Nam, 30 tuổi, Đông Á, tóc đen ngắn gọn gàng, da sáng, mặc áo hoodie xám Nike, kính tròn gọng đen, râu nhẹ, nụ cười thân thiện, giọng nói trầm ấm..."
                                            className="input-field w-full h-20 text-sm"
                                        />
                                    )}

                                    {kolHostMode === 'ai_generate' && (
                                        <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg">
                                            <p className="text-xs text-cyan-400">🤖 AI sẽ tự tạo host phù hợp với nội dung và mood của video. Host sẽ được mô tả chi tiết trong mỗi scene.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Host Interactions */}
                                <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg">
                                    <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                                        <span className="text-xl">🎬</span>
                                        Host tương tác đồ vật (chọn để đưa vào kịch bản)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'drink', icon: '🥤', label: 'Uống nước/cà phê', desc: 'Cầm cốc uống giữa câu nói' },
                                            { id: 'book', icon: '📚', label: 'Cầm sách/sổ', desc: 'Mở sách, lật trang, ghi chép' },
                                            { id: 'snack', icon: '🍪', label: 'Ăn snack/bánh', desc: 'Ăn nhẹ nhàng, casual' },
                                            { id: 'write', icon: '✍️', label: 'Cầm bút viết', desc: 'Viết lên giấy/bảng' },
                                            { id: 'walk', icon: '🚶', label: 'Đi lại trong phòng', desc: 'Đứng dậy, đi qua đi lại' },
                                            { id: 'window', icon: '🪟', label: 'Nhìn ra cửa sổ', desc: 'Đi tới cửa sổ suy nghĩ' },
                                            { id: 'phone', icon: '📱', label: 'Cầm điện thoại', desc: 'Check điện thoại, chỉ màn hình' },
                                            { id: 'desk', icon: '💻', label: 'Tương tác bàn làm việc', desc: 'Gõ bàn, sắp xếp đồ' },
                                        ].map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    setKolHostInteractions(prev =>
                                                        prev.includes(item.id)
                                                            ? prev.filter(id => id !== item.id)
                                                            : [...prev, item.id]
                                                    )
                                                }}
                                                className={`px-3 py-2 rounded-lg text-xs transition flex items-center gap-1.5 ${kolHostInteractions.includes(item.id)
                                                    ? 'bg-amber-500/30 border border-amber-500 text-white'
                                                    : 'bg-[var(--bg-secondary)] border border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                                                    }`}
                                                title={item.desc}
                                            >
                                                <span>{item.icon}</span>
                                                <span>{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] mt-2">
                                        {kolHostInteractions.length === 0
                                            ? '💡 Chưa chọn - AI sẽ tự chọn tương tác phù hợp'
                                            : `✅ Đã chọn ${kolHostInteractions.length} tương tác - sẽ được đưa vào kịch bản`}
                                    </p>
                                </div>

                                {/* Content Style */}
                                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                                    <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                                        <span className="text-xl">✍️</span>
                                        Phong cách kịch bản
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'dua_leo', icon: '🍈', name: 'Dưa Leo Style', desc: 'Mỉa mai, châm biếm, phân tích sâu, hài hước đen' },
                                            { id: 'long_style', icon: '🔥', name: 'Lóng Style', desc: 'Kể chuyện cuốn hút, drama, twist bất ngờ' },
                                            { id: 'commentary', icon: '🎤', name: 'Commentary', desc: 'Bình luận, phản biện, góc nhìn khác biệt' },
                                            { id: 'storytelling', icon: '📚', name: 'Storytelling', desc: 'Kể chuyện nhẹ nhàng, cảm xúc, sâu lắng' },
                                            { id: '教育', icon: '🎓', name: 'Education', desc: 'Giải thích dễ hiểu, ví dụ thực tế, hướng dẫn' },
                                            { id: 'freestyle', icon: '🎨', name: 'Tự do', desc: 'AI tự chọn phong cách phù hợp nội dung' },
                                        ].map(style => (
                                            <button
                                                key={style.id}
                                                onClick={() => setKolContentStyle(style.id)}
                                                className={`p-3 rounded-lg text-left transition border ${kolContentStyle === style.id
                                                    ? 'bg-purple-500/30 border-purple-500 text-white'
                                                    : 'bg-[var(--bg-secondary)] border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span>{style.icon}</span>
                                                    <span className="text-xs font-medium">{style.name}</span>
                                                </div>
                                                <p className="text-[10px] text-[var(--text-muted)] leading-tight">{style.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                    <p className="text-xs text-[var(--text-muted)]">
                                        ℹ️ Mật độ thoại mặc định cho KOL: <strong className="text-green-400">18-21 từ/câu</strong> (phù hợp với kiểu nói chuyện tự nhiên trước camera)
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Cinematic Style Selection (when cinematic_film mode) */}
                        {voiceOverMode === 'cinematic_film' && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg">
                                <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                                    <span className="text-xl">🎬</span>
                                    Chọn phong cách điện ảnh
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {CINEMATIC_STYLES.map(style => (
                                        <div
                                            key={style.id}
                                            onClick={() => setCinematicStyle(style.id)}
                                            className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${cinematicStyle === style.id
                                                ? 'border-amber-500 bg-amber-500/20'
                                                : 'border-transparent bg-[var(--bg-tertiary)] hover:border-amber-500/50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">{style.icon}</span>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{style.nameVi}</p>
                                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{style.name}</p>
                                                    <p className="text-xs text-[var(--text-secondary)] mt-1">{style.description}</p>
                                                    <div className="mt-2 text-xs">
                                                        <span className="text-amber-400">📷 </span>
                                                        <span className="text-[var(--text-muted)]">{style.visualLanguage}</span>
                                                    </div>
                                                    <div className="mt-1 text-xs">
                                                        <span className="text-green-400">✅ </span>
                                                        <span className="text-[var(--text-muted)]">{style.useCase}</span>
                                                    </div>
                                                </div>
                                                {cinematicStyle === style.id && (
                                                    <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Storyteller B-Roll Option */}
                        {voiceOverMode === 'host_storyteller' && (
                            <div className="mb-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">🎬 Chèn B-Roll vào câu chuyện</p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {storytellerBrollEnabled
                                                ? 'Host + cảnh B-Roll minh họa xen kẽ'
                                                : '100% Host trên màn hình suốt video'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setStorytellerBrollEnabled(!storytellerBrollEnabled)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${storytellerBrollEnabled
                                            ? 'bg-[var(--accent-primary)] text-white'
                                            : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                                            }`}
                                    >
                                        {storytellerBrollEnabled ? 'B-Roll ON' : '100% Host'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Voice Settings (for Voice Over mode) */}
                        {voiceOverMode === 'voice_over' && (
                            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium mb-2">🎙️ Giọng đọc</label>
                                    <select
                                        value={voiceGender}
                                        onChange={(e) => setVoiceGender(e.target.value as 'male' | 'female' | 'auto')}
                                        className="input-field w-full"
                                    >
                                        <option value="auto">🔄 Tự động</option>
                                        <option value="female">👩 Giọng Nữ</option>
                                        <option value="male">👨 Giọng Nam</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">🎭 Tone giọng</label>
                                    <select
                                        value={voiceTone}
                                        onChange={(e) => setVoiceTone(e.target.value as 'warm' | 'professional' | 'energetic' | 'calm' | 'serious')}
                                        className="input-field w-full"
                                    >
                                        <option value="warm">🌸 Ấm áp, thân thiện</option>
                                        <option value="professional">💼 Chuyên nghiệp</option>
                                        <option value="energetic">⚡ Năng động, sôi nổi</option>
                                        <option value="calm">🧘 Điềm tĩnh, nhẹ nhàng</option>
                                        <option value="serious">📰 Nghiêm túc (tin tức)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Narrative Storytelling Settings */}
                        {voiceOverMode === 'narrative_storytelling' && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-lg">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <span className="text-xl">📖</span>
                                    Kể Chuyện B-roll (Phong cách Anh Dư Leo)
                                </h4>

                                {/* Template Selection */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-2">Chọn template kể chuyện</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {narrativeTemplates.map(template => (
                                            <button
                                                key={template.id}
                                                onClick={() => setNarrativeTemplateId(template.id)}
                                                className={`p-3 rounded-lg text-left transition ${narrativeTemplateId === template.id
                                                    ? 'bg-orange-500/20 border-2 border-orange-500'
                                                    : 'bg-[var(--bg-secondary)] border border-transparent hover:border-orange-500/50'
                                                    }`}
                                            >
                                                <div className="font-medium text-sm">{template.name}</div>
                                                <div className="text-xs text-[var(--text-muted)] mt-1">{template.description}</div>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {template.suitableFor.slice(0, 3).map((tag, i) => (
                                                        <span key={i} className="px-1.5 py-0.5 bg-orange-500/10 text-orange-400 text-xs rounded">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Key Points */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-2">Điểm chính cần đề cập (tuỳ chọn)</label>
                                    <input
                                        type="text"
                                        value={narrativeKeyPoints}
                                        onChange={(e) => setNarrativeKeyPoints(e.target.value)}
                                        placeholder="VD: Tiết kiệm, Đầu tư, Kiên nhẫn (phân cách bằng dấu phẩy)"
                                        className="input-field w-full"
                                    />
                                    <p className="text-xs text-[var(--text-muted)] mt-1">
                                        AI sẽ tự động tích hợp các điểm này vào kịch bản
                                    </p>
                                </div>

                                {/* Host Mode Toggle */}
                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-2">Chế độ hiển thị</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setNarrativeWithHost(false)}
                                            className={`flex-1 p-3 rounded-lg text-sm transition ${!narrativeWithHost
                                                ? 'bg-orange-500/20 border-2 border-orange-500'
                                                : 'bg-[var(--bg-secondary)] border border-transparent hover:border-orange-500/50'
                                                }`}
                                        >
                                            <div className="font-medium">🎬 100% B-roll</div>
                                            <div className="text-xs text-[var(--text-muted)] mt-1">Chỉ hình minh họa + voiceover</div>
                                        </button>
                                        <button
                                            onClick={() => setNarrativeWithHost(true)}
                                            className={`flex-1 p-3 rounded-lg text-sm transition ${narrativeWithHost
                                                ? 'bg-orange-500/20 border-2 border-orange-500'
                                                : 'bg-[var(--bg-secondary)] border border-transparent hover:border-orange-500/50'
                                                }`}
                                        >
                                            <div className="font-medium">👤 Có Host dẫn chuyện</div>
                                            <div className="text-xs text-[var(--text-muted)] mt-1">Host xuất hiện + kể chuyện</div>
                                        </button>
                                    </div>
                                </div>

                                {/* Host Character Selector */}
                                {narrativeWithHost && channel && channel.characters.length > 0 && (
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium mb-2">Chọn Host dẫn chuyện</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            <button
                                                onClick={() => setNarrativeHostId('')}
                                                className={`p-3 rounded-lg text-left transition text-sm ${narrativeHostId === ''
                                                    ? 'bg-orange-500/20 border-2 border-orange-500'
                                                    : 'bg-[var(--bg-secondary)] border border-transparent hover:border-orange-500/50'
                                                    }`}
                                            >
                                                <div className="font-medium">🤖 AI tự quyết định</div>
                                                <div className="text-xs text-[var(--text-muted)] mt-0.5">AI tự mô tả host phù hợp với channel</div>
                                            </button>
                                            {channel.characters.map(char => (
                                                <button
                                                    key={char.id}
                                                    onClick={() => setNarrativeHostId(char.id)}
                                                    className={`p-3 rounded-lg text-left transition text-sm ${narrativeHostId === char.id
                                                        ? 'bg-orange-500/20 border-2 border-orange-500'
                                                        : 'bg-[var(--bg-secondary)] border border-transparent hover:border-orange-500/50'
                                                        }`}
                                                >
                                                    <div className="font-medium flex items-center gap-2">
                                                        {char.isMain && <span className="text-yellow-400">⭐</span>}
                                                        👤 {char.name}
                                                        <span className="text-xs text-orange-400 font-normal">{char.role}</span>
                                                    </div>
                                                    <div className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{char.fullDescription}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {narrativeWithHost && channel && channel.characters.length === 0 && (
                                    <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                        <p className="text-xs text-yellow-400">⚠️ Channel chưa có nhân vật nào. AI sẽ tự tạo host.</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-1">Tạo nhân vật trong phần Nhân Vật để chọn host cụ thể.</p>
                                    </div>
                                )}

                                {/* Tips - Dynamic based on host mode */}
                                <div className="bg-[var(--bg-secondary)] p-3 rounded-lg">
                                    <p className="text-xs text-[var(--text-muted)] mb-2">💡 <strong>Mẹo:</strong></p>
                                    {narrativeWithHost ? (
                                        <ul className="text-xs text-[var(--text-muted)] space-y-1">
                                            <li>• Host sẽ xuất hiện trên màn hình, kể chuyện trực tiếp</li>
                                            <li>• Story elements sẽ xuất hiện xung quanh host để minh họa</li>
                                            <li>• Sử dụng nhân vật đã tạo sẵn hoặc AI tự generate</li>
                                        </ul>
                                    ) : (
                                        <ul className="text-xs text-[var(--text-muted)] space-y-1">
                                            <li>• Video sẽ 100% B-roll với voiceover kể chuyện</li>
                                            <li>• Nhập nội dung/topic chi tiết ở phần Nội dung bên dưới</li>
                                            <li>• AI sẽ tự động tạo cấu trúc Hook → Bối cảnh → Kết quả → Lời khuyên</li>
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Row 2: Character selection (if useCharacters) */}
                        {useCharacters && channel.characters.length > 0 && (
                            <div className="mb-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                <label className="block text-sm font-medium mb-2">Chọn nhân vật xuất hiện</label>
                                <div className="flex flex-wrap gap-2">
                                    {channel.characters.map(char => (
                                        <button
                                            key={char.id}
                                            onClick={() => {
                                                setSelectedCharacterIds(prev =>
                                                    prev.includes(char.id)
                                                        ? prev.filter(id => id !== char.id)
                                                        : [...prev, char.id]
                                                )
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-sm transition ${selectedCharacterIds.includes(char.id) || selectedCharacterIds.length === 0
                                                ? 'bg-[var(--accent-primary)] text-white'
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                                                }`}
                                        >
                                            {char.isMain && '⭐ '}{char.name} ({char.role})
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-2">
                                    {selectedCharacterIds.length === 0
                                        ? 'Sử dụng tất cả nhân vật'
                                        : `Đã chọn ${selectedCharacterIds.length} nhân vật`}
                                </p>

                                {/* AI Adapt Characters Option */}
                                <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={adaptCharactersToScript}
                                            onChange={(e) => setAdaptCharactersToScript(e.target.checked)}
                                            className="w-4 h-4 rounded accent-[var(--accent-primary)]"
                                        />
                                        <div className="flex-1">
                                            <span className="text-sm font-medium">🎭 AI tự điều chỉnh nhân vật theo kịch bản</span>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {adaptCharactersToScript
                                                    ? 'AI sẽ thay đổi trang phục, biểu cảm, vị trí... phù hợp với từng cảnh'
                                                    : 'Giữ nguyên mô tả nhân vật gốc trong mọi cảnh'}
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Row 3: Channel Mention & CTA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                <label className="block text-sm font-medium mb-2">Nhắc tên kênh trong script</label>
                                <button
                                    onClick={() => setMentionChannel(!mentionChannel)}
                                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition ${mentionChannel
                                        ? 'bg-[var(--accent-primary)] text-white'
                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                                        }`}
                                >
                                    {mentionChannel ? '✓ Có nhắc kênh' : '✗ Không nhắc kênh'}
                                </button>
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    {mentionChannel ? `AI sẽ nhắc đến "${channel.name}" trong lời thoại` : 'Không nhắc tên kênh'}
                                </p>
                            </div>

                            <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                <label className="block text-sm font-medium mb-2">Call to Action (CTA)</label>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={() => setCtaMode('random')}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${ctaMode === 'random'
                                            ? 'bg-[var(--accent-primary)] text-white'
                                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                                            }`}
                                    >
                                        🎲 Random
                                    </button>
                                    <button
                                        onClick={() => setCtaMode('select')}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${ctaMode === 'select'
                                            ? 'bg-[var(--accent-primary)] text-white'
                                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                                            }`}
                                    >
                                        ✓ Chọn CTA
                                    </button>
                                    <button
                                        onClick={() => setCtaMode('disabled')}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${ctaMode === 'disabled'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                                            }`}
                                    >
                                        🚫 Tắt CTA
                                    </button>
                                </div>
                                {ctaMode === 'select' && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {CTA_OPTIONS.map(cta => (
                                            <button
                                                key={cta.id}
                                                onClick={() => {
                                                    setSelectedCTAs(prev =>
                                                        prev.includes(cta.id)
                                                            ? prev.filter(id => id !== cta.id)
                                                            : [...prev, cta.id]
                                                    )
                                                }}
                                                className={`px-2 py-1 rounded text-xs transition ${selectedCTAs.includes(cta.id)
                                                    ? 'bg-[var(--accent-primary)] text-white'
                                                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'
                                                    }`}
                                            >
                                                {cta.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Advanced Episode Features */}
                        <div className="mb-4 p-4 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 rounded-lg border border-purple-500/30">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-purple-300">
                                ⚡ Tính năng nâng cao
                            </h4>

                            {/* Cinematic Film Script specific options */}
                            {voiceOverMode === 'cinematic_film_script' ? (
                                <div className="space-y-4">
                                    {/* Scene Count Slider */}
                                    <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <p className="text-sm font-medium mb-2">🎬 Số cảnh trong kịch bản: {cinematicSceneCount}</p>
                                        <input
                                            type="range"
                                            min="4"
                                            max="20"
                                            value={cinematicSceneCount}
                                            onChange={(e) => setCinematicSceneCount(parseInt(e.target.value))}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                                            <span>4 cảnh (ngắn)</span>
                                            <span>20 cảnh (dài)</span>
                                        </div>
                                    </div>

                                    {/* Camera Angle Selector */}
                                    <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <p className="text-sm font-medium mb-2">📷 Góc quay & Phong cách camera</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {[
                                                { id: 'one_shot', label: '🎯 One-shot', desc: 'Quay liên tục không cắt' },
                                                { id: 'tracking', label: '🎥 Tracking', desc: 'Theo dõi chủ thể' },
                                                { id: 'drone', label: '🚁 Drone', desc: 'Góc nhìn từ trên cao' },
                                                { id: 'macro', label: '🔍 Macro', desc: 'Cận cảnh chi tiết' },
                                                { id: 'dutch_angle', label: '📐 Dutch Angle', desc: 'Góc nghiêng kịch tính' },
                                                { id: 'handheld', label: '✋ Handheld', desc: 'Cầm tay tự nhiên' },
                                                { id: 'steadicam', label: '🎬 Steadicam', desc: 'Mượt mà di chuyển' },
                                                { id: 'crane', label: '🏗️ Crane', desc: 'Góc cao xuống thấp' },
                                                { id: 'focus_pull', label: '🎯 Focus Pull', desc: 'Chuyển nét nghệ thuật' },
                                                { id: 'slow_motion', label: '🐢 Slow Motion', desc: 'Chậm kịch tính' },
                                                { id: 'pov', label: '👁️ POV', desc: 'Góc nhìn nhân vật' },
                                                { id: 'dynamic_angles', label: '🌀 Dynamic Mix', desc: 'AI chọn đa dạng' }
                                            ].map(style => (
                                                <button
                                                    key={style.id}
                                                    onClick={() => {
                                                        if (cinematicCameraStyles.includes(style.id)) {
                                                            setCinematicCameraStyles(cinematicCameraStyles.filter(s => s !== style.id))
                                                        } else {
                                                            setCinematicCameraStyles([...cinematicCameraStyles, style.id])
                                                        }
                                                    }}
                                                    className={`p-2 rounded-lg text-left transition ${cinematicCameraStyles.includes(style.id)
                                                        ? 'bg-purple-500/30 border-purple-500 border'
                                                        : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)]'
                                                        }`}
                                                >
                                                    <p className="text-xs font-medium">{style.label}</p>
                                                    <p className="text-[10px] text-[var(--text-muted)]">{style.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)] mt-2">
                                            💡 Chọn nhiều góc quay để AI phối hợp đa dạng trong kịch bản
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Visual Hook Layering */}
                                    <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium">🎬 Visual Hook (15 giây đầu)</p>
                                            <p className="text-xs text-[var(--text-muted)]">2 cảnh CGI/Macro ấn tượng mở đầu</p>
                                        </div>
                                        <button
                                            onClick={() => setVisualHookEnabled(!visualHookEnabled)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${visualHookEnabled
                                                ? 'bg-[var(--accent-primary)] text-white'
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                                                }`}
                                        >
                                            {visualHookEnabled ? 'ON' : 'OFF'}
                                        </button>
                                    </div>

                                    {/* Emotional Curve */}
                                    <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium">🎭 Emotional Curve</p>
                                            <p className="text-xs text-[var(--text-muted)]">Xen kẽ fast-cuts & slow-burn</p>
                                        </div>
                                        <button
                                            onClick={() => setEmotionalCurveEnabled(!emotionalCurveEnabled)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${emotionalCurveEnabled
                                                ? 'bg-[var(--accent-primary)] text-white'
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                                                }`}
                                        >
                                            {emotionalCurveEnabled ? 'ON' : 'OFF'}
                                        </button>
                                    </div>

                                    {/* Spatial Audio */}
                                    <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium">🔊 Spatial Audio 3D</p>
                                            <p className="text-xs text-[var(--text-muted)]">Âm thanh định hướng tự động</p>
                                        </div>
                                        <button
                                            onClick={() => setSpatialAudioEnabled(!spatialAudioEnabled)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${spatialAudioEnabled
                                                ? 'bg-[var(--accent-primary)] text-white'
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                                                }`}
                                        >
                                            {spatialAudioEnabled ? 'ON' : 'OFF'}
                                        </button>
                                    </div>

                                    {/* Music Mode */}
                                    <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <p className="text-sm font-medium mb-2">🎵 Chế độ âm thanh</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setMusicMode('with_music')}
                                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${musicMode === 'with_music'
                                                    ? 'bg-[var(--accent-primary)] text-white'
                                                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                                                    }`}
                                            >
                                                🎶 Có nhạc nền
                                            </button>
                                            <button
                                                onClick={() => setMusicMode('ambient_only')}
                                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${musicMode === 'ambient_only'
                                                    ? 'bg-[var(--accent-primary)] text-white'
                                                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                                                    }`}
                                            >
                                                🔈 Chỉ âm thanh môi trường
                                            </button>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)] mt-2">
                                            {musicMode === 'with_music'
                                                ? '✓ Có nhạc nền phù hợp với mood từng cảnh'
                                                : '✓ Chỉ giữ âm thanh tự nhiên: tiếng bước chân, gió, mưa...'}
                                        </p>
                                    </div>

                                    {/* Dialogue Density */}
                                    <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <p className="text-sm font-medium mb-2">💬 Mật độ lời thoại (từ/câu)</p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="5"
                                                max="30"
                                                value={dialogueDensityMin}
                                                onChange={(e) => setDialogueDensityMin(Math.max(5, parseInt(e.target.value) || 12))}
                                                className="input-field w-16 text-center text-sm"
                                            />
                                            <span className="text-[var(--text-muted)]">–</span>
                                            <input
                                                type="number"
                                                min="10"
                                                max="50"
                                                value={dialogueDensityMax}
                                                onChange={(e) => setDialogueDensityMax(Math.max(dialogueDensityMin + 1, parseInt(e.target.value) || 18))}
                                                className="input-field w-16 text-center text-sm"
                                            />
                                            <span className="text-xs text-[var(--text-muted)]">từ</span>
                                        </div>
                                    </div>

                                    {/* Voice Settings - Full Width */}
                                    <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg md:col-span-2">
                                        <p className="text-sm font-medium mb-3">🎙️ Cài đặt giọng nói</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Voice Gender */}
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)] mb-2">Giới tính giọng:</p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setVoiceGender('auto')}
                                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${voiceGender === 'auto'
                                                            ? 'bg-[var(--accent-primary)] text-white'
                                                            : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                                                            }`}
                                                    >
                                                        🤖 Tự động
                                                    </button>
                                                    <button
                                                        onClick={() => setVoiceGender('male')}
                                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${voiceGender === 'male'
                                                            ? 'bg-blue-500 text-white'
                                                            : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                                                            }`}
                                                    >
                                                        👨 Nam
                                                    </button>
                                                    <button
                                                        onClick={() => setVoiceGender('female')}
                                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${voiceGender === 'female'
                                                            ? 'bg-pink-500 text-white'
                                                            : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                                                            }`}
                                                    >
                                                        👩 Nữ
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Voice Tone */}
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)] mb-2">Tone giọng nói:</p>
                                                <select
                                                    value={voiceTone}
                                                    onChange={(e) => setVoiceTone(e.target.value as typeof voiceTone)}
                                                    className="input-field w-full text-sm"
                                                >
                                                    <option value="auto">🤖 Tự động (AI chọn theo nội dung)</option>
                                                    <option value="warm">🌤️ Ấm áp - Thân thiện, gần gũi</option>
                                                    <option value="professional">💼 Chuyên nghiệp - Tin tức, giáo dục</option>
                                                    <option value="energetic">⚡ Năng động - Hào hứng, phấn khích</option>
                                                    <option value="calm">🧘 Điềm tĩnh - Thư giãn, mindfulness</option>
                                                    <option value="dramatic">🎭 Kịch tính - Story, suspense</option>
                                                </select>
                                            </div>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)] mt-2">
                                            {voiceGender === 'auto'
                                                ? '✓ AI sẽ tự chọn giọng phù hợp với nội dung và phong cách kênh'
                                                : `✓ Cố định giọng ${voiceGender === 'male' ? 'nam' : 'nữ'} xuyên suốt video`}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Native Ad Insertion */}
                        <div className="mb-4 p-4 bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-lg border border-amber-500/30">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold flex items-center gap-2 text-amber-300">
                                    💰 Quảng cáo tự nhiên (Native Ads)
                                </h4>
                                <button
                                    onClick={() => setAdEnabled(!adEnabled)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${adEnabled
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                                        }`}
                                >
                                    {adEnabled ? 'ON' : 'OFF'}
                                </button>
                            </div>

                            {adEnabled && (
                                <div className="space-y-3">
                                    {/* Product Info Text */}
                                    <div>
                                        <label className="block text-xs text-[var(--text-muted)] mb-1">
                                            📝 Mô tả sản phẩm/dịch vụ
                                        </label>
                                        <textarea
                                            placeholder="Nhập mô tả sản phẩm muốn quảng cáo trong video..."
                                            value={adProductInfo}
                                            onChange={(e) => setAdProductInfo(e.target.value)}
                                            rows={3}
                                            className="input-field w-full text-sm resize-none"
                                        />
                                    </div>

                                    {/* Product Image URL + Analyze */}
                                    <div>
                                        <label className="block text-xs text-[var(--text-muted)] mb-1">
                                            🖼️ URL hình ảnh sản phẩm (AI sẽ phân tích)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                placeholder="https://example.com/product-image.jpg"
                                                value={productImageUrl}
                                                onChange={(e) => setProductImageUrl(e.target.value)}
                                                className="input-field flex-1 text-sm"
                                            />
                                            <button
                                                onClick={handleAnalyzeProduct}
                                                disabled={isAnalyzingAdProduct || (!productImageUrl && !adProductInfo)}
                                                className="btn-secondary px-3 flex items-center gap-1 text-sm"
                                            >
                                                {isAnalyzingAdProduct ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>🔍 Phân tích</>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Product Link */}
                                    <div>
                                        <label className="block text-xs text-[var(--text-muted)] mb-1">
                                            🔗 Link sản phẩm (URL mua hàng)
                                        </label>
                                        <input
                                            type="url"
                                            placeholder="https://shopee.vn/product-link"
                                            value={productLink}
                                            onChange={(e) => setProductLink(e.target.value)}
                                            className="input-field w-full text-sm"
                                        />
                                    </div>

                                    {/* Analyzed Result */}
                                    {analyzedProduct && (
                                        <div className="p-3 bg-[var(--bg-primary)] rounded-lg border border-amber-500/20">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-amber-300 flex items-center gap-1">
                                                        ✓ {analyzedProduct.name}
                                                    </p>
                                                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                                                        {analyzedProduct.description}
                                                    </p>
                                                    {analyzedProduct.features.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {analyzedProduct.features.slice(0, 3).map((f, i) => (
                                                                <span key={i} className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                                                                    {f}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setAnalyzedProduct(null)}
                                                    className="text-xs text-[var(--text-muted)] hover:text-red-400"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Ad Styles Selection */}
                                    <div>
                                        <label className="block text-xs text-[var(--text-muted)] mb-2">
                                            🎨 Chọn style quảng cáo (để trống = AI tự chọn đa dạng)
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {AD_STYLES.map(style => (
                                                <button
                                                    key={style.id}
                                                    onClick={() => {
                                                        setSelectedAdStyles(prev =>
                                                            prev.includes(style.id)
                                                                ? prev.filter(s => s !== style.id)
                                                                : [...prev, style.id]
                                                        )
                                                    }}
                                                    className={`px-2 py-1 rounded text-xs transition ${selectedAdStyles.includes(style.id)
                                                        ? 'bg-amber-500 text-white'
                                                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                                        }`}
                                                    title={style.desc}
                                                >
                                                    {style.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ad Scene Count */}
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs text-[var(--text-muted)]">
                                            📊 Số cảnh quảng cáo:
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setAdSceneCount(Math.max(1, adSceneCount - 1))}
                                                className="w-7 h-7 rounded bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] flex items-center justify-center"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-medium">{adSceneCount}</span>
                                            <button
                                                onClick={() => setAdSceneCount(Math.min(5, adSceneCount + 1))}
                                                className="w-7 h-7 rounded bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] flex items-center justify-center"
                                            >
                                                +
                                            </button>
                                            <span className="text-xs text-[var(--text-muted)]">cảnh</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-[var(--text-muted)]">
                                        💡 {selectedAdStyles.length > 0
                                            ? `Sẽ dùng ${selectedAdStyles.length} style đã chọn cho ${adSceneCount} cảnh quảng cáo`
                                            : `AI sẽ tự chọn style đa dạng cho ${adSceneCount} cảnh quảng cáo`
                                        }
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Generate button */}
                        <button
                            onClick={handleGenerateEpisode}
                            disabled={isGenerating}
                            className="btn-primary flex items-center gap-2 w-full md:w-auto"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    AI đang tạo Episode...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Tạo Episode {selectedCategoryId
                                        ? (channel.episodes.filter(e => e.categoryId === selectedCategoryId).length + 1)
                                        : (channel.episodes.filter(e => !e.categoryId).length + 1)
                                    }
                                    {selectedCategoryId && categories.find(c => c.id === selectedCategoryId) && (
                                        <span className="text-xs opacity-70">
                                            ({categories.find(c => c.id === selectedCategoryId)?.name})
                                        </span>
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}

            {/* Episodes List */}
            <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <Film className="w-5 h-5" />
                    Episodes ({channel.episodes.length})
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="ml-auto px-3 py-1 text-xs rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Danh mục
                    </button>
                </h3>

                {/* Category Filter Tabs */}
                {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button
                            onClick={() => setFilterCategoryId(null)}
                            className={`px-3 py-1.5 rounded-full text-sm transition ${filterCategoryId === null
                                ? 'bg-[var(--accent-primary)] text-white'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                }`}
                        >
                            📁 Tất cả ({channel.episodes.length})
                        </button>
                        {categories.map(cat => {
                            const count = channel.episodes.filter(e => e.categoryId === cat.id).length
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setFilterCategoryId(cat.id)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition flex items-center gap-1 ${filterCategoryId === cat.id
                                        ? 'text-white'
                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                        }`}
                                    style={filterCategoryId === cat.id ? { backgroundColor: cat.color } : {}}
                                >
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                    {cat.name} ({count})
                                </button>
                            )
                        })}
                        <button
                            onClick={() => setFilterCategoryId('uncategorized')}
                            className={`px-3 py-1.5 rounded-full text-sm transition ${filterCategoryId === 'uncategorized'
                                ? 'bg-gray-500 text-white'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                }`}
                        >
                            📂 Chưa phân loại ({channel.episodes.filter(e => !e.categoryId).length})
                        </button>
                        <button
                            onClick={() => setShowCategoryModal(true)}
                            className="px-3 py-1.5 rounded-full text-sm bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Danh mục
                        </button>
                    </div>
                )}

                {/* Category Management Modal */}
                {showCategoryModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="glass-card p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4">📁 Quản lý Danh mục</h3>

                            {/* Create new category */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Tên danh mục mới..."
                                    className="input-field flex-1"
                                />
                                <input
                                    type="color"
                                    value={newCategoryColor}
                                    onChange={(e) => setNewCategoryColor(e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer"
                                />
                                <button onClick={handleCreateCategory} className="btn-primary px-4">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* List categories */}
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between p-2 bg-[var(--bg-secondary)] rounded">
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }} />
                                            <span>{cat.name}</span>
                                            <span className="text-xs text-[var(--text-muted)]">
                                                ({cat._count?.episodes || 0} episodes)
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            className="text-red-400 hover:text-red-300 p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {categories.length === 0 && (
                                    <p className="text-[var(--text-muted)] text-center py-4">
                                        Chưa có danh mục nào
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={() => setShowCategoryModal(false)}
                                className="btn-secondary w-full mt-4"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}

                {/* Bulk Move Modal */}
                {showBulkMoveModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="glass-card p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4">📁 Di chuyển {selectedEpisodeIds.length} episode</h3>

                            <div className="space-y-2">
                                <button
                                    onClick={() => handleBulkMove(null)}
                                    className="w-full p-3 text-left bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] rounded flex items-center gap-2"
                                >
                                    📂 Chưa phân loại
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleBulkMove(cat.id)}
                                        className="w-full p-3 text-left bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] rounded flex items-center gap-2"
                                    >
                                        <span className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }} />
                                        {cat.name}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowBulkMoveModal(false)}
                                className="btn-secondary w-full mt-4"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                )}

                {/* Bulk Action Bar */}
                {selectedEpisodeIds.length > 0 && (
                    <div className="flex items-center gap-3 p-3 mb-4 bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 rounded-lg">
                        <span className="text-sm font-medium">
                            Đã chọn {selectedEpisodeIds.length} episode
                        </span>
                        <button
                            onClick={() => setShowBulkMoveModal(true)}
                            className="px-3 py-1.5 text-sm bg-[var(--accent-primary)] text-white rounded hover:opacity-90 flex items-center gap-1"
                        >
                            📁 Di chuyển
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:opacity-90 flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" /> Xóa
                        </button>
                        <button
                            onClick={() => setSelectedEpisodeIds([])}
                            className="px-3 py-1.5 text-sm bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded hover:bg-[var(--bg-hover)]"
                        >
                            Bỏ chọn
                        </button>
                    </div>
                )}

                {/* Select All Button */}
                {channel.episodes.length > 0 && selectedEpisodeIds.length === 0 && (
                    <div className="mb-4">
                        <button
                            onClick={selectAllEpisodes}
                            className="text-sm text-[var(--text-secondary)] hover:text-white flex items-center gap-1"
                        >
                            ☑️ Chọn tất cả
                        </button>
                    </div>
                )}

                {channel.episodes.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <Film className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                        <p className="text-[var(--text-secondary)]">
                            Chưa có episode nào. Tạo episode đầu tiên!
                        </p>
                    </div>
                ) : (
                    (filterCategoryId === null
                        ? channel.episodes
                        : filterCategoryId === 'uncategorized'
                            ? channel.episodes.filter(e => !e.categoryId)
                            : channel.episodes.filter(e => e.categoryId === filterCategoryId)
                    ).map((episode, index) => (
                        <motion.div
                            key={episode.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card overflow-hidden"
                        >
                            {/* Episode Header */}
                            <div className="w-full flex items-center p-4 hover:bg-[var(--bg-hover)] transition-colors text-left gap-3 min-w-0">
                                {/* Checkbox for bulk selection */}
                                <input
                                    type="checkbox"
                                    checked={selectedEpisodeIds.includes(episode.id)}
                                    onChange={() => toggleEpisodeSelection(episode.id)}
                                    className="w-5 h-5 rounded accent-[var(--accent-primary)] cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    onClick={() => setExpandedEpisode(
                                        expandedEpisode === episode.id ? null : episode.id
                                    )}
                                    className="flex-1 flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-purple-500 flex items-center justify-center text-white font-bold">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium">{episode.title}</p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {episode.scenes.length} scenes • {episode.status}
                                                {episode.categoryId && categories.find(c => c.id === episode.categoryId) && (
                                                    <span
                                                        className="ml-2 px-2 py-0.5 rounded text-[10px]"
                                                        style={{
                                                            backgroundColor: categories.find(c => c.id === episode.categoryId)?.color + '30',
                                                            color: categories.find(c => c.id === episode.categoryId)?.color
                                                        }}
                                                    >
                                                        {categories.find(c => c.id === episode.categoryId)?.name}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    {expandedEpisode === episode.id
                                        ? <ChevronDown className="w-5 h-5" />
                                        : <ChevronRight className="w-5 h-5" />
                                    }
                                </button>

                                {/* Episode Content */}
                                {expandedEpisode === episode.id && (
                                    <div className="border-t border-[var(--border-subtle)] overflow-x-hidden">
                                        {episode.synopsis && (
                                            <div className="px-4 py-3 bg-[var(--bg-tertiary)] break-words">
                                                <p className="text-sm text-[var(--text-secondary)]">
                                                    {episode.synopsis}
                                                </p>
                                            </div>
                                        )}

                                        {/* YouTube Strategies - Toggle Section */}
                                        {showYoutubeStrategies === episode.id && (() => {
                                            const metadata = episode.metadata ? JSON.parse(episode.metadata) : null
                                            const strategies = metadata?.youtubeStrategies
                                            if (!strategies) return null

                                            return (
                                                <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                        📺 YouTube Strategies
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {/* 3 Titles */}
                                                        {strategies.titles?.length > 0 && (
                                                            <div>
                                                                <p className="text-xs text-[var(--text-muted)] mb-1">📝 Titles (3 options)</p>
                                                                <div className="space-y-1">
                                                                    {strategies.titles.map((title: string, i: number) => (
                                                                        <div key={i} className="flex items-center gap-2 bg-[var(--bg-tertiary)] p-2 rounded text-sm">
                                                                            <span className="flex-1">{title}</span>
                                                                            <button
                                                                                onClick={() => {
                                                                                    navigator.clipboard.writeText(title)
                                                                                    toast.success('Đã copy title!')
                                                                                }}
                                                                                className="p-1 hover:bg-[var(--bg-hover)] rounded"
                                                                            >
                                                                                <Copy className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Description */}
                                                        {strategies.description && (
                                                            <div>
                                                                <p className="text-xs text-[var(--text-muted)] mb-1">📄 Description</p>
                                                                <div className="relative bg-[var(--bg-tertiary)] p-2 rounded text-sm">
                                                                    <p className="text-[var(--text-secondary)] whitespace-pre-wrap text-xs">{strategies.description}</p>
                                                                    <button
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(strategies.description)
                                                                            toast.success('Đã copy description!')
                                                                        }}
                                                                        className="absolute top-2 right-2 p-1 hover:bg-[var(--bg-hover)] rounded"
                                                                    >
                                                                        <Copy className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Tags */}
                                                        {strategies.tags?.length > 0 && (
                                                            <div>
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <p className="text-xs text-[var(--text-muted)]">🏷️ Tags ({strategies.tags.length})</p>
                                                                    <button
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(strategies.tags.join(', '))
                                                                            toast.success('Đã copy tags!')
                                                                        }}
                                                                        className="text-xs text-[var(--accent-primary)] hover:underline"
                                                                    >
                                                                        Copy all
                                                                    </button>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {strategies.tags.map((tag: string, i: number) => (
                                                                        <span key={i} className="text-xs bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* 3 Thumbnails */}
                                                        {strategies.thumbnails?.length > 0 && (
                                                            <div>
                                                                <p className="text-xs text-[var(--text-muted)] mb-1">🖼️ Thumbnail Prompts (3 options)</p>
                                                                <div className="space-y-1">
                                                                    {strategies.thumbnails.map((thumb: string, i: number) => (
                                                                        <div key={i} className="flex items-start gap-2 bg-[var(--bg-tertiary)] p-2 rounded text-xs">
                                                                            <span className="flex-1 text-[var(--text-secondary)]">{thumb}</span>
                                                                            <button
                                                                                onClick={() => {
                                                                                    navigator.clipboard.writeText(thumb)
                                                                                    toast.success('Đã copy thumbnail prompt!')
                                                                                }}
                                                                                className="p-1 hover:bg-[var(--bg-hover)] rounded shrink-0"
                                                                            >
                                                                                <Copy className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })()}

                                        {/* Actions */}
                                        <div className="px-4 py-2 flex gap-2 flex-wrap border-b border-[var(--border-subtle)]">
                                            <button
                                                onClick={() => setShowYoutubeStrategies(
                                                    showYoutubeStrategies === episode.id ? null : episode.id
                                                )}
                                                className={`text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${showYoutubeStrategies === episode.id
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                    }`}
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                                </svg>
                                                YouTube
                                            </button>
                                            <button
                                                onClick={() => handleCopyEpisode(episode)}
                                                className="btn-secondary text-sm flex items-center gap-1"
                                            >
                                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                Copy All
                                            </button>
                                            <button
                                                onClick={() => handleTranslateEpisode(episode.id, channel.dialogueLanguage === 'vi' ? 'en' : 'vi')}
                                                disabled={actionLoading === episode.id}
                                                className="btn-secondary text-sm flex items-center gap-1"
                                            >
                                                {actionLoading === episode.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Globe className="w-3 h-3" />
                                                )}
                                                Dịch sang {channel.dialogueLanguage === 'vi' ? 'EN' : 'VI'}
                                            </button>
                                            <button
                                                onClick={() => handleRegenerateEpisode(episode.id)}
                                                disabled={actionLoading === episode.id}
                                                className="btn-secondary text-sm flex items-center gap-1"
                                            >
                                                {actionLoading === episode.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="w-3 h-3" />
                                                )}
                                                Tạo lại
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEpisode(episode.id)}
                                                disabled={actionLoading === episode.id}
                                                className="btn-secondary text-sm flex items-center gap-1 text-red-400 hover:bg-red-500/20"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Xóa
                                            </button>
                                        </div>

                                        {/* Episode Analytics Panel */}
                                        {(() => {
                                            const analytics = analyzeEpisode(episode.scenes)
                                            return (
                                                <div className="px-4 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-[var(--border-subtle)]">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-sm font-medium">📊 Episode Analytics</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                        <div className="bg-[var(--bg-tertiary)] rounded-lg p-2 text-center">
                                                            <div className="text-lg font-bold text-[var(--accent-primary)]">{analytics.totalScenes}</div>
                                                            <div className="text-xs text-[var(--text-muted)]">Scenes</div>
                                                        </div>
                                                        <div className="bg-[var(--bg-tertiary)] rounded-lg p-2 text-center">
                                                            <div className="text-lg font-bold text-green-400">
                                                                {Math.floor(analytics.estimatedDuration / 60)}:{String(analytics.estimatedDuration % 60).padStart(2, '0')}
                                                            </div>
                                                            <div className="text-xs text-[var(--text-muted)]">Est. Duration</div>
                                                        </div>
                                                        <div className="bg-[var(--bg-tertiary)] rounded-lg p-2 text-center">
                                                            <div className="text-lg font-bold text-amber-400">{analytics.avgSceneDuration}s</div>
                                                            <div className="text-xs text-[var(--text-muted)]">Avg/Scene</div>
                                                        </div>
                                                        <div className="bg-[var(--bg-tertiary)] rounded-lg p-2">
                                                            <div className="text-xs text-[var(--text-muted)] mb-1">Structure</div>
                                                            <div className="flex gap-1 text-xs">
                                                                <span className="px-1.5 py-0.5 bg-blue-500/30 rounded text-blue-300">Intro {analytics.structureBreakdown.intro.percent}%</span>
                                                                <span className="px-1.5 py-0.5 bg-purple-500/30 rounded text-purple-300">Content {analytics.structureBreakdown.content.percent}%</span>
                                                                <span className="px-1.5 py-0.5 bg-pink-500/30 rounded text-pink-300">CTA {analytics.structureBreakdown.cta.percent}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })()}

                                        {/* Character Consistency Warnings */}
                                        {channel?.characters && channel.characters.length > 0 && (() => {
                                            const charWarnings = checkCharacterConsistency(episode.scenes, channel.characters)
                                            return charWarnings.length > 0 && (
                                                <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/30">
                                                    <div className="flex items-center gap-2 text-orange-400 text-xs">
                                                        <span className="text-base">🎭</span>
                                                        <span className="font-medium">{charWarnings.length} cảnh báo Character</span>
                                                    </div>
                                                    <ul className="mt-1 text-xs text-orange-300/80">
                                                        {charWarnings.slice(0, 3).map((w, i) => (
                                                            <li key={i}>• {w.message}</li>
                                                        ))}
                                                        {charWarnings.length > 3 && <li>• ...và {charWarnings.length - 3} cảnh báo khác</li>}
                                                    </ul>
                                                </div>
                                            )
                                        })()}

                                        {/* Scenes with Quality Warnings */}
                                        {(() => {
                                            const warnings = analyzeSceneQuality(episode.scenes)
                                            return warnings.length > 0 && (
                                                <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/30">
                                                    <div className="flex items-center gap-2 text-yellow-400 text-xs">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        <span className="font-medium">{warnings.length} cảnh báo chất lượng</span>
                                                    </div>
                                                    <ul className="mt-1 text-xs text-yellow-300/80">
                                                        {warnings.slice(0, 3).map((w, i) => (
                                                            <li key={i}>• {w.message}</li>
                                                        ))}
                                                        {warnings.length > 3 && <li>• ...và {warnings.length - 3} cảnh báo khác</li>}
                                                    </ul>
                                                </div>
                                            )
                                        })()}

                                        {/* Scenes with Drag-Drop */}
                                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, episode.id, episode.scenes)}>
                                            <SortableContext items={episode.scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                                <div className="max-h-[400px] overflow-y-auto">
                                                    {episode.scenes.map(scene => {
                                                        const sceneWarnings = analyzeSceneQuality(episode.scenes).filter(w => w.sceneIds.includes(scene.id))
                                                        return (
                                                            <SortableSceneCard
                                                                key={scene.id}
                                                                scene={scene}
                                                                episodeId={episode.id}
                                                                warnings={sceneWarnings}
                                                                onEdit={() => handleOpenSceneEditor(episode.id, scene)}
                                                                onDelete={() => handleDeleteScene(episode.id, scene.id)}
                                                                onGenerateImage={() => handleGenerateSceneImage(scene.id, scene.promptText)}
                                                                isDeleting={deletingSceneId === scene.id}
                                                                isGeneratingImage={generatingImageForScene === scene.id}
                                                                downloadImage={downloadImage}
                                                            />
                                                        )
                                                    })}
                                                </div>
                                            </SortableContext>
                                        </DndContext>

                                        {/* Add Scene Button */}
                                        <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
                                            {addingSceneToEpisode === episode.id ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={newSceneContext}
                                                        onChange={(e) => setNewSceneContext(e.target.value)}
                                                        placeholder="Mô tả nội dung scene mới (AI sẽ tạo dựa vào context các scene xung quanh)"
                                                        className="input-field text-sm h-20"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={newScenePosition}
                                                            onChange={(e) => setNewScenePosition(Number(e.target.value))}
                                                            className="input-field text-sm flex-1"
                                                        >
                                                            <option value={0}>Thêm vào cuối</option>
                                                            {episode.scenes.map(s => (
                                                                <option key={s.id} value={s.order}>Trước Scene {s.order}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => handleAddSceneWithAI(episode.id)}
                                                            disabled={addingSceneWithAI}
                                                            className="btn-primary text-sm flex items-center gap-1"
                                                        >
                                                            {addingSceneWithAI ? (
                                                                <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
                                                            ) : (
                                                                <><Wand2 className="w-4 h-4" /> Tạo với AI</>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setAddingSceneToEpisode(null)
                                                                setNewSceneContext('')
                                                            }}
                                                            className="btn-secondary text-sm"
                                                        >
                                                            Hủy
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setAddingSceneToEpisode(episode.id)}
                                                    className="w-full py-2 border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--accent-primary)] rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Thêm Scene mới (AI)
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Bulk Create Modal */}
            {showBulkCreate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-secondary)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-[var(--border-subtle)]">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    📦 Bulk Create Episodes
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowBulkCreate(false)
                                        setBulkEpisodes([])
                                    }}
                                    className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg"
                                    disabled={bulkGenerating}
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                                Thêm nhiều mô tả episode và tạo hàng loạt
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Mode Toggle */}
                            <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-1">
                                <button
                                    onClick={() => {
                                        setBulkMode('manual')
                                        setBulkEpisodes([])
                                    }}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${bulkMode === 'manual'
                                        ? 'bg-[var(--accent-primary)] text-white'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                    disabled={bulkGenerating}
                                >
                                    ✍️ Nhập thủ công
                                </button>
                                <button
                                    onClick={() => {
                                        setBulkMode('auto')
                                        setBulkEpisodes([])
                                    }}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${bulkMode === 'auto'
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                    disabled={bulkGenerating}
                                >
                                    🤖 AI Tự động
                                </button>
                            </div>

                            {/* AUTO MODE */}
                            {bulkMode === 'auto' && (
                                <div className="space-y-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">🎯 Chủ đề chính (Series)</label>
                                        <input
                                            type="text"
                                            value={autoMainTopic}
                                            onChange={(e) => setAutoMainTopic(e.target.value)}
                                            placeholder="VD: 10 bí mật thành công của người giàu, Hành trình học tiếng Anh..."
                                            className="input-field w-full"
                                            disabled={bulkGenerating || autoGeneratingIdeas}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">📊 Số Episode cần tạo</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min={2}
                                                max={20}
                                                value={autoEpisodeCount}
                                                onChange={(e) => setAutoEpisodeCount(parseInt(e.target.value))}
                                                className="flex-1"
                                                disabled={bulkGenerating || autoGeneratingIdeas}
                                            />
                                            <span className="text-lg font-bold text-[var(--accent-primary)] w-8 text-center">
                                                {autoEpisodeCount}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAutoGenerateIdeas}
                                        disabled={!autoMainTopic.trim() || autoGeneratingIdeas || bulkGenerating}
                                        className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {autoGeneratingIdeas ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Đang tạo ý tưởng...
                                            </>
                                        ) : (
                                            <>
                                                🧠 Tạo {autoEpisodeCount} Ý tưởng Episode
                                            </>
                                        )}
                                    </button>

                                    {autoCategoryName && (
                                        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                            <p className="text-xs text-[var(--text-muted)]">📁 Danh mục sẽ được tạo:</p>
                                            <p className="font-medium">{autoCategoryName}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* MANUAL MODE */}
                            {bulkMode === 'manual' && (
                                <>
                                    {/* Category Selector */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">📁 Danh mục mặc định</label>
                                        <select
                                            value={bulkCategoryId}
                                            onChange={(e) => setBulkCategoryId(e.target.value)}
                                            className="input-field w-full"
                                            disabled={bulkGenerating}
                                        >
                                            <option value="">Chưa phân loại</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Add Episode Form */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">📝 Mô tả Episode mới</label>
                                        <div className="flex gap-2">
                                            <textarea
                                                value={bulkNewDescription}
                                                onChange={(e) => setBulkNewDescription(e.target.value)}
                                                placeholder="Nhập mô tả nội dung cho episode... (VD: 10 cách kiếm tiền online, Bí mật thành công...)"
                                                className="input-field flex-1 min-h-[80px]"
                                                disabled={bulkGenerating}
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (bulkNewDescription.trim()) {
                                                    setBulkEpisodes([...bulkEpisodes, {
                                                        description: bulkNewDescription.trim(),
                                                        categoryId: bulkCategoryId
                                                    }])
                                                    setBulkNewDescription('')
                                                }
                                            }}
                                            disabled={!bulkNewDescription.trim() || bulkGenerating}
                                            className="mt-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                                        >
                                            ➕ Thêm Episode
                                        </button>
                                    </div>

                                    {/* Episodes List */}
                                    {bulkEpisodes.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                📋 Danh sách Episodes ({bulkEpisodes.length})
                                            </label>
                                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                                {bulkEpisodes.map((ep, i) => (
                                                    <div key={i} className="flex items-start gap-2 bg-[var(--bg-tertiary)] p-3 rounded-lg">
                                                        <span className="text-sm font-bold text-[var(--accent-primary)]">
                                                            #{i + 1}
                                                        </span>
                                                        <div className="flex-1">
                                                            <p className="text-sm">{ep.description}</p>
                                                            {ep.categoryId && (
                                                                <span className="text-xs text-[var(--text-muted)]">
                                                                    📁 {categories.find(c => c.id === ep.categoryId)?.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setBulkEpisodes(bulkEpisodes.filter((_, idx) => idx !== i))
                                                            }}
                                                            disabled={bulkGenerating}
                                                            className="text-red-400 hover:text-red-300 p-1"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Progress */}
                                    {bulkGenerating && (
                                        <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">Đang tạo...</span>
                                                <span className="text-sm text-[var(--accent-primary)]">
                                                    {bulkProgress.current}/{bulkProgress.total}
                                                </span>
                                            </div>
                                            <div className="w-full bg-[var(--bg-primary)] rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Episodes List (for both modes) */}
                            {bulkEpisodes.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        📋 Danh sách Episodes ({bulkEpisodes.length})
                                    </label>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {bulkEpisodes.map((ep, i) => (
                                            <div key={i} className="flex items-start gap-2 bg-[var(--bg-tertiary)] p-3 rounded-lg">
                                                <span className="text-sm font-bold text-[var(--accent-primary)]">
                                                    #{i + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <p className="text-sm">{ep.description}</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setBulkEpisodes(bulkEpisodes.filter((_, idx) => idx !== i))
                                                    }}
                                                    disabled={bulkGenerating}
                                                    className="text-red-400 hover:text-red-300 p-1"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Progress */}
                            {bulkGenerating && (
                                <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Đang tạo...</span>
                                        <span className="text-sm text-[var(--accent-primary)]">
                                            {bulkProgress.current}/{bulkProgress.total}
                                        </span>
                                    </div>
                                    <div className="w-full bg-[var(--bg-primary)] rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                                            style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-[var(--border-subtle)] flex gap-3">
                            <button
                                onClick={() => {
                                    setShowBulkCreate(false)
                                    setBulkEpisodes([])
                                    setAutoMainTopic('')
                                    setAutoCategoryName('')
                                }}
                                disabled={bulkGenerating}
                                className="flex-1 py-2 bg-[var(--bg-tertiary)] rounded-lg font-medium hover:bg-[var(--bg-hover)] transition"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleBulkGenerateWithCategory}
                                disabled={bulkEpisodes.length === 0 || bulkGenerating}
                                className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {bulkGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        🚀 Tạo {bulkEpisodes.length} Episodes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scene Editor Modal */}
            {editingSceneData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-secondary)] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b border-[var(--border-subtle)]">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    ✏️ Chỉnh sửa Scene {editingSceneData.scene.order}
                                </h2>
                                <button
                                    onClick={() => setEditingSceneData(null)}
                                    className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tiêu đề Scene</label>
                                <input
                                    type="text"
                                    value={sceneEditorTitle}
                                    onChange={(e) => setSceneEditorTitle(e.target.value)}
                                    placeholder="VD: Opening Hook"
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    PromptText <span className="text-xs text-[var(--text-muted)]">({sceneEditorPromptText.length} ký tự)</span>
                                </label>
                                <textarea
                                    value={sceneEditorPromptText}
                                    onChange={(e) => setSceneEditorPromptText(e.target.value)}
                                    placeholder="[VOICEOVER in Vietnamese: ...]. ..."
                                    className="input-field font-mono text-sm h-64"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Thời lượng (giây)</label>
                                <input
                                    type="number"
                                    value={sceneEditorDuration}
                                    onChange={(e) => setSceneEditorDuration(Number(e.target.value))}
                                    min={3}
                                    max={30}
                                    className="input-field w-24"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-[var(--border-subtle)] flex justify-end gap-3">
                            <button
                                onClick={() => setEditingSceneData(null)}
                                disabled={savingScene}
                                className="btn-secondary"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveScene}
                                disabled={savingScene}
                                className="btn-primary flex items-center gap-2"
                            >
                                {savingScene ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                                ) : (
                                    <><Check className="w-4 h-4" /> Lưu thay đổi</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
