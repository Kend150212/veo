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
    category: 'illustration' | 'cartoon' | 'realistic' | 'artistic' | 'minimalist' | 'edutainment' | 'fashion'
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
        previewImage: 'https://cdn1.sharemyimage.com/smi/2026/02/01/af191a95b879.jpg',
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
        previewImage: 'https://cdn1.sharemyimage.com/smi/2026/02/01/77710ee71523.jpg',
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
        previewImage: 'https://cdn1.sharemyimage.com/smi/2026/02/01/8d34437860d3.jpg',
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
        previewImage: 'https://cdn1.sharemyimage.com/smi/2026/02/01/87ac51e034f0.jpg',
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
        previewImage: 'https://cdn1.sharemyimage.com/smi/2026/02/01/36cdd1ddc241.jpg',
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
        previewImage: 'https://cdn1.sharemyimage.com/smi/2026/02/01/fb89c2a7f8cb.jpg',
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
        previewImage: 'https://cdn1.sharemyimage.com/smi/2026/02/01/5b12fdd8b726.jpg',
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
        previewImage: 'https://cdn1.sharemyimage.com/smi/2026/02/01/6a1ef8fa9911.jpg',
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
        previewImage: 'https://cdn1.sharemyimage.com/smi/2026/02/01/2c06fe1091c6.jpg',
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
    {
        id: 'historical-3d-illustrated',
        name: 'Historical 3D Illustrated',
        nameVi: 'Tái Hiện Lịch Sử 3D Có Nét Vẽ',
        description: '3D animation with outline strokes for historical events like moon landing',
        descriptionVi: 'Hoạt hình 3D có nét vẽ cho các sự kiện lịch sử như đặt chân lên mặt trăng',
        promptKeywords: '3D animation with outline strokes, cel-shaded 3D, toon shading, historical documentary 3D style, NASA moon landing recreation, Apollo 11 style, 3D rendered with hand-drawn outlines, stylized 3D historical events, 3D toon rendering with black outlines, illustrated 3D documentary, photorealistic 3D with artistic strokes, historical reenactment 3D animation, 3D with sketchy line art overlay, cinematic 3D with outline edges, documentary 3D with illustrated style, 3D characters with bold outlines, historical moments 3D visualization',
        hasCharacters: true,
        suggestedCharCount: 2,
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
        previewImage: 'https://cdn1.sharemyimage.com/smi/2026/02/01/6cfa6889152a.jpg',
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
    {
        id: 'health-warning-hybrid',
        name: 'Health Warning Hybrid',
        nameVi: 'Cảnh Báo Sức Khỏe Kết Hợp',
        description: 'Live-action person combined with 3D animated virus/monster for health awareness videos',
        descriptionVi: 'Người thật kết hợp với virus/quái vật 3D hoạt hình cho video cảnh báo sức khỏe',
        promptKeywords: 'live-action person, realistic human subject, 3D animated virus monster, glowing green slimy creature, health warning video style, photorealistic human combined with stylized 3D animation, sick person in bed, threatening 3D animated character, mixed media health awareness, realistic lighting on live subject, 3D creature with glowing eyes, mucus and slime effects, dramatic health awareness cinematography, person suffering with animated threat, photorealistic bedroom scene with 3D monster overlay',
        hasCharacters: true,
        suggestedCharCount: 1,
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
        previewImage: 'https://cdn1.sharemyimage.com/smi/2026/02/01/05004a3af9cd.jpg',
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
        previewImage: 'https://cdn1.sharemyimage.com/smi/2026/02/01/0f93a4755044.jpg',
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
        previewImage: 'https://cdn1.sharemyimage.com/smi/2026/02/01/5f726b946d43.jpg',
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
    },

    // === EDUTAINMENT CATEGORY (Educational + Entertainment) ===
    {
        id: 'edutainment-hybrid',
        name: 'Edutainment Hybrid',
        nameVi: 'Giáo Dục Giải Trí',
        description: 'Live-action host combined with 3D animated bio-world (like Kurzgesagt + TED-Ed)',
        descriptionVi: 'Kết hợp host thực tế với thế giới 3D hoạt hình (như Kurzgesagt + TED-Ed)',
        promptKeywords: 'edutainment hybrid style, live-action human host combined with 3D animated characters, biological visualization, educational science animation, cinematic lighting for live footage, colorful 3D bio-world, medical animation, stylized 3D internal body scenes, Kurzgesagt style',
        hasCharacters: true,
        suggestedCharCount: 2,
        category: 'edutainment'
    },
    {
        id: 'kurzgesagt',
        name: 'Kurzgesagt Style',
        nameVi: 'Phong Cách Kurzgesagt',
        description: 'Flat colorful geometric animation for science/education',
        descriptionVi: 'Hoạt hình hình học phẳng đầy màu sắc cho khoa học/giáo dục',
        promptKeywords: 'kurzgesagt style, flat design animation, colorful geometric shapes, educational science visualization, bright saturated colors, simple but detailed, consistent character design, cosmic backgrounds',
        hasCharacters: true,
        suggestedCharCount: 2,
        category: 'edutainment'
    },
    {
        id: 'ted-ed',
        name: 'TED-Ed Animation',
        nameVi: 'Hoạt Hình TED-Ed',
        description: 'Educational animation with mixed media approach',
        descriptionVi: 'Hoạt hình giáo dục kết hợp nhiều phương tiện',
        promptKeywords: 'TED-Ed animation style, educational illustration, mixed media, animated infographics, storytelling visuals, conceptual visualization, engaging lecture style',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'edutainment'
    },
    {
        id: 'medical-3d',
        name: 'Medical 3D Animation',
        nameVi: 'Hoạt Hình Y Khoa 3D',
        description: '3D visualization of biological/medical processes',
        descriptionVi: 'Hình ảnh 3D về các quá trình sinh học/y khoa',
        promptKeywords: 'medical 3D animation, biological visualization, cellular animation, anatomical illustration, internal body journey, microscopic world, organ systems, stylized medical graphics, educational anatomy',
        hasCharacters: false,
        suggestedCharCount: 0,
        category: 'edutainment'
    },

    // === FASHION / SOCIAL MEDIA CATEGORY ===
    {
        id: 'iphone-realistic',
        name: 'iPhone Camera Realistic',
        nameVi: 'Quay bằng iPhone thực tế',
        description: 'Realistic smartphone camera look like real TikTok/Reels',
        descriptionVi: 'Phong cách quay điện thoại thực tế như TikTok/Reels thật',
        promptKeywords: 'iPhone camera quality, smartphone selfie, vertical 9:16 format, natural handheld feel, TikTok style, realistic lighting, front camera look, casual authentic feel, social media content',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'fashion'
    },
    {
        id: 'fashion-influencer',
        name: 'Fashion Influencer',
        nameVi: 'Influencer Thời Trang',
        description: 'Polished influencer aesthetic with ring light',
        descriptionVi: 'Phong cách influencer chỉn chu với ring light',
        promptKeywords: 'fashion influencer aesthetic, ring light illumination, perfect selfie lighting, beauty influencer style, polished social media content, high quality smartphone camera, vertical format',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'fashion'
    },
    {
        id: 'mirror-selfie',
        name: 'Mirror Selfie OOTD',
        nameVi: 'Gương Selfie OOTD',
        description: 'Classic mirror selfie outfit-of-the-day style',
        descriptionVi: 'Phong cách selfie gương show outfit cổ điển',
        promptKeywords: 'mirror selfie, full body mirror, OOTD style, smartphone visible in reflection, outfit of the day, fashion blogger, casual authentic, vertical format 9:16',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'fashion'
    },
    {
        id: 'aesthetic-lifestyle',
        name: 'Aesthetic Lifestyle',
        nameVi: 'Lifestyle Thẩm Mỹ',
        description: 'Soft aesthetic with natural light and muted tones',
        descriptionVi: 'Phong cách thẩm mỹ mềm mại với ánh sáng tự nhiên',
        promptKeywords: 'aesthetic lifestyle, soft natural lighting, muted color palette, cozy bedroom vibes, lifestyle photography, warm tones, instagram aesthetic, vertical 9:16',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'fashion'
    },
    {
        id: 'streetwear-urban',
        name: 'Streetwear Urban',
        nameVi: 'Streetwear Đường Phố',
        description: 'Urban street style with city backdrop',
        descriptionVi: 'Phong cách đường phố với backdrop thành phố',
        promptKeywords: 'streetwear fashion, urban backdrop, city street, graffiti walls, street style photography, edgy fashion, outdoor natural light, vertical format',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'fashion'
    },
    {
        id: 'studio-ecommerce',
        name: 'Studio E-commerce',
        nameVi: 'Studio Bán Hàng',
        description: 'Clean professional product showcase',
        descriptionVi: 'Trình bày sản phẩm chuyên nghiệp sạch sẽ',
        promptKeywords: 'e-commerce photography, clean white background, professional product shot, studio lighting, commercial fashion photography, clear product focus, vertical format',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'fashion'
    },
    {
        id: 'korean-soft',
        name: 'Korean Soft Aesthetic',
        nameVi: 'Thẩm Mỹ Hàn Quốc',
        description: 'Soft Korean beauty/fashion aesthetic',
        descriptionVi: 'Phong cách thẩm mỹ Hàn Quốc mềm mại',
        promptKeywords: 'korean aesthetic, soft lighting, minimal background, clean beauty style, kbeauty fashion, pastel tones, gentle feminine look, vertical 9:16',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'fashion'
    },
    {
        id: 'tiktok-viral',
        name: 'TikTok Viral Style',
        nameVi: 'Style TikTok Viral',
        description: 'High energy TikTok viral content style',
        descriptionVi: 'Phong cách TikTok viral năng lượng cao',
        promptKeywords: 'TikTok viral style, dynamic camera angles, trendy transitions, gen-z aesthetic, smartphone vertical video, energetic poses, outfit reveal, fast-paced content',
        hasCharacters: true,
        suggestedCharCount: 1,
        category: 'fashion'
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
    { id: 'minimalist', name: 'Tối giản', nameEn: 'Minimalist' },
    { id: 'fashion', name: 'Thời trang / Social', nameEn: 'Fashion / Social' }
]

// Fashion Background Options
export const FASHION_BACKGROUNDS = [
    {
        id: 'fitting_room',
        name: 'Phòng thử đồ',
        nameEn: 'Fitting Room',
        promptKeywords: 'clothing store fitting room, multiple mirrors, warm lighting, hanging clothes rack visible, retail boutique interior'
    },
    {
        id: 'bedroom_lifestyle',
        name: 'Phòng ngủ lifestyle',
        nameEn: 'Bedroom Lifestyle',
        promptKeywords: 'cozy bedroom interior, aesthetic room decor, natural window light, minimal furniture, lifestyle photography backdrop'
    },
    {
        id: 'closet_wardrobe',
        name: 'Tủ quần áo',
        nameEn: 'Walk-in Closet',
        promptKeywords: 'walk-in closet, organized wardrobe, hanging clothes, shoe shelves, fashion influencer aesthetic'
    },
    {
        id: 'studio_white',
        name: 'Studio trắng',
        nameEn: 'White Studio',
        promptKeywords: 'white photo studio background, professional lighting, clean minimalist backdrop, fashion photography studio'
    },
    {
        id: 'studio_ring_light',
        name: 'Studio ring light',
        nameEn: 'Ring Light Studio',
        promptKeywords: 'ring light studio setup, beauty influencer lighting, soft even illumination, content creator room'
    },
    {
        id: 'cafe_outdoor',
        name: 'Quán café / Outdoor',
        nameEn: 'Cafe / Outdoor',
        promptKeywords: 'aesthetic cafe interior, outdoor street style, urban background, lifestyle location, natural daylight'
    },
    {
        id: 'mirror_selfie',
        name: 'Gương selfie',
        nameEn: 'Mirror Selfie',
        promptKeywords: 'full body mirror, mirror selfie style, smartphone visible in reflection, bathroom or bedroom mirror, OOTD photo'
    },
    {
        id: 'custom',
        name: 'Tùy chỉnh (nhập text)',
        nameEn: 'Custom',
        promptKeywords: ''
    }
]
