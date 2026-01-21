'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    PenTool,
    Library,
    History,
    TrendingUp,
    Sparkles,
    ArrowRight
} from 'lucide-react'

export default function DashboardPage() {
    const { data: session } = useSession()

    const quickActions = [
        {
            title: 'Tạo Prompt Mới',
            description: 'Bắt đầu tạo prompt với Structured Builder',
            icon: PenTool,
            href: '/dashboard/builder',
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            title: 'Duyệt Mẫu',
            description: 'Chọn từ các template có sẵn',
            icon: Library,
            href: '/dashboard/templates',
            gradient: 'from-cyan-500 to-blue-500'
        },
        {
            title: 'Xem Lịch Sử',
            description: 'Các prompt đã tạo gần đây',
            icon: History,
            href: '/dashboard/history',
            gradient: 'from-orange-500 to-yellow-500'
        }
    ]

    const stats = [
        { label: 'Prompts đã tạo', value: '0', icon: PenTool },
        { label: 'Templates sử dụng', value: '0', icon: Library },
        { label: 'Lượt export', value: '0', icon: TrendingUp }
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
                    Chào mừng bạn đến với Veo Prompt Generator. Hãy bắt đầu tạo prompt video chuyên nghiệp.
                </p>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            >
                {stats.map((stat, index) => (
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
                        <h3 className="font-semibold mb-2">💡 Mẹo tạo prompt hiệu quả</h3>
                        <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                            <li>• <strong>Chi tiết hóa Subject:</strong> Mô tả kỹ đặc điểm, quần áo, biểu cảm</li>
                            <li>• <strong>Sử dụng Camera:</strong> Chỉ định góc quay, chuyển động, lens</li>
                            <li>• <strong>Thêm Negative Prompt:</strong> Tránh flickering, blurry, distorted</li>
                            <li>• <strong>Giữ dưới 1500 ký tự:</strong> Prompt quá dài có thể bị cắt</li>
                        </ul>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
