'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Clock,
    Copy,
    Trash2,
    Search,
    FileText,
    ChevronDown,
    ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

// Mock history data - in real app this would come from API
const mockHistory = [
    {
        id: '1',
        promptText: 'A seasoned detective in his 50s with a weathered face, wearing a rumpled trench coat, slowly lighting a cigarette while leaning against a brick wall. Setting: A dimly lit alley in a 1940s metropolis at midnight. Camera: Low-angle static shot, shallow depth of field.',
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        format: 'text'
    },
    {
        id: '2',
        promptText: 'A majestic Bengal tiger prowling through tall grass in Indian jungle at sunset. BBC documentary style, telephoto lens with background compression.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        format: 'json'
    },
    {
        id: '3',
        promptText: 'Luxury wireless headphone rotating slowly on white background, Apple-style minimalism, soft studio lighting.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        format: 'api'
    }
]

export default function HistoryPage() {
    const [history, setHistory] = useState(mockHistory)
    const [search, setSearch] = useState('')
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const filteredHistory = history.filter(item =>
        item.promptText.toLowerCase().includes(search.toLowerCase())
    )

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text)
        toast.success('Đã copy vào clipboard')
    }

    const handleDelete = (id: string) => {
        setHistory(prev => prev.filter(item => item.id !== id))
        toast.success('Đã xóa khỏi lịch sử')
    }

    const formatDate = (date: Date) => {
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const mins = Math.floor(diff / (1000 * 60))
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (mins < 60) return `${mins} phút trước`
        if (hours < 24) return `${hours} giờ trước`
        return `${days} ngày trước`
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Lịch sử Prompt</h1>
                <p className="text-[var(--text-secondary)]">Các prompt bạn đã tạo gần đây</p>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm trong lịch sử..."
                    className="input-field pl-11"
                />
            </div>

            {/* History list */}
            <div className="space-y-3">
                {filteredHistory.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="glass-card overflow-hidden"
                    >
                        {/* Header */}
                        <button
                            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-[var(--bg-hover)] transition-colors text-left"
                        >
                            <div className="w-10 h-10 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-[var(--accent-primary)]" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">
                                    {item.promptText.slice(0, 100)}...
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(item.createdAt)}
                                    </span>
                                    <span className="tag text-xs">{item.format.toUpperCase()}</span>
                                </div>
                            </div>

                            {expandedId === item.id ? (
                                <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
                            )}
                        </button>

                        {/* Expanded content */}
                        {expandedId === item.id && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="border-t border-[var(--border-subtle)]"
                            >
                                <div className="p-4">
                                    <pre className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--bg-primary)] rounded-lg p-4 mb-4">
                                        {item.promptText}
                                    </pre>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleCopy(item.promptText)}
                                            className="btn-secondary flex items-center gap-2 text-sm"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Copy
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="btn-secondary flex items-center gap-2 text-sm text-red-400 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>

            {filteredHistory.length === 0 && (
                <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                    <p className="text-[var(--text-muted)]">
                        {search ? 'Không tìm thấy kết quả' : 'Chưa có lịch sử nào'}
                    </p>
                </div>
            )}
        </div>
    )
}
