'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    Save,
    Loader2,
    Film,
    Users,
    FileText,
    Settings,
    Plus,
    Trash2,
    RefreshCw,
    Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import { GENRES, GENRE_CATEGORIES, type Character } from '@/lib/ai-story'

interface ProjectData {
    id: string
    title: string
    description: string | null
    genre: string
    storyOutline: string | null
    totalScenes: number
    selectedIdea: string | null
    characters: Character[]
}

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { data: session } = useSession()
    const router = useRouter()

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isGeneratingChars, setIsGeneratingChars] = useState(false)

    // Form data
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [genre, setGenre] = useState('')
    const [storyOutline, setStoryOutline] = useState('')
    const [totalScenes, setTotalScenes] = useState(10)
    const [characters, setCharacters] = useState<Partial<Character>[]>([])

    // UI state
    const [activeTab, setActiveTab] = useState<'basic' | 'story' | 'characters'>('basic')
    const [selectedCategory, setSelectedCategory] = useState('all')

    useEffect(() => {
        fetchProject()
    }, [id])

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/projects/${id}`)
            if (res.ok) {
                const data = await res.json()
                const project = data.project as ProjectData
                setTitle(project.title)
                setDescription(project.description || '')
                setGenre(project.genre)
                setStoryOutline(project.storyOutline || '')
                setTotalScenes(project.totalScenes)
                setCharacters(project.characters || [])
            } else {
                toast.error('Không tìm thấy dự án')
                router.push('/dashboard/story')
            }
        } catch (error) {
            console.error('Fetch project error:', error)
            toast.error('Lỗi tải dự án')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Vui lòng nhập tên dự án')
            return
        }

        setIsSaving(true)
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    genre,
                    storyOutline,
                    totalScenes,
                    characters: characters.filter(c => c.name && c.fullDescription)
                })
            })

            if (res.ok) {
                toast.success('Đã lưu thay đổi!')
                router.push(`/dashboard/story/${id}`)
            } else {
                const data = await res.json()
                toast.error(data.error || 'Không thể lưu')
            }
        } catch (error) {
            toast.error('Không thể lưu thay đổi')
        } finally {
            setIsSaving(false)
        }
    }

    const handleGenerateCharacters = async () => {
        setIsGeneratingChars(true)
        try {
            const res = await fetch('/api/story/generate-characters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    genre,
                    storyOutline,
                    idea: { title, description }
                })
            })

            const data = await res.json()
            if (data.characters) {
                setCharacters(data.characters)
                toast.success(`AI đã tạo ${data.characters.length} nhân vật!`)
            } else {
                toast.error(data.error || 'Không thể tạo nhân vật')
            }
        } catch {
            toast.error('Không thể tạo nhân vật')
        } finally {
            setIsGeneratingChars(false)
        }
    }

    const addCharacter = () => {
        setCharacters([...characters, { name: '', role: 'supporting', fullDescription: '' }])
    }

    const updateCharacter = (index: number, field: keyof Character, value: string) => {
        const updated = [...characters]
        updated[index] = { ...updated[index], [field]: value }
        setCharacters(updated)
    }

    const removeCharacter = (index: number) => {
        setCharacters(characters.filter((_, i) => i !== index))
    }

    const filteredGenres = selectedCategory === 'all'
        ? GENRES
        : GENRES.filter(g => g.category === selectedCategory)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/dashboard/story/${id}`)}
                        className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Chỉnh sửa dự án</h1>
                        <p className="text-sm text-[var(--text-secondary)]">{title}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Lưu thay đổi
                        </>
                    )}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { id: 'basic', label: 'Thông tin cơ bản', icon: Settings },
                    { id: 'story', label: 'Cốt truyện', icon: FileText },
                    { id: 'characters', label: 'Nhân vật', icon: Users }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                                ? 'bg-[var(--accent-primary)] text-white'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
            >
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Tên dự án *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="input-field"
                                placeholder="Nhập tên dự án"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Mô tả ngắn</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="input-field min-h-[100px]"
                                placeholder="Mô tả ngắn về dự án"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Thể loại</label>
                            <div className="flex gap-2 mb-3 flex-wrap">
                                {GENRE_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedCategory === cat.id
                                                ? 'bg-[var(--accent-primary)] text-white'
                                                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 max-h-[200px] overflow-y-auto">
                                {filteredGenres.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => setGenre(g.id)}
                                        className={`p-2 rounded-lg text-sm transition-all ${genre === g.id
                                                ? 'bg-[var(--accent-primary)] text-white ring-2 ring-[var(--accent-primary)]'
                                                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                            }`}
                                    >
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Số lượng scenes: {totalScenes}
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="100"
                                value={totalScenes}
                                onChange={(e) => setTotalScenes(parseInt(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-[var(--text-muted)]">
                                <span>5 scenes</span>
                                <span>100 scenes</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Story Tab */}
                {activeTab === 'story' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Cốt truyện / Story Outline
                            </label>
                            <textarea
                                value={storyOutline}
                                onChange={(e) => setStoryOutline(e.target.value)}
                                className="input-field min-h-[400px] mono"
                                placeholder="Nhập cốt truyện chi tiết cho video của bạn..."
                            />
                            <p className="text-xs text-[var(--text-muted)] mt-2">
                                {storyOutline.length} ký tự
                            </p>
                        </div>
                    </div>
                )}

                {/* Characters Tab */}
                {activeTab === 'characters' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Nhân vật ({characters.length})</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleGenerateCharacters}
                                    disabled={isGeneratingChars}
                                    className="btn-secondary text-sm flex items-center gap-2"
                                >
                                    {isGeneratingChars ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    AI tạo nhân vật
                                </button>
                                <button
                                    onClick={addCharacter}
                                    className="btn-secondary text-sm flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Thêm
                                </button>
                            </div>
                        </div>

                        {characters.length === 0 ? (
                            <div className="text-center py-8 text-[var(--text-muted)]">
                                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Chưa có nhân vật nào</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {characters.map((char, index) => (
                                    <div key={index} className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1 grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-[var(--text-muted)]">Tên</label>
                                                    <input
                                                        type="text"
                                                        value={char.name || ''}
                                                        onChange={(e) => updateCharacter(index, 'name', e.target.value)}
                                                        className="input-field text-sm"
                                                        placeholder="Tên nhân vật"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-[var(--text-muted)]">Vai trò</label>
                                                    <select
                                                        value={char.role || 'supporting'}
                                                        onChange={(e) => updateCharacter(index, 'role', e.target.value)}
                                                        className="input-field text-sm"
                                                    >
                                                        <option value="protagonist">Nhân vật chính</option>
                                                        <option value="antagonist">Phản diện</option>
                                                        <option value="supporting">Phụ</option>
                                                        <option value="narrator">Người kể chuyện</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeCharacter(index)}
                                                className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="mt-3">
                                            <label className="text-xs text-[var(--text-muted)]">Mô tả chi tiết</label>
                                            <textarea
                                                value={char.fullDescription || ''}
                                                onChange={(e) => updateCharacter(index, 'fullDescription', e.target.value)}
                                                className="input-field text-sm min-h-[80px]"
                                                placeholder="Mô tả ngoại hình và đặc điểm nhân vật..."
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
