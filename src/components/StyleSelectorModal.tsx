'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Check, Palette } from 'lucide-react'
import { CHANNEL_STYLES, ChannelStyle } from '@/lib/channel-styles'

interface StyleSelectorModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (styleId: string | null) => void
    selectedStyleId: string | null
    channelDefaultStyleId?: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
    'illustration': '🎨 Minh họa',
    'cartoon': '🎬 Hoạt hình',
    'realistic': '📹 Thực tế',
    'artistic': '🖼️ Nghệ thuật',
    'minimalist': '⬜ Tối giản',
    'edutainment': '📚 Giáo dục',
    'fashion': '👗 Thời trang'
}

export default function StyleSelectorModal({
    isOpen,
    onClose,
    onSelect,
    selectedStyleId,
    channelDefaultStyleId
}: StyleSelectorModalProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [activeCategory, setActiveCategory] = useState<string | null>(null)

    // Get unique categories
    const categories = useMemo(() => {
        const cats = [...new Set(CHANNEL_STYLES.map(s => s.category))]
        return cats
    }, [])

    // Filter styles
    const filteredStyles = useMemo(() => {
        return CHANNEL_STYLES.filter(style => {
            const matchesSearch = searchTerm === '' ||
                style.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                style.nameVi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                style.descriptionVi.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesCategory = !activeCategory || style.category === activeCategory

            return matchesSearch && matchesCategory
        })
    }, [searchTerm, activeCategory])

    // Group styles by category
    const groupedStyles = useMemo(() => {
        const groups: Record<string, ChannelStyle[]> = {}
        filteredStyles.forEach(style => {
            if (!groups[style.category]) {
                groups[style.category] = []
            }
            groups[style.category].push(style)
        })
        return groups
    }, [filteredStyles])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-5xl max-h-[90vh] bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Palette className="w-6 h-6 text-purple-400" />
                                Chọn Visual Style
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm style..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setActiveCategory(null)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!activeCategory
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                Tất cả
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        }`}
                                >
                                    {CATEGORY_LABELS[cat] || cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-4">
                        {/* Default Option */}
                        <div className="mb-6">
                            <button
                                onClick={() => {
                                    onSelect(null)
                                    onClose()
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${selectedStyleId === null || selectedStyleId === ''
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                                        <Palette className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-white">Mặc định kênh</h3>
                                        <p className="text-sm text-gray-400">Sử dụng style mặc định của kênh</p>
                                    </div>
                                    {(selectedStyleId === null || selectedStyleId === '') && (
                                        <Check className="w-5 h-5 text-purple-400 ml-auto" />
                                    )}
                                </div>
                            </button>
                        </div>

                        {/* Style Groups */}
                        {Object.entries(groupedStyles).map(([category, styles]) => (
                            <div key={category} className="mb-8">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    {CATEGORY_LABELS[category] || category}
                                    <span className="text-sm font-normal text-gray-500">({styles.length})</span>
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {styles.map(style => (
                                        <motion.button
                                            key={style.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                onSelect(style.id)
                                                onClose()
                                            }}
                                            className={`group relative rounded-xl overflow-hidden border-2 transition-all ${selectedStyleId === style.id
                                                    ? 'border-purple-500 ring-2 ring-purple-500/30'
                                                    : 'border-gray-700 hover:border-gray-500'
                                                }`}
                                        >
                                            {/* Preview Image */}
                                            <div className="aspect-square bg-gray-800">
                                                {style.previewImage ? (
                                                    <img
                                                        src={style.previewImage}
                                                        alt={style.nameVi}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                                                        <Palette className="w-12 h-12 text-gray-600" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info Overlay */}
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3">
                                                <h4 className="font-medium text-white text-sm truncate">
                                                    {style.nameVi}
                                                </h4>
                                                <p className="text-xs text-gray-300 truncate">
                                                    {style.name}
                                                </p>
                                            </div>

                                            {/* Selected Check */}
                                            {selectedStyleId === style.id && (
                                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}

                                            {/* Has Characters Badge */}
                                            {style.hasCharacters && (
                                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-green-500/80 text-xs text-white font-medium">
                                                    👤 Nhân vật
                                                </div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
