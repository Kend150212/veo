'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft, Sparkles, Download, Copy, Trash2,
    Camera, User, Wand2, ChevronDown, Image as ImageIcon,
    Plus, Check, Loader2, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────
const SHOT_TYPES = [
    { id: 'extreme_close_up', label: 'Extreme Close-up', desc: 'Chỉ mắt / môi', icon: '🔍', camera: 'Extreme close-up macro shot of face, only eyes and lips visible, 100mm macro lens' },
    { id: 'close_up', label: 'Close-up', desc: 'Mặt + vai', icon: '👤', camera: 'Close-up portrait shot, face and shoulders, 85mm lens, eye-level' },
    { id: 'medium_close_up', label: 'Medium Close-up', desc: 'Ngực trở lên', icon: '🧐', camera: 'Medium close-up shot, chest up, 50mm lens, eye-level' },
    { id: 'medium_shot', label: 'Medium Shot', desc: 'Nửa người', icon: '📷', camera: 'Medium shot, waist up, 35mm lens, eye-level' },
    { id: 'medium_full', label: 'Medium Full Shot', desc: 'Gần toàn thân', icon: '🧐‍♂️', camera: 'Medium full shot, knees up, 28mm lens, slight low angle' },
    { id: 'full_shot', label: 'Full Shot', desc: 'Toàn thân', icon: '🖼️', camera: 'Full body shot, head to toe, 24mm wide lens, eye-level' },
    { id: 'wide_shot', label: 'Wide Shot', desc: 'Nhân vật trong bối cảnh', icon: '🏔', camera: 'Wide establishing shot, character in full environment, 16mm ultra-wide lens' },
    { id: 'back_34', label: '3/4 Back View', desc: 'Góc sau 3/4', icon: '🔄', camera: 'Three-quarter back view shot, medium shot from behind-left, 50mm lens' },
    { id: 'master_sheet', label: 'Master Sheet', desc: '6 góc trong 1 ảnh', icon: '🗂️', camera: 'Character reference sheet 2x3 grid composite' },
]

const OUTFITS = [
    { id: 'casual', label: 'Casual', desc: 'Áo thun, jeans' },
    { id: 'business', label: 'Business', desc: 'Vest, áo công sở' },
    { id: 'fantasy', label: 'Fantasy', desc: 'Trang phục thần thoại' },
    { id: 'futuristic', label: 'Futuristic', desc: 'Trang phục tương lai' },
    { id: 'traditional_vn', label: 'Áo dài', desc: 'Áo dài Việt Nam' },
    { id: 'streetwear', label: 'Streetwear', desc: 'Urban, hip-hop style' },
    { id: 'custom', label: 'Tùy chỉnh', desc: 'Nhập mô tả riêng' },
]

const BACKGROUNDS = [
    { id: 'studio_white', label: 'Studio White', desc: 'Nền trắng studio chuyên nghiệp' },
    { id: 'studio_dark', label: 'Studio Dark', desc: 'Nền tối cinema' },
    { id: 'urban_city', label: 'Urban City', desc: 'Thành phố hiện đại' },
    { id: 'nature_forest', label: 'Nature Forest', desc: 'Rừng cây xanh mát' },
    { id: 'coffee_shop', label: 'Coffee Shop', desc: 'Quán cà phê ấm cúng' },
    { id: 'beach_sunset', label: 'Beach Sunset', desc: 'Bãi biển hoàng hôn' },
    { id: 'modern_office', label: 'Modern Office', desc: 'Văn phòng hiện đại' },
    { id: 'custom', label: 'Tùy chỉnh', desc: 'Nhập mô tả riêng' },
]

