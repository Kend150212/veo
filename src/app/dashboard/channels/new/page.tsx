'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    ArrowRight,
    Tv,
    Search,
    Sparkles,
    Loader2,
    Check,
    Youtube,
    Users,
    Palette,
    Eye,
    Plus,
    Trash2,
    Wand2,
    FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { CHANNEL_STYLES, STYLE_CATEGORIES, getStylesByCategory } from '@/lib/channel-styles'

type WizardStep = 'basic' | 'analyze' | 'style' | 'characters' | 'complete'

interface TrendingVideo {
    title: string
    channelTitle: string
    viewCount: string
    thumbnail: string
}

interface CharacterInput {
    name: string
    role: string
    fullDescription: string
    personality: string
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

export default function NewChannelPage() {
    const { data: session } = useSession()
    const router = useRouter()

    // Wizard state
    const [step, setStep] = useState<WizardStep>('basic')

    // Basic info
    const [channelName, setChannelName] = useState('')
    const [niche, setNiche] = useState('')
    const [description, setDescription] = useState('')
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)

    // YouTube API
    const [youtubeApiKey, setYoutubeApiKey] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    // Analysis results
    const [trendingVideos, setTrendingVideos] = useState<TrendingVideo[]>([])
    const [analysis, setAnalysis] = useState<{
        nicheKeywords?: string[]
        targetAudience?: { demographics: string; painPoints: string[]; desires: string[] }
        contentStrategy?: { bestTopics: string[]; contentHooks: string[] }
        visualRecommendation?: {
            suggestedStyleId: string
            hasCharacters: boolean
            suggestedCharCount: number
            characterSuggestions?: { name: string; role: string; description: string }[]
        }
        episodeIdeas?: { title: string; synopsis: string }[]
    } | null>(null)

    // Style selection
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [selectedStyle, setSelectedStyle] = useState('')
    const [hasCharacters, setHasCharacters] = useState(true)

    // Characters
    const [characters, setCharacters] = useState<CharacterInput[]>([])
    const [isGeneratingChars, setIsGeneratingChars] = useState(false)
    const [generatingCharIndex, setGeneratingCharIndex] = useState<number | null>(null) // Track which character is being generated

    // Channel ID after creation
    const [channelId, setChannelId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Generate channel description with AI
    const handleGenerateDescription = async () => {
        if (!channelName || !niche) {
            toast.error('Vui lòng nhập tên kênh và chủ đề trước')
            return
        }

        setIsGeneratingDescription(true)
        try {
            const res = await fetch('/api/channels/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: channelName, niche })
            })
            const data = await res.json()

            if (data.description) {
                setDescription(data.description)
                toast.success('Đã tạo mô tả kênh thành công!')
            } else {
                toast.error(data.error || 'Không thể tạo mô tả')
            }
        } catch (error) {
            console.error('Generate description error:', error)
            toast.error('Lỗi khi tạo mô tả')
        } finally {
            setIsGeneratingDescription(false)
        }
    }

