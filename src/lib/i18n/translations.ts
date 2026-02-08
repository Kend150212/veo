export type Language = 'en' | 'vi' | 'es'

export const translations = {
    en: {
        // Header
        nav: {
            howItWorks: 'How It Works',
            features: 'Features',
            pricing: 'Pricing',
            login: 'Login',
            getStarted: 'Get Started Free',
        },
        // Hero
        hero: {
            badge: '#1 Tool for Google Veo, Runway, Pika',
            title: 'AI Video Scripts',
            titleHighlight: 'Fully Automated',
            subtitle: 'AI analyzes your channel → Auto-generates scripts with 5-100+ scenes, emotional pacing, and complete YouTube Strategy.',
            description: 'No manual input. Batch create episodes. Each with title, description, tags + 3 thumbnail prompts ready.',
            cta: 'Create Your First Video Free',
            ctaSecondary: 'See How It Works',
        },
        // Stats
        stats: {
            prompts: 'Prompts Created',
            scenes: 'Scenes per Video',
            styles: 'Visual Styles',
            batch: 'Batch Episodes',
        },
        // Problems
        problems: {
            title: 'No More Headaches With',
            titleHighlight: 'Video Production',
            items: [
                { problem: 'Writing scripts from scratch', solution: 'AI analyzes your channel & generates automatically' },
                { problem: 'Inconsistent emotional pacing', solution: 'Smart emotion adjustment throughout the story' },
                { problem: 'Creating videos one by one', solution: 'Batch create 10, 50, 100 episodes at once' },
            ],
        },
        // Workflow
        workflow: {
            title: 'What You Get From',
            titleHighlight: 'Each Episode',
            description: 'AI analyzes your channel niche, creates scripts tailored to your audience, with everything ready to produce',
            steps: [
                { title: 'Complete Script', desc: 'Auto-generated from channel analysis or URL input' },
                { title: '5-100+ Scene Prompts', desc: 'With smart emotional pacing & camera directions' },
                { title: 'YouTube Strategy', desc: 'Title, description, tags optimized for your niche' },
                { title: '3 Thumbnail Prompts', desc: 'Ready to generate eye-catching thumbnails' },
            ],
            result: 'Copy prompts → Paste into Veo/Runway/Pika → Render video instantly',
            cta: 'Try Now - Free',
        },
        // Styles
        styles: {
            title: '20+ Visual Styles',
            titleHighlight: 'Pre-Optimized',
            description: "Each style has its own prompt templates, ensuring consistent and professional results. No prompt writing skills needed.",
        },
        // Features
        features: {
            title: 'All The Features You Need',
            description: 'From auto-generation to channel management and batch production',
            items: [
                {
                    title: 'Smart Channel Analysis',
                    description: 'AI analyzes your channel niche, audience, and style. Generate scripts without any manual input - just click and go.',
                    highlight: 'Zero input required',
                },
                {
                    title: 'URL-to-Script',
                    description: 'Paste any article/blog URL and AI transforms it into a complete video script with scenes and prompts.',
                    highlight: 'Works with any content',
                },
                {
                    title: 'Batch Episode Creation',
                    description: 'Create 10, 50, or 100 episodes at once. Each with unique script, scenes, and full YouTube strategy.',
                    highlight: 'Scale content fast',
                },
                {
                    title: '5-100+ Scenes',
                    description: 'Generate from 5 to 100+ scenes per video. AI adjusts emotional pacing throughout the story arc.',
                    highlight: 'Smart emotion control',
                },
                {
                    title: 'Complete YouTube Package',
                    description: 'Each episode includes SEO title, description, tags, and 3 thumbnail prompts ready to generate.',
                    highlight: '3 thumbnails included',
                },
                {
                    title: 'Multi-Channel Management',
                    description: 'Manage unlimited channels with separate branding, characters, and tone. Perfect for agencies.',
                    highlight: 'Agency-ready',
                },
            ],
        },
        // Pricing
        pricing: {
            title: 'Transparent Pricing',
            description: 'Start free, upgrade when needed',
            monthly: 'Monthly',
            yearly: 'Yearly',
            mostPopular: 'Most Popular',
            free: 'Free',
            perMonth: '/month',
            channels: 'channels',
            unlimited: 'Unlimited',
            episodes: 'episodes/month',
            apiCalls: 'API calls',
            prioritySupport: 'Priority support',
            startFree: 'Start Free',
            choosePlan: 'Choose This Plan',
        },
        // CTA
        cta: {
            title: 'Ready to Automate Video Production?',
            description: 'Create professional video scripts automatically. Free, no credit card required.',
            button: 'Create Your First Video',
        },
        // Footer
        footer: {
            tagline: '#1 tool for automated AI video script generation.',
            product: 'Product',
            support: 'Support',
            contact: 'Contact',
            apiDocs: 'API Documentation',
            rights: 'All rights reserved.',
            compatible: 'Compatible: Veo, Runway, Pika, Kling',
        },
        // Style names
        styleNames: {
            cinematic: 'Cinematic',
            anime: 'Anime',
            pixar3d: 'Pixar 3D',
            watercolor: 'Watercolor',
            documentary: 'Documentary',
            comicBook: 'Comic Book',
        },
        styleDescs: {
            cinematic: 'Hollywood cinema style',
            anime: 'Japanese animation',
            pixar3d: 'Premium 3D animation',
            watercolor: 'Watercolor art',
            documentary: 'Authentic documentary',
            comicBook: 'Vibrant comic book',
        },
    },

    vi: {
        // Header
        nav: {
            howItWorks: 'Cách hoạt động',
            features: 'Tính năng',
            pricing: 'Bảng giá',
            login: 'Đăng nhập',
            getStarted: 'Dùng thử miễn phí',
        },
        // Hero
        hero: {
            badge: 'Công cụ #1 cho Google Veo, Runway, Pika',
            title: 'Tạo Kịch Bản Video',
            titleHighlight: 'Tự Động Hoàn Toàn',
            subtitle: 'AI phân tích kênh của bạn → Tự động tạo kịch bản với 5-100+ cảnh, điều chỉnh cảm xúc, và chiến lược YouTube hoàn chỉnh.',
            description: 'Không cần nhập thủ công. Tạo episodes hàng loạt. Mỗi episode có title, description, tags + 3 thumbnail prompts.',
            cta: 'Tạo video đầu tiên miễn phí',
            ctaSecondary: 'Xem cách hoạt động',
        },
        // Stats
        stats: {
            prompts: 'Prompts đã tạo',
            scenes: 'Cảnh mỗi video',
            styles: 'Visual Styles',
            batch: 'Tạo hàng loạt',
        },
        // Problems
        problems: {
            title: 'Không Còn Đau Đầu Với',
            titleHighlight: 'Sản Xuất Video',
            items: [
                { problem: 'Viết kịch bản từ đầu', solution: 'AI phân tích kênh & tự động tạo kịch bản' },
                { problem: 'Cảm xúc câu chuyện không nhất quán', solution: 'Tự động điều chỉnh cảm xúc theo story arc' },
                { problem: 'Tạo video từng cái một', solution: 'Tạo hàng loạt 10, 50, 100 episodes cùng lúc' },
            ],
        },
        // Workflow
        workflow: {
            title: 'Mỗi Episode',
            titleHighlight: 'Bạn Nhận Được',
            description: 'AI phân tích niche kênh, tạo kịch bản phù hợp với audience, với mọi thứ sẵn sàng sản xuất',
            steps: [
                { title: 'Kịch bản hoàn chỉnh', desc: 'Tự động từ phân tích kênh hoặc nhập URL' },
                { title: '5-100+ Scene Prompts', desc: 'Với điều chỉnh cảm xúc & camera directions' },
                { title: 'YouTube Strategy', desc: 'Title, description, tags tối ưu cho niche' },
                { title: '3 Thumbnail Prompts', desc: 'Sẵn sàng tạo thumbnails thu hút click' },
            ],
            result: 'Copy prompts → Paste vào Veo/Runway/Pika → Render video ngay',
            cta: 'Thử ngay - Miễn phí',
        },
        // Styles
        styles: {
            title: '20+ Visual Styles',
            titleHighlight: 'Đã Tối Ưu Sẵn',
            description: 'Mỗi style có template prompts riêng, đảm bảo kết quả nhất quán và chuyên nghiệp. Không cần biết viết prompt.',
        },
        // Features
        features: {
            title: 'Tất Cả Tính Năng Bạn Cần',
            description: 'Từ tự động tạo đến quản lý kênh và sản xuất hàng loạt',
            items: [
                {
                    title: 'Phân tích kênh thông minh',
                    description: 'AI phân tích niche, audience, và style kênh. Tạo kịch bản không cần nhập gì - chỉ click và làm.',
                    highlight: 'Không cần nhập liệu',
                },
                {
                    title: 'URL thành kịch bản',
                    description: 'Paste link bài viết/blog và AI chuyển đổi thành kịch bản video hoàn chỉnh với scenes và prompts.',
                    highlight: 'Hoạt động với mọi nội dung',
                },
                {
                    title: 'Tạo Episode hàng loạt',
                    description: 'Tạo 10, 50, hoặc 100 episodes cùng lúc. Mỗi episode có kịch bản riêng, scenes, và YouTube strategy.',
                    highlight: 'Scale nhanh chóng',
                },
                {
                    title: '5-100+ Cảnh',
                    description: 'Tạo từ 5 đến 100+ cảnh mỗi video. AI điều chỉnh cảm xúc theo diễn biến câu chuyện.',
                    highlight: 'Điều khiển cảm xúc',
                },
                {
                    title: 'Gói YouTube hoàn chỉnh',
                    description: 'Mỗi episode bao gồm SEO title, description, tags, và 3 thumbnail prompts sẵn sàng tạo.',
                    highlight: '3 thumbnails đi kèm',
                },
                {
                    title: 'Quản lý đa kênh',
                    description: 'Quản lý không giới hạn kênh với branding, characters, và tone riêng. Hoàn hảo cho agencies.',
                    highlight: 'Agency-ready',
                },
            ],
        },
        // Pricing
        pricing: {
            title: 'Bảng Giá Minh Bạch',
            description: 'Bắt đầu miễn phí, nâng cấp khi cần',
            monthly: 'Hàng tháng',
            yearly: 'Hàng năm',
            mostPopular: 'Phổ biến nhất',
            free: 'Miễn phí',
            perMonth: '/tháng',
            channels: 'kênh',
            unlimited: 'Không giới hạn',
            episodes: 'episodes/tháng',
            apiCalls: 'API calls',
            prioritySupport: 'Hỗ trợ ưu tiên',
            startFree: 'Bắt đầu miễn phí',
            choosePlan: 'Chọn gói này',
        },
        // CTA
        cta: {
            title: 'Sẵn Sàng Tự Động Hóa Sản Xuất Video?',
            description: 'Tạo kịch bản video chuyên nghiệp tự động. Miễn phí, không cần thẻ tín dụng.',
            button: 'Tạo Video Đầu Tiên',
        },
        // Footer
        footer: {
            tagline: 'Công cụ #1 tự động tạo kịch bản video AI.',
            product: 'Sản phẩm',
            support: 'Hỗ trợ',
            contact: 'Liên hệ',
            apiDocs: 'API Documentation',
            rights: 'All rights reserved.',
            compatible: 'Compatible: Veo, Runway, Pika, Kling',
        },
        // Style names
        styleNames: {
            cinematic: 'Cinematic',
            anime: 'Anime',
            pixar3d: 'Pixar 3D',
            watercolor: 'Watercolor',
            documentary: 'Documentary',
            comicBook: 'Comic Book',
        },
        styleDescs: {
            cinematic: 'Phong cách điện ảnh Hollywood',
            anime: 'Hoạt hình Nhật Bản',
            pixar3d: 'Hoạt hình 3D cao cấp',
            watercolor: 'Nghệ thuật màu nước',
            documentary: 'Phim tài liệu chân thực',
            comicBook: 'Truyện tranh sống động',
        },
    },

    es: {
        // Header
        nav: {
            howItWorks: 'Cómo Funciona',
            features: 'Características',
            pricing: 'Precios',
            login: 'Iniciar Sesión',
            getStarted: 'Comenzar Gratis',
        },
        // Hero
        hero: {
            badge: 'Herramienta #1 para Google Veo, Runway, Pika',
            title: 'Guiones de Video IA',
            titleHighlight: 'Totalmente Automatizados',
            subtitle: 'La IA analiza tu canal → Auto-genera guiones con 5-100+ escenas, ritmo emocional, y estrategia completa de YouTube.',
            description: 'Sin entrada manual. Crea episodios en lote. Cada uno con título, descripción, etiquetas + 3 prompts de miniatura.',
            cta: 'Crea tu primer video gratis',
            ctaSecondary: 'Ver cómo funciona',
        },
        // Stats
        stats: {
            prompts: 'Prompts Creados',
            scenes: 'Escenas por Video',
            styles: 'Estilos Visuales',
            batch: 'Episodios en Lote',
        },
        // Problems
        problems: {
            title: 'Sin Más Dolores de Cabeza Con',
            titleHighlight: 'Producción de Videos',
            items: [
                { problem: 'Escribir guiones desde cero', solution: 'IA analiza tu canal y genera automáticamente' },
                { problem: 'Ritmo emocional inconsistente', solution: 'Ajuste inteligente de emociones en toda la historia' },
                { problem: 'Crear videos uno por uno', solution: 'Crear 10, 50, 100 episodios a la vez' },
            ],
        },
        // Workflow
        workflow: {
            title: 'Lo Que Obtienes De',
            titleHighlight: 'Cada Episodio',
            description: 'La IA analiza el nicho de tu canal, crea guiones adaptados a tu audiencia, con todo listo para producir',
            steps: [
                { title: 'Guión Completo', desc: 'Auto-generado desde análisis de canal o entrada de URL' },
                { title: '5-100+ Prompts de Escena', desc: 'Con ritmo emocional inteligente y direcciones de cámara' },
                { title: 'Estrategia YouTube', desc: 'Título, descripción, etiquetas optimizadas para tu nicho' },
                { title: '3 Prompts de Miniatura', desc: 'Listos para generar miniaturas atractivas' },
            ],
            result: 'Copia prompts → Pega en Veo/Runway/Pika → Renderiza video al instante',
            cta: 'Prueba Ahora - Gratis',
        },
        // Styles
        styles: {
            title: '20+ Estilos Visuales',
            titleHighlight: 'Pre-Optimizados',
            description: 'Cada estilo tiene sus propias plantillas de prompts, garantizando resultados consistentes y profesionales.',
        },
        // Features
        features: {
            title: 'Todas Las Características Que Necesitas',
            description: 'Desde auto-generación hasta gestión de canales y producción en lote',
            items: [
                {
                    title: 'Análisis Inteligente de Canal',
                    description: 'La IA analiza el nicho, audiencia, y estilo de tu canal. Genera guiones sin entrada manual - solo click.',
                    highlight: 'Entrada cero requerida',
                },
                {
                    title: 'URL a Guión',
                    description: 'Pega cualquier URL de artículo/blog y la IA lo transforma en guión completo con escenas y prompts.',
                    highlight: 'Funciona con cualquier contenido',
                },
                {
                    title: 'Creación de Episodios en Lote',
                    description: 'Crea 10, 50, o 100 episodios a la vez. Cada uno con guión único, escenas, y estrategia YouTube.',
                    highlight: 'Escala contenido rápido',
                },
                {
                    title: '5-100+ Escenas',
                    description: 'Genera de 5 a 100+ escenas por video. La IA ajusta el ritmo emocional del arco narrativo.',
                    highlight: 'Control de emociones inteligente',
                },
                {
                    title: 'Paquete YouTube Completo',
                    description: 'Cada episodio incluye título SEO, descripción, etiquetas, y 3 prompts de miniatura listos.',
                    highlight: '3 miniaturas incluidas',
                },
                {
                    title: 'Gestión Multi-Canal',
                    description: 'Gestiona canales ilimitados con branding, personajes, y tono separados. Perfecto para agencias.',
                    highlight: 'Listo para agencias',
                },
            ],
        },
        // Pricing
        pricing: {
            title: 'Precios Transparentes',
            description: 'Comienza gratis, mejora cuando lo necesites',
            monthly: 'Mensual',
            yearly: 'Anual',
            mostPopular: 'Más Popular',
            free: 'Gratis',
            perMonth: '/mes',
            channels: 'canales',
            unlimited: 'Ilimitado',
            episodes: 'episodios/mes',
            apiCalls: 'llamadas API',
            prioritySupport: 'Soporte prioritario',
            startFree: 'Comenzar Gratis',
            choosePlan: 'Elegir Este Plan',
        },
        // CTA
        cta: {
            title: '¿Listo para Automatizar la Producción de Videos?',
            description: 'Crea guiones de video profesionales automáticamente. Gratis, sin tarjeta de crédito.',
            button: 'Crea Tu Primer Video',
        },
        // Footer
        footer: {
            tagline: 'Herramienta #1 para generación automática de guiones de video con IA.',
            product: 'Producto',
            support: 'Soporte',
            contact: 'Contacto',
            apiDocs: 'Documentación API',
            rights: 'Todos los derechos reservados.',
            compatible: 'Compatible: Veo, Runway, Pika, Kling',
        },
        // Style names
        styleNames: {
            cinematic: 'Cinematográfico',
            anime: 'Anime',
            pixar3d: 'Pixar 3D',
            watercolor: 'Acuarela',
            documentary: 'Documental',
            comicBook: 'Cómic',
        },
        styleDescs: {
            cinematic: 'Estilo cine de Hollywood',
            anime: 'Animación japonesa',
            pixar3d: 'Animación 3D premium',
            watercolor: 'Arte en acuarela',
            documentary: 'Documental auténtico',
            comicBook: 'Cómic vibrante',
        },
    },
}

export type Translations = typeof translations.en
