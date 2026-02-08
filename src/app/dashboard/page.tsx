'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
    Tv,
    Play,
    TrendingUp,
    Sparkles,
    ArrowRight,
    Plus,
    Film
} from 'lucide-react'

interface ChannelStats {
    totalChannels: number
    totalEpisodes: number
    totalScenes: number
}

export default function DashboardPage() {
    const { data: session } = useSession()
    const [stats, setStats] = useState<ChannelStats>({ totalChannels: 0, totalEpisodes: 0, totalScenes: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/channels')
                if (res.ok) {
                    const channels = await res.json()
                    let totalEpisodes = 0
                    let totalScenes = 0

                    for (const channel of channels) {
                        if (channel.episodes) {
                            totalEpisodes += channel.episodes.length
                            for (const ep of channel.episodes) {
                                totalScenes += ep.scenes?.length || 0
                            }
                        }
                    }

                    setStats({
                        totalChannels: channels.length,
                        totalEpisodes,
                        totalScenes
                    })
                }
            } catch (error) {
                console.error('Error fetching stats:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    const quickActions = [
        {
            title: 'Tạo Kênh Mới',
            description: 'Bắt đầu với kênh YouTube mới',
            icon: Plus,
            href: '/dashboard/channels',
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            title: 'Quản lý Kênh',
            description: 'Xem và quản lý các kênh hiện có',
            icon: Tv,
            href: '/dashboard/channels',
            gradient: 'from-cyan-500 to-blue-500'
        },
        {
            title: 'Tạo Episode',
            description: 'Tạo tập mới cho kênh của bạn',
            icon: Film,
            href: '/dashboard/channels',
            gradient: 'from-orange-500 to-yellow-500'
        }
    ]

    const statsData = [
        { label: 'Kênh YouTube', value: loading ? '...' : stats.totalChannels.toString(), icon: Tv },
        { label: 'Episodes', value: loading ? '...' : stats.totalEpisodes.toString(), icon: Play },
        { label: 'Scenes', value: loading ? '...' : stats.totalScenes.toString(), icon: TrendingUp }
    ]

    return (
        <div className="max-w-6xl mx-auto">
            {/* Welcome header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold mb-2">
                    Xin chào, {session?.user?.name || 'bạn'}! 👋
                </h1>
                <p className="text-[var(--text-secondary)]">
                    Quản lý kênh YouTube và tạo episodes chuyên nghiệp với AI.
                </p>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            >
                {statsData.map((stat, index) => (
                    <div key={index} className="glass-card p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center">
                                <stat.icon className="w-6 h-6 text-[var(--accent-primary)]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Quick actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
            >
                <h2 className="text-xl font-semibold mb-4">Bắt đầu nhanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.map((action, index) => (
                        <Link key={index} href={action.href}>
                            <motion.div
                                whileHover={{ y: -4 }}
                                className="glass-card p-6 h-full cursor-pointer group"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4`}>
                                    <action.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-semibold mb-2 group-hover:text-[var(--accent-primary)] transition-colors">
                                    {action.title}
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] mb-4">
                                    {action.description}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-[var(--accent-primary)]">
                                    <span>Bắt đầu</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </motion.div>

            {/* Tips section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
            >
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">💡 Mẹo tạo video YouTube hiệu quả</h3>
                        <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                            <li>• <strong>Tạo Character Bible:</strong> Mô tả rõ host/nhân vật để giữ nhất quán</li>
                            <li>• <strong>Chọn Visual Style:</strong> Đặt style chung cho toàn bộ kênh</li>
                            <li>• <strong>Dùng Content Type phù hợp:</strong> Voice-over, Host dẫn, hoặc Narrative</li>
                            <li>• <strong>Thiết lập Voice Settings:</strong> Chọn giọng nam/nữ và tone phù hợp</li>
                        </ul>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
