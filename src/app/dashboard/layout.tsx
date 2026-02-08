'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Sparkles,
    Menu,
    X,
    Tv,
    Shield
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', labelVi: 'Tổng quan', icon: LayoutDashboard },
    { href: '/dashboard/channels', label: 'Channels', labelVi: 'Kênh YouTube', icon: Tv },
    { href: '/dashboard/admin', label: 'Admin', labelVi: 'Quản lý Users', icon: Shield, adminOnly: true },
    { href: '/dashboard/settings', label: 'Settings', labelVi: 'Cài đặt', icon: Settings },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    // Fetch user role to show/hide admin menu
    useEffect(() => {
        async function checkAdminRole() {
            try {
                const res = await fetch('/api/user/profile')
                if (res.ok) {
                    const data = await res.json()
                    setIsAdmin(data.user?.isAdmin || false)
                }
            } catch (e) {
                console.error('Failed to check admin role:', e)
            }
        }
        if (status === 'authenticated') {
            checkAdminRole()
        }
    }, [status])

    // Filter nav items based on admin status
    const visibleNavItems = navItems.filter(item =>
        !item.adminOnly || (item.adminOnly && isAdmin)
    )

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!session) {
        return null
    }

    const handleLogout = () => {
        signOut({ callbackUrl: '/login' })
    }

    return (
        <div className="min-h-screen flex">
            {/* Mobile menu button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)]"
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar overlay for mobile */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="lg:hidden fixed inset-0 bg-black/50 z-40"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)]
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-[var(--border-subtle)]">
                        <Link href="/dashboard" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg">Veo Prompt</h1>
                                <p className="text-xs text-[var(--text-muted)]">Generator</p>
                            </div>
                        </Link>
                    </div>

                    {/* Nav items */}
                    <nav className="flex-1 p-4 space-y-1">
                        {visibleNavItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive
                                            ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white border border-[var(--border-accent)]'
                                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-white'
                                        }
                  `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.labelVi}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-[var(--border-subtle)]">
                        <div className="flex items-center gap-3 px-4 py-3 mb-2">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-sm font-medium">
                                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{session.user?.name}</p>
                                <p className="text-xs text-[var(--text-muted)] truncate">{session.user?.email}</p>
                            </div>
                        </div>

                        <Link
                            href="/dashboard/settings"
                            className="flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)] rounded-lg transition-all"
                        >
                            <Settings className="w-5 h-5" />
                            <span>Cài đặt</span>
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all mt-1"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-h-screen lg:pl-0 pt-16 lg:pt-0">
                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
