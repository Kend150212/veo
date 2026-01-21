'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
    Key,
    Save,
    Loader2,
    Eye,
    EyeOff,
    CheckCircle,
    Globe,
    Cpu
} from 'lucide-react'
import toast from 'react-hot-toast'

const AI_PROVIDERS = [
    {
        id: 'gemini',
        name: 'Google Gemini',
        placeholder: 'AIzaSy...',
        models: [
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Mới nhất)' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
        ]
    },
    {
        id: 'openai',
        name: 'OpenAI',
        placeholder: 'sk-...',
        models: [
            { id: 'gpt-4o', name: 'GPT-4o (Mạnh nhất)' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Nhanh)' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        ]
    },
    {
        id: 'deepseek',
        name: 'Deepseek',
        placeholder: 'sk-...',
        models: [
            { id: 'deepseek-chat', name: 'Deepseek Chat' },
            { id: 'deepseek-coder', name: 'Deepseek Coder' },
        ]
    },
    {
        id: 'anthropic',
        name: 'Anthropic',
        placeholder: 'sk-ant-...',
        models: [
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Mạnh nhất)' },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (Nhanh)' },
        ]
    }
]

interface FormData {
    geminiKey: string
    openaiKey: string
    deepseekKey: string
    anthropicKey: string
    geminiModel: string
    openaiModel: string
    deepseekModel: string
    anthropicModel: string
    preferredAI: string
    language: string
}

export default function SettingsPage() {
    const { data: session } = useSession()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
    const [hasExistingKeys, setHasExistingKeys] = useState<Record<string, boolean>>({})

    const [formData, setFormData] = useState<FormData>({
        geminiKey: '',
        openaiKey: '',
        deepseekKey: '',
        anthropicKey: '',
        geminiModel: 'gemini-2.0-flash',
        openaiModel: 'gpt-4o-mini',
        deepseekModel: 'deepseek-chat',
        anthropicModel: 'claude-3-haiku-20240307',
        preferredAI: 'gemini',
        language: 'vi'
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings')
            if (res.ok) {
                const data = await res.json()
                if (data.settings) {
                    // Set form data but leave keys empty - user must re-enter to change
                    setFormData(prev => ({
                        ...prev,
                        geminiModel: data.settings.geminiModel || 'gemini-2.0-flash',
                        openaiModel: data.settings.openaiModel || 'gpt-4o-mini',
                        deepseekModel: data.settings.deepseekModel || 'deepseek-chat',
                        anthropicModel: data.settings.anthropicModel || 'claude-3-haiku-20240307',
                        preferredAI: data.settings.preferredAI || 'gemini',
                        language: data.settings.language || 'vi'
                    }))

                    // Track which keys exist
                    setHasExistingKeys({
                        gemini: data.settings._hasGeminiKey,
                        openai: data.settings._hasOpenaiKey,
                        deepseek: data.settings._hasDeepseekKey,
                        anthropic: data.settings._hasAnthropicKey
                    })
                }
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    // Only send keys if they have values (empty = keep existing)
                    geminiKey: formData.geminiKey || undefined,
                    openaiKey: formData.openaiKey || undefined,
                    deepseekKey: formData.deepseekKey || undefined,
                    anthropicKey: formData.anthropicKey || undefined,
                })
            })

            if (res.ok) {
                toast.success('Đã lưu cài đặt')
                // Clear key inputs and refresh status
                setFormData(prev => ({
                    ...prev,
                    geminiKey: '',
                    openaiKey: '',
                    deepseekKey: '',
                    anthropicKey: ''
                }))
                fetchSettings()
            } else {
                const data = await res.json()
                throw new Error(data.error || 'Failed to save')
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Không thể lưu cài đặt')
        } finally {
            setIsSaving(false)
        }
    }

    const toggleShowKey = (id: string) => {
        setShowKeys(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const testApiKey = async (provider: string) => {
        const keyField = `${provider}Key` as keyof FormData
        const key = formData[keyField]

        if (!key && !hasExistingKeys[provider]) {
            toast.error('Vui lòng nhập API key trước')
            return
        }

        toast.loading('Đang kiểm tra...', { id: `test-${provider}` })

        try {
            const res = await fetch('/api/settings/test-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    apiKey: key || 'USE_EXISTING',
                    useExisting: !key && hasExistingKeys[provider]
                })
            })

            const data = await res.json()

            if (data.success) {
                toast.success(`${provider} API key hợp lệ!`, { id: `test-${provider}` })
            } else {
                toast.error(data.error || `${provider} API key không hợp lệ`, { id: `test-${provider}` })
            }
        } catch {
            toast.error('Không thể kiểm tra key', { id: `test-${provider}` })
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Cài đặt</h1>
                <p className="text-[var(--text-secondary)]">Quản lý API keys và tùy chọn</p>
            </div>

            {/* API Keys Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 mb-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                        <Key className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold">API Keys</h2>
                        <p className="text-sm text-[var(--text-secondary)]">Nhập key mới hoặc để trống để giữ key cũ</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {AI_PROVIDERS.map((provider) => {
                        const keyField = `${provider.id}Key` as keyof FormData
                        const modelField = `${provider.id}Model` as keyof FormData
                        const hasKey = hasExistingKeys[provider.id]

                        return (
                            <div key={provider.id} className="space-y-3 pb-4 border-b border-[var(--border-subtle)] last:border-0 last:pb-0">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{provider.name}</span>
                                    {hasKey && (
                                        <span className="text-xs text-green-400 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Đã cấu hình
                                        </span>
                                    )}
                                </div>

                                {/* API Key input */}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type={showKeys[provider.id] ? 'text' : 'password'}
                                            value={formData[keyField]}
                                            onChange={(e) => setFormData({ ...formData, [keyField]: e.target.value })}
                                            placeholder={hasKey ? 'Nhập key mới để thay thế...' : provider.placeholder}
                                            className="input-field pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleShowKey(provider.id)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                                        >
                                            {showKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => testApiKey(provider.id)}
                                        className="btn-secondary text-sm px-4"
                                        disabled={!formData[keyField] && !hasKey}
                                    >
                                        Test
                                    </button>
                                </div>

                                {/* Model selection */}
                                <div className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-[var(--text-muted)]" />
                                    <select
                                        value={formData[modelField]}
                                        onChange={(e) => setFormData({ ...formData, [modelField]: e.target.value })}
                                        className="input-field text-sm flex-1"
                                    >
                                        {provider.models.map((model) => (
                                            <option key={model.id} value={model.id}>
                                                {model.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Preferred AI */}
                <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
                    <label className="block text-sm font-medium mb-2">AI ưu tiên sử dụng</label>
                    <select
                        value={formData.preferredAI}
                        onChange={(e) => setFormData({ ...formData, preferredAI: e.target.value })}
                        className="input-field"
                    >
                        {AI_PROVIDERS.map((provider) => (
                            <option key={provider.id} value={provider.id}>
                                {provider.name}
                            </option>
                        ))}
                    </select>
                </div>
            </motion.div>

            {/* Language Settings */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6 mb-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center">
                        <Globe className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>
                    <div>
                        <h2 className="font-semibold">Ngôn ngữ</h2>
                        <p className="text-sm text-[var(--text-secondary)]">Cài đặt ngôn ngữ giao diện</p>
                    </div>
                </div>

                <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="input-field"
                >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                </select>
            </motion.div>

            {/* Save button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Lưu cài đặt
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
