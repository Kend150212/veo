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
    AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { CHANNEL_STYLES, getStyleById } from '@/lib/channel-styles'

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
    const [dialogueLanguage, setDialogueLanguage] = useState('vi')

    useEffect(() => {
        fetchChannel()
    }, [id])

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
                        {CHANNEL_STYLES.map(style => (
                            <option key={style.id} value={style.id}>
                                {style.nameVi} - {style.descriptionVi}
                            </option>
                        ))}
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
