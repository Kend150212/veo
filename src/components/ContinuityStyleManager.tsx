'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Sparkles,
    Loader2,
    Plus,
    Edit2,
    Trash2,
    Star,
    Copy,
    Check,
    Wand2,
    ChevronDown,
    ChevronUp,
    Palette,
    Sun,
    Camera,
    Film,
    Music,
    MapPin
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ContinuityStyle {
    id: string
    name: string
    subjectDefault: string | null
    palette: string
    environment: string | null
    lighting: string
    cameraStyle: string
    visualStyle: string
    audioMood: string | null
    createdAt: string
    _count?: { episodes: number }
}

interface Props {
    channelId: string
}

export default function ContinuityStyleManager({ channelId }: Props) {
    const [styles, setStyles] = useState<ContinuityStyle[]>([])
    const [defaultStyleId, setDefaultStyleId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [expandedStyleId, setExpandedStyleId] = useState<string | null>(null)

    // Form state
    const [showForm, setShowForm] = useState(false)
    const [editingStyle, setEditingStyle] = useState<ContinuityStyle | null>(null)
    const [form, setForm] = useState({
        name: '',
        subjectDefault: '',
        palette: '',
        environment: '',
        lighting: '',
        cameraStyle: '',
        visualStyle: '',
        audioMood: '',
        setAsDefault: true
    })

    useEffect(() => {
        fetchStyles()
    }, [channelId])

    const fetchStyles = async () => {
        try {
            const res = await fetch(`/api/channels/${channelId}/continuity-styles`)
            const data = await res.json()
            if (data.styles) {
                setStyles(data.styles)
                setDefaultStyleId(data.defaultStyleId)
            }
        } catch (error) {
            console.error('Failed to fetch styles:', error)
            toast.error('Không thể tải danh sách styles')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGenerateWithAI = async () => {
        setIsGenerating(true)
        try {
            const res = await fetch(`/api/channels/${channelId}/continuity-styles/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    styleHint: form.visualStyle || undefined,
                    characterHint: form.subjectDefault || undefined
                })
            })
            const data = await res.json()

            if (data.generatedStyle) {
                setForm({
                    name: data.generatedStyle.name || '',
                    subjectDefault: data.generatedStyle.subjectDefault || '',
                    palette: data.generatedStyle.palette || '',
                    environment: data.generatedStyle.environment || '',
                    lighting: data.generatedStyle.lighting || '',
                    cameraStyle: data.generatedStyle.cameraStyle || '',
                    visualStyle: data.generatedStyle.visualStyle || '',
                    audioMood: data.generatedStyle.audioMood || '',
                    setAsDefault: true
                })
                toast.success('AI đã tạo style! Review và lưu khi sẵn sàng.')
            } else {
                toast.error(data.error || 'Không thể tạo style')
            }
        } catch (error) {
            console.error('Generate style error:', error)
            toast.error('Lỗi khi tạo style với AI')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSave = async () => {
        if (!form.name || !form.palette || !form.lighting || !form.cameraStyle || !form.visualStyle) {
            toast.error('Vui lòng điền đầy đủ các trường bắt buộc')
            return
        }

        setIsSaving(true)
        try {
            const url = editingStyle
                ? `/api/channels/${channelId}/continuity-styles/${editingStyle.id}`
                : `/api/channels/${channelId}/continuity-styles`

            const method = editingStyle ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to save')
            }

            toast.success(editingStyle ? 'Đã cập nhật style!' : 'Đã tạo style mới!')
            resetForm()
            fetchStyles()
        } catch (error) {
            console.error('Save style error:', error)
            toast.error(error instanceof Error ? error.message : 'Lỗi khi lưu style')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (styleId: string) => {
        if (!confirm('Bạn có chắc muốn xóa style này?')) return

        try {
            const res = await fetch(`/api/channels/${channelId}/continuity-styles/${styleId}`, {
                method: 'DELETE'
            })

            if (!res.ok) {
                throw new Error('Failed to delete')
            }

            toast.success('Đã xóa style')
            fetchStyles()
        } catch (error) {
            console.error('Delete style error:', error)
            toast.error('Lỗi khi xóa style')
        }
    }

    const handleSetDefault = async (styleId: string) => {
        try {
            const res = await fetch(`/api/channels/${channelId}/continuity-styles/${styleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setAsDefault: true })
            })

            if (!res.ok) throw new Error('Failed')

            toast.success('Đã đặt làm style mặc định')
            fetchStyles()
        } catch (error) {
            toast.error('Lỗi khi đặt mặc định')
        }
    }

    const handleEdit = (style: ContinuityStyle) => {
        setEditingStyle(style)
        setForm({
            name: style.name,
            subjectDefault: style.subjectDefault || '',
            palette: style.palette,
            environment: style.environment || '',
            lighting: style.lighting,
            cameraStyle: style.cameraStyle,
            visualStyle: style.visualStyle,
            audioMood: style.audioMood || '',
            setAsDefault: defaultStyleId === style.id
        })
        setShowForm(true)
    }

    const resetForm = () => {
        setShowForm(false)
        setEditingStyle(null)
        setForm({
            name: '',
            subjectDefault: '',
            palette: '',
            environment: '',
            lighting: '',
            cameraStyle: '',
            visualStyle: '',
            audioMood: '',
            setAsDefault: true
        })
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`Đã copy ${label}`)
    }

    // Build continuity block string
    const buildContinuityBlock = (style: ContinuityStyle): string => {
        const parts = []
        if (style.subjectDefault) parts.push(`subject=${style.subjectDefault}`)
        parts.push(`palette=${style.palette}`)
        if (style.environment) parts.push(`environment=${style.environment}`)
        parts.push(`lighting=${style.lighting}`)
        parts.push(`camera=${style.cameraStyle}`)
        parts.push(`style=${style.visualStyle}`)
        if (style.audioMood) parts.push(`audio=${style.audioMood}`)
        return `Continuity: ${parts.join('; ')}`
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
            </div>
        )
    }

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    Continuity Style
                </h3>
                <button
                    onClick={() => {
                        resetForm()
                        setShowForm(true)
                    }}
                    className="px-3 py-1.5 text-sm bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
                >
                    <Plus className="w-3 h-3" />
                    Thêm Style
                </button>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-4">
                Định nghĩa phong cách liên tục cho video (palette, lighting, camera, style) để đảm bảo tính nhất quán.
            </p>

            {/* Styles List */}
            {styles.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Chưa có Continuity Style nào.</p>
                    <p className="text-sm">Nhấn "Thêm Style" để tạo style đầu tiên.</p>
                </div>
            ) : (
                <div className="space-y-3 mb-4">
                    {styles.map((style) => (
                        <div
                            key={style.id}
                            className={`p-4 rounded-lg border-2 transition ${defaultStyleId === style.id
                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                                    : 'border-[var(--bg-tertiary)] bg-[var(--bg-secondary)]'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{style.name}</h4>
                                    {defaultStyleId === style.id && (
                                        <span className="px-2 py-0.5 text-xs bg-[var(--accent-primary)] text-white rounded flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-current" />
                                            Mặc định
                                        </span>
                                    )}
                                    {style._count && style._count.episodes > 0 && (
                                        <span className="px-2 py-0.5 text-xs bg-[var(--bg-tertiary)] text-[var(--text-muted)] rounded">
                                            {style._count.episodes} episodes
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setExpandedStyleId(
                                            expandedStyleId === style.id ? null : style.id
                                        )}
                                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                                    >
                                        {expandedStyleId === style.id ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </button>
                                    {defaultStyleId !== style.id && (
                                        <button
                                            onClick={() => handleSetDefault(style.id)}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition"
                                            title="Đặt làm mặc định"
                                        >
                                            <Star className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEdit(style)}
                                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(style.id)}
                                        className="p-1.5 text-red-400 hover:text-red-300 transition"
                                        title="Xóa"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Quick preview */}
                            <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[var(--bg-tertiary)] rounded">
                                    <Palette className="w-3 h-3" /> {style.palette.split(',')[0]}...
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[var(--bg-tertiary)] rounded">
                                    <Sun className="w-3 h-3" /> {style.lighting.split(',')[0]}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[var(--bg-tertiary)] rounded">
                                    <Camera className="w-3 h-3" /> {style.cameraStyle.split(',')[0]}
                                </span>
                            </div>

                            {/* Expanded details */}
                            <AnimatePresence>
                                {expandedStyleId === style.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-4 space-y-3 pt-4 border-t border-[var(--bg-tertiary)]">
                                            {style.subjectDefault && (
                                                <div>
                                                    <span className="text-xs text-[var(--text-muted)]">Subject mặc định:</span>
                                                    <p className="text-sm">{style.subjectDefault}</p>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-xs text-[var(--text-muted)]">Palette:</span>
                                                <p className="text-sm">{style.palette}</p>
                                            </div>
                                            {style.environment && (
                                                <div>
                                                    <span className="text-xs text-[var(--text-muted)]">Environment:</span>
                                                    <p className="text-sm">{style.environment}</p>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-xs text-[var(--text-muted)]">Lighting:</span>
                                                <p className="text-sm">{style.lighting}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-[var(--text-muted)]">Camera:</span>
                                                <p className="text-sm">{style.cameraStyle}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-[var(--text-muted)]">Visual Style:</span>
                                                <p className="text-sm">{style.visualStyle}</p>
                                            </div>
                                            {style.audioMood && (
                                                <div>
                                                    <span className="text-xs text-[var(--text-muted)]">Audio/Mood:</span>
                                                    <p className="text-sm">{style.audioMood}</p>
                                                </div>
                                            )}

                                            {/* Continuity Block */}
                                            <div className="mt-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-medium text-[var(--text-muted)]">
                                                        Continuity Block (copy vào prompt):
                                                    </span>
                                                    <button
                                                        onClick={() => copyToClipboard(
                                                            buildContinuityBlock(style),
                                                            'Continuity block'
                                                        )}
                                                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <code className="text-xs text-[var(--text-secondary)] block break-all">
                                                    {buildContinuityBlock(style)}
                                                </code>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border-2 border-[var(--accent-primary)]/30">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium">
                                    {editingStyle ? 'Chỉnh sửa Style' : 'Tạo Continuity Style mới'}
                                </h4>
                                <button
                                    onClick={handleGenerateWithAI}
                                    disabled={isGenerating}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-3 h-3" />
                                            AI Tạo Style
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Tên Style <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="VD: Mia Explorer Style"
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                        <Palette className="w-3 h-3" /> Palette <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.palette}
                                        onChange={(e) => setForm({ ...form, palette: e.target.value })}
                                        placeholder="VD: Warm amber, deep teal, muted greens, stone grays"
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> Environment
                                    </label>
                                    <input
                                        type="text"
                                        value={form.environment}
                                        onChange={(e) => setForm({ ...form, environment: e.target.value })}
                                        placeholder="VD: Ancient-futuristic locations with mirrors and holograms"
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                        <Sun className="w-3 h-3" /> Lighting <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.lighting}
                                        onChange={(e) => setForm({ ...form, lighting: e.target.value })}
                                        placeholder="VD: Dramatic, directional studio lighting with ethereal glows"
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                        <Camera className="w-3 h-3" /> Camera Style <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.cameraStyle}
                                        onChange={(e) => setForm({ ...form, cameraStyle: e.target.value })}
                                        placeholder="VD: Smooth, cinematic, dolly, track, crane movements"
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                        <Film className="w-3 h-3" /> Visual Style <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.visualStyle}
                                        onChange={(e) => setForm({ ...form, visualStyle: e.target.value })}
                                        placeholder="VD: Science documentary, mysterious, cinematic"
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                        <Music className="w-3 h-3" /> Audio/Mood
                                    </label>
                                    <input
                                        type="text"
                                        value={form.audioMood}
                                        onChange={(e) => setForm({ ...form, audioMood: e.target.value })}
                                        placeholder="VD: Ambient electronic hum, mysterious echoes"
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Subject mặc định (optional)
                                    </label>
                                    <textarea
                                        value={form.subjectDefault}
                                        onChange={(e) => setForm({ ...form, subjectDefault: e.target.value })}
                                        placeholder="VD: Mia, a thoughtful female anthropologist, mid-30s, dressed in earthy-toned smart casual outfit"
                                        className="input-field min-h-[80px]"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="setAsDefault"
                                        checked={form.setAsDefault}
                                        onChange={(e) => setForm({ ...form, setAsDefault: e.target.checked })}
                                        className="w-5 h-5 rounded"
                                    />
                                    <label htmlFor="setAsDefault" className="text-sm cursor-pointer">
                                        Đặt làm style mặc định cho các episode mới
                                    </label>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Check className="w-4 h-4" />
                                        )}
                                        {editingStyle ? 'Cập nhật' : 'Tạo Style'}
                                    </button>
                                    <button
                                        onClick={resetForm}
                                        className="px-4 py-2 bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--bg-hover)] transition"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
