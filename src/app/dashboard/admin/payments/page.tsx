'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
    CreditCard,
    Settings,
    Check,
    X,
    Loader2,
    RefreshCw,
    Eye,
    EyeOff,
    AlertTriangle
} from 'lucide-react'

interface PaymentGateway {
    id: string
    name: string
    displayName: string
    isEnabled: boolean
    testMode: boolean
    credentials: Record<string, string>
    hasCredentials: boolean
}

const credentialFields: Record<string, { label: string; fields: { key: string; label: string; placeholder: string }[] }> = {
    stripe: {
        label: 'Stripe',
        fields: [
            { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_test_...' },
            { key: 'secretKey', label: 'Secret Key', placeholder: 'sk_test_...' },
            { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsec_...' }
        ]
    },
    paypal: {
        label: 'PayPal',
        fields: [
            { key: 'clientId', label: 'Client ID', placeholder: 'AX...' },
            { key: 'clientSecret', label: 'Client Secret', placeholder: 'EJ...' },
            { key: 'webhookId', label: 'Webhook ID', placeholder: 'WH-...' }
        ]
    }
}

export default function PaymentGatewaysPage() {
    const router = useRouter()
    const { data: session, status } = useSession()
    const [gateways, setGateways] = useState<PaymentGateway[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [testing, setTesting] = useState<string | null>(null)
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
    const [formData, setFormData] = useState<Record<string, Record<string, string>>>({})
    const [error, setError] = useState<string | null>(null)

    // Check admin access
    useEffect(() => {
        if (status === 'loading') return
        if (!session) {
            router.push('/login')
            return
        }
        if ((session?.user as { role?: string })?.role !== 'admin') {
            router.push('/dashboard')
            return
        }
    }, [session, status, router])

    const fetchGateways = async () => {
        try {
            setError(null)
            const res = await fetch('/api/admin/gateways', {
                credentials: 'include'
            })
            if (res.status === 403) {
                router.push('/dashboard')
                return
            }
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to load gateways')
            }
            const data = await res.json()
            setGateways(data.gateways || [])

            // Initialize form data
            const initial: Record<string, Record<string, string>> = {}
            for (const g of data.gateways || []) {
                initial[g.name] = { ...g.credentials }
            }
            setFormData(initial)
        } catch (err) {
            console.error('Error:', err)
            setError(err instanceof Error ? err.message : 'Failed to load gateways')
            toast.error('Failed to load gateways')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (status !== 'loading' && (session?.user as { role?: string })?.role === 'admin') {
            fetchGateways()
        }
    }, [session, status])

    const handleSave = async (gateway: PaymentGateway) => {
        setSaving(gateway.name)
        try {
            const res = await fetch('/api/admin/gateways', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: gateway.name,
                    isEnabled: gateway.isEnabled,
                    testMode: gateway.testMode,
                    credentials: formData[gateway.name]
                })
            })

            if (res.ok) {
                toast.success(`${gateway.displayName} updated`)
                fetchGateways()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to update')
            }
        } catch (error) {
            console.error('Save error:', error)
            toast.error('Failed to save')
        } finally {
            setSaving(null)
        }
    }

    const handleTest = async (gateway: PaymentGateway) => {
        setTesting(gateway.name)
        try {
            const res = await fetch('/api/admin/gateways', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: gateway.name, action: 'test' })
            })

            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
            } else {
                toast.error(data.message || data.error)
            }
        } catch (error) {
            console.error('Test error:', error)
            toast.error('Connection test failed')
        } finally {
            setTesting(null)
        }
    }

    const toggleEnabled = (name: string) => {
        setGateways(prev => prev.map(g =>
            g.name === name ? { ...g, isEnabled: !g.isEnabled } : g
        ))
    }

    const toggleTestMode = (name: string) => {
        setGateways(prev => prev.map(g =>
            g.name === name ? { ...g, testMode: !g.testMode } : g
        ))
    }

    const updateCredential = (gateway: string, key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [gateway]: { ...prev[gateway], [key]: value }
        }))
    }

    if (loading || status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="glass-card p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold mb-2">Failed to Load</h2>
                    <p className="text-[var(--text-secondary)] mb-4">{error}</p>
                    <button onClick={fetchGateways} className="btn-primary">
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Payment Gateways</h1>
                <p className="text-[var(--text-secondary)]">
                    Configure payment providers for subscription billing
                </p>
            </div>

            <div className="space-y-6">
                {gateways.map((gateway) => {
                    const config = credentialFields[gateway.name]
                    if (!config) return null

                    return (
                        <motion.div
                            key={gateway.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gateway.name === 'stripe'
                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                                        : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                        }`}>
                                        <CreditCard className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg">{gateway.displayName}</h2>
                                        <div className="flex items-center gap-2 text-sm">
                                            {gateway.isEnabled ? (
                                                <span className="text-green-500 flex items-center gap-1">
                                                    <Check className="w-4 h-4" /> Enabled
                                                </span>
                                            ) : (
                                                <span className="text-[var(--text-muted)] flex items-center gap-1">
                                                    <X className="w-4 h-4" /> Disabled
                                                </span>
                                            )}
                                            {gateway.testMode && (
                                                <span className="text-yellow-500 text-xs px-2 py-0.5 bg-yellow-500/10 rounded">
                                                    Test Mode
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleEnabled(gateway.name)}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${gateway.isEnabled ? 'bg-green-500' : 'bg-gray-600'
                                            }`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${gateway.isEnabled ? 'left-7' : 'left-1'
                                            }`} />
                                    </button>
                                </div>
                            </div>

                            {/* Test Mode Toggle */}
                            <div className="flex items-center gap-3 mb-6 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                <span className="text-sm flex-1">Test Mode (Sandbox)</span>
                                <button
                                    onClick={() => toggleTestMode(gateway.name)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${gateway.testMode ? 'bg-yellow-500' : 'bg-gray-600'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${gateway.testMode ? 'left-7' : 'left-1'
                                        }`} />
                                </button>
                            </div>

                            {/* Credentials */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium">API Credentials</h3>
                                    <button
                                        onClick={() => setShowSecrets(prev => ({
                                            ...prev,
                                            [gateway.name]: !prev[gateway.name]
                                        }))}
                                        className="text-sm text-[var(--text-secondary)] hover:text-white flex items-center gap-1"
                                    >
                                        {showSecrets[gateway.name] ? (
                                            <><EyeOff className="w-4 h-4" /> Hide</>
                                        ) : (
                                            <><Eye className="w-4 h-4" /> Show</>
                                        )}
                                    </button>
                                </div>

                                {config.fields.map((field) => (
                                    <div key={field.key}>
                                        <label className="block text-sm text-[var(--text-secondary)] mb-1">
                                            {field.label}
                                        </label>
                                        <input
                                            type={showSecrets[gateway.name] ? 'text' : 'password'}
                                            placeholder={field.placeholder}
                                            value={formData[gateway.name]?.[field.key] || ''}
                                            onChange={(e) => updateCredential(gateway.name, field.key, e.target.value)}
                                            className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-[var(--border-subtle)]">
                                <button
                                    onClick={() => handleSave(gateway)}
                                    disabled={saving === gateway.name}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {saving === gateway.name ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Settings className="w-4 h-4" />
                                    )}
                                    Save Settings
                                </button>

                                <button
                                    onClick={() => handleTest(gateway)}
                                    disabled={testing === gateway.name || !gateway.hasCredentials}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    {testing === gateway.name ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                    Test Connection
                                </button>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
