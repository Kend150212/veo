// Channel Visual Styles Library
// Styles cho YouTube Channels với preview images và prompt keywords

export interface ChannelStyle {
    id: string
    name: string
    nameVi: string
    description: string
    descriptionVi: string
    promptKeywords: string
    hasCharacters: boolean  // Style có hỗ trợ nhân vật không
    suggestedCharCount: number  // Số nhân vật AI đề xuất
    previewImage?: string  // Path to preview image
    category: 'illustration' | 'cartoon' | 'realistic' | 'artistic' | 'minimalist'
}

// Comprehensive list of styles - AI determined variety
export const CHANNEL_STYLES: ChannelStyle[] = [
    // === ILLUSTRATION CATEGORY ===
    {
        id: 'doodle',
        name: 'Doodle Art',
        nameVi: 'Nét Vẽ Tay',
        description: 'Hand-drawn sketchy style with simple lines',
        descriptionVi: 'Phong cách vẽ tay nguệch ngoạc đơn giản',
        promptKeywords: 'doodle art style, hand-drawn sketch, simple line art, whiteboard animation style, black ink drawings on white background',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'illustration'
    },
    {
        id: 'digital-illustration',
        name: 'Digital Illustration',
        nameVi: 'Minh Họa Số',
        description: 'Professional digital artwork with clean vectors',
        descriptionVi: 'Minh họa số chuyên nghiệp với nét vẽ sắc nét',
        promptKeywords: 'digital illustration, professional artwork, clean vector art, vibrant colors, modern illustration style',
        hasCharacters: true,
        suggestedCharCount: 2,
        category: 'illustration'
    },
    {
        id: 'infographic',
        name: 'Infographic',
        nameVi: 'Đồ Họa Thông Tin',
        description: 'Data visualization with icons and charts',
        descriptionVi: 'Trình bày dữ liệu với biểu tượng và biểu đồ',
        promptKeywords: 'infographic style, data visualization, flat design icons, charts and graphs, clean modern layout',
        hasCharacters: false,
        suggestedCharCount: 0,
        category: 'illustration'
    },
    {
        id: 'storybook',
        name: 'Storybook Illustration',
        nameVi: 'Minh Họa Truyện',
        description: 'Warm, inviting children\'s book illustration',
        descriptionVi: 'Minh họa ấm áp như sách truyện thiếu nhi',
        promptKeywords: 'storybook illustration, warm colors, soft lighting, childrens book art style, whimsical characters',
        hasCharacters: true,
        suggestedCharCount: 2,
        category: 'illustration'
    },

    // === CARTOON CATEGORY ===
    {
        id: 'cartoon-2d',
        name: '2D Cartoon',
        nameVi: 'Hoạt Hình 2D',
        description: 'Classic 2D animation style like Disney',
        descriptionVi: 'Hoạt hình 2D cổ điển phong cách Disney',
        promptKeywords: '2D cartoon animation, Disney style, expressive characters, vibrant cel shading, dynamic poses',
        hasCharacters: true,
        suggestedCharCount: 2,
        category: 'cartoon'
    },
    {
        id: 'anime',
        name: 'Anime',
        nameVi: 'Anime Nhật Bản',
        description: 'Japanese animation style with expressive eyes',
        descriptionVi: 'Phong cách anime Nhật với đôi mắt biểu cảm',
        promptKeywords: 'anime style, Japanese animation, large expressive eyes, detailed hair, vibrant colors, manga inspired',
        hasCharacters: true,
        suggestedCharCount: 2,
        category: 'cartoon'
    },
    {
        id: 'chibi',
        name: 'Chibi / Cute',
        nameVi: 'Chibi Dễ Thương',
        description: 'Adorable characters with big heads and small bodies',
        descriptionVi: 'Nhân vật dễ thương đầu to mình nhỏ',
        promptKeywords: 'chibi style, kawaii, cute characters, big head small body, adorable expressions, pastel colors',
        hasCharacters: true,
        suggestedCharCount: 2,
        category: 'cartoon'
    },
    {
        id: 'pixar-3d',
        name: 'Pixar 3D',
        nameVi: 'Hoạt Hình 3D Pixar',
        description: '3D animation style like Pixar/Disney movies',
        descriptionVi: 'Hoạt hình 3D phong cách phim Pixar/Disney',
        promptKeywords: 'Pixar 3D animation style, CGI render, expressive characters, cinematic lighting, detailed textures',
        hasCharacters: true,
        suggestedCharCount: 2,
        category: 'cartoon'
    },
    {
        id: 'jellytoon',
        name: 'Jellytoon 3D',
        nameVi: 'Jellytoon 3D',
        description: 'Soft, bouncy 3D characters with jelly-like quality',
        descriptionVi: 'Nhân vật 3D mềm mại như thạch',
        promptKeywords: 'jellytoon 3D style, soft bouncy characters, subsurface scattering, cute 3D render, clay-like texture',
        hasCharacters: true,
        suggestedCharCount: 2,
        category: 'cartoon'
    },
    {
        id: 'comic-book',
        name: 'Comic Book',
        nameVi: 'Truyện Tranh',
        description: 'Bold lines and halftone dots like Marvel/DC',
        descriptionVi: 'Nét đậm và họa tiết chấm như Marvel/DC',
        promptKeywords: 'comic book style, bold outlines, halftone dots, superhero comic, dynamic action poses, speech bubbles',
        hasCharacters: true,
        suggestedCharCount: 2,
        category: 'cartoon'
    },
    {
        id: 'south-park',
        name: 'Cutout Animation',
        nameVi: 'Hoạt Hình Cắt Dán',
        description: 'Simple cutout style like South Park',
        descriptionVi: 'Phong cách cắt dán đơn giản như South Park',
        promptKeywords: 'cutout animation style, paper cutout, simple geometric shapes, flat colors, minimal details',
        hasCharacters: true,
        suggestedCharCount: 3,
        category: 'cartoon'
    },

    // === REALISTIC CATEGORY ===
    {
        id: 'cinematic',
        name: 'Cinematic',
        nameVi: 'Điện Ảnh',
        description: 'Movie-quality realistic visuals',
        descriptionVi: 'Hình ảnh thực tế chất lượng điện ảnh',
        promptKeywords: 'cinematic, photorealistic, film grain, 35mm, movie quality, dramatic lighting, shallow depth of field',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'realistic'
    },
    {
        id: 'documentary',
        name: 'Documentary',
        nameVi: 'Phim Tài Liệu',
        description: 'Natural, authentic documentary footage style',
        descriptionVi: 'Phong cách phim tài liệu tự nhiên',
        promptKeywords: 'documentary style, natural lighting, authentic, handheld camera feel, real-world footage look',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'realistic'
    },
    {
        id: 'stock-footage',
        name: 'Stock Footage',
        nameVi: 'Footage Hình Ảnh',
        description: 'Clean, commercial stock video style',
        descriptionVi: 'Phong cách video stock sạch sẽ',
        promptKeywords: 'stock footage style, clean commercial look, professional video, neutral lighting, corporate aesthetic',
        hasCharacters: false,
        suggestedCharCount: 0,
        category: 'realistic'
    },
    {
        id: 'nature-doc',
        name: 'Nature Documentary',
        nameVi: 'Thiên Nhiên Hoang Dã',
        description: 'BBC Earth / National Geographic style',
        descriptionVi: 'Phong cách BBC Earth / National Geographic',
        promptKeywords: 'nature documentary, BBC Earth style, wildlife cinematography, 4K ultra HD, macro nature shots',
        hasCharacters: false,
        suggestedCharCount: 0,
        category: 'realistic'
    },

    // === ARTISTIC CATEGORY ===
    {
        id: 'watercolor',
        name: 'Watercolor',
        nameVi: 'Màu Nước',
        description: 'Soft watercolor painting aesthetic',
        descriptionVi: 'Mỹ thuật tranh màu nước mềm mại',
        promptKeywords: 'watercolor painting, soft edges, transparent layers, wet on wet technique, artistic brush strokes',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'artistic'
    },
    {
        id: 'oil-painting',
        name: 'Oil Painting',
        nameVi: 'Sơn Dầu',
        description: 'Classic oil painting with rich textures',
        descriptionVi: 'Tranh sơn dầu cổ điển với texture phong phú',
        promptKeywords: 'oil painting, rich textures, visible brush strokes, classical art style, museum quality',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'artistic'
    },
    {
        id: 'pop-art',
        name: 'Pop Art',
        nameVi: 'Nghệ Thuật Pop',
        description: 'Bold Andy Warhol / Roy Lichtenstein style',
        descriptionVi: 'Phong cách đậm Andy Warhol / Roy Lichtenstein',
        promptKeywords: 'pop art, bold primary colors, Ben-Day dots, Andy Warhol style, high contrast, graphic design',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'artistic'
    },
    {
        id: 'retro-vintage',
        name: 'Retro Vintage',
        nameVi: 'Cổ Điển Retro',
        description: '70s/80s vintage aesthetic',
        descriptionVi: 'Mỹ thuật cổ điển thập niên 70/80',
        promptKeywords: 'retro vintage, 70s 80s aesthetic, faded colors, film grain, nostalgic, old photograph look',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'artistic'
    },
    {
        id: 'neon-cyberpunk',
        name: 'Neon Cyberpunk',
        nameVi: 'Neon Cyberpunk',
        description: 'Futuristic neon-lit sci-fi aesthetic',
        descriptionVi: 'Mỹ thuật sci-fi neon tương lai',
        promptKeywords: 'cyberpunk aesthetic, neon lights, futuristic cityscape, rain-slicked streets, high-tech low-life, synthwave',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'artistic'
    },
    {
        id: 'vaporwave',
        name: 'Vaporwave',
        nameVi: 'Vaporwave',
        description: '90s internet aesthetic with pink and cyan',
        descriptionVi: 'Mỹ thuật internet 90s với hồng và cyan',
        promptKeywords: 'vaporwave aesthetic, pink and cyan, retro computer graphics, glitch effects, 90s nostalgia, synthwave',
        hasCharacters: false,
        suggestedCharCount: 0,
        category: 'artistic'
    },

    // === MINIMALIST CATEGORY ===
    {
        id: 'flat-design',
        name: 'Flat Design',
        nameVi: 'Thiết Kế Phẳng',
        description: 'Modern flat design with solid colors',
        descriptionVi: 'Thiết kế phẳng hiện đại màu đơn sắc',
        promptKeywords: 'flat design, solid colors, no gradients, geometric shapes, minimal shadows, clean modern',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'minimalist'
    },
    {
        id: 'line-art',
        name: 'Line Art',
        nameVi: 'Nghệ Thuật Nét',
        description: 'Pure line drawings with minimal color',
        descriptionVi: 'Tranh chỉ có nét vẽ với ít màu sắc',
        promptKeywords: 'line art, continuous line drawing, black lines on white, minimal color accents, elegant simplicity',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'minimalist'
    },
    {
        id: 'abstract',
        name: 'Abstract',
        nameVi: 'Trừu Tượng',
        description: 'Non-representational abstract shapes',
        descriptionVi: 'Hình dạng trừu tượng không mô phỏng thực tế',
        promptKeywords: 'abstract art, geometric shapes, non-representational, color blocks, conceptual visualization',
        hasCharacters: false,
        suggestedCharCount: 0,
        category: 'minimalist'
    },
    {
        id: 'silhouette',
        name: 'Silhouette',
        nameVi: 'Bóng Đen',
        description: 'High contrast silhouettes and shadows',
        descriptionVi: 'Bóng đen tương phản cao',
        promptKeywords: 'silhouette art, high contrast, black shadows, dramatic backlighting, stark minimalism',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'minimalist'
    },
    {
        id: 'isometric',
        name: 'Isometric 3D',
        nameVi: 'Isometric 3D',
        description: '3D isometric view illustration',
        descriptionVi: 'Minh họa góc nhìn isometric 3D',
        promptKeywords: 'isometric 3D, 30 degree angle, architectural illustration, clean geometric, no perspective distortion',
        hasCharacters: false,
        suggestedCharCount: 0,
        category: 'minimalist'
    },
    {
        id: 'paper-craft',
        name: 'Paper Craft',
        nameVi: 'Thủ Công Giấy',
        description: '3D paper craft cutout layers',
        descriptionVi: 'Thủ công cắt giấy 3D nhiều lớp',
        promptKeywords: 'paper craft art, layered paper cutouts, 3D depth, soft shadows, handmade aesthetic',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'minimalist'
    }
]

