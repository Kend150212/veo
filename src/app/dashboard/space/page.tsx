'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Sparkles, Film, ChevronRight, Loader2, Copy,
    Wand2, Image as ImageIcon, Camera, Download,
    ChevronDown, Play, RefreshCw, Layers
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────
interface Channel {
    id: string
    name: string
    _count: { episodes: number; characters: number }
}

interface Episode {
    id: string
    title: string
    scenes: Scene[]
    _count?: { scenes: number }
}

interface Scene {
    id: string
    order: number
    title: string
    promptText: string
    generatedImageUrl?: string | null
}

interface AvatarShot {
    id: string
    shotType: string
    outfit: string
    background: string
    imageUrl: string | null
    prompt: string
}

interface CharacterAvatar {
    characterId: string
    characterName: string
    shots: AvatarShot[]
}

const SHOT_LABELS: Record<string, string> = {
    extreme_close_up: '🔍 Extreme CU',
    close_up: '👤 Close-up',
    medium_close_up: '🧍 Med. Close-up',
    medium_shot: '📷 Medium',
    medium_full: '🧍‍♂️ Med. Full',
    full_shot: '🖼️ Full',
    wide_shot: '🌄 Wide',
    back_34: '🔄 3/4 Back',
}

const BACKGROUNDS = [
    { id: 'studio_white', label: 'Studio White' },
    { id: 'urban_city', label: 'Urban City' },
    { id: 'nature_forest', label: 'Nature Forest' },
    { id: 'coffee_shop', label: 'Coffee Shop' },
    { id: 'beach_sunset', label: 'Beach Sunset' },
    { id: 'modern_office', label: 'Modern Office' },
]

const MOODS = [
    { id: 'natural', label: 'Natural', lighting: 'soft natural daylight' },
    { id: 'golden_hour', label: 'Golden Hour', lighting: 'warm golden hour sunlight, cinematic' },
    { id: 'night_neon', label: 'Night Neon', lighting: 'vibrant neon lights, cyberpunk' },
    { id: 'dramatic', label: 'Dramatic', lighting: 'dramatic side lighting, high contrast' },
]

