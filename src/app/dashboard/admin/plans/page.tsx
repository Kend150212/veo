'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
    Package,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    Check,
    X,
    Star,
    DollarSign,
    Users,
    Zap,
    Film,
    Key
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
    description: string | null
    priceMonthly: number
    priceYearly: number
    yearlyDiscount: number
    maxChannels: number
    maxEpisodesPerMonth: number
    maxApiCalls: number
    features: PlanFeatures
    isPopular: boolean
    isActive: boolean
    sortOrder: number
    subscriberCount: number
}

const defaultFeatures: PlanFeatures = {
    apiAccess: false,
    advancedCinematicStyles: false,
    allNarrativeTemplates: false,
    characterCustomization: true,
    youtubeStrategies: false,
    prioritySupport: false,
    customIntegrations: false
}

const featureLabels: Record<keyof PlanFeatures, { label: string; icon: React.ReactNode }> = {
    apiAccess: { label: 'API Access', icon: <Key className="w-4 h-4" /> },
    advancedCinematicStyles: { label: 'Advanced Cinematic Styles', icon: <Film className="w-4 h-4" /> },
    allNarrativeTemplates: { label: 'All Narrative Templates', icon: <Zap className="w-4 h-4" /> },
    characterCustomization: { label: 'Character Customization', icon: <Users className="w-4 h-4" /> },
    youtubeStrategies: { label: 'YouTube Strategies', icon: <Star className="w-4 h-4" /> },
    prioritySupport: { label: 'Priority Support', icon: <Check className="w-4 h-4" /> },
    customIntegrations: { label: 'Custom Integrations', icon: <Zap className="w-4 h-4" /> }
}

