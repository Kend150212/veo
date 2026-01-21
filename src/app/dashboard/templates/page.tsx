'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    Search,
    Filter,
    Film,
    ShoppingBag,
    Trees,
    Rocket,
    Heart,
    Ghost,
    Music,
    Layers
} from 'lucide-react'

const categories = [
    { id: 'all', label: 'Tất cả', icon: Layers },
    { id: 'cinematic', label: 'Điện ảnh', icon: Film },
    { id: 'product', label: 'Sản phẩm', icon: ShoppingBag },
    { id: 'nature', label: 'Thiên nhiên', icon: Trees },
    { id: 'scifi', label: 'Sci-Fi', icon: Rocket },
    { id: 'romance', label: 'Lãng mạn', icon: Heart },
    { id: 'horror', label: 'Kinh dị', icon: Ghost },
    { id: 'music', label: 'Music Video', icon: Music },
]

const templates = [
    {
        id: '1',
        name: 'Film Noir Detective',
        nameVi: 'Thám tử Film Noir',
        description: 'Classic noir style with dramatic lighting',
        descriptionVi: 'Phong cách noir cổ điển với ánh sáng kịch tính',
        category: 'cinematic',
        structure: {
            subject: 'A seasoned detective in his 50s with a weathered face, wearing a rumpled trench coat and fedora hat',
            action: 'slowly lighting a cigarette while leaning against a brick wall, eyes scanning the rain-soaked street',
            scene: 'A dimly lit alley in a 1940s metropolis at midnight, wet cobblestones reflecting neon signs',
            camera: 'Low-angle static shot, shallow depth of field, shot on 35mm film',
            style: 'Film noir aesthetic, high contrast black and white with subtle lighting',
            lighting: 'Harsh chiaroscuro from a single street lamp, rain catching the light',
            mood: 'Mysterious, melancholic, tense',
            audio: 'Ambient: heavy rain, distant jazz music from a nearby club',
            negative: 'blurry, color, modern elements, cartoon, bright lighting'
        }
    },
    {
        id: '2',
        name: 'Luxury Product Showcase',
        nameVi: 'Giới thiệu sản phẩm cao cấp',
        description: 'Apple-style minimal product video',
        descriptionVi: 'Video sản phẩm tối giản phong cách Apple',
        category: 'product',
        structure: {
            subject: 'A sleek matte black wireless headphone with rose gold accents and premium leather earcups',
            action: 'rotating slowly on an invisible axis, light catching the metallic details',
            scene: 'Clean white cyclorama background with soft gradient, professional studio setup',
            camera: '360-degree orbit shot, smooth continuous motion, macro close-ups',
            style: 'High-end commercial photography, Apple-inspired minimalism',
            lighting: 'Soft studio lighting from multiple angles, subtle rim light highlighting edges',
            mood: 'Premium, aspirational, sophisticated',
            audio: 'Subtle ambient music, soft sound design',
            negative: 'dust, scratches, harsh shadows, cluttered background, cheap look'
        }
    },
    {
        id: '3',
        name: 'Nature Documentary',
        nameVi: 'Phim tài liệu thiên nhiên',
        description: 'BBC-style wildlife footage',
        descriptionVi: 'Phong cách BBC về động vật hoang dã',
        category: 'nature',
        structure: {
            subject: 'A majestic Bengal tiger with distinctive orange and black stripes, muscular build, alert golden eyes',
            action: 'prowling silently through tall grass, muscles rippling beneath fur, ears rotating to catch sounds',
            scene: 'Indian jungle at sunset, golden light filtering through dense canopy, steam rising from forest floor',
            camera: 'Low-angle tracking shot, telephoto lens creating background compression',
            style: 'BBC Nature Documentary, photorealistic, cinematic color grading',
            lighting: 'Dramatic golden hour backlighting, rim light on fur',
            mood: 'Intense, primal, awe-inspiring',
            audio: 'Ambient: jungle sounds, bird calls, insects. SFX: soft footsteps on leaves',
            negative: 'zoo setting, fences, humans, cartoon style, grainy'
        }
    },
    {
        id: '4',
        name: 'Sci-Fi Action Sequence',
        nameVi: 'Cảnh hành động Sci-Fi',
        description: 'Futuristic action scene',
        descriptionVi: 'Cảnh hành động tương lai',
        category: 'scifi',
        structure: {
            subject: 'A female cyborg soldier with half-mechanical face, glowing blue cybernetic eye, short silver hair, tactical black exosuit',
            action: 'sprinting through a corridor, firing plasma pistol behind, dodging debris and sparks',
            scene: 'Collapsing space station interior, red emergency lights, floating debris, hull breaches showing stars',
            camera: 'Dynamic handheld tracking shot, occasional whip pans, wide-angle lens distortion',
            style: 'Blade Runner meets Aliens aesthetic, high contrast, cyan and orange color grading',
            lighting: 'Harsh red emergency lighting mixed with blue holographic displays',
            mood: 'Urgent, intense, high-octane action',
            audio: '"Get to the escape pods!" SFX: explosions, plasma fire, alarms',
            negative: 'static camera, calm atmosphere, cartoon style, flickering, distorted anatomy'
        }
    },
    {
        id: '5',
        name: 'Romantic Paris Scene',
        nameVi: 'Cảnh lãng mạn Paris',
        description: 'Classic French romance',
        descriptionVi: 'Lãng mạn kiểu Pháp cổ điển',
        category: 'romance',
        structure: {
            subject: 'A couple in their 30s - woman with curly auburn hair in cream sweater, man with stubble and warm brown eyes in gray coat',
            action: 'gentle embrace, foreheads touching, soft smiles exchanged, eyes closed peacefully',
            scene: 'Rainy Paris street at evening, wet cobblestones reflecting warm cafe lights, Eiffel Tower visible in distance',
            camera: 'Slow 180-degree arc around the couple, medium shot, shallow depth of field with soft bokeh',
            style: 'French romantic cinema, warm color grading, filmic grain, soft focus edges',
            lighting: 'Warm golden light from street lamps and cafe windows, rain catching light',
            mood: 'Tender, intimate, nostalgic, warm',
            audio: 'Ambient: gentle rain, distant accordion music. Whispered: "I\'ve been waiting for this moment."',
            negative: 'harsh lighting, cold colors, crowds, modern cars'
        }
    },
    {
        id: '6',
        name: 'Horror Basement Scene',
        nameVi: 'Cảnh kinh dị tầng hầm',
        description: 'Classic horror atmosphere',
        descriptionVi: 'Không khí kinh dị cổ điển',
        category: 'horror',
        structure: {
            subject: 'A young woman in her 20s with disheveled dark hair, pale skin, torn white nightgown, expression of terror',
            action: 'backing slowly into a corner, hand reaching for the wall, breathing heavily, eyes fixed on something approaching',
            scene: 'Decrepit Victorian basement, crumbling brick walls, single flickering bare lightbulb, rusted chains hanging',
            camera: 'Slow push-in on face, dutch angle creating unease, shallow depth of field, slight camera shake',
            style: 'Classic horror cinema, desaturated color palette, high contrast, The Conjuring influence',
            lighting: 'Single harsh overhead light with deep shadows, occasional flicker, darkness from edges',
            mood: 'Terrifying, claustrophobic, dread-inducing',
            audio: 'Heavy breathing, creaking floorboards above, water dripping. Distant inhuman whisper',
            negative: 'bright lighting, cheerful atmosphere, gore, jump scare effects'
        }
    }
]

