'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import {
    TrendingUp,
    Users,
    CreditCard,
    Tv,
    Film,
    DollarSign,
    Calendar,
    RefreshCw,
    BarChart3,
    PieChart
} from 'lucide-react'

interface ReportsData {
    period: string
    overview: {
        totalUsers: number
        newUsers: number
        activeSubscriptions: number
        totalChannels: number
        totalEpisodes: number
        totalRevenue: number
        totalTransactions: number
    }
    charts: {
        revenueByDay: { date: string; amount: number }[]
        transactionsByDay: { date: string; count: number }[]
    }
    subscriptionsByPlan: { planName: string; count: number }[]
    recentUsers: { id: string; email: string; name: string | null; createdAt: string }[]
}

const periodOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
]

export default function ReportsPage() {
    const router = useRouter()
    const { data: session, status: sessionStatus } = useSession()
    const [data, setData] = useState<ReportsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('30d')

    useEffect(() => {
        if (sessionStatus === 'loading') return
        if (!session) {
            router.push('/login')
            return
        }
        if ((session?.user as { role?: string })?.role !== 'admin') {
            router.push('/dashboard')
            return
        }
        fetchReports()
    }, [session, sessionStatus, router, period])

    const fetchReports = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/admin/reports?period=${period}`, {
                credentials: 'include'
            })
            if (!res.ok) throw new Error('Failed to load reports')
            const result = await res.json()
            setData(result)
        } catch (err) {
            console.error(err)
            toast.error('Failed to load reports')
        } finally {
            setLoading(false)
        }
    }

    if (sessionStatus === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!data) return null

    const maxRevenue = Math.max(...data.charts.revenueByDay.map(d => d.amount), 1)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Reports</h1>
                    <p className="text-[var(--text-secondary)]">Analytics and business insights</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="input-field"
                    >
                        {periodOptions.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                    <button onClick={fetchReports} className="btn-secondary p-2">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--text-muted)]">Total Users</p>
                            <p className="text-xl font-bold">{data.overview.totalUsers}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--text-muted)]">New Users</p>
                            <p className="text-xl font-bold text-green-400">+{data.overview.newUsers}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--text-muted)]">Active Subs</p>
                            <p className="text-xl font-bold">{data.overview.activeSubscriptions}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                            <Tv className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--text-muted)]">Channels</p>
                            <p className="text-xl font-bold">{data.overview.totalChannels}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <Film className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--text-muted)]">Episodes</p>
                            <p className="text-xl font-bold">{data.overview.totalEpisodes}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--text-muted)]">Revenue</p>
                            <p className="text-xl font-bold text-emerald-400">${data.overview.totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-pink-400" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--text-muted)]">Transactions</p>
                            <p className="text-xl font-bold">{data.overview.totalTransactions}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        Revenue Over Time
                    </h3>
                    {data.charts.revenueByDay.length === 0 ? (
                        <p className="text-center py-8 text-[var(--text-muted)]">No revenue data yet</p>
                    ) : (
                        <div className="space-y-2">
                            {data.charts.revenueByDay.slice(-14).map((d, i) => (
                                <div key={d.date} className="flex items-center gap-3">
                                    <span className="text-xs text-[var(--text-muted)] w-20">
                                        {new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="flex-1 h-6 bg-[var(--bg-tertiary)] rounded overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded"
                                            style={{ width: `${(d.amount / maxRevenue) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium w-20 text-right">${d.amount}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Subscriptions by Plan */}
                <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-purple-400" />
                        Subscriptions by Plan
                    </h3>
                    {data.subscriptionsByPlan.length === 0 ? (
                        <p className="text-center py-8 text-[var(--text-muted)]">No subscriptions yet</p>
                    ) : (
                        <div className="space-y-3">
                            {data.subscriptionsByPlan.map((p, i) => {
                                const colors = ['bg-purple-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500']
                                const total = data.subscriptionsByPlan.reduce((s, x) => s + x.count, 0)
                                return (
                                    <div key={p.planName}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>{p.planName}</span>
                                            <span className="font-medium">{p.count}</span>
                                        </div>
                                        <div className="h-2 bg-[var(--bg-tertiary)] rounded overflow-hidden">
                                            <div
                                                className={`h-full ${colors[i % colors.length]} rounded`}
                                                style={{ width: `${(p.count / total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Users */}
            <div className="glass-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    Recent Sign-ups
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border-subtle)]">
                                <th className="text-left p-3 text-sm font-medium text-[var(--text-secondary)]">User</th>
                                <th className="text-left p-3 text-sm font-medium text-[var(--text-secondary)]">Email</th>
                                <th className="text-left p-3 text-sm font-medium text-[var(--text-secondary)]">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentUsers.map(u => (
                                <tr key={u.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]">
                                    <td className="p-3 text-sm font-medium">{u.name || 'No name'}</td>
                                    <td className="p-3 text-sm text-[var(--text-secondary)]">{u.email}</td>
                                    <td className="p-3 text-sm text-[var(--text-muted)]">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