const MOODS = [
    { id: 'natural', label: 'Natural', lighting: 'soft natural daylight, diffused, flattering' },
    { id: 'golden_hour', label: 'Golden Hour', lighting: 'warm golden hour sunlight, lens flare, cinematic' },
    { id: 'night_neon', label: 'Night Neon', lighting: 'vibrant neon lights, night scene, cyberpunk glow' },
    { id: 'dramatic', label: 'Dramatic', lighting: 'dramatic side lighting, high contrast, chiaroscuro' },
    { id: 'soft_pastel', label: 'Soft Pastel', lighting: 'soft pastel tones, dreamy, ethereal lighting' },
]

const IMAGE_MODELS = [
    { id: 'imagen-3.0-generate-002', label: 'Imagen 3', badge: 'Khủyến dùng', color: '#8b5cf6', desc: 'Chất lượng cao nhất' },
    { id: 'imagegeneration@006', label: 'Imagen 2 (Banana 2)', badge: 'Ổn định', color: '#10b981', desc: 'Nhanh, ổn định, lâu năm' },
    { id: 'imagen-4.0-generate-001', label: 'Imagen 4', badge: 'Preview', color: '#f59e0b', desc: 'Thế hệ tiếp theo' },
    { id: 'gemini-2.0-flash-preview-image-generation', label: 'Gemini Flash', badge: 'Gemini', color: '#3b82f6', desc: 'Hỗ trợ reference image' },
]

// ─── Types ────────────────────────────────────────────────────
interface Character {
    id: string
    name: string
    fullDescription: string
    appearance: string | null
}

interface AvatarShot {
    id: string
    shotType: string
    outfit: string
    background: string
    mood: string
    prompt: string
    imageUrl: string | null
    createdAt: string
}

interface AvatarData {
    characterId: string
    characterName: string
    fullDescription: string
    appearance: string | null
    shots: AvatarShot[]
}

