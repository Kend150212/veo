'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import {
    DollarSign,
    Search,
    Filter,
    Download,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    User,
    CreditCard,
    TrendingUp
} from 'lucide-react'

interface Transaction {
    id: string
    type: string
    status: string
    amount: number
    currency: string
    gateway: string
    externalId: string | null
    description: string | null
    createdAt: string
    user: {
        id: string
        email: string
        name: string | null
    }
}

interface Stats {
    byStatus: { status: string; _count: number; _sum: { amount: number } }[]
    totalRevenue: number
}

const statusColors: Record<string, string> = {
    completed: 'bg-green-500/20 text-green-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    failed: 'bg-red-500/20 text-red-400',
    refunded: 'bg-purple-500/20 text-purple-400'
}

const statusIcons: Record<string, typeof CheckCircle> = {
    completed: CheckCircle,
    pending: Clock,
    failed: XCircle,
    refunded: RefreshCw
}

export default function TransactionsPage() {
    const router = useRouter()
    const { data: session, status: sessionStatus } = useSession()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [filters, setFilters] = useState({
        status: '',
        gateway: '',
        search: ''
    })

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
        fetchTransactions()
    }, [session, sessionStatus, router, page, filters])

    const fetchTransactions = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            })
            if (filters.status) params.append('status', filters.status)
            if (filters.gateway) params.append('gateway', filters.gateway)

            const res = await fetch(`/api/admin/transactions?${params}`, {
                credentials: 'include'
            })
            if (!res.ok) throw new Error('Failed to load transactions')
            const data = await res.json()
            setTransactions(data.transactions || [])
            setTotalPages(data.pagination?.pages || 1)
            setStats(data.stats || null)
        } catch (err) {
            console.error(err)
            toast.error('Failed to load transactions')
        } finally {
            setLoading(false)
        }
    }

    const exportCSV = () => {
        const headers = ['ID', 'Date', 'User', 'Type', 'Status', 'Amount', 'Gateway']
        const rows = transactions.map(t => [
            t.id,
            new Date(t.createdAt).toISOString(),
            t.user.email,
            t.type,
            t.status,
            `${t.amount} ${t.currency}`,
            t.gateway
        ])
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
    }

    if (sessionStatus === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Transactions</h1>
                    <p className="text-[var(--text-secondary)]">View and manage all payment transactions</p>
                </div>
                <button
                    onClick={exportCSV}
                    className="btn-secondary flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">Total Revenue</p>
                                <p className="text-xl font-bold text-green-400">
                                    ${stats.totalRevenue.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    {stats.byStatus.map(s => {
                        const Icon = statusIcons[s.status] || DollarSign
                        return (
                            <div key={s.status} className="glass-card p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusColors[s.status] || 'bg-gray-500/20'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-[var(--text-secondary)] capitalize">{s.status}</p>
                                        <p className="text-xl font-bold">{s._count}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Filters */}
            <div className="glass-card p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search by email or ID..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="input-field flex-1"
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="input-field"
                    >
                        <option value="">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                    </select>
                    <select
                        value={filters.gateway}
                        onChange={(e) => setFilters({ ...filters, gateway: e.target.value })}
                        className="input-field"
                    >
                        <option value="">All Gateways</option>
                        <option value="stripe">Stripe</option>
                        <option value="paypal">PayPal</option>
                        <option value="manual">Manual</option>
                    </select>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border-subtle)]">
                                <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">Date</th>
                                <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">User</th>
                                <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">Type</th>
                                <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">Status</th>
                                <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">Amount</th>
                                <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">Gateway</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((t) => {
                                    const StatusIcon = statusIcons[t.status] || DollarSign
                                    return (
                                        <tr key={t.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]">
                                            <td className="p-4 text-sm">
                                                {new Date(t.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-[var(--text-muted)]" />
                                                    <div>
                                                        <p className="text-sm font-medium">{t.user.name || 'No name'}</p>
                                                        <p className="text-xs text-[var(--text-muted)]">{t.user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm capitalize">{t.type}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusColors[t.status] || 'bg-gray-500/20'}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`font-medium ${t.type === 'refund' ? 'text-red-400' : 'text-green-400'}`}>
                                                    {t.type === 'refund' ? '-' : '+'}${t.amount.toLocaleString()} {t.currency}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="w-4 h-4 text-[var(--text-muted)]" />
                                                    <span className="text-sm capitalize">{t.gateway}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-[var(--border-subtle)]">
                        <p className="text-sm text-[var(--text-muted)]">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="btn-secondary p-2 disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="btn-secondary p-2 disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