    // Step 1: Create channel and analyze
    const handleCreateAndAnalyze = async () => {
        if (!channelName || !niche) {
            toast.error('Vui lòng nhập tên kênh và ngách')
            return
        }

        setIsAnalyzing(true)
        try {
            // Create channel first
            const createRes = await fetch('/api/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: channelName, niche, description })
            })
            const createData = await createRes.json()

            if (!createData.channel) {
                throw new Error(createData.error || 'Failed to create channel')
            }

            setChannelId(createData.channel.id)

            // Now analyze
            const analyzeRes = await fetch(`/api/channels/${createData.channel.id}/analyze-niche`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ youtubeApiKey: youtubeApiKey || undefined })
            })
            const analyzeData = await analyzeRes.json()

            if (analyzeData.analysis) {
                setAnalysis(analyzeData.analysis)
                setTrendingVideos(analyzeData.trendingChannels || [])

                // Set defaults from analysis
                if (analyzeData.analysis.visualRecommendation?.suggestedStyleId) {
                    setSelectedStyle(analyzeData.analysis.visualRecommendation.suggestedStyleId)
                }
                if (analyzeData.analysis.visualRecommendation?.hasCharacters !== undefined) {
                    setHasCharacters(analyzeData.analysis.visualRecommendation.hasCharacters)
                }
                if (analyzeData.analysis.visualRecommendation?.characterSuggestions) {
                    setCharacters(analyzeData.analysis.visualRecommendation.characterSuggestions.map((c: { name: string; role: string; description: string; personality?: string }) => ({
                        name: c.name,
                        role: c.role,
                        fullDescription: c.description,
                        personality: c.personality || '',
                        isMain: true
                    })))
                }

                toast.success('Đã phân tích niche thành công!')
                setStep('analyze')
            } else {
                toast.error(analyzeData.error || 'Không thể phân tích')
            }
        } catch (error) {
            console.error('Create/analyze error:', error)
            toast.error('Lỗi tạo kênh')
        } finally {
            setIsAnalyzing(false)
        }
    }

    // Save style selection
    const handleSaveStyle = async () => {
        if (!channelId) return

        setIsSaving(true)
        try {
            const styleData = CHANNEL_STYLES.find(s => s.id === selectedStyle)

            await fetch(`/api/channels/${channelId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visualStyleId: selectedStyle,
                    visualStyleKeywords: styleData?.promptKeywords,
                    hasCharacters
                })
            })

            if (hasCharacters) {
                setStep('characters')
            } else {
                setStep('complete')
            }
        } catch (error) {
            toast.error('Lỗi lưu style')
        } finally {
            setIsSaving(false)
        }
    }

    // Save characters
    const handleSaveCharacters = async () => {
        if (!channelId) return

        setIsSaving(true)
        try {
            // Save characters via API
            for (const char of characters.filter(c => c.name && c.fullDescription)) {
                await fetch(`/api/channels/${channelId}/characters`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(char)
                })
            }

            setStep('complete')
        } catch (error) {
            toast.error('Lỗi lưu nhân vật')
        } finally {
            setIsSaving(false)
        }
    }

    // Add character
    const addCharacter = () => {
        setCharacters([...characters, { 
            name: '', 
            role: 'host', 
            fullDescription: '', 
            personality: '', 
            isMain: false,
            gender: 'female',
            ageRange: '25-35'
        }])
    }

    const updateCharacter = (index: number, field: keyof CharacterInput, value: string | boolean) => {
        const updated = [...characters]
        updated[index] = { ...updated[index], [field]: value }
        setCharacters(updated)
    }

    const removeCharacter = (index: number) => {
        setCharacters(characters.filter((_, i) => i !== index))
    }

    // Generate detailed character description using AI
    const generateCharacterDetails = async (index: number) => {
        const char = characters[index]
        if (!char.name) {
            toast.error('Vui lòng nhập tên nhân vật trước')
            return
        }

        if (!channelId) {
            toast.error('Vui lòng tạo kênh trước')
            return
        }

        setGeneratingCharIndex(index)
        try {
            const res = await fetch(`/api/channels/${channelId}/characters/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: char.name,
                    role: char.role,
                    personality: char.personality,
                    gender: char.gender || 'female',
                    ageRange: char.ageRange || '25-35',
                    style: selectedStyle || 'pixar-3d'
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Lỗi tạo mô tả')
            }

            const data = await res.json()
            const updated = [...characters]
            updated[index] = {
                ...updated[index],
                fullDescription: data.character.fullDescription || '',
                appearance: data.character.appearance || '',
                faceDetails: data.character.faceDetails || '',
                hairDetails: data.character.hairDetails || '',
                clothing: data.character.clothing || '',
                skinTone: data.character.skinTone || '',
                styleKeywords: data.character.styleKeywords || '',
                voiceStyle: data.character.voiceStyle || ''
            }
            setCharacters(updated)
            toast.success('Đã tạo mô tả chi tiết cho ' + char.name)
        } catch (error) {
            console.error('Generate character error:', error)
            toast.error(error instanceof Error ? error.message : 'Lỗi tạo mô tả nhân vật')
        } finally {
            setGeneratingCharIndex(null)
        }
    }

    const stepTitles: Record<WizardStep, string> = {
        basic: 'Thông tin kênh',
        analyze: 'Phân tích & Trends',
        style: 'Chọn phong cách',
        characters: 'Thiết lập nhân vật',
        complete: 'Hoàn tất'
    }

    const stepNumbers: WizardStep[] = ['basic', 'analyze', 'style', 'characters', 'complete']
    const currentStepIndex = stepNumbers.indexOf(step)

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.push('/dashboard/channels')}
                    className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Tạo Kênh YouTube Mới</h1>
                    <p className="text-[var(--text-secondary)]">
                        AI sẽ phân tích và thiết lập mọi thứ cho bạn
                    </p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    {stepNumbers.map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                                ${i < currentStepIndex ? 'bg-green-500 text-white'
                                    : i === currentStepIndex ? 'bg-[var(--accent-primary)] text-white'
                                        : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}
                            `}>
                                {i < currentStepIndex ? <Check className="w-4 h-4" /> : i + 1}
                            </div>
                            {i < stepNumbers.length - 1 && (
                                <div className={`w-12 md:w-20 h-1 mx-1 rounded ${i < currentStepIndex ? 'bg-green-500' : 'bg-[var(--bg-tertiary)]'}`} />
                            )}
                        </div>
                    ))}
                </div>
                <p className="text-center text-sm text-[var(--text-secondary)]">{stepTitles[step]}</p>
            </div>

            <AnimatePresence mode="wait">
                {/* Step 1: Basic Info */}
                {step === 'basic' && (
                    <motion.div
                        key="basic"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-card p-6"
                    >
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Tên kênh YouTube</label>
                                <input
                                    type="text"
                                    value={channelName}
                                    onChange={(e) => setChannelName(e.target.value)}
                                    placeholder="VD: Tâm Lý Học Thú Vị"
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Ngách/Niche của kênh</label>
                                <textarea
                                    value={niche}
                                    onChange={(e) => setNiche(e.target.value)}
                                    placeholder="VD: Tâm lý học ứng dụng trong cuộc sống hàng ngày, giải thích các hiện tượng tâm lý thú vị..."
                                    className="input-field min-h-[100px]"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    Mô tả chi tiết giúp AI phân tích tốt hơn
                                </p>
                            </div>

                            {/* AI-Generated Description */}
                            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <FileText className="w-4 h-4 text-purple-400" />
                                        Mô tả kênh
                                        <span className="text-xs text-[var(--text-muted)]">(AI tự động tạo)</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateDescription}
                                        disabled={isGeneratingDescription || !channelName || !niche}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGeneratingDescription ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Đang tạo...
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 className="w-4 h-4" />
                                                AI Tạo mô tả
                                            </>
                                        )}
                                    </button>
                                </div>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Nhấn 'AI Tạo mô tả' để AI tự động tạo mô tả chi tiết cho kênh của bạn dựa trên tên và chủ đề..."
                                    className="input-field min-h-[200px] text-sm"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-2">
                                    💡 AI sẽ tạo mô tả bao gồm: giới thiệu kênh, nội dung chính, đối tượng khán giả, lịch đăng và call-to-action
                                </p>
                            </div>

                            <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                    <Youtube className="w-4 h-4 text-red-500" />
                                    YouTube API Key <span className="text-[var(--text-muted)]">(tùy chọn)</span>
                                </label>
                                <input
                                    type="password"
                                    value={youtubeApiKey}
                                    onChange={(e) => setYoutubeApiKey(e.target.value)}
                                    placeholder="AIzaSy..."
                                    className="input-field"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    Có key sẽ hiển thị các video trending thực tế từ YouTube
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleCreateAndAnalyze}
                                    disabled={isAnalyzing || !channelName || !niche}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            AI đang phân tích...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Phân tích Niche
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Analysis Results */}
                {step === 'analyze' && analysis && (
                    <motion.div
                        key="analyze"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* Trending Videos */}
                        {trendingVideos.length > 0 && (
                            <div className="glass-card p-6">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Youtube className="w-5 h-5 text-red-500" />
                                    Video Trending cho "{niche}"
                                </h3>
                                <div className="grid gap-3 max-h-[300px] overflow-y-auto">
                                    {trendingVideos.map((video, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                            <img src={video.thumbnail} alt="" className="w-24 h-14 object-cover rounded" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{video.title}</p>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {video.channelTitle} • {parseInt(video.viewCount).toLocaleString()} views
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AI Analysis */}
                        <div className="glass-card p-6">
                            <h3 className="font-semibold mb-4">📊 Phân tích AI</h3>

                            {analysis.nicheKeywords && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium mb-2">Keywords:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.nicheKeywords.map((kw, i) => (
                                            <span key={i} className="tag text-xs">{kw}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {analysis.contentStrategy?.bestTopics && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium mb-2">Chủ đề hot:</p>
                                    <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                                        {analysis.contentStrategy.bestTopics.slice(0, 5).map((topic, i) => (
                                            <li key={i}>• {topic}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysis.episodeIdeas && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Ý tưởng Episode:</p>
                                    <div className="space-y-2">
                                        {analysis.episodeIdeas.slice(0, 3).map((idea, i) => (
                                            <div key={i} className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                                <p className="font-medium text-sm">{idea.title}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{idea.synopsis}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setStep('style')}
                                className="btn-primary flex items-center gap-2"
                            >
                                Tiếp tục chọn Style
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Style Selection */}
                {step === 'style' && (
                    <motion.div
                        key="style"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-card p-6"
                    >
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Palette className="w-5 h-5" />
                            Chọn Phong Cách Hình Ảnh
                        </h3>

                        {/* Categories */}
                        <div className="flex gap-2 flex-wrap mb-4">
                            {STYLE_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition ${selectedCategory === cat.id
                                        ? 'bg-[var(--accent-primary)] text-white'
                                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Styles Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[350px] overflow-y-auto mb-6">
                            {getStylesByCategory(selectedCategory).map(style => (
                                <div
                                    key={style.id}
                                    onClick={() => {
                                        setSelectedStyle(style.id)
                                        setHasCharacters(style.hasCharacters)
                                    }}
                                    className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedStyle === style.id
                                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                                        : 'border-transparent bg-[var(--bg-tertiary)] hover:border-[var(--accent-primary)]/50'
                                        }`}
                                >
                                    <div className="aspect-square bg-[var(--bg-secondary)] rounded mb-2 flex items-center justify-center">
                                        <Eye className="w-8 h-8 text-[var(--text-muted)]" />
                                    </div>
                                    <p className="font-medium text-sm">{style.nameVi}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{style.descriptionVi}</p>
                                    {style.hasCharacters && (
                                        <span className="inline-flex items-center gap-1 mt-1 text-xs text-[var(--accent-primary)]">
                                            <Users className="w-3 h-3" /> Có nhân vật
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Character toggle */}
                        <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg mb-6">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hasCharacters}
                                    onChange={(e) => setHasCharacters(e.target.checked)}
                                    className="w-5 h-5 rounded"
                                />
                                <div>
                                    <p className="font-medium">Sử dụng nhân vật xuyên suốt</p>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        AI đề xuất: {analysis?.visualRecommendation?.suggestedCharCount || 0} nhân vật
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={() => setStep('analyze')}
                                className="btn-secondary"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại
                            </button>
                            <button
                                onClick={handleSaveStyle}
                                disabled={!selectedStyle || isSaving}
                                className="btn-primary flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                {hasCharacters ? 'Tiếp tục' : 'Hoàn tất'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 4: Characters */}
                {step === 'characters' && (
                    <motion.div
                        key="characters"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-card p-6"
                    >
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Nhân Vật Xuyên Suốt
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                            Các nhân vật này sẽ xuất hiện trong mọi episode
                        </p>

                        <div className="space-y-4 mb-6">
                            {characters.map((char, index) => (
                                <div key={index} className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium">Nhân vật {index + 1}</span>
                                        <button
                                            onClick={() => removeCharacter(index)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid gap-3">
                                        {/* Basic Info Row */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={char.name}
                                                onChange={(e) => updateCharacter(index, 'name', e.target.value)}
                                                placeholder="Tên nhân vật"
                                                className="input-field"
                                            />
                                            <select
                                                value={char.role}
                                                onChange={(e) => updateCharacter(index, 'role', e.target.value)}
                                                className="input-field"
                                            >
                                                <option value="host">Host/Người dẫn</option>
                                                <option value="sidekick">Sidekick/Phụ</option>
                                                <option value="mascot">Mascot/Linh vật</option>
                                                <option value="narrator">Narrator/Người kể</option>
                                            </select>
                                        </div>
                                        
                                        {/* Gender & Age Row */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <select
                                                value={char.gender || 'female'}
                                                onChange={(e) => updateCharacter(index, 'gender', e.target.value)}
                                                className="input-field"
                                            >
                                                <option value="female">👩 Nữ</option>
                                                <option value="male">👨 Nam</option>
                                                <option value="other">🧑 Khác</option>
                                            </select>
                                            <select
                                                value={char.ageRange || '25-35'}
                                                onChange={(e) => updateCharacter(index, 'ageRange', e.target.value)}
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

                                        {/* Personality */}
                                        <div>
                                            <label className="block text-xs text-[var(--text-muted)] mb-1">🎭 Tính cách</label>
                                            <textarea
                                                value={char.personality}
                                                onChange={(e) => updateCharacter(index, 'personality', e.target.value)}
                                                placeholder="VD: Vui vẻ, hài hước, hay đùa. Nói nhanh, thích dùng từ lóng..."
                                                className="input-field min-h-[60px] text-sm"
                                            />
                                        </div>

                                        {/* AI Generate Button */}
                                        <button
                                            onClick={() => generateCharacterDetails(index)}
                                            disabled={generatingCharIndex === index || !char.name}
                                            className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition"
                                        >
                                            {generatingCharIndex === index ? (
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

                                        {/* Full Description (AI Generated or Manual) */}
                                        <div>
                                            <label className="block text-xs text-[var(--text-muted)] mb-1">
                                                📝 Mô tả đầy đủ {char.fullDescription && <span className="text-green-400">(Đã có)</span>}
                                            </label>
                                            <textarea
                                                value={char.fullDescription}
                                                onChange={(e) => updateCharacter(index, 'fullDescription', e.target.value)}
                                                placeholder="Nhấn nút AI ở trên để tự động tạo mô tả chi tiết, hoặc nhập thủ công..."
                                                className="input-field min-h-[120px] text-sm"
                                            />
                                        </div>

                                        {/* Show additional details if generated */}
                                        {char.hairDetails && (
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="p-2 bg-[var(--bg-secondary)] rounded">
                                                    <span className="text-[var(--text-muted)]">💇 Tóc: </span>
                                                    <span>{char.hairDetails}</span>
                                                </div>
                                                <div className="p-2 bg-[var(--bg-secondary)] rounded">
                                                    <span className="text-[var(--text-muted)]">👤 Mặt: </span>
                                                    <span>{char.faceDetails}</span>
                                                </div>
                                                <div className="p-2 bg-[var(--bg-secondary)] rounded">
                                                    <span className="text-[var(--text-muted)]">👕 Outfit: </span>
                                                    <span>{char.clothing}</span>
                                                </div>
                                                <div className="p-2 bg-[var(--bg-secondary)] rounded">
                                                    <span className="text-[var(--text-muted)]">🎨 Da: </span>
                                                    <span>{char.skinTone}</span>
                                                </div>
                                            </div>
                                        )}

                                        {char.styleKeywords && (
                                            <div className="p-2 bg-[var(--bg-secondary)] rounded text-xs">
                                                <span className="text-[var(--text-muted)]">🏷️ AI Keywords: </span>
                                                <span className="text-purple-400">{char.styleKeywords}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addCharacter}
                            className="w-full py-3 border-2 border-dashed border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm nhân vật
                        </button>

                        <div className="flex justify-between mt-6">
                            <button
                                onClick={() => setStep('style')}
                                className="btn-secondary"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại
                            </button>
                            <button
                                onClick={handleSaveCharacters}
                                disabled={isSaving}
                                className="btn-primary flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Hoàn tất
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 5: Complete */}
                {step === 'complete' && (
                    <motion.div
                        key="complete"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-12 text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                            <Check className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Kênh đã sẵn sàng!</h2>
                        <p className="text-[var(--text-secondary)] mb-6">
                            Bạn có thể bắt đầu tạo Episodes ngay bây giờ
                        </p>
                        <button
                            onClick={() => router.push(`/dashboard/channels/${channelId}`)}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <Sparkles className="w-5 h-5" />
                            Đi đến Kênh
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
