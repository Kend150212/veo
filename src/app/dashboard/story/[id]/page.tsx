'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { use } from 'react'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    Download,
    Copy,
    Loader2,
    Check,
    Film,
    Clock,
    Edit2,
    Save,
    X,
    ChevronDown,
    ChevronRight,
    Sparkles,
    RefreshCw,
    Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatScenesForExport, HOOK_TYPES } from '@/lib/ai-story'

interface Scene {
    id: string
    order: number
    title: string | null
    promptText: string
    duration: number
    hookType: string | null
    isEdited: boolean
}

interface Character {
    id: string
    name: string
    role: string
    fullDescription: string
}

interface Project {
    id: string
    title: string
    description: string | null
    genre: string
    storyOutline: string | null
    totalScenes: number
    generatedScenes: number
    status: string
    scenes: Scene[]
    characters: Character[]
    createdAt: string
    updatedAt: string
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { data: session } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const shouldGenerate = searchParams.get('generate') === 'true'

    const [project, setProject] = useState<Project | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generationProgress, setGenerationProgress] = useState(0)
    const [editingScene, setEditingScene] = useState<string | null>(null)
    const [editedPrompt, setEditedPrompt] = useState('')
    const [exportFormat, setExportFormat] = useState<'text' | 'json' | 'api'>('text')
    const [copied, setCopied] = useState(false)
    const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set())

    // Ref to prevent duplicate auto-generation
    const hasTriggeredGeneration = useRef(false)

    useEffect(() => {
        fetchProject()
    }, [id])

    useEffect(() => {
        // Auto-generate scenes when redirected with ?generate=true
        if (
            shouldGenerate &&
            project &&
            project.status === 'draft' &&
            project.scenes.length === 0 &&
            !isGenerating &&
            !hasTriggeredGeneration.current
        ) {
            hasTriggeredGeneration.current = true
            handleGenerateScenes()
        }
    }, [shouldGenerate, project, isGenerating])

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/projects/${id}`)
            if (res.ok) {
                const data = await res.json()
                setProject(data.project)
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

    const handleGenerateScenes = async () => {
        setIsGenerating(true)
        setGenerationProgress(0)

        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: 'POST'
            })

            if (res.ok) {
                toast.success('Tạo scenes thành công!')
                fetchProject()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Lỗi tạo scenes')
            }
        } catch (error) {
            console.error('Generate scenes error:', error)
            toast.error('Lỗi tạo scenes')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleEditScene = (scene: Scene) => {
        setEditingScene(scene.id)
        setEditedPrompt(scene.promptText)
    }

    const handleSaveScene = async (sceneId: string) => {
        try {
            const res = await fetch(`/api/scenes/${sceneId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ promptText: editedPrompt })
            })

            if (res.ok) {
                toast.success('Đã lưu')
                setEditingScene(null)
                fetchProject()
            }
        } catch (error) {
            toast.error('Lỗi lưu scene')
        }
    }

    const handleCopyAll = async () => {
        if (!project) return

        const formatted = formatScenesForExport(
            project.scenes.map(s => ({
                order: s.order,
                title: s.title || `Scene ${s.order}`,
                promptText: s.promptText,
                hookType: s.hookType || undefined,
                duration: s.duration
            })),
            exportFormat
        )

        await navigator.clipboard.writeText(formatted)
        setCopied(true)
        toast.success('Đã copy tất cả scenes')
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        if (!project) return

        const formatted = formatScenesForExport(
            project.scenes.map(s => ({
                order: s.order,
                title: s.title || `Scene ${s.order}`,
                promptText: s.promptText,
                hookType: s.hookType || undefined,
                duration: s.duration
            })),
            exportFormat
        )

        const blob = new Blob([formatted], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${project.title.replace(/\s+/g, '_')}_${project.scenes.length}_scenes.${exportFormat === 'api' || exportFormat === 'json' ? 'json' : 'txt'}`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Đã tải xuống')
    }

    const handleDeleteProject = async () => {
        if (!confirm('Bạn có chắc muốn xóa dự án này?')) return

        try {
            const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Đã xóa dự án')
                router.push('/dashboard/story')
            }
        } catch (error) {
            toast.error('Lỗi xóa dự án')
        }
    }

    const toggleSceneExpand = (sceneId: string) => {
        setExpandedScenes(prev => {
            const newSet = new Set(prev)
            if (newSet.has(sceneId)) {
                newSet.delete(sceneId)
            } else {
                newSet.add(sceneId)
            }
            return newSet
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
            </div>
        )
    }

    if (!project) {
        return null
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/story')}
                        className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">{project.title}</h1>
                        <div className="flex items-center gap-3 mt-1 text-sm text-[var(--text-secondary)]">
                            <span className="tag">{project.genre}</span>
                            <span className="flex items-center gap-1">
                                <Film className="w-4 h-4" />
                                {project.generatedScenes}/{project.totalScenes} scenes
                            </span>
                            <span className={`tag ${project.status === 'completed' ? 'tag-accent' :
                                project.status === 'generating' ? 'bg-yellow-500/20 text-yellow-400' :
                                    project.status === 'error' ? 'bg-red-500/20 text-red-400' : ''
                                }`}>
                                {project.status === 'completed' ? 'Hoàn thành' :
                                    project.status === 'generating' ? 'Đang tạo...' :
                                        project.status === 'error' ? 'Lỗi' : 'Nháp'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {project.status === 'draft' && project.scenes.length === 0 && (
                        <button
                            onClick={handleGenerateScenes}
                            disabled={isGenerating}
                            className="btn-primary flex items-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang tạo...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Tạo {project.totalScenes} scenes
                                </>
                            )}
                        </button>
                    )}
                    <button
                        onClick={() => router.push(`/dashboard/story/${id}/edit`)}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Edit2 className="w-4 h-4" />
                        Chỉnh sửa
                    </button>
                    <button
                        onClick={handleDeleteProject}
                        className="btn-secondary text-red-400 hover:bg-red-500/10"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Generating overlay */}
            {isGenerating && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-8 text-center mb-6"
                >
                    <Loader2 className="w-12 h-12 animate-spin text-[var(--accent-primary)] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Đang tạo {project.totalScenes} scenes...</h3>
                    <p className="text-[var(--text-secondary)]">
                        Quá trình này có thể mất vài phút. Vui lòng không đóng trang.
                    </p>
                </motion.div>
            )}

            {/* Export section */}
            {project.scenes.length > 0 && (
                <div className="glass-card p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Export format:</span>
                            {(['text', 'json', 'api'] as const).map((format) => (
                                <button
                                    key={format}
                                    onClick={() => setExportFormat(format)}
                                    className={`px-3 py-1 rounded text-sm ${exportFormat === format
                                        ? 'bg-[var(--accent-primary)] text-white'
                                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                        }`}
                                >
                                    {format.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopyAll}
                                className="btn-secondary flex items-center gap-2"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Đã copy' : 'Copy tất cả'}
                            </button>
                            <button
                                onClick={handleDownload}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Tải xuống
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scenes list */}
            {project.scenes.length > 0 ? (
                <div className="space-y-3">
                    {project.scenes.map((scene, index) => (
                        <motion.div
                            key={scene.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="glass-card overflow-hidden"
                        >
                            {/* Scene header */}
                            <button
                                onClick={() => toggleSceneExpand(scene.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-sm font-medium">
                                        {scene.order}
                                    </span>
                                    <div>
                                        <span className="font-medium">{scene.title || `Scene ${scene.order}`}</span>
                                        {scene.hookType && (
                                            <span className="ml-2 tag text-xs">{scene.hookType}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {scene.duration}s
                                    </span>
                                    {expandedScenes.has(scene.id) ? (
                                        <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
                                    )}
                                </div>
                            </button>

                            {/* Scene content */}
                            {expandedScenes.has(scene.id) && (
                                <div className="px-4 pb-4 border-t border-[var(--border-subtle)]">
                                    {editingScene === scene.id ? (
                                        <div className="mt-3">
                                            <textarea
                                                value={editedPrompt}
                                                onChange={(e) => setEditedPrompt(e.target.value)}
                                                className="input-field min-h-[120px] mono text-sm"
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button
                                                    onClick={() => setEditingScene(null)}
                                                    className="btn-secondary text-sm flex items-center gap-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={() => handleSaveScene(scene.id)}
                                                    className="btn-primary text-sm flex items-center gap-1"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    Lưu
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-3">
                                            <pre className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--bg-primary)] rounded-lg p-3 mono">
                                                {scene.promptText}
                                            </pre>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    {scene.promptText.length} ký tự
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(scene.promptText)
                                                            toast.success('Đã copy')
                                                        }}
                                                        className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                        Copy
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditScene(scene)}
                                                        className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                        Chỉnh sửa
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            ) : (
                !isGenerating && (
                    <div className="glass-card p-12 text-center">
                        <Film className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Chưa có scenes nào</h3>
                        <p className="text-[var(--text-secondary)] mb-4">
                            Nhấn nút "Tạo scenes" để bắt đầu
                        </p>
                        <button
                            onClick={handleGenerateScenes}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            Tạo {project.totalScenes} scenes
                        </button>
                    </div>
                )
            )}
        </div>
    )
}
