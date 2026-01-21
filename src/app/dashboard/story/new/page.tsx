'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Film,
    Users,
    FileText,
    Wand2,
    Loader2,
    Check,
    RefreshCw,
    Newspaper,
    Bot
} from 'lucide-react'
import toast from 'react-hot-toast'
import { GENRES, GENRE_CATEGORIES, SCRIPT_LANGUAGES, VISUAL_STYLES, type StoryIdea, type Character } from '@/lib/ai-story'

type WizardStep = 'input' | 'genre' | 'ideas' | 'characters' | 'story' | 'generating'
type InputMode = 'manual' | 'article' | 'url' | 'quick'

interface InputData {
    subject: string
    action: string
    scene: string
    camera: string
    style: string
    lighting: string
    mood: string
}

interface ExtractedArticle {
    subject: string
    action: string
    scene: string
    mood: string
    style: string
    suggestedGenre: string
    summary: string
    suggestedSceneCount: number
}

export default function NewStoryPage() {
    const { data: session } = useSession()
    const router = useRouter()

    const [step, setStep] = useState<WizardStep>('input')
    const [inputMode, setInputMode] = useState<InputMode>('manual')
    const [isLoading, setIsLoading] = useState(false)
    const [isGeneratingChars, setIsGeneratingChars] = useState(false)

    // Article/URL input
    const [articleContent, setArticleContent] = useState('')
    const [urlInput, setUrlInput] = useState('')
    const [isExpandingDesc, setIsExpandingDesc] = useState(false)

    // Step 1: Input data
    const [input, setInput] = useState<InputData>({
        subject: '',
        action: '',
        scene: '',
        camera: '',
        style: '',
        lighting: '',
        mood: ''
    })

    // Step 2: Genre
    const [suggestedGenres, setSuggestedGenres] = useState<{ id: string, name: string, confidence: number }[]>([])
    const [selectedGenre, setSelectedGenre] = useState<string>('')

    // Step 3: Ideas
    const [ideas, setIdeas] = useState<StoryIdea[]>([])
    const [selectedIdea, setSelectedIdea] = useState<StoryIdea | null>(null)

    // Step 4: Characters
    const [characters, setCharacters] = useState<Partial<Character>[]>([])
    const [suggestedCharCount, setSuggestedCharCount] = useState<number>(0)

    // Step 5: Story outline
    const [storyOutline, setStoryOutline] = useState('')
    const [sceneCount, setSceneCount] = useState(10)
    const [userDescription, setUserDescription] = useState('')
    const [projectTitle, setProjectTitle] = useState('')

    // Language selection
    const [scriptLanguage, setScriptLanguage] = useState('vi')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [isQuickGenerating, setIsQuickGenerating] = useState(false)

    // Quick Mode states
    const [quickDescription, setQuickDescription] = useState('')
    const [quickIdeas, setQuickIdeas] = useState<{ title: string, logline: string, tone: string, visualStyle: string, hook?: string, keyMoments?: string[], targetAudience?: string }[]>([])
    const [selectedQuickIdea, setSelectedQuickIdea] = useState<number | null>(null)
    const [isGeneratingQuickIdeas, setIsGeneratingQuickIdeas] = useState(false)
    const [quickModeStep, setQuickModeStep] = useState<'input' | 'ideas' | 'styles' | 'confirm'>('input')
    const [selectedStyle, setSelectedStyle] = useState<string>('jellytoon')

    // Parse article content
    const handleParseArticle = async () => {
        if (articleContent.length < 50) {
            toast.error('Vui lòng nhập ít nhất 50 ký tự')
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch('/api/story/parse-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: articleContent })
            })

            const data = await res.json()
            if (data.extracted) {
                const ext = data.extracted as ExtractedArticle
                setInput({
                    subject: ext.subject || '',
                    action: ext.action || '',
                    scene: ext.scene || '',
                    mood: ext.mood || '',
                    style: ext.style || '',
                    camera: '',
                    lighting: ''
                })
                setSceneCount(ext.suggestedSceneCount || 10)
                setUserDescription(ext.summary || '')

                // Auto-select genre if suggested
                if (ext.suggestedGenre) {
                    const genre = GENRES.find(g => g.id === ext.suggestedGenre || g.nameEn.toLowerCase() === ext.suggestedGenre.toLowerCase())
                    if (genre) setSelectedGenre(genre.id)
                }

                toast.success('Đã phân tích nội dung thành công!')
                setStep('genre')
            } else {
                toast.error(data.error || 'Không thể phân tích')
            }
        } catch (error) {
            toast.error('Không thể phân tích nội dung')
        } finally {
            setIsLoading(false)
        }
    }

    // Parse URL content
    const handleParseUrl = async () => {
        if (!urlInput || urlInput.length < 10) {
            toast.error('Vui lòng nhập URL hợp lệ')
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch('/api/story/parse-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: urlInput })
            })

            const data = await res.json()
            if (data.extracted) {
                const ext = data.extracted as ExtractedArticle
                setInput({
                    subject: ext.subject || '',
                    action: ext.action || '',
                    scene: ext.scene || '',
                    mood: ext.mood || '',
                    style: ext.style || '',
                    camera: '',
                    lighting: ''
                })
                setSceneCount(ext.suggestedSceneCount || 10)
                setUserDescription(ext.summary || '')

                // Auto-select genre if suggested
                if (ext.suggestedGenre) {
                    const genre = GENRES.find(g => g.id === ext.suggestedGenre || g.nameEn.toLowerCase() === ext.suggestedGenre.toLowerCase())
                    if (genre) setSelectedGenre(genre.id)
                }

                toast.success('Đã phân tích URL thành công!')
                setStep('genre')
            } else {
                toast.error(data.error || 'Không thể phân tích URL')
            }
        } catch (error) {
            toast.error('Không thể phân tích URL')
        } finally {
            setIsLoading(false)
        }
    }

    // AI expand short description
    const handleExpandDescription = async () => {
        const currentDesc = storyOutline || userDescription
        if (!currentDesc || currentDesc.length < 10) {
            toast.error('Vui lòng nhập ít nhất 10 ký tự để AI mở rộng')
            return
        }

        setIsExpandingDesc(true)
        try {
            const res = await fetch('/api/story/expand-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shortDescription: currentDesc,
                    genre: selectedGenre,
                    context: selectedIdea?.title
                })
            })

            const data = await res.json()
            if (data.expanded) {
                setStoryOutline(data.expanded)
                toast.success(`Đã mở rộng thành ${data.wordCount} từ!`)
            } else {
                toast.error(data.error || 'Không thể mở rộng')
            }
        } catch (error) {
            toast.error('Không thể mở rộng mô tả')
        } finally {
            setIsExpandingDesc(false)
        }
    }

    // Generate 3 quick ideas for selection
    const handleGenerateQuickIdeas = async () => {
        if (!selectedGenre) {
            toast.error('Vui lòng chọn thể loại')
            return
        }

        setIsGeneratingQuickIdeas(true)
        try {
            const res = await fetch('/api/story/generate-ideas-quick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    genre: selectedGenre,
                    language: scriptLanguage,
                    description: quickDescription,
                    sceneCount
                })
            })

            const data = await res.json()
            if (data.ideas && data.ideas.length > 0) {
                setQuickIdeas(data.ideas)
                setQuickModeStep('ideas')
                toast.success(`Đã tạo ${data.ideas.length} ý tưởng!`)
            } else {
                toast.error(data.error || 'Không thể tạo ý tưởng')
            }
        } catch (error) {
            toast.error('Không thể tạo ý tưởng')
        } finally {
            setIsGeneratingQuickIdeas(false)
        }
    }

    // Quick Generate - AI creates everything from selected idea
    const handleQuickGenerate = async () => {
        if (!selectedGenre) {
            toast.error('Vui lòng chọn thể loại')
            return
        }

        // Get the selected idea context
        const selectedIdeaData = selectedQuickIdea !== null ? quickIdeas[selectedQuickIdea] : null
        const ideaContext = selectedIdeaData
            ? `Based on this selected story idea:\nTitle: ${selectedIdeaData.title}\nLogline: ${selectedIdeaData.logline}\nTone: ${selectedIdeaData.tone}\nStyle: ${selectedIdeaData.visualStyle}\n${selectedIdeaData.hook ? `Hook: ${selectedIdeaData.hook}` : ''}`
            : quickDescription

        // Get selected visual style keywords
        const styleData = VISUAL_STYLES.find(s => s.id === selectedStyle)
        const styleKeywords = styleData?.promptKeywords || ''

        setIsQuickGenerating(true)
        try {
            const res = await fetch('/api/story/quick-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    genre: selectedGenre,
                    language: scriptLanguage,
                    sceneCount,
                    description: ideaContext,
                    visualStyle: styleKeywords
                })
            })

            const data = await res.json()
            if (data.generated) {
                const gen = data.generated

                // Set all wizard state
                setInput({
                    subject: gen.subject || '',
                    action: gen.action || '',
                    scene: gen.scene || '',
                    mood: gen.mood || '',
                    style: gen.style || '',
                    camera: '',
                    lighting: ''
                })
                setProjectTitle(gen.title || selectedIdeaData?.title || 'Dự án mới')
                setStoryOutline(gen.storyOutline || '')
                setUserDescription(gen.storyOutline || '')

                if (gen.idea) {
                    setSelectedIdea(gen.idea)
                    setIdeas([gen.idea])
                }

                if (gen.characters && gen.characters.length > 0) {
                    setCharacters(gen.characters)
                }

                toast.success('AI đã tạo toàn bộ nội dung!')
                setQuickModeStep('input') // Reset for next time
                setStep('story') // Skip to final step
            } else {
                toast.error(data.error || 'Không thể tạo nội dung')
            }
        } catch (error) {
            toast.error('Không thể tạo nội dung tự động')
        } finally {
            setIsQuickGenerating(false)
        }
    }

    // Analyze genre
    const handleAnalyzeGenre = async () => {
        if (!input.subject || !input.action) {
            toast.error('Vui lòng nhập Subject và Action')
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch('/api/story/analyze-genre', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input)
            })

            const data = await res.json()
            if (data.genres) {
                setSuggestedGenres(data.genres)
                setStep('genre')
            } else {
                toast.error(data.error || 'Không thể phân tích')
            }
        } catch {
            toast.error('Không thể phân tích thể loại')
        } finally {
            setIsLoading(false)
        }
    }

    // Generate ideas
    const handleGenerateIdeas = async () => {
        if (!selectedGenre) {
            toast.error('Vui lòng chọn thể loại')
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch('/api/story/generate-ideas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...input, genre: selectedGenre })
            })

            const data = await res.json()
            if (data.ideas) {
                setIdeas(data.ideas)
                setStep('ideas')
            }
        } catch {
            toast.error('Không thể tạo ý tưởng')
        } finally {
            setIsLoading(false)
        }
    }

    // AI Generate Characters
    const handleGenerateCharacters = async () => {
        setIsGeneratingChars(true)
        try {
            const res = await fetch('/api/story/generate-characters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idea: selectedIdea,
                    genre: selectedGenre,
                    storyOutline: userDescription || storyOutline,
                    articleContent: inputMode === 'article' ? articleContent : undefined
                })
            })

            const data = await res.json()
            if (data.characters) {
                setCharacters(data.characters)
                setSuggestedCharCount(data.suggestedCount || data.characters.length)
                toast.success(`AI đã tạo ${data.characters.length} nhân vật!`)
            } else {
                toast.error(data.error || 'Không thể tạo nhân vật')
            }
        } catch {
            toast.error('Không thể tạo nhân vật')
        } finally {
            setIsGeneratingChars(false)
        }
    }

    // Generate story outline
    const handleGenerateOutline = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/story/generate-outline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idea: selectedIdea,
                    userDescription,
                    sceneCount,
                    characters: characters.filter(c => c.name && c.fullDescription)
                })
            })

            const data = await res.json()
            if (data.outline) {
                setStoryOutline(data.outline)
                setProjectTitle(selectedIdea?.title || 'Dự án mới')
            }
        } catch {
            toast.error('Không thể tạo outline')
        } finally {
            setIsLoading(false)
        }
    }

    // Create project
    const handleCreateProject = async () => {
        if (!projectTitle) {
            toast.error('Vui lòng nhập tên dự án')
            return
        }

        setIsLoading(true)
        setStep('generating')

        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: projectTitle,
                    genre: selectedGenre,
                    selectedIdea: JSON.stringify(selectedIdea),
                    storyOutline,
                    description: userDescription,
                    totalScenes: sceneCount,
                    characters: characters.filter(c => c.name && c.fullDescription)
                })
            })

            const data = await res.json()
            if (data.project) {
                router.push(`/dashboard/story/${data.project.id}?generate=true`)
            }
        } catch {
            toast.error('Không thể tạo dự án')
            setStep('story')
        } finally {
            setIsLoading(false)
        }
    }

    // Character helpers
    const addCharacter = () => {
        setCharacters([...characters, { name: '', role: 'supporting', fullDescription: '' }])
    }

    const updateCharacter = (index: number, field: keyof Character, value: string) => {
        const updated = [...characters]
        updated[index] = { ...updated[index], [field]: value }
        setCharacters(updated)
    }

    const removeCharacter = (index: number) => {
        setCharacters(characters.filter((_, i) => i !== index))
    }

    const stepTitles: Record<WizardStep, string> = {
        input: 'Nhập thông tin',
        genre: 'Chọn thể loại',
        ideas: 'Chọn ý tưởng',
        characters: 'Thiết lập nhân vật',
        story: 'Tạo video',
        generating: 'Đang tạo...'
    }

    const stepNumbers: WizardStep[] = ['input', 'genre', 'ideas', 'characters', 'story', 'generating']
    const currentStepIndex = stepNumbers.indexOf(step)

    return (
        <div className="max-w-4xl mx-auto">
            {/* Progress bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    {stepNumbers.slice(0, -1).map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${i < currentStepIndex ? 'bg-green-500 text-white'
                                    : i === currentStepIndex ? 'bg-[var(--accent-primary)] text-white'
                                        : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}
              `}>
                                {i < currentStepIndex ? <Check className="w-4 h-4" /> : i + 1}
                            </div>
                            {i < stepNumbers.length - 2 && (
                                <div className={`w-12 md:w-20 h-1 mx-1 rounded ${i < currentStepIndex ? 'bg-green-500' : 'bg-[var(--bg-tertiary)]'}`} />
                            )}
                        </div>
                    ))}
                </div>
                <p className="text-center text-sm text-[var(--text-secondary)]">{stepTitles[step]}</p>
            </div>

            <AnimatePresence mode="wait">
                {/* Step 1: Input */}
                {step === 'input' && (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-card p-6"
                    >
                        {/* Input mode tabs */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setInputMode('quick')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${inputMode === 'quick'
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                    }`}
                            >
                                <Sparkles className="w-4 h-4" />
                                AI Tự Động
                            </button>
                            <button
                                onClick={() => setInputMode('manual')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${inputMode === 'manual'
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                Thủ công
                            </button>
                            <button
                                onClick={() => setInputMode('article')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${inputMode === 'article'
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                    }`}
                            >
                                <Newspaper className="w-4 h-4" />
                                Văn bản
                            </button>
                            <button
                                onClick={() => setInputMode('url')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${inputMode === 'url'
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                    }`}
                            >
                                <Bot className="w-4 h-4" />
                                URL
                            </button>
                        </div>

                        {/* Quick Mode - AI generates everything */}
                        {inputMode === 'quick' && (
                            <div className="space-y-5">
                                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                                    <p className="text-sm">
                                        <span className="font-semibold text-purple-400">✨ Chế độ AI Tự Động</span>
                                        <br />
                                        <span className="text-[var(--text-secondary)]">
                                            Chỉ cần chọn thể loại, AI sẽ tự động tạo toàn bộ: ý tưởng, nhân vật, kịch bản và prompt cho video của bạn.
                                        </span>
                                    </p>
                                </div>

                                {/* Language Selection */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Ngôn ngữ kịch bản</label>
                                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                                        {SCRIPT_LANGUAGES.map((lang) => (
                                            <button
                                                key={lang.id}
                                                onClick={() => setScriptLanguage(lang.id)}
                                                className={`p-2 rounded-lg text-sm transition-all ${scriptLanguage === lang.id
                                                    ? 'bg-[var(--accent-primary)] text-white'
                                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                                    }`}
                                            >
                                                {lang.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Genre Category Filter */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Loại thể loại</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {GENRE_CATEGORIES.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className={`px-3 py-1.5 rounded-full text-sm transition-all ${selectedCategory === cat.id
                                                    ? 'bg-[var(--accent-primary)] text-white'
                                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                                    }`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Genre Grid */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Chọn thể loại</label>
                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 max-h-[250px] overflow-y-auto p-1">
                                        {(selectedCategory === 'all' ? GENRES : GENRES.filter(g => g.category === selectedCategory)).map((genre) => (
                                            <button
                                                key={genre.id}
                                                onClick={() => setSelectedGenre(genre.id)}
                                                className={`p-3 rounded-lg text-sm transition-all border-2 ${selectedGenre === genre.id
                                                    ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/50'
                                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-hover)]'
                                                    }`}
                                            >
                                                <span className="font-medium">{genre.name}</span>
                                                <span className="block text-xs opacity-70">{genre.nameEn}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Mode Step: Input */}
                                {quickModeStep === 'input' && (
                                    <>
                                        {/* Optional Description */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Mô tả câu chuyện <span className="text-[var(--text-muted)]">(tùy chọn)</span>
                                            </label>
                                            <textarea
                                                value={quickDescription}
                                                onChange={(e) => setQuickDescription(e.target.value)}
                                                placeholder="Để AI sáng tạo ngẫu nhiên, bạn có thể bỏ trống. Hoặc nhập mô tả ngắn/dài để AI tạo theo ý bạn...

VD: Một cậu bé 10 tuổi tò mò về cơ thể người và khám phá bên trong cơ thể mình..."
                                                className="input-field min-h-[120px]"
                                            />
                                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                                {quickDescription.length} ký tự • Có thể để trống
                                            </p>
                                        </div>

                                        {/* Scene Count */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Số lượng scenes
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={sceneCount}
                                                onChange={(e) => setSceneCount(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="input-field w-32"
                                            />
                                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                                ~{Math.round(sceneCount * 8 / 60)} phút video ({sceneCount} x 8 giây)
                                            </p>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={handleGenerateQuickIdeas}
                                                disabled={isGeneratingQuickIdeas || !selectedGenre}
                                                className="btn-primary flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 border-none"
                                            >
                                                {isGeneratingQuickIdeas ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        AI đang tạo ý tưởng...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4" />
                                                        Tạo 3 Ý Tưởng
                                                        <ArrowRight className="w-4 h-4" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* Quick Mode Step: Idea Selection */}
                                {quickModeStep === 'ideas' && (
                                    <>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold">Chọn 1 trong 3 ý tưởng:</h3>
                                            <button
                                                onClick={() => {
                                                    setQuickModeStep('input')
                                                    setSelectedQuickIdea(null)
                                                }}
                                                className="text-sm text-[var(--accent-primary)] hover:underline"
                                            >
                                                ← Quay lại
                                            </button>
                                        </div>

                                        <div className="grid gap-4">
                                            {quickIdeas.map((idea, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => setSelectedQuickIdea(index)}
                                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedQuickIdea === index
                                                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 ring-2 ring-[var(--accent-primary)]/30'
                                                        : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 bg-[var(--bg-secondary)]'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${index === 0 ? 'bg-green-500/20 text-green-400' :
                                                            index === 1 ? 'bg-purple-500/20 text-purple-400' :
                                                                'bg-orange-500/20 text-orange-400'
                                                            }`}>
                                                            {index === 0 ? '🎯 An toàn' : index === 1 ? '✨ Sáng tạo' : '🚀 Đột phá'}
                                                        </span>
                                                        {selectedQuickIdea === index && (
                                                            <Check className="w-5 h-5 text-[var(--accent-primary)]" />
                                                        )}
                                                    </div>
                                                    <h4 className="font-bold text-lg mb-1">{idea.title}</h4>
                                                    <p className="text-sm text-[var(--text-secondary)] mb-2">{idea.logline}</p>
                                                    <div className="flex flex-wrap gap-2 text-xs">
                                                        <span className="px-2 py-1 bg-[var(--bg-tertiary)] rounded">{idea.tone}</span>
                                                        <span className="px-2 py-1 bg-[var(--bg-tertiary)] rounded">{idea.visualStyle}</span>
                                                        {idea.targetAudience && (
                                                            <span className="px-2 py-1 bg-[var(--bg-tertiary)] rounded">{idea.targetAudience}</span>
                                                        )}
                                                    </div>
                                                    {idea.hook && (
                                                        <p className="text-xs mt-2 italic text-[var(--text-muted)]">
                                                            Hook: "{idea.hook}"
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between mt-4">
                                            <button
                                                onClick={handleGenerateQuickIdeas}
                                                disabled={isGeneratingQuickIdeas}
                                                className="btn-secondary flex items-center gap-2"
                                            >
                                                {isGeneratingQuickIdeas ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="w-4 h-4" />
                                                )}
                                                Tạo lại 3 ý tưởng khác
                                            </button>
                                            <button
                                                onClick={() => setQuickModeStep('styles')}
                                                disabled={selectedQuickIdea === null}
                                                className="btn-primary flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 border-none"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                Chọn Style Hình Ảnh
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* Quick Mode Step: Style Selection */}
                                {quickModeStep === 'styles' && (
                                    <>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold">Chọn Style Hình Ảnh:</h3>
                                            <button
                                                onClick={() => setQuickModeStep('ideas')}
                                                className="text-sm text-[var(--accent-primary)] hover:underline"
                                            >
                                                ← Quay lại ý tưởng
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {VISUAL_STYLES.map((style) => (
                                                <div
                                                    key={style.id}
                                                    onClick={() => setSelectedStyle(style.id)}
                                                    className={`rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${selectedStyle === style.id
                                                        ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/50 scale-105'
                                                        : 'border-transparent hover:border-[var(--accent-primary)]/50'
                                                        }`}
                                                >
                                                    <div className="aspect-square relative">
                                                        <img
                                                            src={style.image}
                                                            alt={style.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {selectedStyle === style.id && (
                                                            <div className="absolute top-2 right-2 bg-[var(--accent-primary)] rounded-full p-1">
                                                                <Check className="w-4 h-4 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-2 bg-[var(--bg-secondary)]">
                                                        <h4 className="font-medium text-sm">{style.name}</h4>
                                                        <p className="text-xs text-[var(--text-muted)]">{style.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-end mt-6">
                                            <button
                                                onClick={handleQuickGenerate}
                                                disabled={isQuickGenerating || !selectedStyle}
                                                className="btn-primary flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 border-none"
                                            >
                                                {isQuickGenerating ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        AI đang tạo câu chuyện...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4" />
                                                        Tạo Câu Chuyện
                                                        <ArrowRight className="w-4 h-4" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* URL Mode */}
                        {inputMode === 'url' && (
                            <div className="space-y-4">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Nhập URL bài báo, tin tức, hoặc trang web. AI sẽ tự động tải và phân tích nội dung.
                                </p>
                                <div>
                                    <label className="block text-sm font-medium mb-2">URL bài viết</label>
                                    <input
                                        type="url"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        placeholder="https://example.com/article/..."
                                        className="input-field"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleParseUrl}
                                        disabled={isLoading || urlInput.length < 10}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        AI Phân tích URL
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Article Mode */}
                        {inputMode === 'article' && (
                            <div className="space-y-4">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Dán nội dung bài báo, kịch bản, hoặc bất kỳ văn bản nào. AI sẽ tự động trích xuất thông tin và tạo video.
                                </p>
                                <textarea
                                    value={articleContent}
                                    onChange={(e) => setArticleContent(e.target.value)}
                                    placeholder="Dán nội dung bài viết, kịch bản, tin tức, hoặc mô tả ý tưởng của bạn vào đây...

VD: Đạo diễn Christopher Nolan vừa công bố dự án phim mới với cốt truyện xoay quanh một cuộc đua tranh giành công nghệ AI giữa các tập đoàn công nghệ lớn..."
                                    className="input-field min-h-[250px]"
                                />
                                <p className="text-xs text-[var(--text-muted)]">
                                    {articleContent.length} ký tự • Tối thiểu 50 ký tự
                                </p>
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleParseArticle}
                                        disabled={isLoading || articleContent.length < 50}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        AI Phân tích & Tiếp tục
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Manual Mode */}
                        {inputMode === 'manual' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Chủ thể chính *</label>
                                    <textarea
                                        value={input.subject}
                                        onChange={(e) => setInput({ ...input, subject: e.target.value })}
                                        placeholder="Một thám tử 50 tuổi với khuôn mặt phong trần, mặc áo khoác dài nhàu nát..."
                                        className="input-field min-h-[80px]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Hành động chính *</label>
                                    <textarea
                                        value={input.action}
                                        onChange={(e) => setInput({ ...input, action: e.target.value })}
                                        placeholder="Chạy qua con hẻm tối, nhìn lại qua vai..."
                                        className="input-field min-h-[60px]"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Bối cảnh</label>
                                        <input
                                            value={input.scene}
                                            onChange={(e) => setInput({ ...input, scene: e.target.value })}
                                            placeholder="Thành phố về đêm..."
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Phong cách</label>
                                        <input
                                            value={input.style}
                                            onChange={(e) => setInput({ ...input, style: e.target.value })}
                                            placeholder="Cinematic, film noir..."
                                            className="input-field"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleAnalyzeGenre}
                                        disabled={isLoading || !input.subject || !input.action}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        Phân tích & Tiếp tục
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Step 2: Genre */}
                {step === 'genre' && (
                    <motion.div key="genre" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-6">
                        <h2 className="text-xl font-semibold mb-2">Chọn thể loại phim</h2>
                        <p className="text-[var(--text-secondary)] text-sm mb-6">AI đề xuất dựa trên nội dung của bạn</p>

                        {suggestedGenres.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-medium mb-3 text-[var(--accent-primary)]">Đề xuất</h3>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedGenres.map((g) => (
                                        <button
                                            key={g.id}
                                            onClick={() => setSelectedGenre(g.id)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${selectedGenre === g.id ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                                }`}
                                        >
                                            {g.name} <span className="opacity-60">{Math.round(g.confidence * 100)}%</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {GENRES.map((g) => (
                                <button
                                    key={g.id}
                                    onClick={() => setSelectedGenre(g.id)}
                                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${selectedGenre === g.id ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                        }`}
                                >
                                    {g.name}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between mt-6">
                            <button onClick={() => setStep('input')} className="btn-secondary flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Quay lại
                            </button>
                            <button onClick={handleGenerateIdeas} disabled={isLoading || !selectedGenre} className="btn-primary flex items-center gap-2">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                Tạo ý tưởng <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Ideas */}
                {step === 'ideas' && (
                    <motion.div key="ideas" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Chọn ý tưởng</h2>
                            <button onClick={handleGenerateIdeas} disabled={isLoading} className="btn-secondary text-sm flex items-center gap-2">
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Tạo lại
                            </button>
                        </div>

                        {ideas.map((idea) => {
                            const isSelected = selectedIdea?.id === idea.id
                            return (
                                <div
                                    key={idea.id}
                                    onClick={() => setSelectedIdea(idea)}
                                    className={`relative p-5 rounded-xl cursor-pointer transition-all duration-200 ${isSelected
                                        ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-2 border-[var(--accent-primary)] shadow-lg shadow-purple-500/10'
                                        : 'glass-card hover:bg-[var(--bg-hover)] border-2 border-transparent hover:border-[var(--border-subtle)]'
                                        }`}
                                >
                                    {/* Selected indicator */}
                                    {isSelected && (
                                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                    <div className="flex items-start justify-between mb-2 pr-8">
                                        <h3 className={`font-semibold text-lg ${isSelected ? 'text-white' : ''}`}>{idea.title}</h3>
                                        <span className="tag">{idea.suggestedScenes} cảnh</span>
                                    </div>
                                    <p className="text-[var(--text-secondary)] mb-3">{idea.synopsis}</p>

                                    {idea.tone && (
                                        <p className="text-sm text-[var(--text-muted)]">
                                            <span className="font-medium">Tone:</span> {idea.tone}
                                        </p>
                                    )}
                                </div>
                            )
                        })}

                        <div className="flex justify-between mt-6">
                            <button onClick={() => setStep('genre')} className="btn-secondary flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Quay lại
                            </button>
                            <button
                                onClick={() => {
                                    if (selectedIdea) {
                                        setSceneCount(selectedIdea.suggestedScenes || 10)
                                        setStep('characters')
                                    }
                                }}
                                disabled={!selectedIdea}
                                className="btn-primary flex items-center gap-2"
                            >
                                Tiếp tục <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 4: Characters */}
                {step === 'characters' && (
                    <motion.div key="characters" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Users className="w-6 h-6 text-[var(--accent-primary)]" />
                                <div>
                                    <h2 className="text-xl font-semibold">Character Bible</h2>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {suggestedCharCount > 0 ? `AI đề xuất ${suggestedCharCount} nhân vật` : 'Mô tả chi tiết để giữ đồng bộ'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleGenerateCharacters}
                                disabled={isGeneratingChars}
                                className="btn-secondary flex items-center gap-2"
                            >
                                {isGeneratingChars ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                                AI Tạo nhân vật
                            </button>
                        </div>

                        {characters.length === 0 ? (
                            <div className="text-center py-8 bg-[var(--bg-primary)] rounded-lg">
                                <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                                <p className="text-[var(--text-secondary)] mb-4">Chưa có nhân vật nào</p>
                                <div className="flex gap-2 justify-center">
                                    <button onClick={handleGenerateCharacters} disabled={isGeneratingChars} className="btn-primary">
                                        {isGeneratingChars ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bot className="w-4 h-4 mr-2" />}
                                        AI Đề xuất & Tạo
                                    </button>
                                    <button onClick={addCharacter} className="btn-secondary">+ Thêm thủ công</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {characters.map((char, index) => (
                                    <div key={index} className="p-4 bg-[var(--bg-primary)] rounded-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium flex items-center gap-2">
                                                {char.role === 'protagonist' && '⭐'} Nhân vật {index + 1}
                                                {char.role && <span className="tag text-xs">{char.role}</span>}
                                            </span>
                                            <button onClick={() => removeCharacter(index)} className="text-red-400 text-sm hover:underline">
                                                Xóa
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                value={char.name || ''}
                                                onChange={(e) => updateCharacter(index, 'name', e.target.value)}
                                                placeholder="Tên nhân vật"
                                                className="input-field"
                                            />
                                            <select
                                                value={char.role || 'supporting'}
                                                onChange={(e) => updateCharacter(index, 'role', e.target.value)}
                                                className="input-field"
                                            >
                                                <option value="protagonist">Nhân vật chính</option>
                                                <option value="antagonist">Phản diện</option>
                                                <option value="supporting">Phụ</option>
                                                <option value="extra">Background</option>
                                            </select>
                                        </div>
                                        <textarea
                                            value={char.fullDescription || ''}
                                            onChange={(e) => updateCharacter(index, 'fullDescription', e.target.value)}
                                            placeholder="Mô tả đầy đủ 1 câu để copy-paste vào prompt (tuổi, ngoại hình, trang phục, đặc điểm...)"
                                            className="input-field min-h-[80px]"
                                        />
                                    </div>
                                ))}
                                <button onClick={addCharacter} className="btn-secondary w-full">+ Thêm nhân vật</button>
                            </div>
                        )}

                        <div className="flex justify-between mt-6">
                            <button onClick={() => setStep('ideas')} className="btn-secondary flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Quay lại
                            </button>
                            <button onClick={() => setStep('story')} className="btn-primary flex items-center gap-2">
                                Tiếp tục <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 5: Story */}
                {step === 'story' && (
                    <motion.div key="story" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <FileText className="w-6 h-6 text-[var(--accent-primary)]" />
                            <div>
                                <h2 className="text-xl font-semibold">Cấu hình Video</h2>
                                <p className="text-sm text-[var(--text-secondary)]">Tùy chỉnh trước khi tạo</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Tên dự án</label>
                                <input
                                    value={projectTitle || selectedIdea?.title || ''}
                                    onChange={(e) => setProjectTitle(e.target.value)}
                                    placeholder="Tên phim/video"
                                    className="input-field"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Số lượng cảnh</label>
                                    <input
                                        type="number"
                                        min={5}
                                        max={200}
                                        value={sceneCount}
                                        onChange={(e) => setSceneCount(parseInt(e.target.value) || 10)}
                                        className="input-field"
                                    />
                                    <p className="text-xs text-[var(--text-muted)] mt-1">
                                        ~{Math.round(sceneCount * 8 / 60)} phút video
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Thời lượng mỗi cảnh</label>
                                    <select className="input-field">
                                        <option value="8">8 giây (Khuyến nghị)</option>
                                        <option value="5">5 giây</option>
                                        <option value="10">10 giây</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium">Mô tả chi tiết (tùy chọn)</label>
                                    <button
                                        onClick={handleExpandDescription}
                                        disabled={isExpandingDesc || (!storyOutline && !userDescription)}
                                        className="text-sm text-[var(--accent-primary)] flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {isExpandingDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                        AI mở rộng
                                    </button>
                                </div>
                                <textarea
                                    value={storyOutline || userDescription}
                                    onChange={(e) => setStoryOutline(e.target.value)}
                                    placeholder="Mô tả diễn biến câu chuyện (tùy chọn, AI sẽ tự sáng tạo nếu để trống)"
                                    className="input-field min-h-[120px]"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between mt-6">
                            <button onClick={() => setStep('characters')} className="btn-secondary flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Quay lại
                            </button>
                            <button onClick={handleCreateProject} disabled={isLoading || !projectTitle} className="btn-primary flex items-center gap-2">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                                Tạo {sceneCount} cảnh
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Generating */}
                {step === 'generating' && (
                    <motion.div key="generating" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">Đang tạo dự án...</h2>
                        <p className="text-[var(--text-secondary)]">Đang tạo {sceneCount} cảnh video</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
