import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    const adminName = process.env.ADMIN_NAME || 'Administrator'

    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password: hashedPassword,
            name: adminName,
            role: 'admin'
        }
    })

    console.log(`✅ Admin user created: ${admin.email}`)

    // Create default templates
    const templates = [
        {
            name: 'Film Noir Detective',
            nameVi: 'Thám tử Film Noir',
            description: 'Classic noir style with dramatic lighting',
            descriptionVi: 'Phong cách noir cổ điển với ánh sáng kịch tính',
            category: 'cinematic',
            structure: JSON.stringify({
                subject: 'A seasoned detective in his 50s with a weathered face, wearing a rumpled trench coat and fedora hat',
                action: 'slowly lighting a cigarette while leaning against a brick wall, eyes scanning the rain-soaked street',
                scene: 'A dimly lit alley in a 1940s metropolis at midnight, wet cobblestones reflecting neon signs',
                camera: 'Low-angle static shot, shallow depth of field, shot on 35mm film',
                style: 'Film noir aesthetic, high contrast black and white with subtle lighting',
                lighting: 'Harsh chiaroscuro from a single street lamp, rain catching the light',
                mood: 'Mysterious, melancholic, tense',
                audio: 'Ambient: heavy rain, distant jazz music from a nearby club',
                negative: 'blurry, color, modern elements, cartoon, bright lighting'
            }),
            isPublic: true
        },
        {
            name: 'Luxury Product Showcase',
            nameVi: 'Giới thiệu sản phẩm cao cấp',
            description: 'Apple-style minimal product video',
            descriptionVi: 'Video sản phẩm tối giản phong cách Apple',
            category: 'product',
            structure: JSON.stringify({
                subject: 'A sleek matte black wireless headphone with rose gold accents and premium leather earcups',
                action: 'rotating slowly on an invisible axis, light catching the metallic details',
                scene: 'Clean white cyclorama background with soft gradient, professional studio setup',
                camera: '360-degree orbit shot, smooth continuous motion, macro close-ups',
                style: 'High-end commercial photography, Apple-inspired minimalism',
                lighting: 'Soft studio lighting from multiple angles, subtle rim light highlighting edges',
                mood: 'Premium, aspirational, sophisticated',
                audio: 'Subtle ambient music, soft sound design',
                negative: 'dust, scratches, harsh shadows, cluttered background, cheap look'
            }),
            isPublic: true
        },
        {
            name: 'Nature Documentary',
            nameVi: 'Phim tài liệu thiên nhiên',
            description: 'BBC-style wildlife footage',
            descriptionVi: 'Phong cách BBC về động vật hoang dã',
            category: 'nature',
            structure: JSON.stringify({
                subject: 'A majestic Bengal tiger with distinctive orange and black stripes, muscular build, alert golden eyes',
                action: 'prowling silently through tall grass, muscles rippling beneath fur, ears rotating to catch sounds',
                scene: 'Indian jungle at sunset, golden light filtering through dense canopy, steam rising from forest floor',
                camera: 'Low-angle tracking shot, telephoto lens creating background compression',
                style: 'BBC Nature Documentary, photorealistic, cinematic color grading',
                lighting: 'Dramatic golden hour backlighting, rim light on fur',
                mood: 'Intense, primal, awe-inspiring',
                audio: 'Ambient: jungle sounds, bird calls, insects. SFX: soft footsteps on leaves',
                negative: 'zoo setting, fences, humans, cartoon style, grainy'
            }),
            isPublic: true
        },
        {
            name: 'Sci-Fi Action Sequence',
            nameVi: 'Cảnh hành động Sci-Fi',
            description: 'Futuristic action scene',
            descriptionVi: 'Cảnh hành động tương lai',
            category: 'scifi',
            structure: JSON.stringify({
                subject: 'A female cyborg soldier with half-mechanical face, glowing blue cybernetic eye, short silver hair, tactical black exosuit',
                action: 'sprinting through a corridor, firing plasma pistol behind, dodging debris and sparks',
                scene: 'Collapsing space station interior, red emergency lights, floating debris, hull breaches showing stars',
                camera: 'Dynamic handheld tracking shot, occasional whip pans, wide-angle lens distortion',
                style: 'Blade Runner meets Aliens aesthetic, high contrast, cyan and orange color grading',
                lighting: 'Harsh red emergency lighting mixed with blue holographic displays',
                mood: 'Urgent, intense, high-octane action',
                audio: '"Get to the escape pods!" SFX: explosions, plasma fire, alarms',
                negative: 'static camera, calm atmosphere, cartoon style, flickering, distorted anatomy'
            }),
            isPublic: true
        },
        {
            name: 'Romantic Paris Scene',
            nameVi: 'Cảnh lãng mạn Paris',
            description: 'Classic French romance',
            descriptionVi: 'Lãng mạn kiểu Pháp cổ điển',
            category: 'romance',
            structure: JSON.stringify({
                subject: 'A couple in their 30s - woman with curly auburn hair in cream sweater, man with stubble and warm brown eyes in gray coat',
                action: 'gentle embrace, foreheads touching, soft smiles exchanged, eyes closed peacefully',
                scene: 'Rainy Paris street at evening, wet cobblestones reflecting warm cafe lights, Eiffel Tower visible in distance',
                camera: 'Slow 180-degree arc around the couple, medium shot, shallow depth of field with soft bokeh',
                style: 'French romantic cinema, warm color grading, filmic grain, soft focus edges',
                lighting: 'Warm golden light from street lamps and cafe windows, rain catching light',
                mood: 'Tender, intimate, nostalgic, warm',
                audio: 'Ambient: gentle rain, distant accordion music. Whispered: "I\'ve been waiting for this moment."',
                negative: 'harsh lighting, cold colors, crowds, modern cars'
            }),
            isPublic: true
        },
        {
            name: 'Horror Basement Scene',
            nameVi: 'Cảnh kinh dị tầng hầm',
            description: 'Classic horror atmosphere',
            descriptionVi: 'Không khí kinh dị cổ điển',
            category: 'horror',
            structure: JSON.stringify({
                subject: 'A young woman in her 20s with disheveled dark hair, pale skin, torn white nightgown, expression of terror',
                action: 'backing slowly into a corner, hand reaching for the wall, breathing heavily, eyes fixed on something approaching',
                scene: 'Decrepit Victorian basement, crumbling brick walls, single flickering bare lightbulb, rusted chains hanging',
                camera: 'Slow push-in on face, dutch angle creating unease, shallow depth of field, slight camera shake',
                style: 'Classic horror cinema, desaturated color palette, high contrast, The Conjuring influence',
                lighting: 'Single harsh overhead light with deep shadows, occasional flicker, darkness from edges',
                mood: 'Terrifying, claustrophobic, dread-inducing',
                audio: 'Heavy breathing, creaking floorboards above, water dripping. Distant inhuman whisper',
                negative: 'bright lighting, cheerful atmosphere, gore, jump scare effects'
            }),
            isPublic: true
        }
    ]

    for (const template of templates) {
        await prisma.template.upsert({
            where: { id: template.name.toLowerCase().replace(/\s+/g, '-') },
            update: template,
            create: {
                id: template.name.toLowerCase().replace(/\s+/g, '-'),
                ...template
            }
        })
    }

    console.log(`✅ ${templates.length} templates created`)
    console.log('🎉 Seeding completed!')
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
