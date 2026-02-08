'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    Save,
    Trash2,
    Loader2,
    Palette,
    Users,
    Globe,
    Settings,
    AlertTriangle,
    Youtube,
    Link,
    Image
} from 'lucide-react'
import toast from 'react-hot-toast'
import { CHANNEL_STYLES, getStyleById, STYLE_CATEGORIES, getStylesByCategory } from '@/lib/channel-styles'

interface Channel {
    id: string
    name: string
    niche: string
    visualStyleId: string | null
    visualStyleKeywords: string | null
    hasCharacters: boolean
    dialogueLanguage: string
    knowledgeBase: string | null
    targetAudience: string | null
}

export default function ChannelSettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { data: session } = useSession()
    const router = useRouter()

    const [channel, setChannel] = useState<Channel | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Editable fields
    const [name, setName] = useState('')
    const [niche, setNiche] = useState('')
    const [visualStyleId, setVisualStyleId] = useState('')
    const [hasCharacters, setHasCharacters] = useState(true)

    // YouTube Defaults
    const [socialLinks, setSocialLinks] = useState('')
    const [affiliateLinks, setAffiliateLinks] = useState('')
    const [channelTagline, setChannelTagline] = useState('')
    const [defaultHashtags, setDefaultHashtags] = useState('')
    const [thumbnailStyleId, setThumbnailStyleId] = useState('')
    const [dialogueLanguage, setDialogueLanguage] = useState('vi')

    // Thumbnail Styles
    const THUMBNAIL_STYLES = [
        { id: 'bold_minimal', name: '🎯 Bold Minimal', desc: 'Nền solid màu đậm, text lớn bold' },
        { id: 'face_focus', name: '😮 Face Focus', desc: 'Khuôn mặt host biểu cảm mạnh' },
        { id: 'split_contrast', name: '⚡ Split Contrast', desc: 'Chia đôi before/after' },
        { id: 'number_highlight', name: '🔢 Number Highlight', desc: 'Số lớn nổi bật (Top 10, 5 Tips)' },
        { id: 'mystery_dark', name: '🌑 Mystery Dark', desc: 'Theme tối, bí ẩn' },
        { id: 'bright_pop', name: '🌈 Bright Pop', desc: 'Màu sáng rực, vui tươi' },
        { id: 'cinematic_movie', name: '🎬 Cinematic Movie', desc: 'Poster phim style' },
        { id: 'arrows_circles', name: '👉 Arrows & Circles', desc: 'Mũi tên, vòng tròn highlight' },
        { id: 'text_overlay', name: '📝 Text Overlay', desc: 'Text lớn phủ thumbnail' },
        { id: 'reaction_style', name: '😱 Reaction Style', desc: 'Host shocked, emoji overlays' },
        { id: 'clean_professional', name: '💼 Clean Professional', desc: 'Sạch sẽ, chuyên nghiệp' },
        { id: 'gaming_neon', name: '🎮 Gaming Neon', desc: 'Neon glow, cyberpunk' },
    ]

    useEffect(() => {
        fetchChannel()
        fetchYoutubeDefaults()
    }, [id])

    const fetchYoutubeDefaults = async () => {
        try {
            const res = await fetch(`/api/channels/${id}/youtube-defaults`)
            const data = await res.json()
            if (data.defaults) {
                setSocialLinks(data.defaults.socialLinks || '')
                setAffiliateLinks(data.defaults.affiliateLinks || '')
                setChannelTagline(data.defaults.channelTagline || '')
                setDefaultHashtags(data.defaults.defaultHashtags || '')
            }
            if (data.thumbnailStyleId) {
                setThumbnailStyleId(data.thumbnailStyleId)
            }
        } catch {
            console.error('Failed to fetch YouTube defaults')
        }
    }

    const saveYoutubeDefaults = async () => {
        try {
            await fetch(`/api/channels/${id}/youtube-defaults`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    defaults: { socialLinks, affiliateLinks, channelTagline, defaultHashtags },
                    thumbnailStyleId
                })
            })
        } catch {
            console.error('Failed to save YouTube defaults')
        }
    }

    const fetchChannel = async () => {
        try {
            const res = await fetch(`/api/channels/${id}`)
            const data = await res.json()
            if (data.channel) {
                setChannel(data.channel)
                setName(data.channel.name)
                setNiche(data.channel.niche)
                setVisualStyleId(data.channel.visualStyleId || '')
                setHasCharacters(data.channel.hasCharacters)
                setDialogueLanguage(data.channel.dialogueLanguage || 'vi')
            } else {
                toast.error('Không tìm thấy kênh')
                router.push('/dashboard/channels')
            }
        } catch {
            toast.error('Lỗi tải kênh')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const style = getStyleById(visualStyleId)
            await fetch(`/api/channels/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    niche,
                    visualStyleId,
                    visualStyleKeywords: style?.promptKeywords,
                    hasCharacters,
                    dialogueLanguage
                })
            })
            // Also save YouTube defaults
            await saveYoutubeDefaults()
            toast.success('Đã lưu cài đặt!')
        } catch {
            toast.error('Lỗi lưu cài đặt')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await fetch(`/api/channels/${id}`, { method: 'DELETE' })
            toast.success('Đã xóa kênh')
            router.push('/dashboard/channels')
        } catch {
            toast.error('Lỗi xóa kênh')
            setIsDeleting(false)
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
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.push(`/dashboard/channels/${id}`)}
                    className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Settings className="w-6 h-6" />
                        Cài đặt kênh
                    </h1>
                    <p className="text-[var(--text-secondary)]">{channel.name}</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Basic Info */}
                <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4">Thông tin cơ bản</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Tên kênh</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Ngách/Niche</label>
                            <textarea
                                value={niche}
                                onChange={(e) => setNiche(e.target.value)}
                                className="input-field min-h-[80px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Visual Style */}
                <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Phong cách hình ảnh
                    </h3>
                    <select
                        value={visualStyleId}
                        onChange={(e) => setVisualStyleId(e.target.value)}
                        className="input-field"
                    >
                        <option value="">-- Chọn style --</option>
                        {STYLE_CATEGORIES.filter(cat => cat.id !== 'all').map(category => {
                            const styles = getStylesByCategory(category.id)
                            if (styles.length === 0) return null
                            return (
                                <optgroup key={category.id} label={category.name}>
                                    {styles.map(style => (
                                        <option key={style.id} value={style.id}>
                                            {style.nameVi} - {style.descriptionVi}
                                        </option>
                                    ))}
                                </optgroup>
                            )
                        })}
                    </select>
                </div>

                {/* Characters */}
                <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Nhân vật
                    </h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={hasCharacters}
                            onChange={(e) => setHasCharacters(e.target.checked)}
                            className="w-5 h-5 rounded"
                        />
                        <span>Sử dụng nhân vật xuyên suốt trong các episode</span>
                    </label>
                </div>

                {/* Dialogue Language */}
                <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Ngôn ngữ lời thoại
                    </h3>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setDialogueLanguage('vi')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${dialogueLanguage === 'vi'
                                ? 'bg-[var(--accent-primary)] text-white'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                }`}
                        >
                            🇻🇳 Tiếng Việt
                        </button>
                        <button
                            onClick={() => setDialogueLanguage('en')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${dialogueLanguage === 'en'
                                ? 'bg-[var(--accent-primary)] text-white'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                }`}
                        >
                            🇺🇸 English
                        </button>
                    </div>
                </div>

                {/* YouTube Defaults */}
                <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Youtube className="w-4 h-4 text-red-500" />
                        YouTube Defaults
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mb-4">
                        Thông tin mặc định sẽ được thêm vào description của mỗi episode
                    </p>
                    <div className="space-y-4">
                        {/* Channel Tagline */}
                        <div>
                            <label className="block text-sm font-medium mb-2">📝 Tagline kênh</label>
                            <input
                                type="text"
                                value={channelTagline}
                                onChange={(e) => setChannelTagline(e.target.value)}
                                placeholder="VD: Kênh chia sẻ kiến thức tâm lý hàng đầu Việt Nam"
                                className="input-field"
                            />
                        </div>

                        {/* Social Links */}
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                <Link className="w-3 h-3" />
                                Social Links
                            </label>
                            <textarea
                                value={socialLinks}
                                onChange={(e) => setSocialLinks(e.target.value)}
                                placeholder="🔗 Facebook: https://facebook.com/...&#10;🔗 TikTok: https://tiktok.com/...&#10;🔗 Instagram: https://instagram.com/..."
                                className="input-field min-h-[100px] text-sm"
                            />
                        </div>

                        {/* Affiliate Links */}
                        <div>
                            <label className="block text-sm font-medium mb-2">💰 Affiliate Links</label>
                            <textarea
                                value={affiliateLinks}
                                onChange={(e) => setAffiliateLinks(e.target.value)}
                                placeholder="📦 Sản phẩm khuyên dùng: https://...&#10;🎁 Nhập mã CHANNEL20 giảm 20%"
                                className="input-field min-h-[80px] text-sm"
                            />
                        </div>

                        {/* Default Hashtags */}
                        <div>
                            <label className="block text-sm font-medium mb-2">#️⃣ Default Hashtags</label>
                            <input
                                type="text"
                                value={defaultHashtags}
                                onChange={(e) => setDefaultHashtags(e.target.value)}
                                placeholder="#tâmlý #khoahọc #việtnam #knowledge"
                                className="input-field"
                            />
                        </div>
                    </div>
                </div>

                {/* Thumbnail Style */}
                <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Thumbnail Style (cho toàn kênh)
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mb-4">
                        Chọn style thống nhất cho tất cả thumbnail của kênh
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {THUMBNAIL_STYLES.map(style => (
                            <button
                                key={style.id}
                                onClick={() => setThumbnailStyleId(style.id)}
                                className={`p-3 rounded-lg text-left text-sm transition ${thumbnailStyleId === style.id
                                        ? 'bg-[var(--accent-primary)] text-white'
                                        : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]'
                                    }`}
                            >
                                <div className="font-medium">{style.name}</div>
                                <div className={`text-xs mt-1 ${thumbnailStyleId === style.id
                                        ? 'text-white/80'
                                        : 'text-[var(--text-muted)]'
                                    }`}>{style.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Lưu cài đặt
                </button>

                {/* Danger Zone */}
                <div className="glass-card p-6 border-red-500/30">
                    <h3 className="font-semibold mb-4 text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Vùng nguy hiểm
                    </h3>
                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Xóa kênh này
                        </button>
                    ) : (
                        <div className="p-4 bg-red-500/10 rounded-lg">
                            <p className="text-sm text-red-300 mb-4">
                                Bạn có chắc muốn xóa kênh này? Tất cả episodes sẽ bị xóa vĩnh viễn.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    Xác nhận xóa
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 bg-[var(--bg-tertiary)] rounded-lg"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