export default function TemplatesPage() {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.nameVi.toLowerCase().includes(search.toLowerCase()) ||
            template.descriptionVi.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const handleUseTemplate = (template: typeof templates[0]) => {
        // Store template in sessionStorage and redirect to builder
        sessionStorage.setItem('pendingTemplate', JSON.stringify(template.structure))
        router.push('/dashboard/builder')
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Mẫu Prompt</h1>
                <p className="text-[var(--text-secondary)]">Chọn template và tùy chỉnh theo ý bạn</p>
            </div>

            {/* Search and filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm template..."
                        className="input-field pl-11"
                    />
                </div>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${selectedCategory === cat.id
                                ? 'bg-[var(--accent-primary)] text-white'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                            }
            `}
                    >
                        <cat.icon className="w-4 h-4" />
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Templates grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template, index) => (
                    <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card overflow-hidden group"
                    >
                        {/* Preview header */}
                        <div className="h-32 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 p-4 flex items-end">
                            <div className="bg-[var(--bg-primary)]/80 backdrop-blur-sm rounded-lg px-3 py-1 text-xs">
                                {categories.find(c => c.id === template.category)?.label}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <h3 className="font-semibold mb-1">{template.nameVi}</h3>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">
                                {template.descriptionVi}
                            </p>

                            <button
                                onClick={() => handleUseTemplate(template)}
                                className="btn-primary w-full text-sm"
                            >
                                Sử dụng mẫu này
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-[var(--text-muted)]">
                    Không tìm thấy template phù hợp
                </div>
            )}
        </div>
    )
}
