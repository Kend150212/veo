'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
    Check,
    Zap,
    Star,
    Crown,
    Loader2,
    ArrowRight,
    CreditCard
} from 'lucide-react'

interface PlanFeatures {
    apiAccess: boolean
    advancedCinematicStyles: boolean
    allNarrativeTemplates: boolean
    characterCustomization: boolean
    youtubeStrategies: boolean
    prioritySupport: boolean
    customIntegrations: boolean
}

interface Plan {
    id: string
    name: string
    slug: string
    description: string
    priceMonthly: number
    priceYearly: number
    yearlyDiscount: number
    maxChannels: number
    maxEpisodesPerMonth: number
    maxApiCalls: number
    features: PlanFeatures
    isPopular: boolean
    yearlySavings: number
}

const planIcons: Record<string, React.ReactNode> = {
    free: <Zap className="w-6 h-6" />,
    starter: <Star className="w-6 h-6" />,
    pro: <Crown className="w-6 h-6" />,
    enterprise: <CreditCard className="w-6 h-6" />
}

const planGradients: Record<string, string> = {
    free: 'from-gray-500 to-gray-600',
    starter: 'from-blue-500 to-cyan-500',
    pro: 'from-purple-500 to-pink-500',
    enterprise: 'from-amber-500 to-orange-500'
}

function PricingContent() {
    const { data: session } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
    const [subscribing, setSubscribing] = useState<string | null>(null)

    useEffect(() => {
        if (searchParams.get('canceled') === 'true') {
            toast.error('Checkout canceled')
        }
        fetchPlans()
    }, [searchParams])

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/plans')
            const data = await res.json()
            setPlans(data.plans || [])
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load plans')
        } finally {
            setLoading(false)
        }
    }

    const handleSubscribe = async (plan: Plan) => {
        if (!session) {
            router.push('/login?redirect=/pricing')
            return
        }

        if (plan.priceMonthly === 0) {
            router.push('/dashboard')
            return
        }

        setSubscribing(plan.id)
        try {
            const res = await fetch('/api/subscription/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: plan.id,
                    billingCycle,
                    gateway: 'stripe'
                })
            })

            const data = await res.json()

            if (res.ok && data.checkoutUrl) {
                window.location.href = data.checkoutUrl
            } else {
                toast.error(data.error || 'Failed to start checkout')
            }
        } catch (error) {
            console.error('Checkout error:', error)
            toast.error('Failed to start checkout')
        } finally {
            setSubscribing(null)
        }
    }

    const getPrice = (plan: Plan) => {
        return billingCycle === 'yearly' ? plan.priceYearly / 12 : plan.priceMonthly
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-16 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
                        Start with a 14-day free trial. No credit card required for free plan.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-4 p-1 bg-[var(--bg-secondary)] rounded-full">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2 rounded-full transition-all ${billingCycle === 'monthly'
                                    ? 'bg-purple-500 text-white'
                                    : 'text-[var(--text-secondary)] hover:text-white'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-6 py-2 rounded-full transition-all flex items-center gap-2 ${billingCycle === 'yearly'
                                    ? 'bg-purple-500 text-white'
                                    : 'text-[var(--text-secondary)] hover:text-white'
                                }`}
                        >
                            Yearly
                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                Save 17%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`glass-card p-6 relative flex flex-col ${plan.isPopular ? 'ring-2 ring-purple-500 scale-105' : ''
                                }`}
                        >
                            {plan.isPopular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full">
                                    Most Popular
                                </div>
                            )}

                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${planGradients[plan.slug] || 'from-gray-500 to-gray-600'} flex items-center justify-center mb-4 text-white`}>
                                {planIcons[plan.slug] || <Zap className="w-6 h-6" />}
                            </div>

                            {/* Name & Description */}
                            <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                            <p className="text-sm text-[var(--text-muted)] mb-4">{plan.description}</p>

                            {/* Price */}
                            <div className="mb-6">
                                <span className="text-4xl font-bold">
                                    ${getPrice(plan).toFixed(plan.priceMonthly > 0 ? 0 : 2)}
                                </span>
                                <span className="text-[var(--text-muted)]">/mo</span>
                                {billingCycle === 'yearly' && plan.yearlySavings > 0 && (
                                    <p className="text-sm text-green-500 mt-1">
                                        Save ${plan.yearlySavings}/year
                                    </p>
                                )}
                            </div>

                            {/* Features */}
                            <div className="space-y-3 mb-6 flex-1">
                                <div className="flex items-center gap-2 text-sm">
                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span>{plan.maxChannels === -1 ? 'Unlimited' : plan.maxChannels} channels</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span>{plan.maxEpisodesPerMonth === -1 ? 'Unlimited' : plan.maxEpisodesPerMonth} episodes/month</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    {plan.maxApiCalls > 0 ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span>{plan.maxApiCalls === -1 ? 'Unlimited' : plan.maxApiCalls} API calls</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0">—</span>
                                            <span className="text-[var(--text-muted)]">No API access</span>
                                        </>
                                    )}
                                </div>
                                {plan.features.advancedCinematicStyles && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <span>Advanced cinematic styles</span>
                                    </div>
                                )}
                                {plan.features.youtubeStrategies && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <span>YouTube strategies</span>
                                    </div>
                                )}
                                {plan.features.prioritySupport && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <span>Priority support</span>
                                    </div>
                                )}
                            </div>

                            {/* CTA */}
                            <button
                                onClick={() => handleSubscribe(plan)}
                                disabled={subscribing === plan.id}
                                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${plan.isPopular
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                                        : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)]'
                                    }`}
                            >
                                {subscribing === plan.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        {plan.priceMonthly === 0 ? 'Get Started' : 'Start Free Trial'}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Back to Dashboard */}
                {session && (
                    <div className="text-center mt-12">
                        <Link
                            href="/dashboard"
                            className="text-[var(--text-secondary)] hover:text-white transition-colors"
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function PricingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        }>
            <PricingContent />
        </Suspense>
    )
}