// ─── Component ────────────────────────────────────────────────
export default function AvatarStudioPage() {
    const params = useParams()
    const router = useRouter()
    const channelId = params.id as string

    const [characters, setCharacters] = useState<Character[]>([])
    const [avatarData, setAvatarData] = useState<AvatarData[]>([])
    const [selectedChar, setSelectedChar] = useState<string>('')
    const [selectedShot, setSelectedShot] = useState(SHOT_TYPES[1]) // Close-up default
    const [selectedOutfit, setSelectedOutfit] = useState(OUTFITS[0])
    const [selectedBg, setSelectedBg] = useState(BACKGROUNDS[0])
    const [selectedMood, setSelectedMood] = useState(MOODS[0])
    const [customOutfit, setCustomOutfit] = useState('')
    const [customBg, setCustomBg] = useState('')
    const [generatedPrompt, setGeneratedPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'create' | 'library'>('create')
    const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0])
    const [masterSheetImage, setMasterSheetImage] = useState<string | null>(null)
    const [isGeneratingMaster, setIsGeneratingMaster] = useState(false)

    const fetchData = useCallback(async () => {
        try {
            const [charRes, avatarRes] = await Promise.all([
                fetch(`/api/channels/${channelId}/characters`),
                fetch(`/api/channels/${channelId}/avatar`)
            ])
            const charData = await charRes.json()
            const avatarDataRes = await avatarRes.json()

            const chars = charData.characters || []
            setCharacters(chars)
            setAvatarData(avatarDataRes.avatarShots || [])
            if (chars.length > 0 && !selectedChar) {
                setSelectedChar(chars[0].id)
            }
        } catch {
            toast.error('Không thể tải dữ liệu')
        } finally {
            setIsLoading(false)
        }
    }, [channelId, selectedChar])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Auto-generate prompt when selections change
    useEffect(() => {
        if (!selectedChar) return
        const char = characters.find(c => c.id === selectedChar)
        if (!char) return

        const outfitText = selectedOutfit.id === 'custom' ? customOutfit : `wearing ${selectedOutfit.label} outfit (${selectedOutfit.desc})`
        const bgText = selectedBg.id === 'custom' ? customBg : `${selectedBg.label} background (${selectedBg.desc})`

        const prompt = `${char.fullDescription}${char.appearance ? ', ' + char.appearance : ''}, ${outfitText}. ${selectedShot.camera}. Background: ${bgText}. Lighting: ${selectedMood.lighting}. High quality, 8K, photorealistic, cinematic photography, no text, no watermark.`
        setGeneratedPrompt(prompt)
    }, [selectedChar, selectedShot, selectedOutfit, selectedBg, selectedMood, customOutfit, customBg, characters])

    const handleGenerate = async () => {
        if (!generatedPrompt || !selectedChar) return
        setIsGenerating(true)
        setPreviewImage(null)

        try {
            const res = await fetch('/api/imagen/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: generatedPrompt,
                    aspectRatio: ['full_shot', 'medium_full', 'wide_shot'].includes(selectedShot.id) ? '9:16' : '1:1',
                    model: selectedModel.id
                })
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                toast.error(err.error || `Lỗi ${res.status}`)
                return
            }

            const data = await res.json()

            if (data.imageBase64) {
                const imageUrl = `data:image/png;base64,${data.imageBase64}`
                // Show image IMMEDIATELY — don't block on save
                setPreviewImage(imageUrl)
                toast.success('Ảnh đã được tạo!')

                // Save in background — failure won't affect preview
                fetch(`/api/channels/${channelId}/avatar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        characterId: selectedChar,
                        shotType: selectedShot.id,
                        outfit: selectedOutfit.id === 'custom' ? customOutfit : selectedOutfit.id,
                        background: selectedBg.id === 'custom' ? customBg : selectedBg.id,
                        mood: selectedMood.id,
                        prompt: generatedPrompt,
                        imageUrl
                    })
                }).then(r => {
                    if (r.ok) fetchData()
                    else console.warn('[Avatar save] failed:', r.status)
                }).catch(e => console.warn('[Avatar save] error:', e))
            } else {
                toast.error(data.error || 'Không thể tạo ảnh')
            }
        } catch (e) {
            console.error('[Generate] error:', e)
            toast.error('Lỗi kết nối tới server')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleGenerateMasterSheet = async () => {
        if (!selectedChar) return
        const char = characters.find(c => c.id === selectedChar)
        if (!char) return

        setIsGeneratingMaster(true)
        setMasterSheetImage(null)

        const outfitText = selectedOutfit.id === 'custom' ? customOutfit : `${selectedOutfit.label} outfit (${selectedOutfit.desc})`
        const bgText = selectedBg.id === 'custom' ? customBg : `${selectedBg.label} background`
        const charDesc = `${char.fullDescription}${char.appearance ? ', ' + char.appearance : ''}`

        const masterPrompt = `Character reference sheet. A 2x3 grid composite photo of the SAME person: ${charDesc}, wearing ${outfitText}. ` +
            `Top-left: extreme close-up face portrait. ` +
            `Top-right: medium shot waist-up front facing. ` +
            `Middle-left: full body front view head to toe. ` +
            `Middle-right: full body side profile view. ` +
            `Bottom-left: full body rear back view. ` +
            `Bottom-right: full body 3/4 angle walking pose. ` +
            `${bgText}, ${selectedMood.lighting}. ` +
            `Clean white studio backdrop. All 6 panels show the EXACT SAME character with consistent appearance. ` +
            `High quality, photorealistic, 8K, no text, no labels, no watermark.`

        try {
            const res = await fetch('/api/imagen/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: masterPrompt,
                    aspectRatio: '9:16',
                    model: selectedModel.id
                })
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                toast.error(err.error || `Lỗi ${res.status}`)
                return
            }

            const data = await res.json()

            if (data.imageBase64) {
                const imageUrl = `data:image/png;base64,${data.imageBase64}`
                // Show immediately
                setMasterSheetImage(imageUrl)
                toast.success('Master Sheet đã được tạo!')

                // Save in background
                fetch(`/api/channels/${channelId}/avatar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        characterId: selectedChar,
                        shotType: 'master_sheet',
                        outfit: selectedOutfit.id === 'custom' ? customOutfit : selectedOutfit.id,
                        background: selectedBg.id === 'custom' ? customBg : selectedBg.id,
                        mood: selectedMood.id,
                        prompt: masterPrompt,
                        imageUrl
                    })
                }).then(r => {
                    if (r.ok) fetchData()
                    else console.warn('[MasterSheet save] failed:', r.status)
                }).catch(e => console.warn('[MasterSheet save] error:', e))
            } else {
                toast.error(data.error || 'Không thể tạo Master Sheet')
            }
        } catch (e) {
            console.error('[MasterSheet] error:', e)
            toast.error('Lỗi kết nối tới server')
        } finally {
            setIsGeneratingMaster(false)
        }
    }


    const handleDelete = async (characterId: string, shotId: string) => {
        try {
            await fetch(`/api/channels/${channelId}/avatar`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ characterId, shotId })
            })
            toast.success('Đã xóa shot')
            fetchData()
        } catch {
            toast.error('Lỗi khi xóa')
        }
    }

    const currentCharAvatar = avatarData.find(a => a.characterId === selectedChar)
    const allShots = avatarData.flatMap(a => a.shots.map(s => ({ ...s, characterName: a.characterName, characterId: a.characterId })))
    const allShotsWithImages = allShots.filter(s => s.imageUrl)

    const handleBulkDownload = async () => {
        if (allShotsWithImages.length === 0) {
            toast.error('Không có ảnh nào để download')
            return
        }
        toast.loading(`Đang tải ${allShotsWithImages.length} ảnh...`, { id: 'bulk-dl' })
        for (const shot of allShotsWithImages) {
            const a = document.createElement('a')
            a.href = shot.imageUrl!
            a.download = `${shot.characterName}_${shot.shotType}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            await new Promise(r => setTimeout(r, 300))
        }
        toast.success(`Đã tải ${allShotsWithImages.length} ảnh!`, { id: 'bulk-dl' })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
        )
    }

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 50%, #0f1a2e 100%)' }}>
            {/* Header */}
            <div className="border-b border-white/10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push(`/dashboard/channels/${channelId}`)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                                <Camera className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Avatar Studio</h1>
                                <p className="text-xs text-white/40">Tạo bộ ảnh nhân vật đa góc độ</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {activeTab === 'library' && allShotsWithImages.length > 0 && (
                            <button
                                onClick={handleBulkDownload}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all"
                            >
                                <Download className="w-4 h-4" />
                                Tải tất cả ({allShotsWithImages.length})
                            </button>
                        )}
                        <div className="flex rounded-lg overflow-hidden border border-white/10">

                            {(['create', 'library'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === tab ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/60 hover:text-white'}`}
                                >
                                    {tab === 'create' ? '✨ Tạo mới' : `🖼️ Thư viện (${allShots.length})`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {characters.length === 0 ? (
                    <div className="text-center py-20">
                        <User className="w-16 h-16 text-white/20 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Chưa có nhân vật nào</h3>
                        <p className="text-white/40 mb-6">Tạo nhân vật trong Channel trước để dùng Avatar Studio</p>
                        <button
                            onClick={() => router.push(`/dashboard/channels/${channelId}`)}
                            className="px-6 py-3 rounded-xl font-medium text-white"
                            style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
                        >
                            Đến trang Channel
                        </button>
                    </div>
                ) : activeTab === 'create' ? (
                    // ─── CREATE TAB ───────────────────────────────────────
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* LEFT: Controls */}
                        <div className="lg:col-span-1 space-y-4">
                            {/* Character Select */}
                            <div className="rounded-2xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Nhân vật
                                </h3>
                                <div className="space-y-2">
                                    {characters.map(char => (
                                        <button
                                            key={char.id}
                                            onClick={() => setSelectedChar(char.id)}
                                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedChar === char.id ? 'bg-purple-600/30 border border-purple-500/50 text-white' : 'bg-white/5 border border-transparent text-white/60 hover:text-white hover:bg-white/10'}`}
                                        >
                                            <div className="font-medium">{char.name}</div>
                                            <div className="text-xs opacity-60 truncate mt-0.5">{char.fullDescription}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Shot Type */}
                            <div className="rounded-2xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Camera className="w-4 h-4" /> Góc quay
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {SHOT_TYPES.map(shot => (
                                        <button
                                            key={shot.id}
                                            onClick={() => setSelectedShot(shot)}
                                            className={`text-left px-3 py-2.5 rounded-xl transition-all text-sm ${selectedShot.id === shot.id ? 'bg-purple-600/40 border border-purple-400/50 text-white' : 'bg-white/5 border border-transparent text-white/60 hover:bg-white/10'}`}
                                        >
                                            <div>{shot.icon} {shot.label}</div>
                                            <div className="text-xs opacity-50 mt-0.5">{shot.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Outfit */}
                            <div className="rounded-2xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3">👗 Trang phục</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {OUTFITS.map(o => (
                                        <button
                                            key={o.id}
                                            onClick={() => setSelectedOutfit(o)}
                                            className={`text-left px-3 py-2 rounded-xl transition-all text-sm ${selectedOutfit.id === o.id ? 'bg-pink-600/40 border border-pink-400/50 text-white' : 'bg-white/5 border border-transparent text-white/60 hover:bg-white/10'}`}
                                        >
                                            <div className="font-medium">{o.label}</div>
                                            <div className="text-xs opacity-50">{o.desc}</div>
                                        </button>
                                    ))}
                                </div>
                                {selectedOutfit.id === 'custom' && (
                                    <textarea
                                        value={customOutfit}
                                        onChange={e => setCustomOutfit(e.target.value)}
                                        placeholder="Mô tả trang phục..."
                                        className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 resize-none"
                                        rows={2}
                                    />
                                )}
                            </div>

                            {/* Background */}
                            <div className="rounded-2xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3">🏞️ Bối cảnh</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {BACKGROUNDS.map(bg => (
                                        <button
                                            key={bg.id}
                                            onClick={() => setSelectedBg(bg)}
                                            className={`text-left px-3 py-2 rounded-xl transition-all text-sm ${selectedBg.id === bg.id ? 'bg-cyan-600/40 border border-cyan-400/50 text-white' : 'bg-white/5 border border-transparent text-white/60 hover:bg-white/10'}`}
                                        >
                                            <div className="font-medium">{bg.label}</div>
                                            <div className="text-xs opacity-50">{bg.desc}</div>
                                        </button>
                                    ))}
                                </div>
                                {selectedBg.id === 'custom' && (
                                    <textarea
                                        value={customBg}
                                        onChange={e => setCustomBg(e.target.value)}
                                        placeholder="Mô tả bối cảnh..."
                                        className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 resize-none"
                                        rows={2}
                                    />
                                )}
                            </div>

                            {/* Mood */}
                            <div className="rounded-2xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3">🎨 Ánh sáng</h3>
                                <div className="flex flex-wrap gap-2">
                                    {MOODS.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedMood(m)}
                                            className={`px-3 py-1.5 rounded-full text-sm transition-all ${selectedMood.id === m.id ? 'bg-amber-500/40 border border-amber-400/50 text-white' : 'bg-white/5 border border-transparent text-white/50 hover:text-white'}`}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Image Model */}
                            <div className="rounded-2xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    🤖 Model AI
                                </h3>
                                <div className="space-y-2">
                                    {IMAGE_MODELS.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedModel(m)}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between ${selectedModel.id === m.id ? 'border text-white' : 'bg-white/5 border border-transparent text-white/60 hover:text-white hover:bg-white/10'}`}
                                            style={selectedModel.id === m.id ? { background: `${m.color}22`, borderColor: `${m.color}66` } : {}}
                                        >
                                            <div>
                                                <div className="text-sm font-medium">{m.label}</div>
                                                <div className="text-xs opacity-50">{m.desc}</div>
                                            </div>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${m.color}33`, color: m.color }}>
                                                {m.badge}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Preview + Prompt */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Preview Area */}
                            <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="font-semibold text-white flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-purple-400" />
                                        Preview
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                                            {selectedShot.icon} {selectedShot.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {previewImage ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="relative"
                                        >
                                            <img
                                                src={previewImage}
                                                alt="Generated avatar"
                                                className="w-full rounded-xl object-cover max-h-[500px]"
                                            />
                                            <div className="absolute top-3 right-3 flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const a = document.createElement('a')
                                                        a.href = previewImage
                                                        a.download = `avatar_${selectedShot.id}.png`
                                                        a.click()
                                                    }}
                                                    className="p-2 rounded-lg backdrop-blur-sm bg-black/50 text-white hover:bg-black/70 transition-all"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={handleGenerate}
                                                    className="p-2 rounded-lg backdrop-blur-sm bg-black/50 text-white hover:bg-black/70 transition-all"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div
                                            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 py-20"
                                            style={{ minHeight: 300 }}
                                        >
                                            {isGenerating ? (
                                                <div className="text-center">
                                                    <div className="relative w-16 h-16 mx-auto mb-4">
                                                        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping" />
                                                        <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-purple-500/20 animate-spin" />
                                                    </div>
                                                    <p className="text-white/60">Đang tạo ảnh...</p>
                                                    <p className="text-white/30 text-sm mt-1">Khoảng 10-20 giây</p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <Camera className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                                    <p className="text-white/40">Chọn nhân vật và góc quay,</p>
                                                    <p className="text-white/40">rồi bấm Generate bên dưới</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Auto-generated Prompt */}
                            <div className="rounded-2xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest flex items-center gap-2">
                                        <Wand2 className="w-4 h-4" /> Auto Prompt
                                    </h3>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedPrompt)
                                            toast.success('Đã copy prompt!')
                                        }}
                                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-all"
                                    >
                                        <Copy className="w-3 h-3" /> Copy
                                    </button>
                                </div>
                                <p className="text-sm text-white/50 leading-relaxed bg-white/5 rounded-lg p-3 font-mono">
                                    {generatedPrompt || 'Chọn nhân vật để xem prompt...'}
                                </p>
                            </div>

                            {/* Generate Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || isGeneratingMaster || !selectedChar}
                                    className="py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
                                >
                                    {isGenerating ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
                                    ) : (
                                        <><Sparkles className="w-4 h-4" /> 1 Shot</>
                                    )}
                                </button>
                                <button
                                    onClick={handleGenerateMasterSheet}
                                    disabled={isGenerating || isGeneratingMaster || !selectedChar}
                                    className="py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-amber-400/30"
                                    style={{ background: 'linear-gradient(135deg, #92400e, #d97706, #f59e0b)' }}
                                >
                                    {isGeneratingMaster ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
                                    ) : (
                                        <><ImageIcon className="w-4 h-4" /> Master Sheet</>
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-white/30 text-center -mt-2">
                                Master Sheet = 1 ảnh 6 góc • tiết kiệm 6x API call
                            </p>

                            {/* Master Sheet Preview */}
                            {masterSheetImage && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-2xl border border-amber-500/30 overflow-hidden"
                                    style={{ background: 'rgba(217,119,6,0.05)' }}
                                >
                                    <div className="p-3 border-b border-amber-500/20 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" /> Master Sheet — 6 góc
                                        </span>
                                        <button
                                            onClick={() => {
                                                const a = document.createElement('a')
                                                a.href = masterSheetImage
                                                a.download = `master_sheet_${selectedChar}.png`
                                                a.click()
                                            }}
                                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs transition-all"
                                        >
                                            <Download className="w-3 h-3" /> Download
                                        </button>
                                    </div>
                                    <img src={masterSheetImage} alt="Master Sheet" className="w-full object-contain" />
                                </motion.div>
                            )}

                            {/* Existing shots for this character */}
                            {currentCharAvatar && currentCharAvatar.shots.length > 0 && (
                                <div className="rounded-2xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3">
                                        Shots đã tạo cho nhân vật này ({currentCharAvatar.shots.length})
                                    </h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {currentCharAvatar.shots.map(shot => {
                                            const shotInfo = SHOT_TYPES.find(s => s.id === shot.shotType)
                                            return (
                                                <div key={shot.id} className="relative group rounded-xl overflow-hidden aspect-square bg-white/5 border border-white/10">
                                                    {shot.imageUrl ? (
                                                        <img src={shot.imageUrl} alt={shot.shotType} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-2xl">
                                                            {shotInfo?.icon || '📷'}
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                                                        <span className="text-xs text-white font-medium">{shotInfo?.label}</span>
                                                        <div className="flex gap-1">
                                                            {shot.imageUrl && (
                                                                <button
                                                                    onClick={() => {
                                                                        const a = document.createElement('a')
                                                                        a.href = shot.imageUrl!
                                                                        a.download = `${currentCharAvatar?.characterName}_${shot.shotType}.png`
                                                                        a.click()
                                                                    }}
                                                                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                                                                >
                                                                    <Download className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDelete(currentCharAvatar!.characterId, shot.id)}
                                                                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-all"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-1 px-1.5">
                                                        <span className="text-[10px] text-white/70">{shotInfo?.label || shot.shotType}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // ─── LIBRARY TAB ──────────────────────────────────────
                    <div>
                        {allShots.length === 0 ? (
                            <div className="text-center py-20">
                                <ImageIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">Thư viện trống</h3>
                                <p className="text-white/40 mb-6">Tạo avatar shots ở tab Create để xem tại đây</p>
                                <button onClick={() => setActiveTab('create')} className="px-6 py-3 rounded-xl font-medium text-white" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                                    Bắt đầu tạo
                                </button>
                            </div>
                        ) : (
                            <>
                                {avatarData.filter(a => a.shots.length > 0).map(charData => (
                                    <div key={charData.characterId} className="mb-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                                                {charData.characterName.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white">{charData.characterName}</h3>
                                                <p className="text-xs text-white/40">{charData.shots.length} shots</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                            {charData.shots.map(shot => {
                                                const shotInfo = SHOT_TYPES.find(s => s.id === shot.shotType)
                                                return (
                                                    <div key={shot.id} className="relative group rounded-xl overflow-hidden border border-white/10" style={{ aspectRatio: '3/4', background: 'rgba(255,255,255,0.05)' }}>
                                                        {shot.imageUrl ? (
                                                            <img src={shot.imageUrl} alt={shot.shotType} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-3xl">{shotInfo?.icon || '📷'}</div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 p-2">
                                                            <span className="text-xs text-white font-medium text-center">{shotInfo?.label}</span>
                                                            <div className="flex gap-1">
                                                                {shot.imageUrl && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const a = document.createElement('a')
                                                                            a.href = shot.imageUrl!
                                                                            a.download = `${charData.characterName}_${shot.shotType}.png`
                                                                            a.click()
                                                                        }}
                                                                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                                                                    >
                                                                        <Download className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(shot.prompt)
                                                                        toast.success('Đã copy prompt!')
                                                                    }}
                                                                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                                                                >
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(charData.characterId, shot.id)}
                                                                    className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-all"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-2 px-2">
                                                            <p className="text-[10px] text-white/70">{shotInfo?.label || shot.shotType}</p>
                                                            <p className="text-[9px] text-white/40">{shot.outfit} · {shot.mood}</p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {/* Add more button */}
                                            <button
                                                onClick={() => { setSelectedChar(charData.characterId); setActiveTab('create') }}
                                                className="rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-white/30 hover:text-white/60 hover:border-white/20 transition-all"
                                                style={{ aspectRatio: '3/4' }}
                                            >
                                                <Plus className="w-6 h-6" />
                                                <span className="text-xs">Thêm shot</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