// ─────────────────────────────────────────────────────────────
export default function VeoSpacePage() {
    const router = useRouter()

    const [channels, setChannels] = useState<Channel[]>([])
    const [selectedChannel, setSelectedChannel] = useState<string>('')
    const [episodes, setEpisodes] = useState<Episode[]>([])
    const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
    const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
    const [avatars, setAvatars] = useState<CharacterAvatar[]>([])
    const [selectedShot, setSelectedShot] = useState<AvatarShot | null>(null)
    const [selectedBg, setSelectedBg] = useState(BACKGROUNDS[0])
    const [selectedMood, setSelectedMood] = useState(MOODS[0])
    const [composedPrompt, setComposedPrompt] = useState('')
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false)
    const [isLoadingInit, setIsLoadingInit] = useState(true)
    const [channelDropdownOpen, setChannelDropdownOpen] = useState(false)
    const [episodeDropdownOpen, setEpisodeDropdownOpen] = useState(false)
    const [batchResults, setBatchResults] = useState<Record<string, string>>({})

    // Load channels
    useEffect(() => {
        fetch('/api/channels')
            .then(r => r.json())
            .then(d => { setChannels(d.channels || []); setIsLoadingInit(false) })
            .catch(() => setIsLoadingInit(false))
    }, [])

    // Load episodes + avatars on channel select
    useEffect(() => {
        if (!selectedChannel) return
        setIsLoadingEpisodes(true)
        setSelectedEpisode(null)
        setSelectedScene(null)

        Promise.all([
            fetch(`/api/channels/${selectedChannel}/episodes`).then(r => r.json()),
            fetch(`/api/channels/${selectedChannel}/avatar`).then(r => r.json()),
        ]).then(([epData, avData]) => {
            setEpisodes(epData.episodes || [])
            setAvatars(avData.avatarShots || [])
        }).catch(() => {
            toast.error('Lỗi tải dữ liệu')
        }).finally(() => setIsLoadingEpisodes(false))
    }, [selectedChannel])

    // Auto-compose prompt when scene + shot + bg + mood change
    useEffect(() => {
        if (!selectedScene) return

        let prompt = selectedScene.promptText || ''

        if (selectedShot) {
            const shotLabel = SHOT_LABELS[selectedShot.shotType] || selectedShot.shotType
            prompt += `\n\nCamera: ${shotLabel} shot. Character: ${selectedShot.prompt.split(',').slice(0, 2).join(',')}.`
        }

        prompt += ` Background: ${selectedBg.label}. Lighting: ${selectedMood.lighting}. Cinematic, 8K, photorealistic.`

        setComposedPrompt(prompt)
        setGeneratedImage(null)
    }, [selectedScene, selectedShot, selectedBg, selectedMood])

    const handleGenerate = async () => {
        if (!composedPrompt) return
        setIsGenerating(true)
        setGeneratedImage(null)

        try {
            const res = await fetch('/api/imagen/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: composedPrompt, aspectRatio: '16:9' })
            })
            const data = await res.json()
            if (data.imageUrl) {
                setGeneratedImage(data.imageUrl)
                if (selectedScene) {
                    setBatchResults(prev => ({ ...prev, [selectedScene.id]: data.imageUrl }))
                }
                toast.success('Đã tạo ảnh!')
            } else {
                toast.error(data.error || 'Không thể tạo ảnh')
            }
        } catch {
            toast.error('Lỗi kết nối')
        } finally {
            setIsGenerating(false)
        }
    }

    const allAvatarShots = avatars.flatMap(a => a.shots.map(s => ({ ...s, characterName: a.characterName })))
    const currentChannel = channels.find(c => c.id === selectedChannel)

    if (isLoadingInit) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
        )
    }

    return (
        <div className="min-h-screen -m-6 lg:-m-8" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #12082a 50%, #080a1a 100%)' }}>
            {/* ── TOP BAR ── */}
            <div className="border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between max-w-full">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)' }}>
                                <Layers className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Veo Space</h1>
                                <p className="text-xs text-white/30">AI Visual Workspace</p>
                            </div>
                        </div>

                        {/* Channel Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setChannelDropdownOpen(!channelDropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-white transition-all min-w-[160px]"
                            >
                                <Film className="w-4 h-4 text-purple-400" />
                                <span className="flex-1 text-left">{currentChannel?.name || 'Chọn Channel'}</span>
                                <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${channelDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {channelDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="absolute top-full mt-2 left-0 w-64 rounded-xl border border-white/10 overflow-hidden z-50 shadow-2xl"
                                        style={{ background: '#1a1a2e' }}
                                    >
                                        {channels.map(ch => (
                                            <button
                                                key={ch.id}
                                                onClick={() => { setSelectedChannel(ch.id); setChannelDropdownOpen(false) }}
                                                className="w-full text-left px-4 py-3 hover:bg-white/10 transition-all text-sm"
                                            >
                                                <div className="font-medium text-white">{ch.name}</div>
                                                <div className="text-xs text-white/40">{ch._count.episodes} episodes · {ch._count.characters} characters</div>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Episode Selector */}
                        {selectedChannel && (
                            <div className="relative">
                                <button
                                    onClick={() => setEpisodeDropdownOpen(!episodeDropdownOpen)}
                                    disabled={isLoadingEpisodes}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-white transition-all min-w-[180px] disabled:opacity-50"
                                >
                                    {isLoadingEpisodes ? <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> : <Play className="w-4 h-4 text-cyan-400" />}
                                    <span className="flex-1 text-left truncate">{selectedEpisode?.title || 'Chọn Episode'}</span>
                                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${episodeDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {episodeDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="absolute top-full mt-2 left-0 w-72 rounded-xl border border-white/10 overflow-hidden z-50 shadow-2xl max-h-64 overflow-y-auto"
                                            style={{ background: '#1a1a2e' }}
                                        >
                                            {episodes.map(ep => (
                                                <button
                                                    key={ep.id}
                                                    onClick={() => { setSelectedEpisode(ep); setEpisodeDropdownOpen(false); setSelectedScene(null) }}
                                                    className="w-full text-left px-4 py-3 hover:bg-white/10 transition-all text-sm border-b border-white/5"
                                                >
                                                    <div className="font-medium text-white truncate">{ep.title}</div>
                                                    <div className="text-xs text-white/40">{ep.scenes?.length || ep._count?.scenes || 0} scenes</div>
                                                </button>
                                            ))}
                                            {episodes.length === 0 && (
                                                <div className="px-4 py-6 text-center text-white/40 text-sm">Chưa có Episode nào</div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {selectedChannel && (
                        <button
                            onClick={() => router.push(`/dashboard/channels/${selectedChannel}/avatar`)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all"
                        >
                            <Camera className="w-4 h-4" />
                            Avatar Studio
                        </button>
                    )}
                </div>
            </div>

            {!selectedChannel ? (
                // ── EMPTY STATE ──
                <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)' }}>
                            <Layers className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-3">Chào mừng đến Veo Space</h2>
                        <p className="text-white/40 max-w-md mx-auto mb-8">
                            Workspace AI để tạo ảnh đồng bộ từ kịch bản Episode — nhân vật nhất quán, bối cảnh chuyên nghiệp
                        </p>
                        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
                            {['🎭 Nhân vật từ Avatar Studio', '📽️ Kịch bản từ Episodes', '🖼️ Generate ảnh đồng bộ'].map((f, i) => (
                                <div key={i} className="rounded-xl border border-white/10 p-3 text-center text-sm text-white/60" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    {f}
                                </div>
                            ))}
                        </div>
                        <p className="text-white/30 text-sm">Chọn Channel ở thanh trên để bắt đầu</p>
                    </motion.div>
                </div>
            ) : !selectedEpisode ? (
                // ── SELECT EPISODE ──
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Chọn Episode để làm việc</h2>
                    {isLoadingEpisodes ? (
                        <div className="flex items-center gap-3 text-white/40">
                            <Loader2 className="w-5 h-5 animate-spin" /> Đang tải...
                        </div>
                    ) : episodes.length === 0 ? (
                        <div className="text-center py-16 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <Film className="w-12 h-12 text-white/20 mx-auto mb-3" />
                            <p className="text-white/40 mb-4">Channel này chưa có Episode nào</p>
                            <button onClick={() => router.push(`/dashboard/channels/${selectedChannel}`)} className="px-5 py-2 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                                Đến Channel tạo Episode
                            </button>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {episodes.map(ep => (
                                <motion.button
                                    key={ep.id}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => setSelectedEpisode(ep)}
                                    className="text-left p-4 rounded-xl border border-white/10 hover:border-purple-500/40 transition-all"
                                    style={{ background: 'rgba(255,255,255,0.03)' }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                                            <Play className="w-4 h-4 text-white" />
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-white/20" />
                                    </div>
                                    <h3 className="font-medium text-white text-sm mb-1 line-clamp-2">{ep.title}</h3>
                                    <p className="text-xs text-white/30">{ep.scenes?.length || ep._count?.scenes || 0} scenes</p>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                // ── WORKSPACE ──
                <div className="flex h-[calc(100vh-112px)]">
                    {/* LEFT: Scene Filmstrip */}
                    <div className="w-56 border-r border-white/10 flex flex-col" style={{ background: 'rgba(0,0,0,0.3)' }}>
                        <div className="px-4 py-3 border-b border-white/10">
                            <p className="text-xs text-white/40 uppercase tracking-widest">Scenes</p>
                            <p className="text-sm font-medium text-white truncate">{selectedEpisode.title}</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                            {(selectedEpisode.scenes || []).map((scene, i) => (
                                <button
                                    key={scene.id}
                                    onClick={() => { setSelectedScene(scene); setGeneratedImage(batchResults[scene.id] || null) }}
                                    className={`w-full text-left p-3 rounded-xl transition-all ${selectedScene?.id === scene.id ? 'bg-purple-600/30 border border-purple-500/50' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-xs font-bold text-white/30">#{i + 1}</span>
                                        {batchResults[scene.id] && <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto" title="Đã có ảnh" />}
                                    </div>
                                    {batchResults[scene.id] ? (
                                        <img src={batchResults[scene.id]} alt="scene" className="w-full h-12 rounded-lg object-cover mb-1.5" />
                                    ) : (
                                        <div className="w-full h-12 rounded-lg bg-white/5 flex items-center justify-center mb-1.5">
                                            <ImageIcon className="w-4 h-4 text-white/20" />
                                        </div>
                                    )}
                                    <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">{scene.title || scene.promptText.slice(0, 50)}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CENTER: Main Workspace */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {!selectedScene ? (
                            <div className="flex items-center justify-center h-full text-center">
                                <div>
                                    <ImageIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                    <p className="text-white/40">Chọn một Scene từ danh sách bên trái</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Scene Info */}
                                <div className="rounded-xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">Scene {selectedScene.order}</span>
                                        {selectedScene.title && <h3 className="text-sm font-semibold text-white">{selectedScene.title}</h3>}
                                    </div>
                                    <p className="text-sm text-white/50 leading-relaxed line-clamp-4">{selectedScene.promptText}</p>
                                </div>

                                {/* Generated Image */}
                                <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                                        <span className="text-sm font-medium text-white">Kết quả</span>
                                        {generatedImage && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { const a = document.createElement('a'); a.href = generatedImage; a.download = `scene_${selectedScene.order}.png`; a.click() }}
                                                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
                                                ><Download className="w-4 h-4" /></button>
                                                <button onClick={handleGenerate} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all">
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        {generatedImage ? (
                                            <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={generatedImage} alt="generated" className="w-full rounded-lg object-cover" style={{ maxHeight: 360 }} />
                                        ) : (
                                            <div className="flex items-center justify-center rounded-lg border border-dashed border-white/10 py-16" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                {isGenerating ? (
                                                    <div className="text-center">
                                                        <div className="relative w-12 h-12 mx-auto mb-3">
                                                            <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping" />
                                                            <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-purple-500/20 animate-spin" />
                                                        </div>
                                                        <p className="text-white/40 text-sm">Đang tạo ảnh...</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <Wand2 className="w-8 h-8 text-white/20 mx-auto mb-2" />
                                                        <p className="text-white/30 text-sm">Bấm Generate để tạo ảnh</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Composed Prompt */}
                                <div className="rounded-xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-white/40 uppercase tracking-widest flex items-center gap-2"><Wand2 className="w-3.5 h-3.5" /> Prompt tổng hợp</span>
                                        <button onClick={() => { navigator.clipboard.writeText(composedPrompt); toast.success('Đã copy!') }} className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-all">
                                            <Copy className="w-3 h-3" /> Copy
                                        </button>
                                    </div>
                                    <p className="text-xs text-white/40 font-mono leading-relaxed bg-black/30 rounded-lg p-3">{composedPrompt}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* RIGHT: Controls */}
                    <div className="w-64 border-l border-white/10 flex flex-col" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Avatar Shots */}
                            <div>
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Camera className="w-3.5 h-3.5" /> Nhân vật
                                </p>
                                {allAvatarShots.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-white/10 p-4 text-center">
                                        <p className="text-xs text-white/30 mb-2">Chưa có avatar</p>
                                        <button
                                            onClick={() => router.push(`/dashboard/channels/${selectedChannel}/avatar`)}
                                            className="text-xs text-purple-400 hover:text-purple-300"
                                        >
                                            → Đến Avatar Studio
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {allAvatarShots.map(shot => (
                                            <button
                                                key={shot.id}
                                                onClick={() => setSelectedShot(selectedShot?.id === shot.id ? null : shot)}
                                                className={`relative rounded-xl overflow-hidden border transition-all ${selectedShot?.id === shot.id ? 'border-purple-500/60' : 'border-white/10 hover:border-white/30'}`}
                                                style={{ aspectRatio: '3/4' }}
                                            >
                                                {shot.imageUrl ? (
                                                    <img src={shot.imageUrl} alt={shot.shotType} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-white/5 text-xl">
                                                        {shot.shotType === 'full_shot' ? '🖼️' : '📷'}
                                                    </div>
                                                )}
                                                {selectedShot?.id === shot.id && (
                                                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                                                        <span className="text-[8px] text-white font-bold">✓</span>
                                                    </div>
                                                )}
                                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                                                    <p className="text-[9px] text-white/70 leading-tight">{SHOT_LABELS[shot.shotType]?.split(' ').slice(1).join(' ')}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Background */}
                            <div>
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-2">🏞️ Bối cảnh</p>
                                <div className="space-y-1">
                                    {BACKGROUNDS.map(bg => (
                                        <button
                                            key={bg.id}
                                            onClick={() => setSelectedBg(bg)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedBg.id === bg.id ? 'bg-cyan-600/30 border border-cyan-500/40 text-white' : 'bg-white/5 border border-transparent text-white/50 hover:text-white'}`}
                                        >
                                            {bg.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mood */}
                            <div>
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-2">🎨 Ánh sáng</p>
                                <div className="space-y-1">
                                    {MOODS.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedMood(m)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedMood.id === m.id ? 'bg-amber-500/30 border border-amber-500/40 text-white' : 'bg-white/5 border border-transparent text-white/50 hover:text-white'}`}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="p-4 border-t border-white/10">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !selectedScene}
                                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)' }}
                            >
                                {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</> : <><Sparkles className="w-4 h-4" /> Generate Scene</>}
                            </button>
                            <p className="text-xs text-white/20 text-center mt-2">{Object.keys(batchResults).length}/{(selectedEpisode.scenes || []).length} scenes đã tạo</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
