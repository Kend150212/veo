'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    Plus,
    Film,
    Clock,
    MoreVertical,
    Trash2,
    Loader2,
    FolderOpen
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Project {
    id: string
    title: string
    genre: string
    totalScenes: number
    generatedScenes: number
    status: string
    createdAt: string
    updatedAt: string
    _count: { scenes: number }
}

export default function StoryPage() {
    const { data: session } = useSession()
    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchProjects()
    }, [])

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects')
            if (res.ok) {
                const data = await res.json()
                setProjects(data.projects || [])
            }
        } catch (error) {
            console.error('Fetch projects error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteProject = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa dự án này?')) return

        try {
            const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Đã xóa dự án')
                fetchProjects()
            }
        } catch (error) {
            toast.error('Lỗi xóa dự án')
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Story Mode</h1>
                    <p className="text-[var(--text-secondary)]">Tạo phim ngắn với nhiều scenes</p>
                </div>
                <Link href="/dashboard/story/new" className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Dự án mới
                </Link>
            </div>

            {projects.length > 0 ? (
                <div className="grid gap-4">
                    {projects.map((project, index) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link
                                href={`/dashboard/story/${project.id}`}
                                className="glass-card p-5 block hover:bg-[var(--bg-hover)] transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                                            <Film className="w-6 h-6 text-[var(--accent-primary)]" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
                                            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                                                <span className="tag">{project.genre}</span>
                                                <span>{project._count.scenes || project.generatedScenes}/{project.totalScenes} scenes</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(project.updatedAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`tag ${project.status === 'completed' ? 'tag-accent' :
                                                project.status === 'generating' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    project.status === 'error' ? 'bg-red-500/20 text-red-400' : ''
                                            }`}>
                                            {project.status === 'completed' ? 'Hoàn thành' :
                                                project.status === 'generating' ? 'Đang tạo' :
                                                    project.status === 'error' ? 'Lỗi' : 'Nháp'}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                handleDeleteProject(project.id)
                                            }}
                                            className="p-2 rounded-lg hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <FolderOpen className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Chưa có dự án nào</h3>
                    <p className="text-[var(--text-secondary)] mb-6">
                        Bắt đầu tạo phim ngắn với Story Mode
                    </p>
                    <Link href="/dashboard/story/new" className="btn-primary inline-flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Tạo dự án đầu tiên
                    </Link>
                </div>
            )}
        </div>
    )
}
