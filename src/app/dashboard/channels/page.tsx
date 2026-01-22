'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Plus,
    Tv,
    Sparkles,
    ChevronRight,
    Film,
    Users,
    Loader2,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Channel {
    id: string
    name: string
    niche: string
    visualStyleId: string | null
    hasCharacters: boolean
    createdAt: string
    _count: {
        episodes: number
        characters: number
    }
}

export default function ChannelsPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [channels, setChannels] = useState<Channel[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedNiche, setExpandedNiche] = useState<string | null>(null)

    useEffect(() => {
        fetchChannels()
    }, [])

    const fetchChannels = async () => {
        try {
            const res = await fetch('/api/channels')
            const data = await res.json()
            if (data.channels) {
                setChannels(data.channels)
            }
        } catch (error) {
            toast.error('Không thể tải danh sách kênh')
        } finally {
            setIsLoading(false)
        }
    }

    const truncateText = (text: string, maxLength: number = 80) => {
        if (text.length <= maxLength) return text
        return text.substring(0, maxLength).trim() + '...'
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Tv className="w-8 h-8 text-[var(--accent-primary)]" />
                        YouTube Channels
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        Quản lý kênh YouTube và tạo nội dung theo Episodes
                    </p>
                </div>
                <button
                    onClick={() => router.push('/dashboard/channels/new')}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Tạo Kênh Mới
                </button>
            </div>

            {/* Channels Grid */}
            {channels.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-12 text-center"
                >
                    <Tv className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Chưa có kênh nào</h3>
                    <p className="text-[var(--text-secondary)] mb-6">
                        Tạo kênh YouTube đầu tiên để bắt đầu sản xuất nội dung theo Episodes
                    </p>
                    <button
                        onClick={() => router.push('/dashboard/channels/new')}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Sparkles className="w-5 h-5" />
                        Tạo Kênh Đầu Tiên
                    </button>
                </motion.div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {channels.map((channel, index) => (
                        <motion.div
                            key={channel.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card p-5 hover:border-[var(--accent-primary)] transition-all group"
                        >
                            <div
                                onClick={() => router.push(`/dashboard/channels/${channel.id}`)}
                                className="cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                        <Tv className="w-6 h-6 text-white" />
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" />
                                </div>

                                <h3 className="font-semibold text-lg mb-1">{channel.name}</h3>
                            </div>

                            {/* Niche Description with See More */}
                            <div className="mb-3">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {expandedNiche === channel.id
                                        ? channel.niche
                                        : truncateText(channel.niche, 80)
                                    }
                                </p>
                                {channel.niche.length > 80 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setExpandedNiche(expandedNiche === channel.id ? null : channel.id)
                                        }}
                                        className="text-xs text-[var(--accent-primary)] hover:underline mt-1 flex items-center gap-1"
                                    >
                                        {expandedNiche === channel.id ? (
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
                            </div>

                            <div
                                onClick={() => router.push(`/dashboard/channels/${channel.id}`)}
                                className="cursor-pointer"
                            >
                                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                                    <span className="flex items-center gap-1">
                                        <Film className="w-3.5 h-3.5" />
                                        {channel._count.episodes} Episodes
                                    </span>
                                    {channel.hasCharacters && (
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3.5 h-3.5" />
                                            {channel._count.characters} Nhân vật
                                        </span>
                                    )}
                                </div>

                                {channel.visualStyleId && (
                                    <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                                        <span className="tag text-xs">{channel.visualStyleId}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
