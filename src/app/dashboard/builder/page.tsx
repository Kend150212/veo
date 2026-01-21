'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronDown,
    ChevronRight,
    Copy,
    Download,
    Sparkles,
    Check,
    Trash2,
    Wand2,
    AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
    defaultSections,
    buildPrompt,
    exportPrompt,
    validatePrompt,
    quickFillPresets,
    defaultNegatives,
    type PromptStructure,
    type ExportOptions
} from '@/lib/prompt-builder'

type SectionId = keyof PromptStructure

export default function BuilderPage() {
    const [sections, setSections] = useState<Record<SectionId, string>>({
        subject: '',
        action: '',
        scene: '',
        camera: '',
        style: '',
        lighting: '',
        mood: '',
        audio: '',
        negative: ''
    })

    const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
        new Set(['subject', 'action', 'scene'])
    )
    const [exportFormat, setExportFormat] = useState<'text' | 'json' | 'api'>('text')
    const [copied, setCopied] = useState(false)
    const [showExportOptions, setShowExportOptions] = useState(false)
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        format: 'text',
        includeNegative: true,
        aspectRatio: '16:9',
        videoLength: 8,
        resolution: '1080p',
        generateAudio: true
    })

    const toggleSection = (id: SectionId) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    const updateSection = (id: SectionId, value: string) => {
        setSections(prev => ({ ...prev, [id]: value }))
    }

    const clearSection = (id: SectionId) => {
        setSections(prev => ({ ...prev, [id]: '' }))
    }

    const clearAll = () => {
        setSections({
            subject: '',
            action: '',
            scene: '',
            camera: '',
            style: '',
            lighting: '',
            mood: '',
            audio: '',
            negative: ''
        })
        toast.success('Đã xóa tất cả')
    }

    const applyQuickFill = (sectionId: SectionId, preset: string) => {
        updateSection(sectionId, preset)
        toast.success('Đã áp dụng preset')
    }

    const applyDefaultNegatives = () => {
        const allNegatives = Object.values(defaultNegatives).join(', ')
        updateSection('negative', allNegatives)
        toast.success('Đã thêm negative prompts mặc định')
    }

    const getPromptPreview = useCallback(() => {
        return buildPrompt(sections)
    }, [sections])

    const getExportedPrompt = useCallback(() => {
        return exportPrompt(sections, { ...exportOptions, format: exportFormat })
    }, [sections, exportOptions, exportFormat])

    const validation = validatePrompt(sections)

    const handleCopy = async () => {
        const text = getExportedPrompt()
        await navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success('Đã copy vào clipboard')
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        const text = getExportedPrompt()
        const blob = new Blob([text], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `veo-prompt-${Date.now()}.${exportFormat === 'api' || exportFormat === 'json' ? 'json' : 'txt'}`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Đã tải xuống')
    }

    const sectionMeta = defaultSections.reduce((acc, s) => {
        acc[s.id as SectionId] = s
        return acc
    }, {} as Record<SectionId, typeof defaultSections[0]>)

    const characterCount = getPromptPreview().length

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Tạo Prompt</h1>
                    <p className="text-[var(--text-secondary)]">Xây dựng prompt chuyên nghiệp cho Veo</p>
                </div>
                <button
                    onClick={clearAll}
                    className="btn-secondary flex items-center gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    Xóa tất cả
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Builder sections */}
                <div className="space-y-3">
                    {defaultSections.map((section) => {
                        const id = section.id as SectionId
                        const isExpanded = expandedSections.has(id)
                        const value = sections[id]
                        const presets = quickFillPresets[id as keyof typeof quickFillPresets]

                        return (
                            <motion.div
                                key={id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card overflow-hidden"
                            >
                                {/* Section header */}
                                <button
                                    onClick={() => toggleSection(id)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
                                        )}
                                        <span className="font-medium">{section.labelVi}</span>
                                        {section.required && (
                                            <span className="text-xs text-red-400">*</span>
                                        )}
                                    </div>
                                    {value && (
                                        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-1 rounded">
                                            {value.length} ký tự
                                        </span>
                                    )}
                                </button>

                                {/* Section content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 space-y-3">
                                                <textarea
                                                    value={value}
                                                    onChange={(e) => updateSection(id, e.target.value)}
                                                    placeholder={section.placeholderVi}
                                                    className="input-field min-h-[100px] resize-y"
                                                />

                                                {/* Quick fill presets */}
                                                {presets && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(presets).map(([key, preset]) => (
                                                            <button
                                                                key={key}
                                                                onClick={() => applyQuickFill(id, preset)}
                                                                className="tag hover:tag-accent cursor-pointer transition-colors"
                                                            >
                                                                <Wand2 className="w-3 h-3" />
                                                                {key}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Negative prompt special options */}
                                                {id === 'negative' && (
                                                    <button
                                                        onClick={applyDefaultNegatives}
                                                        className="btn-secondary text-sm flex items-center gap-2"
                                                    >
                                                        <Sparkles className="w-4 h-4" />
                                                        Áp dụng negative mặc định
                                                    </button>
                                                )}

                                                {value && (
                                                    <button
                                                        onClick={() => clearSection(id)}
                                                        className="text-xs text-[var(--text-muted)] hover:text-red-400"
                                                    >
                                                        Xóa section này
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Right: Preview & Export */}
                <div className="space-y-4">
                    {/* Validation warnings */}
                    {(validation.errors.length > 0 || validation.warnings.length > 0) && (
                        <div className="glass-card p-4 space-y-2">
                            {validation.errors.map((error, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-red-400">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    {error}
                                </div>
                            ))}
                            {validation.warnings.map((warning, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-yellow-400">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    {warning}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Preview */}
                    <div className="glass-card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Xem trước</h3>
                            <span className={`text-xs ${characterCount > 1500 ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                                {characterCount}/1500 ký tự
                            </span>
                        </div>
                        <div className="bg-[var(--bg-primary)] rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                            <pre className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-sans">
                                {getPromptPreview() || 'Prompt sẽ hiển thị ở đây...'}
                            </pre>
                        </div>
                    </div>

                    {/* Export options */}
                    <div className="glass-card p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Export</h3>
                            <button
                                onClick={() => setShowExportOptions(!showExportOptions)}
                                className="text-sm text-[var(--accent-primary)]"
                            >
                                {showExportOptions ? 'Ẩn tùy chọn' : 'Tùy chọn'}
                            </button>
                        </div>

                        {/* Format selector */}
                        <div className="flex gap-2 mb-4">
                            {(['text', 'json', 'api'] as const).map((format) => (
                                <button
                                    key={format}
                                    onClick={() => setExportFormat(format)}
                                    className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${exportFormat === format
                                            ? 'bg-[var(--accent-primary)] text-white'
                                            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                        }
                  `}
                                >
                                    {format === 'api' ? 'API Payload' : format.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {/* Export options panel */}
                        <AnimatePresence>
                            {showExportOptions && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden mb-4"
                                >
                                    <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--bg-primary)] rounded-lg">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={exportOptions.includeNegative}
                                                onChange={(e) => setExportOptions({ ...exportOptions, includeNegative: e.target.checked })}
                                                className="rounded"
                                            />
                                            <span className="text-sm">Bao gồm Negative</span>
                                        </label>

                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={exportOptions.generateAudio}
                                                onChange={(e) => setExportOptions({ ...exportOptions, generateAudio: e.target.checked })}
                                                className="rounded"
                                            />
                                            <span className="text-sm">Tạo Audio</span>
                                        </label>

                                        <div>
                                            <label className="text-xs text-[var(--text-muted)] block mb-1">Tỷ lệ</label>
                                            <select
                                                value={exportOptions.aspectRatio}
                                                onChange={(e) => setExportOptions({ ...exportOptions, aspectRatio: e.target.value as '16:9' | '9:16' | '1:1' })}
                                                className="input-field py-1 text-sm"
                                            >
                                                <option value="16:9">16:9 (YouTube)</option>
                                                <option value="9:16">9:16 (TikTok)</option>
                                                <option value="1:1">1:1 (Square)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs text-[var(--text-muted)] block mb-1">Độ dài (giây)</label>
                                            <input
                                                type="number"
                                                value={exportOptions.videoLength}
                                                onChange={(e) => setExportOptions({ ...exportOptions, videoLength: parseInt(e.target.value) || 8 })}
                                                min={1}
                                                max={60}
                                                className="input-field py-1 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-[var(--text-muted)] block mb-1">Độ phân giải</label>
                                            <select
                                                value={exportOptions.resolution}
                                                onChange={(e) => setExportOptions({ ...exportOptions, resolution: e.target.value as '720p' | '1080p' | '4K' })}
                                                className="input-field py-1 text-sm"
                                            >
                                                <option value="720p">720p</option>
                                                <option value="1080p">1080p</option>
                                                <option value="4K">4K</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Export preview */}
                        <div className="bg-[var(--bg-primary)] rounded-lg p-3 mb-4 max-h-[200px] overflow-y-auto">
                            <pre className="text-xs text-[var(--text-muted)] whitespace-pre-wrap mono">
                                {getExportedPrompt() || 'Export sẽ hiển thị ở đây...'}
                            </pre>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleCopy}
                                disabled={!validation.isValid}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Đã copy
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={!validation.isValid}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Tải xuống
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