// Get styles by category
export function getStylesByCategory(category: string): ChannelStyle[] {
    if (category === 'all') return CHANNEL_STYLES
    return CHANNEL_STYLES.filter(s => s.category === category)
}

// Get styles that support characters
export function getCharacterStyles(): ChannelStyle[] {
    return CHANNEL_STYLES.filter(s => s.hasCharacters)
}

// Get styles without characters (for educational/documentary content)
export function getNonCharacterStyles(): ChannelStyle[] {
    return CHANNEL_STYLES.filter(s => !s.hasCharacters)
}

// Get style by ID
export function getStyleById(id: string): ChannelStyle | undefined {
    return CHANNEL_STYLES.find(s => s.id === id)
}

// Style categories for UI
export const STYLE_CATEGORIES = [
    { id: 'all', name: 'Tất cả', nameEn: 'All' },
    { id: 'illustration', name: 'Minh họa', nameEn: 'Illustration' },
    { id: 'cartoon', name: 'Hoạt hình', nameEn: 'Cartoon' },
    { id: 'realistic', name: 'Thực tế', nameEn: 'Realistic' },
    { id: 'artistic', name: 'Nghệ thuật', nameEn: 'Artistic' },
    { id: 'minimalist', name: 'Tối giản', nameEn: 'Minimalist' }
]