export default function PlansAdminPage() {
    const router = useRouter()
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState<Partial<Plan>>({})

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/admin/plans')
            if (res.status === 403) {
                router.push('/dashboard')
                return
            }
            const data = await res.json()
            setPlans(data.plans || [])
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load plans')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPlans()
    }, [])

    const handleCreate = () => {
        setEditingPlan(null)
        setFormData({
            name: '',
            slug: '',
            description: '',
            priceMonthly: 0,
            priceYearly: 0,
            yearlyDiscount: 17,
            maxChannels: 1,
            maxEpisodesPerMonth: 5,
            maxApiCalls: 0,
            features: { ...defaultFeatures },
            isPopular: false,
            isActive: true,
            sortOrder: plans.length
        })
        setShowForm(true)
    }

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan)
        setFormData({ ...plan })
        setShowForm(true)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const method = editingPlan ? 'PUT' : 'POST'
            const body = editingPlan
                ? { id: editingPlan.id, ...formData }
                : formData

            const res = await fetch('/api/admin/plans', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                toast.success(editingPlan ? 'Plan updated' : 'Plan created')
                setShowForm(false)
                fetchPlans()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to save')
            }
        } catch (error) {
            console.error('Save error:', error)
            toast.error('Failed to save plan')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (plan: Plan) => {
        if (!confirm(`Delete "${plan.name}" plan? This cannot be undone.`)) return

        try {
            const res = await fetch(`/api/admin/plans?id=${plan.id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success('Plan deleted')
                fetchPlans()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to delete')
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Failed to delete plan')
        }
    }

    const toggleFeature = (key: keyof PlanFeatures) => {
        setFormData(prev => ({
            ...prev,
            features: {
                ...(prev.features || defaultFeatures),
                [key]: !(prev.features as PlanFeatures)?.[key]
            }
        }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Subscription Plans</h1>
                    <p className="text-[var(--text-secondary)]">
                        Configure pricing and features for each plan
                    </p>
                </div>
                <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Plan
                </button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {plans.map((plan) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`glass-card p-5 relative ${plan.isPopular ? 'ring-2 ring-purple-500' : ''}`}
                    >
                        {plan.isPopular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs rounded-full">
                                Popular
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-lg">{plan.name}</h3>
                            <span className={`px-2 py-0.5 text-xs rounded ${plan.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                                }`}>
                                {plan.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="mb-4">
                            <span className="text-3xl font-bold">${plan.priceMonthly}</span>
                            <span className="text-[var(--text-muted)]">/mo</span>
                        </div>

                        <div className="space-y-2 text-sm text-[var(--text-secondary)] mb-4">
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                <span>{plan.maxChannels === -1 ? 'Unlimited' : plan.maxChannels} channels</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Film className="w-4 h-4" />
                                <span>{plan.maxEpisodesPerMonth === -1 ? 'Unlimited' : plan.maxEpisodesPerMonth} episodes/mo</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Key className="w-4 h-4" />
                                <span>{plan.maxApiCalls === 0 ? 'No API' : plan.maxApiCalls === -1 ? 'Unlimited API' : `${plan.maxApiCalls} API calls`}</span>
                            </div>
                        </div>

                        <div className="text-xs text-[var(--text-muted)] mb-4">
                            {plan.subscriberCount} subscribers
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(plan)}
                                className="flex-1 btn-secondary flex items-center justify-center gap-1 py-2 text-sm"
                            >
                                <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                                onClick={() => handleDelete(plan)}
                                disabled={plan.subscriberCount > 0}
                                className="btn-secondary p-2 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Edit/Create Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold mb-6">
                                {editingPlan ? 'Edit Plan' : 'Create Plan'}
                            </h2>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg"
                                        placeholder="Pro"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Slug</label>
                                    <input
                                        type="text"
                                        value={formData.slug || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg"
                                        placeholder="pro"
                                        disabled={!!editingPlan}
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm mb-1">Description</label>
                                <input
                                    type="text"
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg"
                                    placeholder="Perfect for professional creators"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm mb-1">Monthly Price ($)</label>
                                    <input
                                        type="number"
                                        value={formData.priceMonthly || 0}
                                        onChange={(e) => setFormData(prev => ({ ...prev, priceMonthly: parseFloat(e.target.value) }))}
                                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Yearly Price ($)</label>
                                    <input
                                        type="number"
                                        value={formData.priceYearly || 0}
                                        onChange={(e) => setFormData(prev => ({ ...prev, priceYearly: parseFloat(e.target.value) }))}
                                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Yearly Discount (%)</label>
                                    <input
                                        type="number"
                                        value={formData.yearlyDiscount || 0}
                                        onChange={(e) => setFormData(prev => ({ ...prev, yearlyDiscount: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm mb-1">Max Channels (-1 = ∞)</label>
                                    <input
                                        type="number"
                                        value={formData.maxChannels ?? 1}
                                        onChange={(e) => setFormData(prev => ({ ...prev, maxChannels: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Episodes/Month (-1 = ∞)</label>
                                    <input
                                        type="number"
                                        value={formData.maxEpisodesPerMonth ?? 5}
                                        onChange={(e) => setFormData(prev => ({ ...prev, maxEpisodesPerMonth: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">API Calls (0 = none)</label>
                                    <input
                                        type="number"
                                        value={formData.maxApiCalls ?? 0}
                                        onChange={(e) => setFormData(prev => ({ ...prev, maxApiCalls: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm mb-3">Features</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(featureLabels).map(([key, { label, icon }]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => toggleFeature(key as keyof PlanFeatures)}
                                            className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${(formData.features as PlanFeatures)?.[key as keyof PlanFeatures]
                                                    ? 'border-purple-500 bg-purple-500/10 text-white'
                                                    : 'border-[var(--border-default)] text-[var(--text-secondary)]'
                                                }`}
                                        >
                                            {icon}
                                            <span className="text-sm">{label}</span>
                                            {(formData.features as PlanFeatures)?.[key as keyof PlanFeatures] && (
                                                <Check className="w-4 h-4 ml-auto text-purple-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPopular || false}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isPopular: e.target.checked }))}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Mark as Popular</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive !== false}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Active</span>
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                                </button>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
