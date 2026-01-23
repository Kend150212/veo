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
    const [copied, setCopied] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    // Character management
    const [showAddCharacter, setShowAddCharacter] = useState(false)
    const [editingCharacter, setEditingCharacter] = useState<ChannelCharacter | null>(null)
    const [newCharacter, setNewCharacter] = useState({
        name: '',
        role: 'host',
        fullDescription: '',
        isMain: false
    })
    const [showKnowledge, setShowKnowledge] = useState(false)
    const [expandedNiche, setExpandedNiche] = useState(false)

    // Episode creation options
    const [useCharacters, setUseCharacters] = useState(true)
    const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([])
    const [selectedStyleId, setSelectedStyleId] = useState<string>('')
    const [mentionChannel, setMentionChannel] = useState(false)
    const [ctaMode, setCtaMode] = useState<'random' | 'select'>('random')
    const [selectedCTAs, setSelectedCTAs] = useState<string[]>([])
    const [voiceOverMode, setVoiceOverMode] = useState<'with_host' | 'voice_over' | 'broll_only'>('with_host')

    // Voice settings (for voice_over mode)
    const [voiceGender, setVoiceGender] = useState<'male' | 'female' | 'auto'>('auto')
    const [voiceTone, setVoiceTone] = useState<'warm' | 'professional' | 'energetic' | 'calm' | 'serious'>('warm')

    // Category management
    const [categories, setCategories] = useState<EpisodeCategory[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)  // For episode creation
    const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null)  // For filtering episodes
    const [showCategoryModal, setShowCategoryModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState<EpisodeCategory | null>(null)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryColor, setNewCategoryColor] = useState('#6366f1')

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
                    selectedStyleId: selectedStyleId || null,
                    mentionChannel,
                    ctaMode,
                    selectedCTAs: ctaMode === 'select' ? selectedCTAs : [],
                    customContent: customContent.trim() || null,
                    voiceOverMode,
                    voiceGender: voiceOverMode === 'voice_over' ? voiceGender : 'auto',
                    voiceTone: voiceOverMode === 'voice_over' ? voiceTone : 'warm',
                    categoryId: selectedCategoryId
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
            setNewCharacter({ name: '', role: 'host', fullDescription: '', isMain: false })
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
                                    setNewCharacter({ name: '', role: 'host', fullDescription: '', isMain: false })
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
                <h3 className="font-semibold mb-4">Tạo Episode Mới</h3>

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
                                const mode = e.target.value as 'with_host' | 'voice_over' | 'broll_only'
                                setVoiceOverMode(mode)
                                setUseCharacters(mode === 'with_host')
                            }}
                            className="input-field w-full"
                        >
                            <option value="with_host">👤 Có Host/Nhân vật</option>
                            <option value="voice_over">🎙️ Voice Over (Thuyết minh)</option>
                            <option value="broll_only">🎬 B-Roll only (không lời)</option>
                        </select>
                    </div>
                </div>

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
                            Tạo Episode {channel.episodes.length + 1}
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
                            <button
                                onClick={() => setExpandedEpisode(
                                    expandedEpisode === episode.id ? null : episode.id
                                )}
                                className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-purple-500 flex items-center justify-center text-white font-bold">
                                        {episode.episodeNumber}
                                    </span>
                                    <div>
                                        <p className="font-medium">{episode.title}</p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {episode.scenes.length} scenes • {episode.status}
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

                                    {/* Actions */}
                                    <div className="px-4 py-2 flex gap-2 flex-wrap border-b border-[var(--border-subtle)]">
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
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}
