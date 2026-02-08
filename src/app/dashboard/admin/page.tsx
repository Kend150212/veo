'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
    Users,
    Shield,
    Trash2,
    Edit,
    ChevronLeft,
    Search,
    Check,
    X,
    Calendar,
    Key
} from 'lucide-react'

interface UserData {
    id: string
    email: string
    name: string | null
    role: string
    createdAt: string
    hasApiKey: boolean
    _count: {
        channels: number
        projects: number
    }
}

export default function AdminPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [users, setUsers] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [editingUser, setEditingUser] = useState<string | null>(null)
    const [editRole, setEditRole] = useState<string>('')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/v1/admin/users')
            if (!res.ok) {
                if (res.status === 403) {
                    toast.error('Bạn không có quyền truy cập trang này')
                    router.push('/dashboard')
                    return
                }
                throw new Error('Failed to fetch users')
            }
            const data = await res.json()
            setUsers(data.users)
        } catch (error) {
            console.error(error)
            toast.error('Không thể tải danh sách users')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const res = await fetch(`/api/v1/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            })
            if (!res.ok) throw new Error('Failed to update')

            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
            setEditingUser(null)
            toast.success('Đã cập nhật role')
        } catch (error) {
            toast.error('Không thể cập nhật')
        }
    }

    const handleDeleteUser = async (userId: string, email: string) => {
        if (!confirm(`Xác nhận xóa user ${email}? Tất cả dữ liệu sẽ bị xóa.`)) return

        try {
            const res = await fetch(`/api/v1/admin/users/${userId}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Failed to delete')

            setUsers(users.filter(u => u.id !== userId))
            toast.success('Đã xóa user')
        } catch (error) {
            toast.error('Không thể xóa user')
        }
    }

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)]" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Shield className="w-6 h-6 text-red-400" />
                            Quản lý Admin
                        </h1>
                        <p className="text-sm text-[var(--text-muted)]">
                            Quản lý users và phân quyền
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="glass-card p-4 text-center">
                    <Users className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                    <p className="text-2xl font-bold">{users.length}</p>
                    <p className="text-xs text-[var(--text-muted)]">Tổng users</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <Shield className="w-6 h-6 mx-auto mb-2 text-red-400" />
                    <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                    <p className="text-xs text-[var(--text-muted)]">Admins</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <Key className="w-6 h-6 mx-auto mb-2 text-green-400" />
                    <p className="text-2xl font-bold">{users.filter(u => u.hasApiKey).length}</p>
                    <p className="text-xs text-[var(--text-muted)]">Có API Key</p>
                </div>
            </div>

            {/* Search */}
            <div className="glass-card p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Tìm theo email hoặc tên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10 w-full"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="glass-card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[var(--bg-tertiary)]">
                        <tr>
                            <th className="text-left p-4 font-medium">User</th>
                            <th className="text-left p-4 font-medium">Role</th>
                            <th className="text-center p-4 font-medium">API Key</th>
                            <th className="text-center p-4 font-medium">Channels</th>
                            <th className="text-left p-4 font-medium">Ngày tạo</th>
                            <th className="text-right p-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <motion.tr
                                key={user.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="border-t border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
                            >
                                <td className="p-4">
                                    <div>
                                        <p className="font-medium">{user.email}</p>
                                        {user.name && (
                                            <p className="text-sm text-[var(--text-muted)]">{user.name}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    {editingUser === user.id ? (
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={editRole}
                                                onChange={(e) => setEditRole(e.target.value)}
                                                className="input-field text-sm py-1"
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <button
                                                onClick={() => handleUpdateRole(user.id, editRole)}
                                                className="p-1 text-green-400 hover:bg-green-400/20 rounded"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setEditingUser(null)}
                                                className="p-1 text-red-400 hover:bg-red-400/20 rounded"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className={`tag ${user.role === 'admin' ? 'tag-error' : 'tag-muted'}`}>
                                            {user.role}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-center">
                                    {user.hasApiKey ? (
                                        <span className="text-green-400">✓</span>
                                    ) : (
                                        <span className="text-[var(--text-muted)]">—</span>
                                    )}
                                </td>
                                <td className="p-4 text-center">
                                    {user._count.channels}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingUser(user.id)
                                                setEditRole(user.role)
                                            }}
                                            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg"
                                            title="Sửa role"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        {user.id !== session?.user?.id && (
                                            <button
                                                onClick={() => handleDeleteUser(user.id, user.email)}
                                                className="p-2 hover:bg-red-500/20 rounded-lg text-red-400"
                                                title="Xóa user"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-[var(--text-muted)]">
                        Không tìm thấy user nào
                    </div>
                )}
            </div>
        </div>
    )
}
