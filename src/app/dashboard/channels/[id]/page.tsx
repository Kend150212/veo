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
    Copy,
    Download,
    Edit2,
    Settings,
    Tv,
    Check
} from 'lucide-react'
import toast from 'react-hot-toast'

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
    characters: ChannelCharacter[]
    episodes: Episode[]
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

    useEffect(() => {
        fetchChannel()
    }, [id])

    const fetchChannel = async () => {
        try {
            const res = await fetch(`/api/channels/${id}`)
            const data = await res.json()
            if (data.channel) {
                setChannel(data.channel)
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

    const handleGenerateEpisode = async () => {
        setIsGenerating(true)
        try {
            const res = await fetch(`/api/channels/${id}/episodes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ totalScenes: sceneCount })
            })

            const data = await res.json()
            if (data.episode) {
                toast.success(`Đã tạo Episode ${data.episode.episodeNumber}!`)
                fetchChannel()
                setExpandedEpisode(data.episode.id)
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
                        <div className="flex items-center gap-3 mt-1 text-sm text-[var(--text-secondary)]">
                            <span className="tag">{channel.niche}</span>
                            {channel.visualStyleId && (
                                <span className="tag tag-accent">{channel.visualStyleId}</span>
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

            {/* Characters */}
            {channel.characters.length > 0 && (
                <div className="glass-card p-4 mb-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Nhân vật xuyên suốt
                    </h3>
                    <div className="flex gap-3 flex-wrap">
                        {channel.characters.map(char => (
                            <div key={char.id} className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                                    {char.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{char.name}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{char.role}</p>
                                </div>
                                {char.isMain && <span className="tag text-xs">Main</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Generate New Episode */}
            <div className="glass-card p-6 mb-6">
                <h3 className="font-semibold mb-4">Tạo Episode Mới</h3>
                <div className="flex items-end gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">Số cảnh</label>
                        <input
                            type="number"
                            min="5"
                            max="50"
                            value={sceneCount}
                            onChange={(e) => setSceneCount(Math.max(5, parseInt(e.target.value) || 10))}
                            className="input-field w-32"
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            ~{Math.round(sceneCount * 8 / 60)} phút video
                        </p>
                    </div>
                    <button
                        onClick={handleGenerateEpisode}
                        disabled={isGenerating}
                        className="btn-primary flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                AI đang tạo...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Tạo Episode {channel.episodes.length + 1}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Episodes List */}
            <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <Film className="w-5 h-5" />
                    Episodes ({channel.episodes.length})
                </h3>

                {channel.episodes.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <Film className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                        <p className="text-[var(--text-secondary)]">
                            Chưa có episode nào. Tạo episode đầu tiên!
                        </p>
                    </div>
                ) : (
                    channel.episodes.map((episode, index) => (
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
                                    <div className="px-4 py-2 flex gap-2 border-b border-[var(--border-subtle)]">
                                        <button
                                            onClick={() => handleCopyEpisode(episode)}
                                            className="btn-secondary text-sm flex items-center gap-1"
                                        >
                                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            Copy All
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
