'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
    CreditCard,
    Package,
    Loader2,
    Check,
    AlertTriangle,
    ArrowUpRight,
    Settings,
    XCircle,
    Calendar,
    Zap
} from 'lucide-react'

interface Subscription {
    id: string
    status: string
    billingCycle: string
    gateway: string | null
    trialEndsAt: string | null
    currentPeriodEnd: string | null
    canceledAt: string | null
    apiCallsUsed: number
    episodesCreated: number
    usageResetAt: string
    plan: {
        id: string
        name: string
        slug: string
        priceMonthly: number
        priceYearly: number
        maxChannels: number
        maxEpisodesPerMonth: number
        maxApiCalls: number
        features: Record<string, boolean>
    }
}

export default function BillingPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    useEffect(() => {
        if (searchParams.get('success') === 'true') {
            toast.success('Subscription activated successfully!')
            // Clear the URL params
            window.history.replaceState({}, '', '/dashboard/billing')
        }
        fetchSubscription()
    }, [searchParams])

    const fetchSubscription = async () => {
        try {
            const res = await fetch('/api/subscription')
            const data = await res.json()
            setSubscription(data.subscription)
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load subscription')
        } finally {
            setLoading(false)
        }
    }

    const handleManageBilling = async () => {
        setActionLoading('portal')
        try {
            const res = await fetch('/api/subscription/portal', {
                method: 'POST'
            })
            const data = await res.json()

            if (res.ok && data.portalUrl) {
                window.location.href = data.portalUrl
            } else {
                toast.error(data.error || 'Failed to open billing portal')
            }
        } catch (error) {
            console.error('Portal error:', error)
            toast.error('Failed to open billing portal')
        } finally {
            setActionLoading(null)
        }
    }

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
            return
        }

        setActionLoading('cancel')
        try {
            const res = await fetch('/api/subscription/cancel', {
                method: 'POST'
            })
            const data = await res.json()

            if (res.ok) {
                toast.success(data.message)
                fetchSubscription()
            } else {
                toast.error(data.error || 'Failed to cancel subscription')
            }
        } catch (error) {
            console.error('Cancel error:', error)
            toast.error('Failed to cancel subscription')
        } finally {
            setActionLoading(null)
        }
    }

    const getUsagePercentage = (used: number, max: number) => {
        if (max === -1) return 0 // Unlimited
        if (max === 0) return 100 // No access
        return Math.min((used / max) * 100, 100)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs rounded-full">Active</span>
            case 'trialing':
                return <span className="px-2 py-1 bg-blue-500/20 text-blue-500 text-xs rounded-full">Trial</span>
            case 'canceled':
                return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded-full">Canceled</span>
            case 'past_due':
                return <span className="px-2 py-1 bg-red-500/20 text-red-500 text-xs rounded-full">Past Due</span>
            default:
                return <span className="px-2 py-1 bg-gray-500/20 text-gray-500 text-xs rounded-full">{status}</span>
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        )
    }

    if (!subscription) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="glass-card p-8 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                    <h1 className="text-2xl font-bold mb-2">No Active Subscription</h1>
                    <p className="text-[var(--text-secondary)] mb-6">
                        Choose a plan to unlock more features and higher limits.
                    </p>
                    <Link href="/pricing" className="btn-primary inline-flex items-center gap-2">
                        View Plans <ArrowUpRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        )
    }

    const plan = subscription.plan
    const isPaid = plan.priceMonthly > 0
    const isCanceled = subscription.status === 'canceled'
    const isTrial = subscription.status === 'trialing'

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Billing</h1>
                    <p className="text-[var(--text-secondary)]">Manage your subscription and usage</p>
                </div>
                {isPaid && !isCanceled && (
                    <button
                        onClick={handleManageBilling}
                        disabled={actionLoading === 'portal'}
                        className="btn-secondary flex items-center gap-2"
                    >
                        {actionLoading === 'portal' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Settings className="w-4 h-4" />
                        )}
                        Manage Billing
                    </button>
                )}
            </div>

            {/* Current Plan */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
            >
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold">{plan.name} Plan</h2>
                                {getStatusBadge(subscription.status)}
                            </div>
                            <p className="text-[var(--text-secondary)]">
                                ${plan.priceMonthly}/month · {subscription.billingCycle}
                            </p>
                        </div>
                    </div>
                    {!isPaid && (
                        <Link href="/pricing" className="btn-primary flex items-center gap-2">
                            Upgrade <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>

                {/* Status Messages */}
                {isTrial && subscription.trialEndsAt && (
                    <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg mb-4">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <span className="text-sm">
                            Trial ends on {new Date(subscription.trialEndsAt).toLocaleDateString()}
                        </span>
                    </div>
                )}

                {isCanceled && subscription.currentPeriodEnd && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg mb-4">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm">
                            Access until {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </span>
                    </div>
                )}

                {/* Usage Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Episodes Usage */}
                    <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[var(--text-muted)]">Episodes</span>
                            <span className="text-sm">
                                {subscription.episodesCreated} / {plan.maxEpisodesPerMonth === -1 ? '∞' : plan.maxEpisodesPerMonth}
                            </span>
                        </div>
                        <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                                style={{ width: `${getUsagePercentage(subscription.episodesCreated, plan.maxEpisodesPerMonth)}%` }}
                            />
                        </div>
                    </div>

                    {/* API Calls Usage */}
                    <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[var(--text-muted)]">API Calls</span>
                            <span className="text-sm">
                                {subscription.apiCallsUsed} / {plan.maxApiCalls === 0 ? 'N/A' : plan.maxApiCalls === -1 ? '∞' : plan.maxApiCalls}
                            </span>
                        </div>
                        <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r transition-all ${plan.maxApiCalls === 0
                                        ? 'from-gray-500 to-gray-600'
                                        : 'from-cyan-500 to-blue-500'
                                    }`}
                                style={{ width: `${plan.maxApiCalls === 0 ? 0 : getUsagePercentage(subscription.apiCallsUsed, plan.maxApiCalls)}%` }}
                            />
                        </div>
                    </div>

                    {/* Reset Date */}
                    <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[var(--text-muted)]">Usage Resets</span>
                            <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                        </div>
                        <p className="text-sm font-medium">
                            {new Date(subscription.usageResetAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Features */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6"
            >
                <h3 className="font-semibold mb-4">Plan Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{plan.maxChannels === -1 ? 'Unlimited' : plan.maxChannels} channels</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {plan.features.apiAccess ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <XCircle className="w-4 h-4 text-[var(--text-muted)]" />
                        )}
                        <span className={`text-sm ${!plan.features.apiAccess ? 'text-[var(--text-muted)]' : ''}`}>
                            API Access
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {plan.features.advancedCinematicStyles ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <XCircle className="w-4 h-4 text-[var(--text-muted)]" />
                        )}
                        <span className={`text-sm ${!plan.features.advancedCinematicStyles ? 'text-[var(--text-muted)]' : ''}`}>
                            Advanced Styles
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {plan.features.youtubeStrategies ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <XCircle className="w-4 h-4 text-[var(--text-muted)]" />
                        )}
                        <span className={`text-sm ${!plan.features.youtubeStrategies ? 'text-[var(--text-muted)]' : ''}`}>
                            YouTube Strategies
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {plan.features.prioritySupport ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <XCircle className="w-4 h-4 text-[var(--text-muted)]" />
                        )}
                        <span className={`text-sm ${!plan.features.prioritySupport ? 'text-[var(--text-muted)]' : ''}`}>
                            Priority Support
                        </span>
                    </div>
                </div>

                {!isPaid && (
                    <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-purple-500" />
                            <div>
                                <p className="font-medium">Upgrade for more features</p>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Get API access, advanced styles, and higher limits
                                </p>
                            </div>
                            <Link href="/pricing" className="btn-primary ml-auto">
                                View Plans
                            </Link>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Cancel Subscription */}
            {isPaid && !isCanceled && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold">Cancel Subscription</h3>
                            <p className="text-sm text-[var(--text-muted)]">
                                You'll retain access until the end of your billing period
                            </p>
                        </div>
                        <button
                            onClick={handleCancel}
                            disabled={actionLoading === 'cancel'}
                            className="btn-secondary text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                        >
                            {actionLoading === 'cancel' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <XCircle className="w-4 h-4" />
                            )}
                            Cancel
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
