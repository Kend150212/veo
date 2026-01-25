'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { motion } from 'framer-motion'
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
    Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { VISUAL_STYLES } from '@/lib/ai-story'

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
    }
]

interface EpisodeScene {
    id: string
    order: number
    title: string | null
    promptText: string
    duration: number
    hookType: string | null
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
        isMain: false
    })
    const [showKnowledge, setShowKnowledge] = useState(false)
    const [expandedNiche, setExpandedNiche] = useState(false)

    // Episode creation options
    const [useCharacters, setUseCharacters] = useState(true)
    const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([])
    const [adaptCharactersToScript, setAdaptCharactersToScript] = useState(false) // AI tự điều chỉnh nhân vật
    const [selectedStyleId, setSelectedStyleId] = useState<string>('')
    const [mentionChannel, setMentionChannel] = useState(false)
    const [ctaMode, setCtaMode] = useState<'random' | 'select'>('random')
    const [selectedCTAs, setSelectedCTAs] = useState<string[]>([])
    const [voiceOverMode, setVoiceOverMode] = useState<'with_host' | 'voice_over' | 'broll_only' | 'host_dynamic_env' | 'host_storyteller' | 'cinematic_film'>('with_host')
    const [cinematicStyle, setCinematicStyle] = useState<string>('cinematic_documentary') // Style cho mode điện ảnh

    // Voice settings (for voice_over mode)
    const [voiceGender, setVoiceGender] = useState<'male' | 'female' | 'auto'>('auto')
    const [voiceTone, setVoiceTone] = useState<'warm' | 'professional' | 'energetic' | 'calm' | 'serious'>('warm')

    // Storyteller B-Roll option
    const [storytellerBrollEnabled, setStorytellerBrollEnabled] = useState(false)

    // Advanced Episode Features
    const [visualHookEnabled, setVisualHookEnabled] = useState(true)
    const [emotionalCurveEnabled, setEmotionalCurveEnabled] = useState(true)
    const [spatialAudioEnabled, setSpatialAudioEnabled] = useState(true)
    const [dialogueDensityMin, setDialogueDensityMin] = useState(12)
    const [dialogueDensityMax, setDialogueDensityMax] = useState(18)

    // Native Ad Insertion
    const [adEnabled, setAdEnabled] = useState(false)
    const [productInfo, setProductInfo] = useState('')
    const [productImageUrl, setProductImageUrl] = useState('')
    const [productLink, setProductLink] = useState('')
    const [isAnalyzingProduct, setIsAnalyzingProduct] = useState(false)
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
        if (!productImageUrl && !productInfo) {
            toast.error('Vui lòng nhập thông tin sản phẩm hoặc URL hình ảnh')
            return
        }
        setIsAnalyzingProduct(true)
        try {
            const res = await fetch('/api/channels/analyze-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: productImageUrl,
                    productInfo,
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
            setIsAnalyzingProduct(false)
        }
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
                    customContent: customContent.trim() || null,
                    voiceOverMode,
                    cinematicStyle: voiceOverMode === 'cinematic_film' ? cinematicStyle : null,
                    voiceGender: voiceOverMode === 'voice_over' ? voiceGender : 'auto',
                    voiceTone: voiceOverMode === 'voice_over' ? voiceTone : 'warm',
                    categoryId: selectedCategoryId,
                    // Advanced Episode Features
                    visualHookEnabled,
                    emotionalCurveEnabled,
                    spatialAudioEnabled,
                    dialogueDensityMin,
                    dialogueDensityMax,
                    // Native Ad Insertion
                    adEnabled,
                    productInfo: adEnabled ? productInfo : null,
                    productImageUrl: adEnabled ? productImageUrl : null,
                    productLink: adEnabled ? productLink : null,
                    analyzedProduct: adEnabled ? analyzedProduct : null,
                    selectedAdStyles: adEnabled ? selectedAdStyles : [],
                    adSceneCount: adEnabled ? adSceneCount : 2,
                    // Storyteller B-Roll option
                    storytellerBrollEnabled: voiceOverMode === 'host_storyteller' ? storytellerBrollEnabled : false
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
            setNewCharacter({ name: '', role: 'host', fullDescription: '', personality: '', isMain: false })
            fetchChannel()
        } catch {
            toast.error('Lỗi lưu nhân vật')
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
            isMain: char.isMain
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
                <button
                    onClick={() => router.push(`/dashboard/channels/${id}/settings`)}
                    className="btn-secondary flex items-center gap-2"
                >
                    <Settings className="w-4 h-4" />
                    Cài đặt
                </button>
            </div>

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
                                    placeholder="VD: Host chính, Khách mời..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mô tả chi tiết *</label>
                                <textarea
                                    value={newCharacter.fullDescription}
                                    onChange={(e) => setNewCharacter({ ...newCharacter, fullDescription: e.target.value })}
                                    className="input-field min-h-[100px]"
                                    placeholder="Mô tả ngoại hình, trang phục, đặc điểm nhận dạng chi tiết..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">🎭 Tính cách nhân vật</label>
                                <textarea
                                    value={newCharacter.personality}
                                    onChange={(e) => setNewCharacter({ ...newCharacter, personality: e.target.value })}
                                    className="input-field min-h-[80px]"
                                    placeholder="VD: Vui vẻ, hài hước, hay đùa. Nói nhanh, thích dùng từ lóng Gen Z. Hay cười toe toét, thích trêu chọc người khác..."
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    AI sẽ dùng tính cách này để tạo dialogue và hành động phù hợp
                                </p>
                            </div>
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
                                    setNewCharacter({ name: '', role: 'host', fullDescription: '', personality: '', isMain: false })
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
                        <select
                            value={selectedStyleId}
                            onChange={(e) => setSelectedStyleId(e.target.value)}
                            className="input-field w-full"
                        >
                            <option value="">Mặc định kênh</option>
                            {VISUAL_STYLES.map(style => (
                                <option key={style.id} value={style.id}>{style.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Loại nội dung</label>
                        <select
                            value={voiceOverMode}
                            onChange={(e) => {
                                const mode = e.target.value as 'with_host' | 'voice_over' | 'broll_only' | 'host_dynamic_env' | 'host_storyteller' | 'cinematic_film'
                                setVoiceOverMode(mode)
                                setUseCharacters(['with_host', 'host_dynamic_env', 'host_storyteller', 'cinematic_film'].includes(mode))
                            }}
                            className="input-field w-full"
                        >
                            <option value="with_host">👤 Có Host/Nhân vật</option>
                            <option value="voice_over">🎙️ Voice Over (Thuyết minh)</option>
                            <option value="broll_only">🎬 B-Roll only (không lời)</option>
                            <option value="host_dynamic_env">🌍 Host 100% + Môi trường động</option>
                            <option value="host_storyteller">🎭 Host Kể Chuyện (Elements sinh động)</option>
                            <option value="cinematic_film">🎬 Điện Ảnh (Kịch bản phim)</option>
                        </select>
                    </div>
                </div>

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
                                    className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                                        cinematicStyle === style.id
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
                    </div>
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
                                    value={productInfo}
                                    onChange={(e) => setProductInfo(e.target.value)}
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
                                        disabled={isAnalyzingProduct || (!productImageUrl && !productInfo)}
                                        className="btn-secondary px-3 flex items-center gap-1 text-sm"
                                    >
                                        {isAnalyzingProduct ? (
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
                            <div className="w-full flex items-center p-4 hover:bg-[var(--bg-hover)] transition-colors text-left gap-3">
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
                                    <div className="border-t border-[var(--border-subtle)]">
                                        {episode.synopsis && (
                                            <div className="px-4 py-3 bg-[var(--bg-tertiary)]">
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

                                        {/* Scenes */}
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {episode.scenes.map(scene => (
                                                <div key={scene.id} className="px-4 py-3 border-b border-[var(--border-subtle)] last:border-0">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-sm">
                                                            Scene {scene.order}: {scene.title}
                                                        </span>
                                                        <span className="text-xs text-[var(--text-muted)]">
                                                            {scene.duration}s
                                                        </span>
                                                    </div>
                                                    <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--bg-primary)] rounded p-2 mono">
                                                        {scene.promptText}
                                                    </pre>
                                                </div>
                                            ))}
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
        </div>
    )
}
