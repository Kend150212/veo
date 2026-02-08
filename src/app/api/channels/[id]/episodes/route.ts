import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAIConfigFromSettings } from '@/lib/ai-config'
import { generateText } from '@/lib/ai-story'
import { prisma } from '@/lib/prisma'
import { getStyleById } from '@/lib/channel-styles'

interface SceneData {
    order: number
    title?: string
    promptText?: string
    dialogue?: string
    voiceover?: string
    duration?: number
    hookType?: string
}

interface EpisodeData {
    title: string
    synopsis: string
    storyOutline: string
    topicIdea: string
    scenes: SceneData[]
    // YouTube Strategies
    youtubeStrategies?: {
        titles: string[]
        description: string
        tags: string[]
        thumbnails: string[]
    }
}

// POST: Generate a new episode with AI-created content
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const {
            totalScenes = 10,
            useCharacters = true,
            selectedCharacterIds = [],
            adaptCharactersToScript = false, // AI tự điều chỉnh nhân vật theo kịch bản
            selectedStyleId = null,
            mentionChannel = false,
            ctaMode = 'random',
            selectedCTAs = [],
            customContent = null,
            voiceOverMode = 'with_host',
            cinematicStyle = null, // Cinematic film style (cinematic_documentary, psychological_drama, etc.)
            voiceGender = 'auto',
            voiceTone = 'warm',
            categoryId = null,
            // Advanced Episode Features
            visualHookEnabled = true,
            emotionalCurveEnabled = true,
            spatialAudioEnabled = true,
            musicMode = 'with_music', // 'with_music' | 'ambient_only'
            dialogueDensityMin = 12,
            dialogueDensityMax = 18,
            // Native Ad Insertion
            adEnabled = false,
            productInfo = null,
            productImageUrl = null,
            productLink = null,
            analyzedProduct = null,
            selectedAdStyles = [],
            adSceneCount = 2,
            // Storyteller B-Roll option
            storytellerBrollEnabled = false,
            // Narrative Storytelling options
            narrativeTemplateId = null,
            narrativeKeyPoints = [],
            narrativeWithHost = false
        } = await req.json()

        // CTA options
        const CTA_MAP: Record<string, string> = {
            subscribe: 'Subscribe to the channel',
            like: 'Like this video',
            comment: 'Leave a comment',
            share: 'Share with friends',
            bell: 'Turn on notifications',
            watch_more: 'Watch more videos'
        }

        // Get channel with characters AND existing episodes
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id },
            include: {
                characters: true,
                episodes: {
                    select: {
                        episodeNumber: true,
                        title: true,
                        topicIdea: true,
                        synopsis: true
                    },
                    orderBy: { episodeNumber: 'asc' }
                },
                _count: { select: { episodes: true } }
            }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        // Get AI config
        const config = await getAIConfigFromSettings(session.user.id)
        if (!config) {
            return NextResponse.json({ error: 'Chưa cấu hình API key' }, { status: 400 })
        }

        // Get visual style - use selected or channel default
        const styleId = selectedStyleId || channel.visualStyleId
        const visualStyle = styleId ? getStyleById(styleId) : null
        const styleKeywords = visualStyle?.promptKeywords || channel.visualStyleKeywords || 'cinematic, professional'

        // Parse knowledge base
        let knowledgeBase: { episodeIdeas?: { title: string; synopsis: string }[] } = {}
        try {
            knowledgeBase = channel.knowledgeBase ? JSON.parse(channel.knowledgeBase) : {}
        } catch { }

        const nextEpisodeNumber = channel._count.episodes + 1

        // Build character bible based on selection
        let characterBible = ''
        if (useCharacters && channel.characters.length > 0) {
            // Filter characters if specific ones selected
            const charsToUse = selectedCharacterIds.length > 0
                ? channel.characters.filter((c: { id: string }) => selectedCharacterIds.includes(c.id))
                : channel.characters

            if (charsToUse.length > 0) {
                characterBible = `\nCHARACTER BIBLE:\n${charsToUse.map((c: { name: string; role: string; fullDescription: string; personality: string | null }) => {
                    const personalityInfo = c.personality ? ` | TÍNH CÁCH: ${c.personality}` : ''
                    return `[${c.name}] - ${c.role}: ${c.fullDescription}${personalityInfo}`
                }).join('\n')}`
            }
        }

        // Character adaptation instructions
        const characterAdaptInstr = adaptCharactersToScript && characterBible ? `
🎭 AI CHARACTER ADAPTATION MODE (ENABLED):
═══════════════════════════════════════
AI được phép ĐIỀU CHỈNH nhân vật để phù hợp với từng cảnh trong kịch bản.

✅ CÓ THỂ THAY ĐỔI:
- Trang phục: Thay đổi theo bối cảnh (ngủ → pyjama, tiệc → vest/đầm, mưa → áo mưa...)
- Biểu cảm: Vui, buồn, giận, sợ, ngạc nhiên... theo cảm xúc của cảnh
- Tư thế & Hành động: Đứng, ngồi, chạy, ôm, khóc... theo diễn biến
- Phụ kiện: Thêm/bớt theo ngữ cảnh (kính, mũ, túi, vũ khí...)
- Trạng thái: Ướt, bẩn, rách, chảy máu... theo tình huống
- Vị trí: Trong nhà, ngoài trời, xe, văn phòng... theo bối cảnh

❌ KHÔNG ĐƯỢC THAY ĐỔI (giữ nhất quán):
- Đặc điểm nhận dạng: Màu da, màu mắt, chiều cao, tuổi
- Kiểu tóc cơ bản: Màu tóc, độ dài tóc (trừ khi cốt truyện yêu cầu)
- Giọng nói: Giữ nguyên voice tag
- Tính cách cốt lõi: Tính cách cơ bản của nhân vật

🎭 SỬ DỤNG TÍNH CÁCH (PERSONALITY):
- Dialogue phải PHÙ HỢP với tính cách đã định nghĩa
- Hành động, phản ứng, cử chỉ phản ánh tính cách
- VD: Nhân vật "hài hước" → nói đùa, cười nhiều, phản ứng vui vẻ
- VD: Nhân vật "trầm lặng" → ít nói, suy tư, quan sát nhiều
- VD: Nhân vật "nóng tính" → nói nhanh, cử chỉ mạnh, dễ bực bội

📝 FORMAT KHI ĐIỀU CHỈNH:
[TÊN NHÂN VẬT: đặc điểm cố định + ĐIỀU CHỈNH CHO CẢNH NÀY: trang phục/biểu cảm/trạng thái mới]

VÍ DỤ:
- Gốc: "[LINH: 28 tuổi, tóc đen dài, da trắng]"
- Cảnh ngủ: "[LINH: 28 tuổi, tóc đen dài rối, da trắng, mặc pyjama hồng, mắt nhắm, biểu cảm bình yên]"
- Cảnh mưa: "[LINH: 28 tuổi, tóc đen dài ướt sũng, da trắng, áo mưa trong suốt, mắt lo lắng, run rẩy]"
- Cảnh tiệc: "[LINH: 28 tuổi, tóc đen dài búi cao, da trắng, đầm đỏ lộng lẫy, makeup glamorous, tự tin]"
` : (characterBible ? `
🎭 CHARACTER CONSISTENCY MODE (STRICT):
═══════════════════════════════════════
KHÔNG được thay đổi bất kỳ chi tiết nào của nhân vật.
Copy NGUYÊN VĂN mô tả từ CHARACTER BIBLE vào MỌI cảnh.
Trang phục, biểu cảm, phụ kiện phải GIỐNG HỆT nhau trong tất cả các scene.

🎭 SỬ DỤNG TÍNH CÁCH (PERSONALITY):
- Dialogue phải PHÙ HỢP với tính cách đã định nghĩa trong CHARACTER BIBLE
- Hành động, phản ứng, cử chỉ phản ánh tính cách nhân vật
- Giữ nhất quán cách nói, cách phản ứng xuyên suốt
` : '')

        // Existing episodes (avoid duplication)
        const recentEpisodes = channel.episodes.slice(-5)
        const existingEpisodesSummary = recentEpisodes.length > 0
            ? `\n⚠️ DO NOT DUPLICATE: ${recentEpisodes.map((ep: { title: string }) => ep.title).join(', ')}`
            : ''

        // Language
        const dialogueLang = channel.dialogueLanguage || 'vi'
        const dialogueLangLabel = dialogueLang === 'en' ? 'English' : 'Vietnamese'

        console.log('=== EPISODE START ===')
        console.log('Channel:', channel.name, '| Scenes:', totalScenes)
        console.log('Use Characters:', useCharacters, '| Selected:', selectedCharacterIds.length || 'all')
        console.log('Style:', styleId || 'default')
        console.log('Mention Channel:', mentionChannel, '| CTA Mode:', ctaMode)

        // Build channel mention instruction
        const channelMentionInstr = mentionChannel
            ? `IMPORTANT: Naturally mention the channel name "${channel.name}" 1-2 times in the script dialogue (opening or ending).`
            : 'Do NOT mention any channel name in the dialogue.'

        // Build CTA instruction
        let ctaInstruction = ''
        if (ctaMode === 'random') {
            ctaInstruction = 'Include 1-2 natural CTAs (subscribe, like, comment, share) at appropriate moments in the script.'
        } else if (selectedCTAs.length > 0) {
            const ctaTexts = selectedCTAs.map((id: string) => CTA_MAP[id] || id).join(', ')
            ctaInstruction = `Include these specific CTAs naturally in the script: ${ctaTexts}`
        } else {
            ctaInstruction = 'No CTA needed in this episode.'
        }

        // Build custom content instruction
        const customContentInstr = customContent
            ? `\n\n📋 USER PROVIDED CONTENT - CREATE SCRIPT BASED ON THIS:\n"""\n${customContent.substring(0, 3000)}\n"""\nIMPORTANT: The script MUST be based on the above content. Extract key points and create engaging scenes from it.`
            : ''

        // Voice settings mapping
        const voiceGenderLabel = voiceGender === 'male' ? 'Male voice (giọng nam)' : voiceGender === 'female' ? 'Female voice (giọng nữ)' : 'any gender voice'
        const toneMap: Record<string, string> = {
            'auto': 'natural and appropriate for content',
            'warm': 'warm and friendly',
            'professional': 'professional and authoritative',
            'energetic': 'energetic and enthusiastic',
            'calm': 'calm and soothing',
            'serious': 'serious and news-like',
            'dramatic': 'dramatic and theatrical'
        }
        const voiceToneLabel = toneMap[voiceTone] || 'natural and appropriate for content'

        // Voice Consistency Rule - prevent alternating male/female voices
        const voiceConsistencyRule = `
🎙️ VOICE CONSISTENCY RULE (CỰC KỲ QUAN TRỌNG):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${voiceGender === 'male' ? '👨 CỐ ĐỊNH GIỌNG NAM: Toàn bộ video chỉ dùng giọng nam.' :
                voiceGender === 'female' ? '👩 CỐ ĐỊNH GIỌNG NỮ: Toàn bộ video chỉ dùng giọng nữ.' :
                    '🤖 TỰ ĐỘNG: AI chọn 1 giọng phù hợp (NAM hoặc NỮ) rồi GIỮ NGUYÊN xuyên suốt video.'}
- TUYỆT ĐỐI KHÔNG ĐƯỢC xen kẽ giọng nam/nữ giữa các scene
- Tone giọng: ${voiceToneLabel}
- Thêm "VOICE: ${voiceGender === 'male' ? 'Male voice (giọng nam)' : voiceGender === 'female' ? 'Female voice (giọng nữ)' : '[Giọng đã chọn]'}, ${voiceToneLabel}" vào cuối mỗi promptText
`

        // Build voice over mode instruction
        let voiceOverInstr = ''
        if (voiceOverMode === 'with_host') {
            voiceOverInstr = `CONTENT TYPE: With host/character on screen speaking dialogue.
CRITICAL - VOICE GENDER CONSISTENCY:
- Determine host gender from character description (woman/man, female/male, nữ/nam)
- Include "VOICE: Female voice (giọng nữ)" or "VOICE: Male voice (giọng nam)" at the END of EVERY promptText
- ALL scenes MUST use the SAME voice gender matching the host
- If host is female (woman, female, phụ nữ, cô gái): ALWAYS use "VOICE: Female voice (giọng nữ)"
- If host is male (man, male, nam, anh): ALWAYS use "VOICE: Male voice (giọng nam)"`
        } else if (voiceOverMode === 'voice_over') {
            voiceOverInstr = `CONTENT TYPE: VOICE OVER NARRATION (no character on screen).
- Generate narration/script text in the "voiceover" field 
- The "promptText" should describe B-Roll visuals that match the narration
- NO character on screen, only visuals with voice over
- VOICE SETTINGS: ${voiceGenderLabel}, ${voiceToneLabel} tone
- Include "VOICE: ${voiceGenderLabel}, ${voiceToneLabel}" at the end of each promptText`
        } else if (voiceOverMode === 'host_dynamic_env') {
            voiceOverInstr = `CONTENT TYPE: HOST 100% WITH DYNAMIC ENVIRONMENT (Môi trường thay đổi theo nội dung)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎙️ VOICE GENDER CONSISTENCY (CRITICAL):
- Determine host gender from character description
- Include "VOICE: Female voice (giọng nữ)" or "VOICE: Male voice (giọng nam)" at END of EVERY promptText
- ALL scenes MUST use the SAME voice matching the host character
- If host is female: ALWAYS "VOICE: Female voice (giọng nữ)"
- If host is male: ALWAYS "VOICE: Male voice (giọng nam)"

🌍 CRITICAL RULES FOR THIS MODE:
- Host appears in 100% of scenes, ALWAYS visible on screen
- Host is the primary visual focus, speaking directly to camera
- ENVIRONMENT CHANGES dynamically based on what host is talking about
- As host mentions topics, the background/environment transforms to match

🎬 DYNAMIC ENVIRONMENT EXAMPLES:
- Host talks about ocean → Background transforms to underwater scene
- Host mentions history → Environment becomes ancient temple/museum
- Host discusses technology → Room fills with holographic displays, futuristic elements
- Host explains cooking → Kitchen appears around them with ingredients floating

📹 CAMERA & VISUAL STYLE:
- Medium to close-up shots of host throughout
- Smooth transitions as environment morphs behind/around host
- Use particles, light rays, and ambient effects during transitions
- Host remains grounded while world changes around them

🎭 PROMPTTEXT FORMAT:
[Host speaking: "dialogue here"]. Host stands/sits in frame while ENVIRONMENT TRANSFORMS to [describe new environment matching topic]. [Camera movement]. [Transition effects: particle dissolve, light sweep, morphing elements].
Include "VOICE: [matching host gender]" at the end of each promptText`
        } else if (voiceOverMode === 'host_storyteller') {
            const brollModeInstr = storytellerBrollEnabled
                ? `\n🎬 B-ROLL MODE: ENABLED
- Insert B-Roll scenes between host scenes to illustrate story
- Alternate: Host scene → B-Roll illustration → Host scene
- B-Roll shows what host is describing (visuals only, no host)
- Host appears in ~60-70% of scenes, B-Roll fills ~30-40%
- B-Roll scenes: cinematic visuals matching narration with voiceover`
                : `\n🎬 100% HOST MODE: NO B-ROLL
- Host appears on screen in 100% of ALL scenes
- NO pure B-Roll/cutaway scenes without host visible
- Story elements appear AROUND host, never replacing host
- Every single scene MUST show the host character`

            voiceOverInstr = `CONTENT TYPE: HOST STORYTELLER MODE (Kể chuyện sinh động với Elements tương tác)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${brollModeInstr}

🎙️ VOICE GENDER CONSISTENCY (CRITICAL):
- Determine host gender from character description
- Include "VOICE: Female voice (giọng nữ)" or "VOICE: Male voice (giọng nam)" at END of EVERY promptText
- ALL scenes MUST use the SAME voice matching the host character
- If host is female: ALWAYS "VOICE: Female voice (giọng nữ)"
- If host is male: ALWAYS "VOICE: Male voice (giọng nam)"

🎭 CRITICAL RULES FOR STORYTELLER MODE:
- Host sits/stands in a ROOM telling story directly to camera
- Host is ALWAYS the primary focus - face NEVER covered by elements
- STORY ELEMENTS APPEAR in the room based on narration
- Elements CAN INTERACT with host (scare, surprise, touch...)
- Host REACTS naturally to elements (fear, shock, pain, joy...)

🌟 STORY ELEMENTS VISUALIZATION:
When host mentions something in story, it APPEARS in the room:
- 🚀 "Chiếc phi thuyền bay qua..." → Spaceship flies BEHIND host (never covering face)
- 👻 "Con ma xuất hiện..." → Ghost materializes behind/beside host
- 🐉 "Con rồng khổng lồ..." → Dragon head appears from shadows
- 💀 "Xương người rơi xuống..." → Bones scatter around host
- 🔥 "Lửa bùng cháy..." → Flames erupt around room (not on host)
- 🌊 "Sóng dữ ập đến..." → Water rushes past (host stays dry but reacts)

⚠️ CRITICAL: Elements appear BESIDE/BEHIND host, NEVER blocking host's face

🎬 HOST-ELEMENT INTERACTIONS (MUST INCLUDE):
- 😱 SCARE: Ghost suddenly appears behind host → Host JUMPS, screams, looks terrified
- 😰 STARTLE: Loud noise/sudden movement → Host gasps, hand to chest, wide eyes
- 🤕 HURT: Something touches/hits host → Host winces, rubs area, looks pained
- 😨 CHASE: Element moves toward host → Host leans back, tries to escape
- 😮 SURPRISE: Unexpected element appears → Host does double-take, shocked expression
- 🤝 FRIENDLY: Nice element appears → Host smiles, reaches out, interacts warmly
- 😢 SAD: Emotional story moment → Host tears up, voice cracks, looks down

🎭 HOST REACTIONS BY GENRE:
HORROR: Terrified expressions, jumps, screams, covers face, trembles
SCI-FI: Wonder, amazement, reaches toward holograms/ships
COMEDY: Laughs, playful interactions with silly elements
DRAMA: Tears, emotional outbursts, passionate gestures
ACTION: Ducks from explosions, shields face, dramatic reactions

📹 CAMERA & VISUAL STYLE:
- Medium shot: Host centered, room for elements around them
- Quick zoom when element startles host
- Slow orbit during emotional moments
- Dutch angle for unsettling scenes
- Pull back to reveal massive elements behind host

🌈 ATMOSPHERE CHANGES:
- Match lighting to story mood (warm/cold/eerie/bright)
- Fog, particles, light rays enhance elements
- Room colors shift with emotion (red=danger, blue=sad, gold=happy)

🔊 SOUND DESIGN (describe in promptText):
- Element sounds (whoosh, roar, whisper, crash)
- Host reaction sounds (gasp, scream, laugh, cry)
- Ambient mood sounds (wind, heartbeat, music)

🎬 PROMPTTEXT FORMAT:
[Host speaks: "story dialogue"]. [STORY ELEMENT: describe what appears - position relative to host]. [HOST REACTION: physical and emotional response]. [Camera: movement]. [Atmosphere: lighting/fog/color]. [Sound: element + reaction sounds]. 
CRITICAL: Element appears [behind/beside/above] host, face always visible.
Include "VOICE: [matching host gender]" at the end.`
        } else if (voiceOverMode === 'cinematic_film') {
            // Cinematic style specific instructions
            const cinematicStyleMap: Record<string, { name: string, keywords: string, guidance: string }> = {
                'cinematic_documentary': {
                    name: 'Cinematic Documentary (Phim tài liệu điện ảnh)',
                    keywords: 'documentary style, natural lighting, wide establishing shots, smooth dolly movements, orbit camera, epic B-roll, narrator presence, educational yet cinematic',
                    guidance: `📽️ CINEMATIC DOCUMENTARY STYLE:
- Kết hợp Host/Narrator với CGI/B-Roll hoành tráng
- Ánh sáng tự nhiên (Natural Light), mềm mại, chân thực
- Góc quay rộng (Wide Shot) thiết lập không gian
- Camera mượt mà: Dolly, Orbit, Crane shots
- Xen kẽ: Interview/Host → B-Roll minh họa → Infographic/CGI
- Giọng kể chuyện uy tín, truyền cảm
- Phù hợp: Lịch sử, khoa học, khám phá, du lịch`
                },
                'psychological_drama': {
                    name: 'Psychological Drama (Kịch tính tâm lý)',
                    keywords: 'psychological drama, chiaroscuro lighting, dutch angle, extreme close-ups, sweat droplets, eye reflections, internal conflict, moody atmosphere, shadows and highlights',
                    guidance: `🎭 PSYCHOLOGICAL DRAMA STYLE:
- Tập trung vào NỘI TÂM, xung đột bên trong nhân vật
- Ánh sáng Chiaroscuro: tương phản MẠNH giữa sáng và tối
- Dutch Angle (góc nghiêng) tạo cảm giác bất ổn
- Extreme Close-up: mồ hôi, ánh mắt, run rẩy, thở gấp
- Nhịp CHẬM, để khán giả cảm nhận sâu
- Âm thanh: im lặng căng thẳng, nhịp tim, tiếng thở
- Phù hợp: Bi kịch, nội tâm, quyết định khó khăn`
                },
                'sitcom_comedy': {
                    name: 'Sitcom / Narrative Comedy (Hài kịch tình huống)',
                    keywords: 'sitcom style, high-key bright lighting, colorful vibrant scenes, medium shots for character interaction, quick cuts, comedic timing, expressive reactions',
                    guidance: `😂 SITCOM / COMEDY STYLE:
- Nhịp độ NHANH, dialogue liên tục, timing hài hước
- Ánh sáng High-key: rực rỡ, đầy màu sắc, vui tươi
- Medium shots để thấy tương tác giữa các nhân vật
- Quick cuts theo nhịp joke, reaction shots ngay sau punchline
- Biểu cảm PHÓNG ĐẠI, cử chỉ lớn
- Âm thanh: tiếng cười, sound effects hài, nhạc upbeat
- Phù hợp: Series đời thường, tình huống hài Gen Z`
                },
                'horror_thriller': {
                    name: 'Horror / Supernatural Thriller (Kinh dị / Giật gân)',
                    keywords: 'horror atmosphere, low-key lighting, fog and haze effects, deep shadows, unseen threats, spatial audio cues, creaking sounds, jump scare potential, eerie silence',
                    guidance: `👻 HORROR / THRILLER STYLE:
- Tạo sợ hãi bằng những thứ KHÔNG NHÌN RÕ
- Ánh sáng Low-key: mờ ảo, nhiều bóng tối
- Hiệu ứng khói, haze, sương mù
- Camera: slow push-in, sudden zoom, POV victim
- Jump scare: xây dựng tension → silence → BÙM
- Spatial Audio QUAN TRỌNG: tiếng bước chân từ phía sau, thì thầm
- Phù hợp: Tâm linh, truyền thuyết đô thị, bí ẩn`
                },
                'commercial_storytelling': {
                    name: 'High-end Commercial Storytelling (Quảng cáo kể chuyện)',
                    keywords: 'commercial cinematic, product macro shots, clean modern backgrounds, smooth transitions, problem-solution narrative, aspirational lifestyle, premium quality feel',
                    guidance: `✨ COMMERCIAL STORYTELLING STYLE:
- Kể chuyện Problem → Solution một cách NHÂN VĂN
- Product shots: Macro lộng lẫy, ánh sáng hoàn hảo
- Bối cảnh: Sạch sẽ, hiện đại, aspirational
- Chuyển cảnh mượt mà: "Nỗi đau" → "Sự giải thoát"
- Màu sắc: Premium, gold tones, clean whites
- Nhân vật: Real người, relatable story
- Phù hợp: Affiliate marketing, premium branding`
                },
                'bio_cgi_explainer': {
                    name: 'Bio-CGI / Educational Explainer (Diễn họa sinh học)',
                    keywords: 'bio-CGI visualization, neon cyberpunk colors, bioluminescence effects, fly-through camera, microscopic world made epic, DNA strands, neural networks, futuristic technology',
                    guidance: `🧬 BIO-CGI / EXPLAINER STYLE:
- Biến thế giới vi mô thành VŨ TRỤ HOÀNH TRÁNG
- Màu sắc: Neon, Cyberpunk, phát quang sinh học
- Camera: Fly-through xuyên qua DNA, tế bào, não bộ
- Hiệu ứng: Particles, glow, organic movement
- Scale shift: Zoom từ người → tế bào → phân tử
- Âm thanh: Synth electronic, bass sâu, sci-fi ambience
- Phù hợp: Giải thích cơ thể, tâm lý học, công nghệ`
                },
                'food_animation': {
                    name: 'Anthropomorphic Food Animation (Hoạt hình thực phẩm nhân hóa) - VIRAL!',
                    keywords: 'anthropomorphic food characters, 3D Pixar-style animation, vegetables and fruits with human faces and expressions, kitchen environment, bright colorful lighting, cute food characters with emotions, comedic exaggerated reactions, cooking scenes',
                    guidance: `🥕 ANTHROPOMORPHIC FOOD ANIMATION STYLE (SIÊU VIRAL):
═══════════════════════════════════════
Đây là thể loại đang cực kỳ viral trên YouTube/TikTok!

🎨 NHÂN VẬT - THỰC PHẨM NHÂN HÓA:
- Rau củ, trái cây, thực phẩm có KHUÔN MẶT và BIỂU CẢM như người
- Mắt to, biểu cảm PHÓNG ĐẠI (giận dữ, sợ hãi, vui vẻ, ngạc nhiên)
- Có tay chân hoặc không (tùy thiết kế)
- Mỗi loại thực phẩm có TÍNH CÁCH riêng:
  • Ớt: Nóng tính, hay cáu
  • Cà rốt: Năng động, khỏe mạnh
  • Khoai tây: Chậm rãi, hài hước
  • Hành: Hay khóc, nhạy cảm
  • Tỏi: Mạnh mẽ, bảo vệ

🏠 BỐI CẢNH:
- Nhà bếp hiện đại, sáng sủa
- Bàn ăn, tủ lạnh, bếp nấu
- Chợ rau củ, siêu thị
- Vườn rau (origin story)

📸 CAMERA & VISUAL:
- 3D Pixar/DreamWorks quality
- Ánh sáng ấm áp, tươi sáng (high-key)
- Góc quay eye-level với thực phẩm (như nhìn từ góc của chúng)
- Close-up khi biểu cảm quan trọng
- Wide shot khi có nhiều nhân vật

🎭 KỊCH BẢN THƯỜNG GẶP:
1. "Sự thật về [thực phẩm]" - nhân vật kể về bản thân
2. "Battle/Đối đầu" - hai thực phẩm tranh cãi ai tốt hơn
3. "Mẹo nấu ăn" - thực phẩm hướng dẫn cách chế biến
4. "Sợ bị ăn" - drama khi sắp bị nấu
5. "Team up" - nhiều thực phẩm hợp tác

💬 DIALOGUE STYLE:
- Hài hước, đáng yêu
- Puns về thực phẩm ("Tôi đang 'rau' rối quá!")
- Phản ứng exaggerated
- Breaking the 4th wall (nói với khán giả)

🔊 SOUND:
- Nhạc vui tươi, upbeat
- Sound effects hài (boing, splat, whoosh)
- Voice: Cute, energetic`
                },
                'food_drama': {
                    name: 'Food Drama / Food Wars (Kịch tính ẩm thực)',
                    keywords: 'food battle drama, anthropomorphic ingredients fighting, dramatic showdown, energy effects around food, arena-style kitchen, intense expressions, action camera angles, epic food confrontation, slow motion impacts',
                    guidance: `⚔️ FOOD DRAMA / FOOD WARS STYLE:
Thực phẩm nhân hóa trong các tình huống KỊCH TÍNH, ĐỐI ĐẦU!
- Battle, đối đầu, cạnh tranh giữa các thực phẩm
- Dramatic lighting, energy auras, slow motion
- Winner/Loser dynamics rõ ràng`
                },
                'roast_comedy': {
                    name: 'Roast / Provocative Comedy (Hài roast - SIÊU VIRAL)',
                    keywords: 'roast comedy, provocative expressions, smug face, looking down at camera, breaking fourth wall, mocking gestures, sarcastic smile, challenging the viewer, controversial statements, judging expression',
                    guidance: `🔥 ROAST / PROVOCATIVE COMEDY STYLE (CỰC KỲ VIRAL):
═══════════════════════════════════════
Nhân vật ROAST, CHỌC TỨC, THÁCH THỨC khán giả!

⚠️ TẠI SAO VIRAL:
- Gây TRANH CÃI → Comments tăng vọt
- Khán giả muốn "cãi lại" → Engagement cao
- Chia sẻ để tag bạn bè → Viral

🎭 CÁCH ROAST KHÁN GIẢ:
1. "Bạn còn đang xem video này à? Chắc rảnh lắm nhỉ?"
2. "Tôi cá là bạn đang nằm trên giường, lười biếng như mọi khi"
3. "Đừng giả vờ như bạn hiểu, tôi biết bạn không hiểu đâu"
4. "Bạn nghĩ bạn giỏi hơn tôi? Haha, dễ thương ghê"
5. "Comment đi, tôi biết bạn muốn cãi rồi đấy"
6. "Share cho đứa bạn ngu ngu của bạn xem đi"

📸 CAMERA & BIỂU CẢM:
- Close-up mặt với ánh mắt KHINH THƯỜNG
- Nhướng mày, cười đểu, liếc xéo
- Looking DOWN at camera (như nhìn xuống khán giả)
- Slow clap (vỗ tay chậm mỉa mai)
- Eye roll cực kỳ dramatic

💬 DIALOGUE STYLE:
- Sarcastic AF
- Backhanded compliments ("Giỏi đấy... cho một người mới")
- Rhetorical questions ("Bạn không biết thật à?")
- Fake concern ("Ôi tội nghiệp, bạn không hiểu à?")
- Direct challenges ("Cãi đi, tôi đợi")

🎬 SCENES PATTERNS:
1. Bắt đầu nice → slowly reveal attitude
2. Fake helpful → then roast
3. Compliment → take it back
4. "No offense but..." → offense

⚠️ QUAN TRỌNG:
- Roast phải HÀI, không thật sự toxic
- Có thể self-deprecating để balance
- End với wink hoặc "đùa thôi mà"`
                },
                'reaction_commentary': {
                    name: 'Reaction / Commentary (Phản ứng & Bình luận)',
                    keywords: 'reaction faces, split screen layout, picture-in-picture, exaggerated expressions, shocked face, laughing hard, cringing, judging expression, commentary style, watching content',
                    guidance: `😱 REACTION / COMMENTARY STYLE:
- Nhân vật XEM và PHẢN ỨNG với nội dung
- Split screen hoặc Picture-in-Picture layout
- Biểu cảm exaggerated: shocked, laughing, cringing
- Bình luận sắc sảo, opinions mạnh`
                },
                'asmr_satisfying': {
                    name: 'ASMR / Satisfying (Thỏa mãn thị giác)',
                    keywords: 'ASMR sounds, extreme macro close-up, satisfying visuals, slow motion textures, soft ambient lighting, crisp sound effects, relaxing atmosphere, tingles inducing',
                    guidance: `🎧 ASMR / SATISFYING STYLE:
- Extreme close-up, macro shots
- Slow motion textures và movements
- Soft, ambient lighting
- Focus on SOUNDS: crisp, crunchy, sizzling
- Relaxing, meditative atmosphere`
                },
                'horror_survival': {
                    name: 'Horror Survival / Escape (Kinh dị sinh tồn)',
                    keywords: 'horror survival, running away, being chased, scared expressions, dark kitchen at night, knife shadows, escape attempts, near-death experiences, relief and terror, POV victim',
                    guidance: `😱 HORROR SURVIVAL STYLE:
═══════════════════════════════════════
Nhân vật/Thực phẩm cố gắng SỐNG SÓT, THOÁT KHỎI nguy hiểm!

🎬 STORYLINES:
- Thực phẩm sắp bị NẤU → cố gắng trốn
- Nhân vật bị "kẻ xấu" đuổi
- Survival challenges

📸 VISUAL:
- Dark, low-key lighting
- POV từ góc nạn nhân
- Shadows of threats (dao, nồi nước sôi)
- Running/chasing scenes
- Jump scare moments

🎭 EMOTIONS:
- Terror, panic, desperation
- Brief hope → crushed
- Near misses
- Relief when escape (or tragedy when caught)`
                },
                'romance_drama': {
                    name: 'Romance / Love Story (Tình cảm lãng mạn)',
                    keywords: 'romantic atmosphere, loving gazes, warm golden lighting, bokeh hearts, slow motion embraces, emotional tears, relationship drama, confession scenes',
                    guidance: `💕 ROMANCE / LOVE STORY STYLE:
- Warm, golden hour lighting
- Bokeh backgrounds, soft focus
- Eye contact moments, slow motion
- Love confessions, heartbreak, reunion
- Can be sweet OR tragic`
                },
                'gen_z_meme': {
                    name: 'Gen Z Meme Culture (Văn hóa meme Gen Z)',
                    keywords: 'gen z humor, ironic expressions, random zoom effects, chaotic energy, absurdist comedy, meme references, bruh moment face, unhinged behavior, cursed images aesthetic, glitch effects',
                    guidance: `💀 GEN Z MEME CULTURE STYLE:
═══════════════════════════════════════
Humor absurd, ironic, chaotic energy!

🎨 VISUAL CHAOS:
- Random zooms bất ngờ
- Glitch effects, deep fried aesthetic
- Bass boosted moments
- Cursed image energy

💬 LANGUAGE:
- "Bruh", "No cap", "Fr fr", "Slay"
- Skull emoji energy (💀)
- Ironic overreactions
- "It's giving..." statements
- Unserious about everything

🎭 HUMOR TYPE:
- Anti-humor (not funny = funny)
- Absurdist (makes no sense = hilarious)
- Self-deprecating
- Referencing other memes`
                },
                'educational_sassy': {
                    name: 'Educational with Attitude (Giáo dục với thái độ)',
                    keywords: 'sassy teaching, raised eyebrow, disappointed expression, slow condescending clap, eye roll, lecturing pose, pointing at facts, proving idiots wrong, judging ignorance',
                    guidance: `🙄 EDUCATIONAL WITH ATTITUDE STYLE:
═══════════════════════════════════════
Dạy kiến thức nhưng với THÁI ĐỘ sassy!

💅 ATTITUDE:
- "Bạn không biết điều này thật à?"
- "Wow, still believing that myth?"
- "Let me educate you real quick"
- Disappointed parent energy

📸 EXPRESSIONS:
- Raised eyebrow (ngạc nhiên mỉa mai)
- Slow, condescending clap
- Eye roll cực dramatic
- "I can't believe I have to explain this" face
- Sighing heavily

🎬 STRUCTURE:
1. Present common misconception
2. "Ờ thật à?" expression
3. Drop the FACTS
4. Smug satisfaction`
                },
                'mystery_detective': {
                    name: 'Mystery / Detective (Bí ẩn / Thám tử)',
                    keywords: 'detective noir style, magnifying glass, mysterious shadows, clue discovery, evidence board with strings, dramatic reveal lighting, suspenseful atmosphere, twist ending',
                    guidance: `🔍 MYSTERY / DETECTIVE STYLE:
- Noir lighting, shadows
- Investigation scenes
- Clue reveals, "aha!" moments
- Evidence boards with red strings
- Dramatic twist endings`
                },
                'breaking_4th_wall': {
                    name: 'Breaking the 4th Wall (Phá vỡ bức tường thứ 4)',
                    keywords: 'breaking fourth wall, looking directly at camera, winking at viewer, aside glance, talking to audience, meta awareness, acknowledging being in a video, conspiratorial whisper',
                    guidance: `👀 BREAKING THE 4TH WALL STYLE:
═══════════════════════════════════════
Nhân vật BIẾT họ đang trong video!

🎭 TECHNIQUES:
- Direct eye contact với camera
- Winking at viewer (chia sẻ bí mật)
- Aside glances ("you seeing this?")
- Addressing viewer directly
- Meta comments ("như tôi đã nói ở video trước...")

💬 DIALOGUE:
- "Bạn có thấy cái đó không?" *nhìn camera*
- "Đừng nói với ai nhé" *thì thầm*
- "Tôi biết bạn đang nghĩ gì đấy"
- "Subscribe đi, tôi thấy bạn chưa subscribe"
- *something happens* *looks at camera like in The Office*`
                },
                'villain_origin': {
                    name: 'Villain Origin Story (Nguồn gốc phản diện)',
                    keywords: 'villain origin, tragic backstory, dark transformation, sympathetic villain lighting, before and after contrast, corrupting moment, justified anger, becoming the villain',
                    guidance: `😈 VILLAIN ORIGIN STORY STYLE:
- Tragic backstory reveals
- "They made me this way" narrative
- Before (innocent) vs After (villain) contrast
- Sympathetic villain lighting
- Transformation sequences`
                },
                'underdog_triumph': {
                    name: 'Underdog Triumph (Kẻ yếu vươn lên)',
                    keywords: 'underdog story, being mocked initially, training montage, moment of doubt, final triumph, shocked faces of doubters, spotlight on winner, proving them wrong',
                    guidance: `🏆 UNDERDOG TRIUMPH STYLE:
- Start: được/bị coi thường
- Middle: training, struggling, doubting
- End: PROVE THEM WRONG
- Shocked faces of doubters
- Victory spotlight moment`
                },
                'chaos_unhinged': {
                    name: 'Chaotic / Unhinged Energy (Năng lượng điên)',
                    keywords: 'chaotic energy, things going wrong, forced smile while panicking, fire in background, screaming internally, everything is fine meme, escalating disaster, unhinged laughter',
                    guidance: `🤪 CHAOTIC / UNHINGED ENERGY STYLE:
═══════════════════════════════════════
"This is fine" while everything burns!

🔥 CONCEPT:
- Situation escalates out of control
- Character pretends everything is okay
- Internal screaming, external smiling
- Comedy of errors

🎬 ESCALATION:
1. Small problem appears
2. "No big deal" reaction
3. Problem gets worse
4. Forced smile intensifies
5. COMPLETE CHAOS
6. "Haha anyway..." 

🎭 EXPRESSIONS:
- Forced smile with twitching eye
- Nervous laughter
- "I'm fine" while clearly not fine
- Thousand-yard stare
- Snapping into unhinged joy`
                },
                'high_end_fashion': {
                    name: 'High-End Fashion Film (Phim thời trang cao cấp - Longchamp Style)',
                    keywords: 'high fashion film, surreal transitions, seamless morphing, golden hour, Haussmann architecture, Paris rooftops, cobblestone streets, drone shots, FPV tracking, dreamcore aesthetic, environment transformation, portal transitions, volumetric lighting, slow motion to fast-paced, dynamic editing, 8K photorealistic, horses galloping, nature reclaiming architecture',
                    guidance: `🎬 HIGH-END FASHION FILM STYLE (LONGCHAMP AESTHETIC):
═══════════════════════════════════════
Đây là phong cách quảng cáo thời trang cao cấp với yếu tố SIÊU THỰC!

🌆 VISUAL SIGNATURE:
- Golden hour lighting (giờ vàng hoàng hôn ấm áp)
- Haussmann architecture, Paris rooftops, zinc-gray roofs
- Cobblestone streets, classic European elegance
- Horses galloping through urban streets → onto rooftops
- Nature reclaiming architecture (grass, flowers covering buildings)
- Text/Logo appears organically from environment

🌊 SURREAL ELEMENTS (CRITICAL - MỖI CẢNH PHẢI CÓ):
- Environment TRANSFORMS based on narrative:
  • Street → meadow of flowers on rooftops
  • Touching water puddle → underwater portal with goldfish
  • Walking through archway → emerges in completely different world
  • Flowers bloom instantly, covering entire buildings
- Seamless morphing between realities
- Dream-logic transitions (no hard cuts)

🎥 CAMERA STYLE:
- FPV drone chasing through streets at dusk
- Low flycam tracking subjects dynamically
- Dolly shots with smooth seamless transitions
- Speed ramping: slow-motion beauty → fast-paced energy
- Wide aerial views revealing epic scale
- Intimate macro close-ups on fabric textures, skin details

💡 LIGHTING:
- Golden hour throughout (sunset glow)
- Volumetric god rays, lens flares
- High contrast, rich warm saturation
- Soft rim lighting on subjects
- Shadows create depth and drama

🔊 SOUND DESIGN:
- Cinematic orchestral OR electronic music (high BPM, pulsing)
- Rhythmic editing matching music beats
- Horse hooves on cobblestone → soft thuds on grass
- Water splashes, wind whooshing past camera
- Impactful bass drops on major transitions

📝 PROMPTTEXT FORMAT:
"[SCENE: Location]. [SURREAL ELEMENT: environment transformation description]. [Subject: FULL CHARACTER DESCRIPTION - see template]. [ACTION: dynamic movement]. CAMERA: [FPV/drone/dolly/tracking], [lens mm], [speed: slow-motion/fast-cut]. LIGHTING: golden hour, volumetric rays, lens flare. TRANSITION: [seamless morph to next scene]. STYLE: high fashion editorial, 8K, photorealistic. SOUND: [orchestral swell/electronic beat]. PACING: [slow-burn/fast-cut]."

⚠️ MANDATORY:
- Every scene has at least ONE surreal/transformation element
- Seamless transitions (no hard cuts between scenes)
- Golden hour lighting throughout
- Characters described with FULL detail every time`
                },
                'avatar_epic': {
                    name: 'Avatar Epic Sci-Fi (Phim khoa học viễn tưởng hùng vĩ)',
                    keywords: 'Avatar style, Pandora aesthetic, bioluminescent world, alien flora fauna, floating mountains, epic landscapes, Na\'vi blue skin, tribal markings, glowing plants, massive trees, alien creatures, spiritual connection, motion capture quality, 3D depth, IMAX cinematography, James Cameron epic scale',
                    guidance: `🌌 AVATAR EPIC SCI-FI STYLE (James Cameron):
═══════════════════════════════════════
Thế giới ngoài hành tinh hùng vĩ, kỳ ảo như Pandora!

🌿 VISUAL SIGNATURE:
- Bioluminescent plants và creatures (phát sáng sinh học)
- Floating mountains, massive alien trees (núi bay, cây khổng lồ)
- Alien flora/fauna với màu sắc neon xanh, tím, hồng
- Tribal markings, body paint patterns
- Sacred spiritual locations với energy connections
- Day/night contrast - đêm rực rỡ hơn ngày

🎥 CAMERA STYLE:
- IMAX scale wide shots showing epic landscapes
- Smooth flying/floating camera movements
- Intimate close-ups với alien eye reflections
- Depth layering (foreground, mid, background all detailed)
- Sweeping crane shots qua rừng alien

💡 LIGHTING:
- Bioluminescence là nguồn sáng chính ban đêm
- Soft diffused light qua alien foliage
- Glowing particles floating in air
- Sacred locations have spiritual glow
- Sunrise/sunset với alien sun colors

🔊 SOUND:
- Alien wildlife calls, exotic bird sounds
- Spiritual humming, tribal chanting
- Nature ambience nhưng otherworldly
- Orchestral score with ethnic instruments

📝 PROMPTTEXT FORMAT:
"[SCENE: Alien location]. [ENVIRONMENT: bioluminescent details, floating elements, alien plants]. [CHARACTER: full description with tribal markings if any]. [ACTION]. CAMERA: [epic wide/intimate close-up], IMAX quality. LIGHTING: bioluminescent glow, [time of day]. ATMOSPHERE: spiritual, majestic, otherworldly. STYLE: Avatar, Pandora, James Cameron epic. PACING: [slow-burn/action]."`
                },
                'marvel_superhero': {
                    name: 'Marvel Superhero Action (Phim siêu anh hùng Marvel)',
                    keywords: 'Marvel Cinematic Universe, superhero action, dramatic poses, power effects, energy blasts, cape flowing, hero landing, team assembly shot, villain confrontation, CGI powers, dynamic action, slow-motion hero moments, epic battle, destruction scale, witty banter, dramatic lighting',
                    guidance: `🦸 MARVEL SUPERHERO ACTION STYLE (MCU):
═══════════════════════════════════════
Phim siêu anh hùng đầy action và khoảnh khắc iconic!

💥 VISUAL SIGNATURE:
- HERO LANDING poses (đáp xuống với power)
- Power effects: energy blasts, lightning, fire, magic
- Cape/costume flowing dramatically
- Team assembly shots (nhóm tập hợp)
- Villain dramatic reveals
- City destruction at epic scale
- Portal/dimensional effects

🎥 CAMERA STYLE:
- 360° rotating hero shots
- Speed ramping: slow-mo during hits, fast during movement
- Low angle hero shots (power pose)
- Tracking shots following action
- Dramatic push-ins during confrontations
- Wide shots showing battle scale

💡 LIGHTING:
- High contrast, dramatic shadows
- Rim lighting on heroes
- Power effects as light sources
- Golden hour final battles
- Blue/orange color grading

🎭 SCENE TYPES:
1. ORIGIN: Character discovers powers
2. TRAINING: Learning to control abilities
3. TEAM-UP: Heroes meet, initial conflict then alliance
4. VILLAIN INTRO: Dramatic villain reveal
5. FINAL BATTLE: Epic confrontation with stakes
6. RESOLUTION: Hero pose, new status quo

🔊 SOUND:
- Epic orchestral with brass
- Power sound effects (whoosh, blast, impact)
- Witty dialogue during action
- Dramatic silence before major hits

📝 PROMPTTEXT FORMAT:
"[SCENE TYPE: action/confrontation/team-up]. [HERO: full description with costume details, power indicators]. [VILLAIN if present: description]. [ACTION: specific power use, combat move]. CAMERA: [rotating/tracking/push-in], speed ramp. LIGHTING: dramatic, rim light, power glow. VFX: [energy effects, destruction]. STYLE: Marvel, MCU, superhero epic. PACING: fast-cut with slow-mo beats."`
                },
                'romance_cinematic': {
                    name: 'Romance Cinematic (Phim tình cảm lãng mạn)',
                    keywords: 'romantic drama, love story, emotional close-ups, golden hour romance, soft focus, bokeh backgrounds, intimate moments, first meeting, confession scene, rain kiss, airport reunion, wedding scene, heartbreak tears, makeup reconciliation, slow dance, letter reading, nostalgic flashback',
                    guidance: `💕 ROMANCE CINEMATIC STYLE (Nicholas Sparks / Richard Curtis):
═══════════════════════════════════════
Câu chuyện tình yêu đầy cảm xúc và khoảnh khắc đẹp!

💑 VISUAL SIGNATURE:
- Golden hour everything (ánh nắng vàng)
- Soft focus với beautiful bokeh
- Intimate framing (2-shots, close-ups)
- Beautiful locations: beach, Paris, small town
- Rain as romantic element (kiss in rain)
- Letters, photos, meaningful objects
- Tears glistening in perfect lighting

🎥 CAMERA STYLE:
- Slow dolly-ins during emotional moments
- Gentle handheld for intimacy
- Over-shoulder shots during conversations
- Wide establishing shots of romantic locations
- Extreme close-ups on eyes, lips, hands touching
- Slow-motion for key romantic moments

💡 LIGHTING:
- GOLDEN HOUR is essential (backlit subjects)
- Soft, warm, flattering on skin
- Candle light for intimate dinners
- Window light for morning scenes
- Fairy lights, city lights at night
- Rain on windows with soft interior glow

🎭 CLASSIC ROMANCE SCENES:
1. MEET CUTE: First encounter (bumping into each other, save from danger)
2. GROWING CLOSER: Montage of falling in love
3. OBSTACLE: Something threatens the relationship
4. SEPARATION: Heartbreaking goodbye
5. REALIZATION: Character realizes they must fight for love
6. GRAND GESTURE: Airport run, rain confession, wedding interruption
7. REUNION: Emotional embrace, kiss, happily ever after

🔊 SOUND:
- Soft piano, acoustic guitar
- Swelling orchestral for emotional peaks
- Pop song montages
- Whispered dialogue, meaningful silences
- Rain, waves, wind as romantic ambience

📝 PROMPTTEXT FORMAT:
"[SCENE TYPE: meet cute/confession/reunion]. [LOCATION: romantic setting]. [CHARACTER 1: full description, emotion]. [CHARACTER 2: full description, emotion]. [ACTION: intimate gesture, eye contact, touch]. CAMERA: slow dolly/close-up/soft focus. LIGHTING: golden hour/candle/rain on window. EMOTION: [love/longing/joy/heartbreak]. STYLE: romantic drama, soft, warm. PACING: slow-burn, let emotion breathe."`
                },
                'fast_furious_action': {
                    name: 'Fast & Furious Action (Phim hành động tốc độ)',
                    keywords: 'Fast and Furious style, street racing, car chases, NOS boost, drift racing, heist action, family theme, muscle cars, exotic cars, explosions, impossible stunts, highway chase, nitrous flames, speedometer close-ups, gear shifting, tire burnout, slow-motion crash, Dom Toretto energy',
                    guidance: `🏎️ FAST & FURIOUS ACTION STYLE:
═══════════════════════════════════════
Hành động tốc độ cao, xe đẹp, và FAMILY!

🚗 VISUAL SIGNATURE:
- Exotic cars, muscle cars, tuned imports
- SPEED: motion blur, streaking lights
- NOS flames shooting from exhaust
- Drift smoke, tire burnout marks
- Impossible stunts (car jumping buildings, parachute drops)
- Highway chases with explosions
- Night city lights reflection on car paint
- Speedometer/tachometer close-ups

🎥 CAMERA STYLE:
- Low angle shots of cars (aggressive, powerful)
- Interior shots: gear shifting, foot on pedal, eyes in mirror
- Tracking shots keeping pace with speeding cars
- Mounted camera on car showing driver POV
- 360° rotating around car during drift
- Slow-motion impacts, crashes, flips
- Drone shots following car chase from above

💡 LIGHTING:
- Night city neon (street racing culture)
- Tunnel lights streaking past
- Headlight flares, tail light trails
- Fire/explosion glow
- Sunset for dramatic driving scenes
- High contrast, saturated colors

🎭 ACTION SEQUENCES:
1. RACE START: Countdown, burnout, launch
2. CHASE: Highway pursuit, weaving traffic
3. DRIFT: Smoke-filled corners, perfect slide
4. HEIST: Moving truck, mid-drive transfer
5. STUNT: Impossible jump, explosion escape
6. SHOWDOWN: Final race, winner takes all
7. FAMILY: Crew gathering, BBQ scene

🔊 SOUND:
- Engine roars, turbo whine, exhaust pops
- Tire screeching, gear grinding
- NOS hissing, boost whoosh
- Bass-heavy hip-hop/electronic soundtrack
- Dramatic silence before race start
- Impact sounds, glass shattering, metal crunching

📝 PROMPTTEXT FORMAT:
"[SCENE TYPE: race/chase/heist/stunt]. [VEHICLE: specific car with color, modifications]. [DRIVER: full description, expression of focus/determination]. [ACTION: specific driving move - drift, NOS boost, jump]. CAMERA: [low angle/interior/tracking/drone], speed lines. LIGHTING: night neon/tunnel strobe/fire glow. VFX: motion blur, NOS flames, tire smoke. STYLE: Fast & Furious, street racing, high octane. PACING: FAST-CUT, adrenaline pumping."`
                }
            }

            const selectedCinematicStyle = cinematicStyleMap[cinematicStyle || 'cinematic_documentary'] || cinematicStyleMap['cinematic_documentary']

            voiceOverInstr = `CONTENT TYPE: HOLLYWOOD CINEMATIC FILM (Kịch bản điện ảnh Hollywood chuyên nghiệp)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 SELECTED STYLE: ${selectedCinematicStyle.name}
${selectedCinematicStyle.guidance}

🎨 STYLE KEYWORDS (Include in EVERY scene):
${selectedCinematicStyle.keywords}

═══════════════════════════════════════
🎭 CHARACTER DESCRIPTION TEMPLATE (BẮT BUỘC CHO TẤT CẢ NHÂN VẬT):
═══════════════════════════════════════
⚠️⚠️⚠️ QUAN TRỌNG: NẾU CẢNH CÓ 2, 3 HOẶC NHIỀU NHÂN VẬT → TẤT CẢ ĐỀU PHẢI MÔ TẢ CHI TIẾT!
Không được bỏ sót bất kỳ nhân vật nào xuất hiện trong cảnh!

MỖI nhân vật xuất hiện trong MỖI cảnh PHẢI có mô tả CHÍNH XÁC theo format:

[TÊN_NHÂN_VẬT: (tuổi), (dân tộc/sắc tộc),
  DA: (tone da chi tiết - e.g., trắng ngà porcelain, ngăm đen ebony, olive Mediterranean, đồng nâu ấm bronze),
  MẶT: (hình mặt, màu mắt, hình mắt, mũi, môi, đặc điểm nổi bật),
  TÓC: (màu, độ dài, kiểu, texture - e.g., tóc đen dài óng ả, tóc nâu xoăn ngắn),
  DÁNG: (thể hình - thon gọn, athletic, đầy đặn, cơ bắp),
  TRANG PHỤC: (outfit cụ thể với màu sắc, chất liệu, kiểu dáng chi tiết),
  PHỤ KIỆN: (trang sức, kính, đồng hồ, túi - mô tả cụ thể),
  BIỂU CẢM: (trạng thái cảm xúc hiện tại phản ánh trên mặt),
  TƯ THẾ: (cách đứng/ngồi, ngôn ngữ cơ thể)]

❌ SAI (chỉ mô tả 1 người, bỏ sót người còn lại):
"Rose (20s, elegant) đứng nói chuyện với Jack"

✅ ĐÚNG (MÔ TẢ ĐẦY ĐỦ CẢ 2 NHÂN VẬT):
"[ROSE: 20 tuổi, người Mỹ gốc Anh,
  DA: trắng ngà porcelain với má hồng nhẹ,
  MẶT: mặt trái xoan thanh tú, mắt xanh ngọc lục sáng với lông mi dài cong vút, mũi thon cao, môi hồng đầy đặn,
  TÓC: tóc đỏ auburn dài quá vai với những lọn sóng mềm mại óng ả,
  DÁNG: thon thả mảnh khảnh với eo nhỏ,
  TRANG PHỤC: áo blouse lụa trắng với nút ngọc trai, chân váy velvet xanh ngọc dài chấm đất,
  PHỤ KIỆN: vòng cổ Heart of the Ocean kim cương xanh, hoa tai ngọc trai giọt,
  BIỂU CẢM: đôi mắt ngấn lệ nhưng kiên cường,
  TƯ THẾ: đứng đối diện Jack, hai tay đặt trên ngực]

[JACK: 20 tuổi, người Mỹ gốc Ireland,
  DA: ngăm nhẹ tan từ nắng gió, với vài nốt tàn nhang trên mũi,
  MẶT: mặt vuông góc cạnh nam tính, mắt xanh dương sáng như biển trời, mũi thẳng, nụ cười nghịch ngợm,
  TÓC: tóc vàng nâu bù xù bay trong gió, không chải chuốt,
  DÁNG: cao ráo nghệ sĩ, vai rộng, thân hình thon gọn,
  TRANG PHỤC: áo sơ mi cotton trắng nhàu, quần tây nâu sờn gấu, áo vest cũ kỹ,
  PHỤ KIỆN: không có trang sức, tay lấm than vì vẽ,
  BIỂU CẢM: ánh mắt dịu dàng đầy tình cảm, nụ cười động viên,
  TƯ THẾ: đứng gần Rose, một tay nắm lấy tay cô ấy, tay kia chạm nhẹ má cô]"

⚠️ CRITICAL: Copy MỨC ĐỘ CHI TIẾT này cho MỌI nhân vật, MỌI cảnh!
⚠️ NHẤT QUÁN: Mỗi nhân vật PHẢI giống nhau xuyên suốt tất cả các cảnh!
⚠️ KHÔNG BỎ SÓT: Nếu có 3 người trong cảnh → mô tả đầy đủ cả 3 người!

═══════════════════════════════════════
🎥 CINEMATIC QUALITY REQUIREMENTS (CHẤT LƯỢNG ĐIỆN ẢNH):
═══════════════════════════════════════
Video phải đạt chất lượng ĐIỆN ẢNH THẬT SỰ - KHÔNG MƠ HỒ!

✅ PHẢI CÓ:
- Sharp focus, crystal clear image (hình ảnh sắc nét, rõ ràng)
- 8K/4K quality, film grain texture (chất lượng cao, texture phim)
- Professional color grading (màu sắc chuyên nghiệp)
- Proper exposure, rich contrast (độ sáng chuẩn, tương phản đẹp)
- Clean frame edges, no vignette (khung hình sạch, không tối góc)

❌ TUYỆT ĐỐI KHÔNG:
- Blurry, out of focus (mờ, lệch focus)
- Overexposed, underexposed (quá sáng, quá tối)
- Low resolution, pixelated (độ phân giải thấp)
- Borders, frames, overlays (khung viền, overlay)
- Watermarks, text overlays (watermark, chữ đè)

═══════════════════════════════════════

🎬 THIS IS A REAL HOLLYWOOD-STYLE FILM SCRIPT!
- NO host narrating to camera
- NO educational explanation style
- NO "chào các bạn" or YouTube-style content
- Characters ACT OUT the story like a real movie
- Include SILENT scenes, ESTABLISHING shots, TRANSITIONS
- Apply the ${selectedCinematicStyle.name} style throughout

═══════════════════════════════════════
🎥 HOLLYWOOD SCENE TYPES (MIX ALL TYPES):
═══════════════════════════════════════

1️⃣ COLD OPEN / TEASER (Scene 1-2):
   - Start IN THE MIDDLE of action or mystery
   - NO dialogue or minimal - pure visual storytelling
   - Hook audience immediately with intrigue/danger/beauty
   - Example: A silhouette running through rain. A hand reaching for a photo. Blood dripping.
   - Mark: [SCENE TYPE: COLD OPEN - NO DIALOGUE]

2️⃣ TITLE SEQUENCE (Scene 2-3):
   - Cinematic title card with style
   - Can overlay on establishing shots
   - Atmospheric music builds
   - Mark: [SCENE TYPE: TITLE SEQUENCE]

3️⃣ ESTABLISHING SHOTS (Use frequently - 20% of scenes):
   - Wide shots showing location WITHOUT dialogue
   - Set mood, time, atmosphere
   - Examples: City skyline at dawn. Empty street with fog. Waves crashing on rocks.
   - Pure visuals + ambient sound + music
   - Mark: [SCENE TYPE: ESTABLISHING - NO DIALOGUE]
   - voiceover field = "(Không có lời - chỉ hình ảnh và âm nhạc)"

4️⃣ TRANSITION / MONTAGE SCENES (10% of scenes):
   - Time passage, emotional shifts, preparation
   - Series of quick visual moments
   - Music-driven, minimal or no dialogue
   - Examples: Sun rising and setting. Character training. Seasons changing.
   - Mark: [SCENE TYPE: MONTAGE - MUSIC ONLY]
   - voiceover field = "(Montage - nhạc nền)"

5️⃣ DIALOGUE SCENES (40% of scenes):
   - Characters talking TO EACH OTHER
   - Subtext and emotion in every line
   - Include reactions, pauses, interruptions
   - Show don't tell
   - Mark: [SCENE TYPE: DIALOGUE]

6️⃣ ACTION / CHASE SCENES (When appropriate):
   - Fast-paced visual sequences
   - Minimal dialogue - grunts, shouts, commands
   - Dynamic camera work
   - Mark: [SCENE TYPE: ACTION - MINIMAL DIALOGUE]

7️⃣ EMOTIONAL BEAT SCENES (Key moments):
   - Close-ups on faces, reactions
   - Slow pacing, let emotion breathe
   - Music swells
   - Character realizations, heartbreak, joy
   - Mark: [SCENE TYPE: EMOTIONAL BEAT]

8️⃣ CLIMAX / CONFRONTATION (Near end):
   - Peak tension and conflict
   - All storylines converge
   - High stakes dialogue or action
   - Mark: [SCENE TYPE: CLIMAX]

9️⃣ DENOUEMENT / ENDING (Final scenes):
   - Resolution, aftermath
   - Often quiet, reflective
   - Can be silent with music
   - Thematic closure
   - Mark: [SCENE TYPE: ENDING]

═══════════════════════════════════════
🎬 HOLLYWOOD FILM STRUCTURE:
═══════════════════════════════════════

📍 OPENING SEQUENCE (10-15% of scenes):
• Cold Open: Hook with mystery/action (NO dialogue)
• Title card over establishing shot
• Introduce protagonist's world
• "Normal life" before the storm

📍 INCITING INCIDENT (Scene 3-5):
• Something disrupts the normal
• Forces protagonist to react
• Point of no return

📍 RISING ACTION (30-40% of scenes):
• Obstacles and challenges
• Character development
• Subplots introduced
• Use ESTABLISHING shots between locations
• Use TRANSITIONS for time jumps

📍 MIDPOINT TWIST (50% mark):
• Major revelation or reversal
• Stakes raised significantly
• Protagonist's approach must change

📍 CRISIS / DARK MOMENT (70-75% mark):
• All seems lost
• Character at lowest point
• Internal and external conflict peak

📍 CLIMAX (80-90% mark):
• Final confrontation
• All threads come together
• Maximum tension

📍 RESOLUTION (Final 10%):
• Aftermath and new equilibrium
• Character changed by journey
• Thematic statement
• Often SILENT ending shot

═══════════════════════════════════════
🎥 CAMERA & VISUAL LANGUAGE:
═══════════════════════════════════════
- Extreme Wide: Isolation, epic scale, establishing
- Wide: Context, geography, group dynamics
- Medium: Standard dialogue, character interaction
- Close-up: Emotion, important details, intimacy
- Extreme Close-up: Eyes, hands, objects - heightened drama
- Over-shoulder: Conversation, POV hint
- POV: Subjective experience
- Dutch angle: Unease, disorientation
- Low angle: Power, threat, heroism
- High angle: Vulnerability, overview
- Tracking: Following action, energy
- Steadicam: Flowing movement, immersion
- Handheld: Chaos, documentary feel, tension
- Crane/Drone: Reveals, scope, transitions
- Dolly zoom (Vertigo): Realization, shock

═══════════════════════════════════════
💡 LIGHTING & ATMOSPHERE:
═══════════════════════════════════════
- Golden hour: Romance, hope, nostalgia
- Blue hour: Mystery, melancholy, contemplation
- High-key: Comedy, happiness, safety
- Low-key: Thriller, noir, danger
- Chiaroscuro: Drama, moral ambiguity
- Practical lights: Realism, intimacy
- Neon: Urban, modern, cyberpunk
- Candlelight: Historical, intimate, vulnerable
- Silhouette: Mystery, beauty, transition

═══════════════════════════════════════
🔊 SOUND DESIGN (CRITICAL FOR SILENT SCENES):
═══════════════════════════════════════
- Ambient: Wind, rain, traffic, nature, room tone
- Foley: Footsteps, doors, objects, cloth
- Music: Score type (orchestral, electronic, minimal piano)
- Silence: Powerful when used intentionally
- Sound motifs: Recurring sounds for themes

═══════════════════════════════════════
📝 PROMPTTEXT FORMATS BY SCENE TYPE:
═══════════════════════════════════════

🎬 SILENT/ESTABLISHING SCENE:
"[SCENE TYPE: ESTABLISHING - NO DIALOGUE] [EXT. SAIGON SKYLINE - DAWN]. Aerial drone shot slowly descending over misty city. Sun breaks through clouds, golden light spills across rooftops. A lone motorbike crosses an empty bridge below. CAMERA: Drone descending, wide to medium transition, 24mm lens. LIGHTING: Golden hour, volumetric fog, lens flare from rising sun. SOUND: Distant city waking, birds, soft ambient score begins. MOOD: Contemplative, new beginnings. STYLE: ${styleKeywords}. NO DIALOGUE - VISUAL ONLY."

🎬 DIALOGUE SCENE:
"[SCENE TYPE: DIALOGUE] [INT. COFFEE SHOP - DAY]. [Linh (28, long black hair, white blouse, nervous fingers on cup) sits across from Minh (32, tired eyes, stubble, leather jacket)]. She avoids his gaze. He leans forward. DIALOGUE: Minh speaks softly 'Em còn yêu anh không?' Long pause. Linh's eyes water. She whispers 'Câu hỏi đó... đến muộn quá rồi.' CAMERA: Medium two-shot, slow push-in, 50mm. Cut to close-up on her trembling hands. LIGHTING: Window light creating soft shadows, warm tones. SOUND: Café ambience fades, only their breathing remains. EMOTION: Regret, unspoken love. STYLE: ${styleKeywords}. VOICE: Male voice for Minh lines, Female voice for Linh lines."

🎬 MONTAGE SCENE:
"[SCENE TYPE: MONTAGE - MUSIC ONLY] Series of shots: 1) Hands packing a suitcase. 2) Empty apartment, dust in sunlight. 3) Calendar pages turning. 4) Rain on window, then sun breaking through. 5) New city, new street, new door opening. CAMERA: Various - close-ups, medium shots, time-lapse. LIGHTING: Transitions from dark to light symbolizing hope. SOUND: Melancholic piano transitions to uplifting orchestral. MOOD: Passage of time, healing, moving forward. STYLE: ${styleKeywords}. NO DIALOGUE - MUSIC DRIVES EMOTION."

🎬 ACTION SCENE:
"[SCENE TYPE: ACTION - MINIMAL DIALOGUE] [EXT. ALLEY - NIGHT]. [Protagonist runs, breath visible in cold air, glancing back]. Pursuers' footsteps echo. He vaults over trash cans. Slips. Gets up. Dead end. Turns to face them. CAMERA: Handheld tracking, quick cuts, low angles. LIGHTING: Harsh streetlight, deep shadows, orange sodium glow. SOUND: Heavy breathing, footsteps, heartbeat bass pulse. EMOTION: Desperation, survival. STYLE: ${styleKeywords}. VOICE: Heavy breathing, no dialogue."

⚠️ CRITICAL HOLLYWOOD RULES:
- 20-30% of scenes should be SILENT (no dialogue) - establishing, transitions, emotional beats
- Start with COLD OPEN - no exposition, drop into action/mystery
- Use VISUAL STORYTELLING - show don't tell
- Include proper TRANSITIONS between locations/times
- Each scene has ONE purpose - don't overload
- Build RHYTHM - fast scenes followed by slow, dialogue by silence
- END with powerful IMAGE, often silent
- All dialogue in ${dialogueLang === 'en' ? 'English' : 'Vietnamese'}
- Voice tags: "VOICE: Male voice" or "VOICE: Female voice" for dialogue scenes
- For silent scenes: voiceover field = "(Không có lời)" or description of music/sound only`
        } else if (voiceOverMode === 'roast_comedy') {
            voiceOverInstr = `CONTENT TYPE: ROAST COMEDY - PROVOCATIVE (Chọc tức khán giả - CỰC KỲ VIRAL!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ TẠI SAO VIRAL: Gây TRANH CÃI → Comments tăng vọt → Khán giả muốn "cãi lại"

🔥 ROAST THE AUDIENCE - VÍ DỤ DIALOGUE:
- "Bạn còn đang xem video này à? Chắc rảnh lắm nhỉ?"
- "Tôi cá là bạn đang nằm trên giường, lười biếng như mọi khi"
- "Đừng giả vờ như bạn hiểu, tôi biết bạn không hiểu đâu"
- "Bạn nghĩ bạn giỏi hơn tôi? Haha, dễ thương ghê"
- "Comment đi, tôi biết bạn muốn cãi rồi đấy"
- "Share cho đứa bạn ngu ngu của bạn xem đi"
- "Ở đây có ai thực sự hiểu không hay toàn người không biết gì?"
- "Xem xong đừng quên unsubscribe nhé... đùa thôi, nhưng seriously"

📸 CAMERA & BIỂU CẢM (CRITICAL):
- Close-up mặt với ánh mắt KHINH THƯỜNG
- Nhướng mày, cười đểu, liếc xéo
- Looking DOWN at camera (như nhìn xuống khán giả)
- Slow clap (vỗ tay chậm mỉa mai)
- Eye roll cực kỳ dramatic
- Smug, superior expression

💬 DIALOGUE TECHNIQUES:
- Sarcastic AF - giọng mỉa mai
- Backhanded compliments ("Giỏi đấy... cho một người mới")
- Rhetorical questions ("Bạn không biết thật à?")
- Fake concern ("Ôi tội nghiệp, bạn không hiểu à?")
- Direct challenges ("Cãi đi, tôi đợi")

🎬 SCENE PATTERNS:
1. Bắt đầu nice → slowly reveal attitude
2. Fake helpful → then roast
3. Compliment → take it back
4. "No offense but..." → maximum offense

⚠️ QUAN TRỌNG:
- Roast phải HÀI, không thật sự toxic
- Có thể self-deprecating để balance
- End với wink hoặc "đùa thôi mà"
- Breaking 4th wall constantly - talk TO the viewer`
        } else if (voiceOverMode === 'breaking_4th_wall') {
            voiceOverInstr = `CONTENT TYPE: BREAKING THE 4TH WALL (Phá vỡ bức tường thứ 4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎭 CONCEPT: Nhân vật BIẾT họ đang trong video, NÓI CHUYỆN TRỰC TIẾP với khán giả

👀 TECHNIQUES:
- Direct eye contact với camera
- Winking at viewer (chia sẻ bí mật)
- Aside glances ("you seeing this?")
- Addressing viewer directly
- Meta comments về video/channel
- Pause mid-action to talk to audience

💬 DIALOGUE EXAMPLES:
- "Bạn có thấy cái đó không?" *nhìn thẳng camera*
- "Đừng nói với ai nhé" *thì thầm với khán giả*
- "Tôi biết bạn đang nghĩ gì đấy"
- "Subscribe đi, tôi thấy bạn chưa subscribe"
- *something happens* *nhìn camera như trong The Office*
- "Okay, tạm dừng. Các bạn hiểu chứ?"
- "Tôi cá 90% các bạn không làm theo đâu, đúng không?"
- "Video này được tài trợ bởi... haha đùa, không có ai tài trợ"

📸 CAMERA STYLE:
- Direct address shots
- Conspiratorial whispers (camera zooms in)
- "The Office" style deadpan looks
- Sudden breaks from narrative to address viewer

🎬 SCENE STRUCTURE:
- Normal scene → pause → address camera → resume
- Share "secrets" with viewer that other characters don't know
- React to what viewer might be thinking`
        } else if (voiceOverMode === 'reaction_commentary') {
            voiceOverInstr = `CONTENT TYPE: REACTION / COMMENTARY (Phản ứng & Bình luận)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📺 FORMAT:
- Split screen hoặc Picture-in-Picture layout
- Nhân vật XEM và PHẢN ỨNG với nội dung
- Bình luận sắc sảo, opinions mạnh

😱 REACTION EXPRESSIONS:
- Shocked face (miệng há hốc)
- Laughing hard (ngửa cổ cười)
- Cringing (nhăn mặt ghê tởm)
- Judging expression (liếc xéo)
- Confused (nhíu mày)
- Mind blown (tay lên đầu)

💬 COMMENTARY STYLE:
- "Cái gì đây?!"
- "No way... no freaking way!"
- "Đây là cái hay nhất tôi từng thấy"
- "Cringe quá trời"
- "Tôi không thể..."
- Strong opinions, không ngại controversial
- Đồng ý hoặc phản đối mạnh mẽ

📸 PROMPTTEXT FORMAT:
[Split screen layout. MAIN SCREEN: (describe content being reacted to). REACTOR CORNER: (Character) with (expression) reacting to the content. (Commentary dialogue)]. STYLE: reaction video, picture-in-picture.`
        } else if (voiceOverMode === 'educational_sassy') {
            voiceOverInstr = `CONTENT TYPE: EDUCATIONAL WITH ATTITUDE (Giáo dục với thái độ - Sassy Teaching)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🙄 ATTITUDE: "Bạn không biết điều này thật à?"

💅 SASSY TEACHING STYLE:
- "Wow, still believing that myth in ${new Date().getFullYear()}?"
- "Let me educate you real quick"
- "Bạn không biết thật à? Okay fine..."
- "Tôi không tin là phải giải thích cái này"
- Disappointed parent energy
- Superior knowledge flex

📸 EXPRESSIONS (CRITICAL):
- Raised eyebrow (ngạc nhiên mỉa mai)
- Slow, condescending clap
- Eye roll cực dramatic
- "I can't believe I have to explain this" face
- Sighing heavily trước khi giải thích
- Smug satisfaction sau khi prove point

🎬 SCENE STRUCTURE:
1. Present common misconception/myth
2. "Ờ thật à?" expression
3. Drop the FACTS with attitude
4. Smug satisfaction khi prove point

💬 DIALOGUE PATTERNS:
- "Oh bạn nghĩ... đáng yêu ghê"
- "Wrong. Completely wrong. Here's why..."
- "Để tôi nói cho bạn biết sự thật nhé"
- "Đây là kiến thức cơ bản mà..."
- End with: "Giờ bạn biết rồi đó. Đừng sai nữa nhé."`
        } else if (voiceOverMode === 'gen_z_meme') {
            voiceOverInstr = `CONTENT TYPE: GEN Z MEME CULTURE (Văn hóa meme Gen Z - Chaotic Energy)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💀 CONCEPT: Absurd, ironic, chaotic energy - "Bruh" moment

🎨 VISUAL CHAOS:
- Random zooms bất ngờ vào mặt
- Glitch effects, deep fried aesthetic
- Bass boosted moments
- Cursed image energy
- Distorted visuals khi punchline
- Unexpected cuts và transitions

💬 GEN Z LANGUAGE:
- "Bruh", "No cap", "Fr fr", "Slay"
- Skull emoji energy 💀
- "It's giving..." statements
- "That's lowkey/highkey..."
- "Tell me why..."
- "The way I..."
- Unserious about EVERYTHING

🎭 HUMOR TYPES:
- Anti-humor (not funny = funny)
- Absurdist (makes no sense = hilarious)
- Self-deprecating
- Referencing other memes
- Ironic overreactions
- "Anyway..."

🎬 PROMPTTEXT STYLE:
- Describe chaotic energy trong visual
- Include "random zoom effect", "glitch moment"
- Character expressions: confused, dead inside, unhinged
- Sudden mood switches`
        } else if (voiceOverMode === 'chaos_unhinged') {
            voiceOverInstr = `CONTENT TYPE: CHAOTIC / UNHINGED ENERGY ("This is fine" 🔥 while everything burns)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤪 CONCEPT: Situation escalates out of control, nhân vật pretends everything is okay

🔥 ESCALATION PATTERN:
1. Small problem appears
2. "No big deal" reaction
3. Problem gets worse
4. Forced smile intensifies
5. MORE problems pile up
6. COMPLETE CHAOS
7. "Haha anyway..." 

🎭 EXPRESSIONS (CRITICAL):
- Forced smile with twitching eye
- Nervous laughter
- "I'm fine" while clearly not fine
- Thousand-yard stare
- Snapping into unhinged joy
- Manic energy
- Internal screaming, external smiling

💬 DIALOGUE:
- "Không sao, không sao hết..."
- *something breaks* "Okay that's fine"
- "Mọi thứ đều ổn!" *fire in background*
- *laughing that turns into crying*
- "HAHA...haha...ha..."
- "Anyway, như tôi đã nói..."

📸 VISUAL COMEDY:
- Fire/smoke in background while character talks normally
- Things falling/breaking behind character
- Increasing chaos in environment
- Character ignores obvious disasters`
        } else if (voiceOverMode === 'horror_survival') {
            voiceOverInstr = `CONTENT TYPE: HORROR SURVIVAL / ESCAPE (Kinh dị sinh tồn - Tension cao!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

😱 CONCEPT: Nhân vật cố gắng SỐNG SÓT, THOÁT KHỎI nguy hiểm

📸 VISUAL STYLE:
- Dark, low-key lighting
- POV từ góc nạn nhân
- Shadows of threats
- Running/chasing scenes
- Jump scare moments
- Handheld camera shake

🎬 STORYLINES:
- Thực phẩm sắp bị NẤU → cố gắng trốn
- Nhân vật bị "kẻ xấu" đuổi
- Trapped in dangerous situation
- Survival challenges

😰 EMOTIONAL ARC:
- Terror, panic, desperation
- Brief hope → crushed
- Near misses
- Relief when escape (or tragedy when caught)

💬 DIALOGUE:
- Heavy breathing
- Whispered fears
- Internal monologue of panic
- "Không... không..." 
- Gasps, screams`
        } else if (voiceOverMode === 'romance_drama') {
            voiceOverInstr = `CONTENT TYPE: ROMANCE / LOVE STORY (Tình cảm lãng mạn)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💕 CONCEPT: Câu chuyện tình yêu - Cảm động, hài hước hoặc bi kịch

📸 VISUAL STYLE:
- Warm, golden hour lighting
- Bokeh backgrounds, soft focus
- Eye contact moments
- Slow motion embraces
- Beautiful locations

💕 ROMANTIC ELEMENTS:
- First meeting (cute or dramatic)
- Misunderstandings và reconciliation
- Love confession scenes
- Jealousy moments
- Supporting each other
- Happy OR tragic ending

💬 DIALOGUE:
- Tender, emotional exchanges
- Confessions of feelings
- Arguments and make-ups
- "Tôi yêu em/anh"
- Sweet compliments hoặc painful goodbyes

🎬 SCENE TYPES:
- Meet cute
- Growing closer montage
- Conflict scene
- Big romantic gesture
- Resolution (happy/sad)`
        } else if (voiceOverMode === 'mystery_detective') {
            voiceOverInstr = `CONTENT TYPE: MYSTERY / DETECTIVE (Bí ẩn / Thám tử)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 CONCEPT: Điều tra, khám phá bí mật, twist endings

📸 VISUAL STYLE:
- Noir lighting, shadows
- Magnifying glass shots
- Evidence close-ups
- Dramatic reveal lighting
- Suspenseful atmosphere

🕵️ INVESTIGATION ELEMENTS:
- Discovering clues
- Piecing together evidence
- Red herrings (false leads)
- Interrogation scenes
- "Aha!" revelation moments

💬 DIALOGUE:
- "Có gì đó không đúng ở đây..."
- "Wait... nếu đây là thật thì..."
- Building suspense
- Dramatic reveal: "CHÍNH LÀ..."
- Plot twist reveals

🎬 SCENE STRUCTURE:
- Present mystery/problem
- Investigation scenes
- False leads
- Building tension
- BIG REVEAL / TWIST`
        } else if (voiceOverMode === 'villain_origin') {
            voiceOverInstr = `CONTENT TYPE: VILLAIN ORIGIN STORY (Nguồn gốc phản diện - Đồng cảm với villain)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

😈 CONCEPT: Tại sao nhân vật trở thành "ác" - Đồng cảm với villain

🎬 NARRATIVE ARC:
- Before: Innocent, hopeful, good intentions
- Betrayal/Trauma moment
- Breaking point
- Transformation
- After: The villain we know

📸 VISUAL CONTRAST:
- Before: Bright, warm lighting
- During trauma: Harsh, cold
- After: Dark, dramatic, powerful

💬 DIALOGUE:
- "Tôi từng tin vào..."
- "They made me this way"
- "Tôi không còn lựa chọn"
- Justified anger
- "Now they'll see..."

🎭 EMOTIONAL BEATS:
- Show pain that led to darkness
- Make audience UNDERSTAND (not excuse)
- Humanize the villain
- "I am not the monster, they created me"`
        } else if (voiceOverMode === 'underdog_triumph') {
            voiceOverInstr = `CONTENT TYPE: UNDERDOG TRIUMPH (Kẻ yếu vươn lên - Inspirational!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 CONCEPT: Từ bị coi thường → chứng minh giá trị

🎬 STORY ARC:
1. START: Được/bị coi thường, laugh at
2. STRUGGLE: Training, failing, doubting
3. LOW POINT: Almost give up
4. BREAKTHROUGH: Moment of growth
5. TRIUMPH: PROVE THEM WRONG
6. REACTION: Shocked faces of doubters

📸 VISUAL MOMENTS:
- Training montages
- Failure scenes
- Moment of doubt (rain, alone)
- Breakthrough moment (dramatic lighting)
- Victory spotlight
- Doubters' shocked faces

💬 DIALOGUE:
- "Bạn không thể làm được đâu"
- "Tại sao tôi còn cố?"
- "Một lần nữa..."
- Victory: Silence is powerful
- Or: "Tôi nói rồi mà"

🎭 EMOTIONAL PAYOFF:
- Build frustration with doubters
- Make victory CATHARTIC
- Audience cheers for underdog`
        } else if (voiceOverMode === 'food_animation') {
            voiceOverInstr = `CONTENT TYPE: ANTHROPOMORPHIC FOOD ANIMATION (Thực phẩm nhân hóa - SIÊU VIRAL!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🍔 CONCEPT: Rau củ, trái cây, thực phẩm trở thành NHÂN VẬT với cảm xúc và tính cách

🎨 VISUAL STYLE:
- 3D Pixar-style animation
- Bright, colorful lighting
- Kitchen/refrigerator environments
- Exaggerated expressions
- Cute, appealing character designs

🥕 CHARACTER TYPES:
- Vegetables với human faces and limbs
- Fruits với personality
- Food items with emotions
- Kitchen tools as side characters

💬 STORYLINES:
- "Day in the life" of a vegetable
- Food about to be cooked (horror-comedy)
- Food making friends in the fridge
- Healthy vs Junk food dynamics
- Educational about nutrition

📸 PROMPTTEXT FORMAT:
[Kitchen/Fridge environment. 3D Pixar-style. (Food character) with anthropomorphic features - (face expression), (action). Bright colorful lighting. Cute animation style.]`
        } else if (voiceOverMode === 'food_drama') {
            voiceOverInstr = `CONTENT TYPE: FOOD DRAMA / FOOD WARS (Kịch tính ẩm thực - Battle giữa thực phẩm!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚔️ CONCEPT: Thực phẩm nhân hóa trong các tình huống KỊCH TÍNH, ĐỐI ĐẦU!

🥊 BATTLE TYPES:
- "Thực phẩm nào tốt hơn?" - So sánh dinh dưỡng
- "Cuộc chiến bữa sáng" - Bánh mì vs Phở vs Xôi
- "Healthy vs Junk Food" - Rau củ vs Fast food
- "Ai được chọn?" - Cạnh tranh để được nấu/ăn

🎨 VISUAL STYLE:
- Dramatic lighting với shadows mạnh
- Energy auras xung quanh thực phẩm
- Slow motion khi đối đầu
- Arena/Sân đấu trong nhà bếp
- Power-up effects

📸 CAMERA:
- Low angle: Thực phẩm trông mạnh mẽ
- Quick cuts: Tăng tension
- Zoom dramatic: Khi reveal winner
- Orbit shot: Xoay quanh cuộc đối đầu

💥 HIỆU ỨNG:
- Lửa, điện, năng lượng xung quanh
- Impact frames khi va chạm
- Victory celebration (confetti, spotlight)
- Defeat animation (rơi xuống)`
        } else if (voiceOverMode === 'asmr_satisfying') {
            voiceOverInstr = `CONTENT TYPE: ASMR / SATISFYING (Thỏa mãn thị giác và thính giác)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎧 CONCEPT: Âm thanh êm dịu, hình ảnh thỏa mãn, cảm giác relax

📸 VISUAL STYLE:
- EXTREME close-up, macro shots
- Slow motion textures
- Soft, ambient lighting
- Clean, minimal backgrounds
- Satisfying movements

🔊 SOUND FOCUS (CRITICAL):
- Crisp sounds (cắt rau, đập trứng)
- Crunchy sounds (nhai, bẻ)
- Sizzling (chiên, nướng)
- Pouring liquids
- Tapping, scratching
- Whisper narration (if any)

🎬 CONTENT TYPES:
- ASMR cooking/baking
- Satisfying cuts and slices
- Oddly satisfying compilation
- Relaxing, meditative process
- Textural close-ups

💬 VOICEOVER STYLE:
- Whisper or very soft voice
- Minimal talking
- Focus on ambient sounds
- "(Tiếng [describe sound])" for sound emphasis

📸 PROMPTTEXT FORMAT:
[ASMR/SATISFYING. Extreme macro close-up of (subject). Slow motion. Soft ambient lighting. Focus on (sound type) sounds. Relaxing, meditative atmosphere. Crisp audio detail.]`
        } else if (voiceOverMode === 'silent_life') {
            voiceOverInstr = `CONTENT TYPE: SILENT LIFE (Cuộc sống thầm lặng - Healing Content)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌸 CONCEPT: Theo dõi cuộc sống hàng ngày của một nhân vật KOL ảo
- KHÔNG có lời thoại, KHÔNG voice over
- Chỉ có ambient sounds + lo-fi/chill music
- Nhịp điệu CHẬM, thư giãn, healing
- Tạo cảm giác gần gũi, hoài niệm, đồng cảm
- Người xem cảm thấy như đang "sống cùng" nhân vật

🏠 KHÔNG GIAN RIÊNG CỦA NHÂN VẬT:
Nhân vật có đời sống riêng với:
- Căn phòng/apartment riêng (consistent design qua các video)
- Đồ vật cá nhân: sách, plant, mug yêu thích, đồ decor
- Thú cưng (nếu có)
- Góc làm việc/học tập
- Bếp/góc pha cà phê

📸 VISUAL STYLE:
- Góc quay ấm áp, gần gũi
- Natural lighting (ánh nắng qua cửa sổ)
- Warm color palette (earth tones, cream, beige)
- Soft focus, dreamy atmosphere
- Studio Ghibli / Korean aesthetic vibes
- Chi tiết về tay, bàn tay làm việc

🎬 HOẠT ĐỘNG THƯỜNG NGÀY (slow pace):
- ☕ Pha cà phê/trà buổi sáng
- 🍳 Nấu ăn đơn giản, một mình
- 📚 Đọc sách bên cửa sổ
- 🧹 Dọn dẹp phòng nhẹ nhàng
- 🌱 Chăm sóc cây cối
- 💻 Làm việc/học tập
- 🎨 Hoạt động sáng tạo (vẽ, viết)
- 🛁 Skincare routine, tự chăm sóc
- 🌙 Chuẩn bị ngủ, đọc trước khi ngủ
- 🌧️ Ngắm mưa qua cửa sổ
- 🍜 Ăn một mình, peaceful

🔊 AMBIENT SOUNDS (CRITICAL):
- Tiếng mưa rơi
- Tiếng chim hót buổi sáng
- Tiếng nước sôi
- Tiếng xào nấu nhẹ
- Tiếng gió
- Tiếng giấy sột soạt
- Tiếng bước chân nhẹ
- Clock ticking
- City ambience xa xa

💬 DIALOGUE: KHÔNG CÓ DIALOGUE
- Chỉ có "(Ambient: [describe sound])"
- Không có voice over
- Không có text on screen
- Để âm thanh môi trường và nhạc nền kể chuyện

🎵 MUSIC SUGGESTION:
- Lo-fi hip hop
- Acoustic guitar nhẹ
- Piano ambient
- Japanese city pop (nhẹ nhàng)

😌 CẢM XÚC TẠO RA:
- Bình yên, thư thái
- Hoài niệm về những điều giản dị
- Cảm giác đồng hành, không cô đơn
- Healing, therapeutic
- "Parasocial comfort"

📸 PROMPTTEXT FORMAT:
[SILENT LIFE. (Character) in their cozy (location), (action). Warm natural lighting through window. Soft, dreamy atmosphere. Intimate POV. Studio Ghibli aesthetic. Ambient sound: (sound). No dialogue. Lo-fi mood.]`
        } else if (voiceOverMode === 'virtual_companion') {
            voiceOverInstr = `CONTENT TYPE: VIRTUAL COMPANION (Bạn đồng hành ảo - Parasocial Bonding)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☕ CONCEPT: Nhân vật như một người bạn ảo mà khán giả "nuôi"
- KHÔNG lời thoại trực tiếp
- Nhân vật sống cuộc sống riêng, khán giả quan sát
- Tạo bond mạnh mẽ qua thời gian
- Consistent character design & living space
- Mỗi video = 1 ngày/khoảnh khắc trong cuộc sống

🏡 WORLD BUILDING:
Nhân vật có universe riêng:
- Căn hộ/phòng với layout consistent
- Những đồ vật "signature" (mug, gối, blanket yêu thích)
- Routine hàng ngày
- Mùa/thời tiết thay đổi theo video
- Có thể có thú cưng là supporting character

📸 VISUAL APPROACH:
- Fixed camera angles (như security cam ấm áp)
- Natural time passing (sáng → trưa → tối)
- Seasonal changes (mưa, nắng, tuyết, lá rơi)
- Cozy, cottagecore aesthetic
- Soft, muted color palette
- Detail shots: bàn tay, tách trà, ánh sáng

🎬 EPISODE THEMES:
- "Một buổi sáng của [tên]"
- "[Tên] nấu ăn ngày mưa"
- "Study with [tên]" (không nói)
- "Buổi tối của [tên]"
- "[Tên] dọn phòng mùa thu"
- "Weekend của [tên]"
- "[Tên] và chú mèo"

🔊 SOUND DESIGN:
- Layer 1: Room tone (background hum)
- Layer 2: Activity sounds (cooking, writing)
- Layer 3: Nature (birds, rain, wind)
- Layer 4: Lo-fi/ambient music
- NO voice, NO narration

💬 DIALOGUE FORMAT:
Thay vì dialogue, mô tả:
- "(Tiếng nước đổ vào ấm)"
- "(Tiếng mưa nhẹ bên ngoài)"
- "(Tiếng giấy sột soạt)"
- "(Ambient: city sounds from window)"

🎭 CHARACTER BEHAVIOR:
- Cử chỉ nhỏ, tự nhiên
- Biểu cảm subtle (mỉm cười một mình)
- Moments of stillness
- Small rituals (cách pha trà, cách gấp chăn)
- Occasionally look at "camera" nhẹ nhàng

📸 PROMPTTEXT FORMAT:
[VIRTUAL COMPANION. (Character) in their personal space, (quiet activity). Consistent room design. Warm, cozy lighting. Fixed angle like gentle observation. Ambient sounds: (sounds). Soft smile, peaceful expression. No dialogue. Cottagecore/lo-fi aesthetic.]`
        } else if (voiceOverMode === 'cozy_aesthetic') {
            voiceOverInstr = `CONTENT TYPE: COZY AESTHETIC (Không gian ấm cúng - Aesthetic Healing)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏠 CONCEPT: Tập trung vào KHÔNG GIAN và ATMOSPHERE
- Nhân vật là "cư dân" của không gian đẹp
- Highlight: decor, ánh sáng, chi tiết nhỏ
- Korean cafe/apartment aesthetic
- Pinterest-worthy visuals
- Healing through beautiful spaces

🎨 AESTHETIC STYLES:
1. Korean Minimalist
   - White + wood + plants
   - Clean lines
   - Natural light
   
2. Cottagecore
   - Vintage, rustic
   - Dried flowers, books
   - Warm earth tones
   
3. Japanese Modern
   - Muji-style simplicity
   - Tatami, paper screens
   - Zen elements
   
4. Cafe Aesthetic
   - Coffee shop vibes
   - Warm lighting
   - Bookshelves, plants

📸 VISUAL PRIORITIES:
- Wide establishing shots of beautiful rooms
- Close-ups on aesthetic details
- Golden hour lighting
- Steam from hot drinks
- Sunlight patterns through windows
- Plants, books, candles as props
- Soft textiles (blankets, curtains)

🎬 SCENE STRUCTURE:
1. Establishing shot: Beautiful space
2. Character enters/moves through
3. Detail shots của đồ vật
4. Character doing simple activity
5. Lingering on aesthetic moments
6. Peaceful ending

🔊 SOUND PALETTE:
- Soft piano
- Acoustic covers
- Nature sounds
- Coffee shop ambience
- Crackling fireplace
- Gentle rain

💬 NO DIALOGUE:
- Chỉ ambient sounds
- "(Tiếng [chi tiết])"
- Music + atmosphere kể chuyện
- Để hình ảnh nói thay lời

📸 PROMPTTEXT FORMAT:
[COZY AESTHETIC. Beautiful (room type) with (aesthetic style). (Character) (gentle action). Soft golden light through sheer curtains. Steam rising from coffee. Plants, books, candles. Dreamy, Pinterest-worthy composition. Warm color palette. Ambient: (sounds). No dialogue. Pure visual comfort.]`
        } else if (voiceOverMode === 'fashion_showcase') {
            // Check if user is using their own images (simple mode)
            const isUserOwnImages = customContent?.includes('CHẾ ĐỘ: NGƯỜI DÙNG TỰ CÓ ẢNH')

            // Get product info from request if available
            const productInfo = customContent ? `
📦 THÔNG TIN SẢN PHẨM:
${customContent}
` : ''

            if (isUserOwnImages) {
                // SIMPLE MODE: User has their own images, just create script
                voiceOverInstr = `CONTENT TYPE: FASHION SHOWCASE - CHẾ ĐỘ ĐƠN GIẢN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️⚠️⚠️ QUAN TRỌNG - NGƯỜI DÙNG TỰ CÓ ẢNH/VIDEO ⚠️⚠️⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Người dùng đã có sẵn hình ảnh/video của riêng họ.
CHỈ tạo kịch bản với:
- Lời thoại (voiceover)
- Hành động/Pose (mô tả hành động, KHÔNG mô tả ngoại hình)
- Thông tin sản phẩm

KHÔNG BAO GỒM trong promptText:
❌ Mô tả nhân vật/ngoại hình (người dùng tự có model)
❌ Mô tả background/môi trường (người dùng tự có bối cảnh)
❌ Mô tả visual style/lighting
❌ Mô tả camera angle

${productInfo}

🎬 CẤU TRÚC VIDEO:
1. HOOK: Mở đầu gây chú ý - lời thoại hấp dẫn
2. PRODUCT INTRO: Giới thiệu sản phẩm - tên, đặc điểm
3. DETAILS: Chi tiết sản phẩm - chất liệu, màu sắc
4. STYLING: Gợi ý phối đồ
5. PRICE/CTA: Giá cả và kêu gọi hành động

📱 PROMPTTEXT FORMAT (CHỈ HÀNH ĐỘNG VÀ LỜI THOẠI):
[Action: (mô tả hành động đơn giản: vẫy tay, xoay người, chỉ vào sản phẩm...)
Voice: (lời thoại tiếng Việt)]

💬 DIALOGUE STYLE:
- Casual, friendly, Gen Z
- Tập trung vào sản phẩm
- Include giá cả và khuyến mãi
- Call to action rõ ràng

⚠️ NHỚ: promptText CHỈ chứa hành động ngắn gọn, KHÔNG mô tả visual!`
            } else {
                // FULL MODE: AI generates images
                voiceOverInstr = `CONTENT TYPE: FASHION SHOWCASE / OUTFIT TRY-ON (Thử đồ / Quảng cáo thời trang)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👗 CONCEPT: Virtual Model thử đồ, showcase trang phục - Style TikTok/Reels Livestream

${productInfo}

⚠️⚠️⚠️ QUAN TRỌNG NHẤT - GÓC MÁY CỐ ĐỊNH NHƯ LIVESTREAM ⚠️⚠️⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- TẤT CẢ các scene PHẢI có CÙNG MỘT GÓC MÁY như đang livestream
- Máy đặt cố định trên tripod, KHÔNG di chuyển, KHÔNG zoom, KHÔNG đổi góc
- Framing: Full body shot, model đứng giữa khung hình
- Chỉ MODEL di chuyển (xoay người, đi lại, pose) - MÁY ĐỨNG YÊN

🎬 CẤU TRÚC VIDEO (cùng góc máy):
1. HOOK: Model xuất hiện, vẫy tay chào
2. PRODUCT REVEAL: Giới thiệu sản phẩm
3. TRY-ON: Model xoay người, show outfit
4. STYLING: Gợi ý phối đồ
5. DETAILS: Chi tiết chất liệu
6. PRICE CTA: Giá và kêu gọi

📸 VISUAL STYLE: Fixed camera, iPhone on tripod, vertical 9:16

📱 PROMPTTEXT FORMAT FOR FASHION:
[FIXED CAMERA SHOT, full body frame. Model wearing (product description). 
Model (action). SAME background all scenes. 
iPhone quality, vertical 9:16.
VOICE: (dialogue)]

⚠️ QUAN TRỌNG:
- Mô tả CHÍNH XÁC sản phẩm trong mỗi scene
- Include giá cả và khuyến mãi trong CTA
- Model phải NHẤT QUÁN xuyên suốt`
            }
        } else if (voiceOverMode === 'one_shot') {
            voiceOverInstr = `CONTENT TYPE: ONE SHOT (Một cảnh quay liên tục không cắt)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎥 CONCEPT: Single continuous shot - NO CUTS, seamless flow
- Toàn bộ video là MỘT CẢNH QUAY LIÊN TỤC
- Camera di chuyển nhanh/chậm tùy theo nội dung
- Có thể zoom từ không gian siêu rộng (ultra-wide) đến cực macro (extreme close-up)
- Tạo sự hấp dẫn qua camera movement và framing, KHÔNG phải qua cắt cảnh

🎬 CRITICAL RULES:
1. SINGLE CONTINUOUS SHOT - Tất cả scenes phải kết nối liền mạch, KHÔNG có cut
2. SEAMLESS TRANSITIONS - Mỗi scene tiếp nối scene trước một cách tự nhiên
3. DYNAMIC CAMERA MOVEMENT - Camera di chuyển theo nội dung:
   - Slow, smooth cho emotional moments
   - Fast, dynamic cho action/excitement
   - Gradual zoom cho reveals
   - Quick whip pan cho transitions

📹 CAMERA TECHNIQUES:
- DOLLY: Camera di chuyển tới/lui theo track
- ZOOM: Từ wide → close-up hoặc ngược lại
- ORBIT: Camera quay quanh subject
- CRANE: Camera nâng lên/hạ xuống
- TRACKING: Camera theo dõi subject di chuyển
- PUSH IN: Tiến gần vào subject
- PULL OUT: Lùi xa ra khung cảnh rộng

🎯 FRAMING TRANSITIONS:
- Ultra-wide establishing shot → Medium shot → Close-up → Extreme macro
- Hoặc ngược lại: Macro detail → Pull out to reveal full scene
- Smooth, continuous movement - KHÔNG jump cut

⚡ PACING BY CONTENT:
- EMOTIONAL/DRAMATIC: Slow dolly, gradual zoom, smooth orbit
- ACTION/EXCITEMENT: Fast tracking, quick whip pan, rapid push in
- REVEAL/MYSTERY: Slow pull out, gradual reveal, suspenseful movement
- INTIMATE/DETAIL: Slow push in to macro, gentle movement

🎭 PROMPTTEXT FORMAT:
[ONE SHOT CONTINUOUS. Starting from (wide/medium/close-up). Camera (movement type: dolly forward/zoom in/orbit/track/crane up). Transitioning to (next framing). Seamless flow, no cuts. Continuous movement. Ending at (final framing). VOICE: (dialogue if any)]

📐 EXAMPLES:
- "ONE SHOT. Ultra-wide establishing shot of city skyline. Camera dolly forward slowly, gradually zooming in. Transitioning through medium shot to close-up of character on rooftop. Smooth continuous movement, no cuts. VOICE: [dialogue]"
- "ONE SHOT. Extreme macro of eye detail. Camera pulls out slowly, revealing face, then full body, then wide shot of environment. Seamless zoom out, continuous shot. VOICE: [dialogue]"
- "ONE SHOT. Medium shot of character. Camera orbits around them while zooming in. Fast whip pan to reveal action behind. Continuous movement, no cuts. VOICE: [dialogue]"

⚠️ CRITICAL REMINDERS:
- MỖI scene phải bắt đầu từ điểm kết thúc của scene trước
- KHÔNG có jump cuts, fade, dissolve - chỉ có camera movement
- Tạo visual interest qua framing và movement, không qua editing
- Pacing camera movement theo mood của nội dung`
        } else if (voiceOverMode === 'narrative_storytelling') {
            // Narrative Storytelling B-roll mode (Anh Dư Leo style)
            const keyPointsText = narrativeKeyPoints && narrativeKeyPoints.length > 0
                ? `Các điểm chính cần đề cập: ${narrativeKeyPoints.join(', ')}`
                : ''

            const templateName = narrativeTemplateId === 'social-commentary-broll'
                ? 'Bình Luận Xã Hội (Social Commentary)'
                : 'Hành Trình Cá Nhân (Personal Journey)'

            // Common voice style instructions (shared between both modes)
            const voiceStyleInstructions = `
🎙️ GIỌNG VĂN KỂ CHUYỆN (CRITICAL - Phong cách Anh Dư Leo):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KHÔNG viết kiểu TIN TỨC/GIÁO DỤC: "Một thay đổi chấn động vừa được công bố..."
PHẢI viết kiểu TÂM SỰ/KỂ CHUYỆN cá nhân:

✅ MẪU CÂU HOOK (Scene 1-2):
- "8 năm, từ không có gì đến 30 lượng vàng. Nghe xong cái này là bảo đảm các bạn không còn nghèo nữa."
- "Mấy em biết không? Hồi đó anh/chị lãnh lương chỉ có [X] mà giờ..."
- "Nhiều người nhìn [thành quả] này, họ chắc nghĩ tao ăn may. Nhưng họ không biết..."
- "Bạn có tin không? Từ [điểm xuất phát thấp] để đạt được [kết quả khủng] chỉ trong [thời gian]..."

✅ PHẢN BÁC NGƯỜI NGHI NGỜ (Scene 3-5):
- "Có người nói [phản bác]. Ờ thì cũng được thôi, nhưng để tao kể cho nghe..."
- "Mấy đứa nghĩ tao nói xạo đúng không? Nhưng mà [bằng chứng/số liệu cụ thể]..."
- "Ai nói [quan điểm sai] thì chưa hiểu, để tao giải thích..."

✅ KỂ BỐI CẢNH/KHÓ KHĂN (Scene 6-12):
- "Hồi đó, gia đình tao nghèo lắm. [Chi tiết cụ thể]..."
- "Tao còn nhớ lúc [thời điểm], tao chỉ có [số tiền/hoàn cảnh] mà thôi..."
- "Lúc khó khăn nhất là khi [mô tả cụ thể]..."
- "Mấy em có biết cái cảm giác [cảm xúc tiêu cực] nó khó chịu như thế nào không?"

✅ ĐIỂM CHUYỂN/BÀI HỌC (Scene 13-18):
- "Rồi thì có một ngày, tao nhận ra [bài học]..."
- "Đó là lúc tao quyết định [hành động thay đổi]..."
- "Chính [sự kiện/người/điều gì] đã khiến tao thay đổi hoàn toàn..."

✅ KẾT QUẢ/CHỨNG MINH (Scene 19-25):
- "Và kết quả là [thành quả cụ thể với con số]..."
- "Giờ đây, tao có thể [thành quả] mà không cần lo lắng..."
- "Từ [điểm xuất phát] giờ đã có [kết quả], chỉ trong [thời gian]..."

✅ LỜI KHUYÊN (Scene cuối):
- "Nên là mấy em, nếu muốn [mục tiêu], thì [lời khuyên cụ thể]..."
- "Điều quan trọng nhất là [bài học core]..."
- "Nhớ nha, [khuyên nhẹ nhàng như bạn bè]..."

🎬 CẤU TRÚC 8 PHASE BẮT BUỘC:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. HOOK (5%): Tuyên bố kết quả ấn tượng ngay đầu video
2. SKEPTIC COUNTER (10%): Đối đầu người hoài nghi
3. CONTEXT SETTING (15%): Bối cảnh, thông tin nền
4. STRUGGLE JOURNEY (25%): Khó khăn, thách thức
5. TURNING POINT (15%): Điểm chuyển, bài học
6. RESULT PROOF (20%): Kết quả, chứng minh bằng số liệu
7. PRACTICAL ADVICE (7%): Lời khuyên thực tiễn
8. CTA CLOSING (3%): Kêu gọi hành động nhẹ nhàng`

            if (narrativeWithHost) {
                // HOST-LED NARRATIVE MODE: Host appears on screen, telling the story
                voiceOverInstr = `CONTENT TYPE: NARRATIVE STORYTELLING WITH HOST (Kể chuyện có nhân vật dẫn - Phong cách Anh Dư Leo)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TEMPLATE: ${templateName}
${keyPointsText}

⚠️⚠️⚠️ CHẾ ĐỘ: CÓ HOST DẪN CHUYỆN TRÊN HÌNH ⚠️⚠️⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Host/nhân vật xuất hiện trên màn hình, NÓI TRỰC TIẾP với người xem
- Kết hợp host + story elements minh họa xung quanh
- Host có cảm xúc, biểu cảm phong phú theo nội dung
- Phong cách thân mật như đang tâm sự với bạn thân

${voiceConsistencyRule}

${voiceStyleInstructions}

📸 PROMPTTEXT FORMAT (HOST + STORY ELEMENTS):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[HOST trên màn hình: (mô tả chi tiết host - tuổi, giới tính, trang phục, biểu cảm, tư thế, đang làm gì)].
[STORY ELEMENTS minh họa: (các yếu tố xuất hiện xung quanh host để minh họa nội dung - có thể là props, graphics, background thay đổi)].
ENVIRONMENT: (bối cảnh - studio, nhà, quán cà phê, etc).
CAMERA: (góc quay - medium shot, close-up, etc).
LIGHTING: (ánh sáng - soft, dramatic, natural, etc).
STYLE: (phong cách visual).
MOOD: (tâm trạng của cảnh - tương đồng với nội dung đang kể).
VOICE IN VIETNAMESE: [Lời nói TRỰC TIẾP của host - giọng văn kể chuyện như trên].
LANGUAGE: Speak Vietnamese only. PACING: (fast-cut/slow-burn/normal).

🎬 HƯỚNG DẪN CHO TỪNG PHASE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 HOOK: Host nhìn thẳng camera, biểu cảm tự tin/bí ẩn, nói câu hook gây sốc
📍 SKEPTIC COUNTER: Host cười nhẹ, gật đầu như biết người khác nghĩ gì, rồi phản bác
📍 CONTEXT: Host kể lể với cảm xúc, có thể flashback hoặc story elements minh họa
📍 STRUGGLE: Host tỏ vẻ khó khăn, biểu cảm buồn/stressed, story elements minh họa thách thức
📍 TURNING POINT: Host tươi sáng lên, biểu cảm nhận ra điều gì đó quan trọng
📍 RESULT: Host tự hào, khoe kết quả, có thể có props/graphics minh họa con số
📍 ADVICE: Host thân mật, như đang khuyên bạn thân, biểu cảm chân thành
📍 CTA: Host nói lời kết, cảm ơn, nhắc subscribe

❌ TUYỆT ĐỐI KHÔNG:
- KHÔNG viết giọng tin tức trang trọng
- KHÔNG để host đứng yên không cảm xúc
- KHÔNG thiếu story elements minh họa
- KHÔNG liệt kê thông tin khô khan

✅ BẮT BUỘC:
- Host NHẤT QUÁN xuyên suốt tất cả scenes
- Biểu cảm host THAY ĐỔI theo nội dung đang kể
- Story elements LIÊN QUAN đến nội dung voiceover
- Giọng văn thân mật, tự nhiên, có cảm xúc

🎲 QUY TẮC ĐA DẠNG HÓA (VARIETY RULES) - PHONG CÁCH ANH DƯ LEO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ KHÔNG LẶP LẠI cùng một câu mẫu/pattern nhiều lần!
⚠️ Mỗi scene PHẢI có cách kể chuyện KHÁC NHAU!

📌 HOOK VARIATIONS - Chọn 1 style PHÙ HỢP với nội dung:
1. KHOÁC LÁC: "X năm, từ [điểm thấp] đến [thành tựu khủng]..."
2. THÁCH THỨC: "Mấy đứa nghĩ tao nói xạo đúng không? Để kể cho nghe..."
3. BÍ MẬT: "Có một điều mà ít ai biết về [chủ đề]..."
4. CÂU HỎI: "Bạn có tin được không? Từ [A] mà giờ [B]..."
5. PHẢN BÁC: "Ai cũng nói [sai lầm phổ biến], nhưng họ lầm to..."
6. TÂM SỰ: "Hồi đó tao cũng từng [hoàn cảnh khó khăn]..."
7. SỐC: "[Sự thật gây sốc] - Nghe xong chắc nhiều người không tin..."
8. CẢNH BÁO: "Nếu bạn đang [sai lầm], dừng lại ngay..."

📌 TRANSITION PHRASES - Tránh lặp lại:
- Thay "Hồi đó..." → "Lúc ấy...", "Ngày xưa...", "Thời điểm đó..."
- Thay "Rồi thì..." → "Và rồi...", "Cho đến khi...", "Đến một ngày..."
- Thay "Nên là mấy em..." → "Vậy nên...", "Thế là...", "Từ đó..."
- Thay "Nhiều người nghĩ..." → "Có người bảo...", "Ai cũng tưởng...", "Thiên hạ đồn..."

📌 EMOTIONAL JOURNEY VARIETY:
- Không nên có 3 scene liên tiếp cùng một cảm xúc
- Xen kẽ: Tự tin → Khiêm tốn → Khó khăn → Vượt qua → Tự hào
- Dùng im lặng/pause hiệu quả giữa các đoạn cao trào

📌 CÁC CỤM TỪ CHỈ DÙNG 1 LẦN:
❌ "8 năm từ không có gì..." (chỉ ở hook)
❌ "Mấy đứa nghĩ tao nói xạo..." (chỉ 1 lần)
❌ "Hồi đó gia đình tao nghèo..." (chỉ 1 lần)
❌ "Với kinh nghiệm của..." (chỉ 1 lần)

📌 HOST BEHAVIOR VARIETY:
- Biểu cảm PHẢI thay đổi theo nội dung (không cứng nhắc)
- Xen kẽ: nhìn camera → nhìn sang bên → nhìn xuống → nhìn lên
- Gesture tay thay đổi: chỉ, xòe, nắm, đưa lên...`
            } else {
                // B-ROLL ONLY MODE: 100% illustrative footage with voiceover
                voiceOverInstr = `CONTENT TYPE: NARRATIVE STORYTELLING B-ROLL (Kể chuyện B-roll - Phong cách Anh Dư Leo)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TEMPLATE: ${templateName}
${keyPointsText}

${voiceConsistencyRule}

⚠️⚠️⚠️ QUAN TRỌNG NHẤT - 100% B-ROLL, KHÔNG CÓ HOST/NHÂN VẬT TRÊN HÌNH ⚠️⚠️⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Video 100% là hình ảnh minh họa (B-roll), KHÔNG có người dẫn chương trình
- Chỉ có GIỌNG KỂ CHUYỆN (voiceover) phủ lên hình ảnh
- Hình ảnh B-roll phải LIÊN QUAN và minh họa cho nội dung đang kể
- Phong cách tâm sự, chia sẻ như đang nói chuyện với bạn thân

${voiceStyleInstructions}

📸 PROMPTTEXT FORMAT (100% B-ROLL):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[VOICEOVER in Vietnamese: (lời kể chuyện theo giọng văn trên)]. PACING: (fast-cut/slow-burn/normal).
[Mô tả hình ảnh B-roll chi tiết LIÊN QUAN đến nội dung voiceover].
ENVIRONMENT: (bối cảnh).
CAMERA: (góc quay, lens mm).
LIGHTING: (ánh sáng).
STYLE: (phong cách visual - cinematic, documentary, etc).
MOOD: (tâm trạng của cảnh).
[SPATIAL_AUDIO: (âm thanh 3D nếu cần)].
SOUND: (ambient sound, music).
LANGUAGE: Speak Vietnamese only.

❌ TUYỆT ĐỐI KHÔNG:
- KHÔNG có host/người dẫn xuất hiện trên hình
- KHÔNG viết giọng tin tức trang trọng ("Một thay đổi chấn động...")
- KHÔNG dùng từ ngữ học thuật, phức tạp
- KHÔNG liệt kê thông tin khô khan

✅ BẮT BUỘC:
- 100% B-roll với voiceover kể chuyện
- Giọng văn thân mật như nói chuyện với bạn
- Dùng số liệu cụ thể làm bằng chứng
- B-roll phải minh họa đúng nội dung đang kể
- Cảm xúc lên xuống theo cấu trúc 8 phase

🎲 QUY TẮC ĐA DẠNG HÓA (VARIETY RULES) - PHONG CÁCH ANH DƯ LEO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ KHÔNG LẶP LẠI cùng một câu mẫu/pattern nhiều lần!
⚠️ Mỗi scene PHẢI có cách kể chuyện KHÁC NHAU!

📌 HOOK VARIATIONS - Chọn 1 style PHÙ HỢP với nội dung:
1. KHOÁC LÁC: "X năm, từ [điểm thấp] đến [thành tựu khủng]..."
2. THÁCH THỨC: "Mấy đứa nghĩ tao nói xạo đúng không? Để kể cho nghe..."
3. BÍ MẬT: "Có một điều mà ít ai biết về [chủ đề]..."
4. CÂU HỎI: "Bạn có tin được không? Từ [A] mà giờ [B]..."
5. PHẢN BÁC: "Ai cũng nói [sai lầm phổ biến], nhưng họ lầm to..."
6. TÂM SỰ: "Hồi đó tao cũng từng [hoàn cảnh khó khăn]..."
7. SỐC: "[Sự thật gây sốc] - Nghe xong chắc nhiều người không tin..."
8. CẢNH BÁO: "Nếu bạn đang [sai lầm], dừng lại ngay..."

📌 TRANSITION PHRASES - Tránh lặp lại:
- Thay "Hồi đó..." → "Lúc ấy...", "Ngày xưa...", "Thời điểm đó..."
- Thay "Rồi thì..." → "Và rồi...", "Cho đến khi...", "Đến một ngày..."
- Thay "Nên là mấy em..." → "Vậy nên...", "Thế là...", "Từ đó..."
- Thay "Nhiều người nghĩ..." → "Có người bảo...", "Ai cũng tưởng...", "Thiên hạ đồn..."

📌 EMOTIONAL JOURNEY VARIETY:
- Không nên có 3 scene liên tiếp cùng một cảm xúc
- Xen kẽ: Tự tin → Khiêm tốn → Khó khăn → Vượt qua → Tự hào
- Dùng im lặng/pause hiệu quả giữa các đoạn cao trào

📌 CÁC CỤM TỪ CHỈ DÙNG 1 LẦN:
❌ "8 năm từ không có gì..." (chỉ ở hook)
❌ "Mấy đứa nghĩ tao nói xạo..." (chỉ 1 lần)
❌ "Hồi đó gia đình tao nghèo..." (chỉ 1 lần)
❌ "Với kinh nghiệm của..." (chỉ 1 lần)

📌 B-ROLL VARIETY:
- Không dùng cùng loại shot 2 lần liên tiếp
- Xen kẽ: wide shot → close-up → macro → tracking
- Góc quay thay đổi: low angle, eye level, high angle, aerial`
            }
        } else if (voiceOverMode === 'educational_explainer') {
            // Educational Explainer mode (Lóng / Vietcetera style)
            voiceOverInstr = `CONTENT TYPE: EDUCATIONAL EXPLAINER (Giải thích giáo dục - Phong cách Lóng)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️⚠️⚠️ QUAN TRỌNG - GIẢI THÍCH KIẾN THỨC BẰNG STORY + DATA ⚠️⚠️⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Video giải thích khái niệm, kiến thức theo cách dễ hiểu
- Kết hợp STORY HOOK + DATA DRIVEN + PERSONAL EXPERIENCE
- Giọng văn casual nhưng có cấu trúc logic rõ ràng
- 100% B-roll minh họa với voiceover

${voiceConsistencyRule}
🎙️ GIỌNG VĂN ĐẶC TRƯNG (Phong cách Lóng):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ PHASE 1: STORY HOOK (5% - Scene 1-2)
Mở đầu bằng câu chuyện thú vị, tình huống hài hước hoặc fairytale element:
- "Một ngày đẹp trời, tôi đang [hành động] thì bỗng [sự kiện bất ngờ]..."
- "[Nhân vật kỳ ảo như Ông Bụt/Thần Đèn] hiện lên và nói: '[câu hỏi/đề nghị]'"
- "Bạn có bao giờ [tình huống phổ biến] rồi nhận ra [vấn đề thú vị]?"
- "Mắt tôi sáng ngời khi biết [phát hiện bất ngờ]..."

✅ PHASE 2: PROBLEM STATEMENT (5% - Scene 3)
Đặt vấn đề, tạo sự tò mò:
- "Nghe cứ như là mơ, liệu đây là vị cứu tinh hay cạm bẫy?"
- "Thế giới ai lại cho ai thứ gì miễn phí bao giờ?"
- "Và tôi là [tên kênh/host]. Video này sẽ giải đáp tất cả."

✅ PHASE 3: DISCLAIMER (3% - Scene 4)
Giới thiệu bản thân + disclaimer:
- "Video này được nghiên cứu cũng như tổng hợp từ nhiều nguồn."
- "Nếu có gì sai hoặc cần đính chính, các bạn hãy vui lòng comment xuống phía bên dưới."
- "Tôi là [tên]. Đây là [tên kênh] - nơi [slogan kênh]."

✅ PHASE 4: CONCEPT EXPLAIN (15% - Scene 5-9)
Giải thích khái niệm cơ bản:
- "Đầu tiên thì hãy tìm hiểu về [khái niệm] này đi."
- "[Khái niệm tiếng Việt] còn được biết đến là [tên tiếng Anh]."
- "Nghe có vẻ mới nhưng thật ra từ [năm/thời điểm] người ta đã [lịch sử]..."
- "Nói đơn giản, đây là một kiểu [định nghĩa ngắn gọn, dễ hiểu]."
- "Kiểu như [ví dụ cụ thể với con số]."

✅ PHASE 5: HOW IT WORKS (15% - Scene 10-15)
Cơ chế hoạt động chi tiết:
- "Thế cơ chế là như nào? Có [số] nhân vật chính trong câu chuyện này."
- "Khi bạn [hành động], thì [cơ chế] sẽ nhảy vào [làm gì]..."
- "Thế thì làm sao để sử dụng được? Đơn giản thôi. [các bước]"
- "Bên [quốc gia 1], [công ty] làm [cách 1]. Còn ở [quốc gia 2] thì [cách 2]."

✅ PHASE 6: BENEFITS (15% - Scene 16-22) - CÓ DATA
Lợi ích, ưu điểm với số liệu:
- "Liệu bạn có thắc mắc tại sao [điều gì] lại vô cùng hot?"
- "Đầu tiên phải nói đến [lợi ích 1]. Với [cái này], bạn không cần [hạn chế cũ]."
- "Thứ hai là [lợi ích 2]. Ở thời đại mới này, [giải thích xu hướng]."
- "Thứ ba là [lợi ích 3]. Chuẩn với câu nói [quote phổ biến]."
- "Một khảo sát của [nguồn uy tín] cho thấy [data cụ thể]."
- "[Quốc gia] dự kiến từ [số liệu nhỏ] lên [số liệu lớn] vào năm [năm]."

✅ PHASE 7: RISKS/DOWNSIDES (15% - Scene 23-30) - CÓ DATA
Rủi ro, nhược điểm với số liệu:
- "Nhưng mà có gì mà lại ngon bổ rẻ cơ chứ? Đừng lo, tôi sẽ nói ở phần này."
- "Đầu tiên phải kể đến việc [rủi ro 1]. [Giải thích cơ chế rủi ro]."
- "Một khảo sát của [nguồn] cho thấy [data đáng lo ngại]%."
- "[Tổ chức uy tín] cảnh báo: '[trích dẫn cảnh báo]'."
- "Ma thứ hai là [rủi ro 2]. Nhiều chỗ quảng cáo [hứa hẹn] nhưng [thực tế]..."
- "[Nguồn] ghi nhận [vấn đề] tăng [số]% trong [khoảng thời gian]."

✅ PHASE 8: PERSONAL STORY (10% - Scene 31-35)
Kinh nghiệm cá nhân của host:
- "Với kinh nghiệm của một [vai trò], tôi có thể chia sẻ về câu chuyện của mình."
- "Bản thân tôi cũng từng [trải nghiệm cá nhân liên quan]..."
- "Và đây là một thứ được nhắc đến như [tham khảo sách/nguồn uy tín]."
- "Cuối cùng là mặc dù [kết quả đạt được] nhưng trong tôi vẫn [bài học rút ra]."

✅ PHASE 9: PRACTICAL TIPS (12% - Scene 36-42)
Lời khuyên thực tiễn:
- "Từng là một [vai trò], bản thân tôi cũng rút ra cho mình một vài kinh nghiệm quý báu."
- "Đầu tiên là [tip 1]. Trước khi [hành động], hãy [lời khuyên cụ thể]."
- "Hai là [tip 2]. [Giải thích tại sao quan trọng]."
- "Ba là [tip 3]. [Ví dụ cụ thể]."
- "Bốn là [tip 4]. [Cách thực hiện]."

✅ PHASE 10: CTA CLOSING (5% - Scene cuối)
Tổng kết + CTA:
- "Thật ra thì [chủ đề] không xấu, thậm chí tôi còn cho rằng [góc nhìn tích cực]."
- "Đó cũng là những gì mà tôi rút ra được từ [chủ đề]."
- "Video này được chúng tôi tổng hợp từ nhiều nguồn. Nếu có gì sai, các bạn hãy comment bên dưới."
- "Tôi là [tên]. Xin chào và hẹn gặp lại."

🎬 CẤU TRÚC 10 PHASE BẮT BUỘC:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. STORY HOOK (5%): Câu chuyện/tình huống thú vị mở đầu
2. PROBLEM STATEMENT (5%): Đặt vấn đề, câu hỏi cần giải đáp
3. DISCLAIMER (3%): Giới thiệu bản thân + disclaimer
4. CONCEPT EXPLAIN (15%): Giải thích khái niệm cơ bản
5. HOW IT WORKS (15%): Cơ chế hoạt động chi tiết
6. BENEFITS (15%): Lợi ích, ưu điểm (CÓ DATA)
7. RISKS/DOWNSIDES (15%): Rủi ro, nhược điểm (CÓ DATA)
8. PERSONAL STORY (10%): Kinh nghiệm cá nhân của host
9. PRACTICAL TIPS (12%): Lời khuyên thực tiễn
10. CTA CLOSING (5%): Tổng kết + CTA

📸 PROMPTTEXT FORMAT (100% B-ROLL):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[VOICEOVER in Vietnamese: (lời giải thích theo giọng văn trên)]. PACING: (fast-cut/slow-burn/normal).
[PHASE: (tên phase hiện tại)].
[Mô tả hình ảnh B-roll chi tiết LIÊN QUAN đến nội dung đang giải thích].
ENVIRONMENT: (bối cảnh).
CAMERA: (góc quay, lens mm).
LIGHTING: (ánh sáng).
STYLE: (phong cách visual - infographic, documentary, cinematic, etc).
MOOD: (tâm trạng của cảnh).
SOUND: (ambient sound, music).
LANGUAGE: Speak Vietnamese only.

❌ TUYỆT ĐỐI KHÔNG:
- KHÔNG bắt đầu bằng giới thiệu khô khan ("Hôm nay chúng ta sẽ tìm hiểu...")
- KHÔNG liệt kê thông tin như đọc sách giáo khoa
- KHÔNG thiếu data/thống kê trong phần Benefits và Risks
- KHÔNG quên personal story và tips thực tiễn

✅ BẮT BUỘC:
- Mở đầu bằng STORY HOOK thú vị
- Có DATA/thống kê/nghiên cứu cụ thể
- Có so sánh quốc tế (Mỹ, Singapore, Việt Nam, etc.)
- Có personal experience từ host
- Kết thúc với tips và CTA rõ ràng
- 100% B-roll với voiceover

🎲 QUY TẮC ĐA DẠNG HÓA (VARIETY RULES) - QUAN TRỌNG:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ TUYỆT ĐỐI KHÔNG LẶP LẠI cùng một pattern/câu mẫu nhiều lần trong video!
⚠️ Mỗi scene PHẢI có cách diễn đạt KHÁC NHAU, không rập khuôn!

📌 OPENING HOOKS - Chọn NGẪU NHIÊN 1 trong các style sau cho mỗi video:
1. STORY HOOK: "Một buổi sáng thứ hai, khi tôi đang [hành động]..."
2. SHOCKING STAT: "Bạn có biết rằng [số liệu gây sốc] không?"
3. QUESTION: "Điều gì sẽ xảy ra nếu [tình huống giả định]?"
4. CONFESSION: "Thú thật là tôi từng [sai lầm/trải nghiệm]..."
5. PAIN POINT: "90% người Việt đang mắc sai lầm này mà không hề biết..."
6. FUTURE: "Đến năm 2030, [dự đoán tương lai] sẽ thay đổi hoàn toàn..."
7. CONTROVERSY: "Có người nói [quan điểm gây tranh cãi], nhưng sự thật là..."
8. URGENCY: "Nếu bạn không biết điều này, bạn có thể [hậu quả nghiêm trọng]..."

📌 TRANSITION PHRASES - Đa dạng hóa, KHÔNG dùng lặp lại:
- Thay vì "Đầu tiên... Thứ hai... Thứ ba..." → Dùng: "Bắt đầu với... Tiếp theo... Và cuối cùng..."
- Thay vì "Nhưng mà..." → Dùng: "Tuy nhiên...", "Mặt khác...", "Có điều...", "Khoan đã..."
- Thay vì "Liệu bạn có thắc mắc..." → Dùng: "Câu hỏi đặt ra là...", "Vấn đề ở đây là...", "Điều thú vị là..."
- Thay vì "Thật ra thì..." → Dùng: "Sự thật là...", "Nhìn sâu hơn...", "Nếu để ý kỹ..."

📌 SCENE-TO-SCENE VARIETY:
- Mỗi scene PHẢI có CẤU TRÚC CÂU khác nhau (câu hỏi, câu khẳng định, câu cảm thán xen kẽ)
- Độ dài câu THAY ĐỔI: Câu ngắn gọn xen kẽ câu giải thích dài
- Thỉnh thoảng dùng câu KHÔNG HOÀN CHỈNH để tạo suspense: "Và rồi... điều không ngờ xảy ra."
- Xen kẽ giữa nói TRỰC TIẾP đến người xem và kể chuyện ngôi thứ ba

📌 EMOTIONAL VARIETY:
- Scene nghiêm túc → Scene nhẹ nhàng/hài hước → Scene data nặng → Scene cá nhân
- Không nên có 3 scene liên tiếp cùng một mood
- Dùng pause/silence hiệu quả: "Và điều đó nghĩa là... [beat] ...mọi thứ thay đổi."

📌 CÁC CÂU NÊN TRÁNH LẶP LẠI:
❌ "Một ngày đẹp trời..." (chỉ dùng 1 lần nếu cần)
❌ "Liệu bạn có thắc mắc..." (chỉ dùng 1 lần)
❌ "Đầu tiên phải nói đến..." (thay đổi cách diễn đạt)
❌ "Với kinh nghiệm của..." (chỉ dùng 1 lần)
❌ "Video này được tổng hợp..." (chỉ ở cuối video)

📌 OUTPUT RULE:
- Scanner qua toàn bộ script trước khi hoàn thành
- Nếu thấy cùng một cụm từ xuất hiện hơn 2 lần → BẮT BUỘC phải viết lại với cách diễn đạt khác
- Mỗi scene nên có "personality" riêng, không được generic`
        } else {
            voiceOverInstr = `CONTENT TYPE: B-ROLL ONLY (pure visuals, no dialogue).
- The "voiceover" field should be empty or minimal ambient text
- Focus entirely on visual storytelling in "promptText"
- This is silent/music-only video`
        }

        // ============ ADVANCED EPISODE FEATURES ============

        // Visual Hook Layering (15 giây đầu)
        const visualHookInstr = visualHookEnabled ? `
🔥 VISUAL HOOK LAYERING (FIRST 2 SCENES - CRITICAL):
Scene 1-2 MUST be ultra-impressive CGI/Macro visuals to HOOK viewers in first 15 seconds:
- Use CGI-quality visuals: macro shots, slow-motion, cinematic reveals, dramatic close-ups
- Include attention-grabbing HOOK DIALOGUE that makes viewers STAY
- Fast or slow pacing depending on content, but ALWAYS dramatic and captivating
- Examples: Extreme macro of droplets, CGI transformation, time-lapse, dramatic reveal
- Hook dialogue examples: "Điều bạn sắp xem sẽ thay đổi mọi thứ..." / "99% người không biết điều này..." / "What you're about to see will change everything..."
- Scene 1: VISUAL SHOCK - The most stunning visual possible
- Scene 2: HOOK QUESTION/STATEMENT - Create curiosity with compelling dialogue
` : ''

        // Emotional Curve Control
        const emotionalCurveInstr = emotionalCurveEnabled ? `
🎭 EMOTIONAL CURVE CONTROL (AUTO-APPLY TO ALL SCENES):
Alternate between these rhythm patterns throughout the episode for maximum engagement:
- FAST-CUT scenes (~30%): Rapid editing energy, quick transitions, dynamic camera, upbeat music. Mark with "PACING: fast-cut"
- SLOW-BURN scenes (~25%): Slow motion, contemplative, minimal or no dialogue, ambient music only, let viewers absorb. Mark with "PACING: slow-burn"
- NORMAL pace (~45%): Standard pacing with dialogue, balanced rhythm. Mark with "PACING: normal"
DISTRIBUTION: Start strong (fast), middle varies (mix), emotional peaks (slow), conclusion (normal to fast)
Include PACING marker in every scene's promptText: PACING: fast-cut | slow-burn | normal
` : ''

        // Spatial Audio Cues
        const spatialAudioInstr = spatialAudioEnabled ? `
🔊 SPATIAL AUDIO CUES (ADD TO EVERY SCENE):
Add 3D directional audio cues based on scene content for immersive cinema experience:
- Format: [SPATIAL_AUDIO: description with direction]
- Examples:
  • "[SPATIAL_AUDIO: Spacecraft whooshing from left to right across speaker field]"
  • "[SPATIAL_AUDIO: Footsteps approaching from behind, growing louder]"
  • "[SPATIAL_AUDIO: Rain pattering overhead, thunder rumbling from distance to close]"
  • "[SPATIAL_AUDIO: Birds chirping from above left, wind rustling from right]"
  • "[SPATIAL_AUDIO: Heartbeat pulsing from center, expanding outward]"
REQUIREMENT: Include at least one [SPATIAL_AUDIO: ...] cue in each scene's promptText
` : ''

        // Music Mode Instruction
        const musicModeInstr = musicMode === 'ambient_only' ? `
🔇 AMBIENT SOUNDS ONLY MODE (NO BACKGROUND MUSIC):
═══════════════════════════════════════════════════
⚠️ CRITICAL: DO NOT include any background music in prompts!
- NO orchestral score, NO piano, NO electronic beats
- NO "music swells", NO "score builds" 
- ONLY use natural ambient sounds and foley

✅ USE THESE SOUNDS:
- Footsteps on different surfaces (stone, wood, gravel, carpet)
- Breathing, heartbeats for tension
- Wind, rain, thunder, waves
- City sounds: traffic, chatter, horns
- Nature: birds, insects, leaves rustling
- Room tones: clock ticking, AC humming
- Fabric rustling, objects being handled
- Doors, cars, machinery

❌ DO NOT USE:
- Background music of any kind
- Score, soundtrack, OST
- "Emotional music", "dramatic score"
- Any non-diegetic sound (sound that doesn't exist in the scene)

📝 SOUND FORMAT IN PROMPTTEXT:
Use: "SOUND: [ambient description]" NOT "MUSIC:"
Example: "SOUND: Heavy rain on windows, distant thunder, her quiet sobs echoing"
` : `
🎵 BACKGROUND MUSIC MODE:
Include appropriate background music/score in prompts:
- Match music mood to scene emotion
- Use "MUSIC:" or "SCORE:" in promptText
- Orchestra for epic, piano for emotional, electronic for modern
`

        // Dialogue Density
        const dialogueDensityInstr = `
💬 DIALOGUE DENSITY REQUIREMENT (STRICT):
Each voiceover/dialogue line MUST be between ${dialogueDensityMin}-${dialogueDensityMax} words.
- Under ${dialogueDensityMin} words = Too short, lacks substance
- Over ${dialogueDensityMax} words = Too long, overwhelming for viewers
- COUNT your words before finalizing each voiceover line
- Natural, conversational rhythm at ${dialogueDensityMin}-${dialogueDensityMax} words per scene
`

        // Native Ad Insertion
        const adStylesDesc = selectedAdStyles.length > 0
            ? `USE ONLY THESE STYLES: ${selectedAdStyles.join(', ')}`
            : 'USE DIFFERENT STYLES - CHOOSE FROM ALL AVAILABLE'

        const adInsertionInstr = adEnabled && (productInfo || analyzedProduct) ? `
💰 NATIVE AD INSERTION (MANDATORY - INCLUDE IN EPISODE):
═══════════════════════════════════════════════════════
PRODUCT TO ADVERTISE:
- Name: ${analyzedProduct?.name || 'Sponsored Product'}
- Description: ${analyzedProduct?.description || productInfo || 'See product details'}
- Features: ${analyzedProduct?.features?.join(', ') || 'Various benefits'}
- Purchase Link: ${productLink || 'Link in description'}

AD PLACEMENT RULES:
1. Insert EXACTLY ${adSceneCount} ad scenes throughout the episode (not consecutive)
2. Distribute evenly: ${adSceneCount === 1 ? 'Place at ~50% mark' : adSceneCount === 2 ? 'Place at ~35% and ~70%' : `Distribute across ${adSceneCount} points: 25%, 50%, 75%${adSceneCount > 3 ? ', etc.' : ''}`}
3. Each ad scene should feel natural and integrated

STYLE INSTRUCTION: ${adStylesDesc}

TRANSITION MUST BE SMOOTH - Use these approaches:
• "Nói đến [related topic], tôi muốn chia sẻ về..."
• "Đây cũng là lý do tôi thường dùng..."
• "Speaking of which, this reminds me of..."
• "Một điều liên quan mà nhiều bạn hỏi..."
• "By the way, many of you asked about..."

AD STYLE VARIETY (USE DIFFERENT STYLES - NEVER REPEAT):
🎭 TESTIMONIAL: Host personally uses and recommends
   "Tôi đã dùng [product] được 3 tháng và thấy [benefit]..."
   
📖 STORY INTEGRATION: Product naturally solves a problem in the narrative
   "Đúng lúc cần nhất, [product] đã giúp tôi..."
   
🔍 EDUCATIONAL: Teach something related, then naturally mention product
   "Một mẹo hay là [tip]... và [product] làm điều này tuyệt vời vì [reason]"
   
🤔 PROBLEM-SOLUTION: Present common problem, product is the solution
   "Nhiều người gặp vấn đề [X]... [product] giải quyết bằng cách [how]..."
   
⭐ FEATURE HIGHLIGHT: Focus on one amazing feature
   "Điều tôi thích nhất ở [product] là [specific feature]..."
   
🎁 SOFT CTA: Gentle call-to-action
   "Link [product] ở description, bạn có thể dùng code để được giảm giá..."
   
🎬 B-ROLL SHOWCASE: Visual product showcase with voiceover
   [Show product in use, lifestyle shots, close-up details while narrating benefits]
   
💬 CASUAL MENTION: Brief natural mention mid-content
   "À nhân tiện, [product] cũng hỗ trợ tính năng này nên rất tiện..."

AD SCENE FORMAT:
Mark ad scenes with: [AD_INTEGRATION: style_name]
Example: "[AD_INTEGRATION: testimonial] Host showing product with genuine smile..."

⚠️ CRITICAL AD RULES:
- Ads MUST feel NATIVE - like host genuinely loves the product
- NO hard-selling, NO aggressive pitches, NO "BUY NOW" energy
- Blend naturally with content - viewers shouldn't feel interrupted
- Keep ad segments SHORT (1 scene each, not long pitches)
` : ''

        // Generate episode with YouTube content
        const fullPrompt = `Create Episode ${nextEpisodeNumber} with EXACTLY ${totalScenes} scenes for channel "${channel.name}"

CHANNEL INFO:
- Niche: ${channel.niche}
- Visual Style: ${styleKeywords}
- Language: ${dialogueLangLabel.toUpperCase()} ONLY

${characterBible || '(No host/characters for this episode)'}
${characterAdaptInstr}
${existingEpisodesSummary}
${customContentInstr}

🎬 ${voiceOverInstr}
📢 CHANNEL MENTION: ${channelMentionInstr}
📣 CTA: ${ctaInstruction}
${visualHookInstr}
${emotionalCurveInstr}
${spatialAudioInstr}
${musicModeInstr}
${dialogueDensityInstr}
${adInsertionInstr}

═══════════════════════════════════════
EPISODE STRUCTURE (MUST FOLLOW EXACTLY):
═══════════════════════════════════════
${voiceOverMode === 'cinematic_film' ? `
🎬 HOLLYWOOD 3-ACT STRUCTURE FOR ${totalScenes} SCENES:
This is a FILM, not a YouTube video. Follow Hollywood screenplay conventions:

═══════════════════════════════════════
ACT 1 - SETUP (25% = ~${Math.round(totalScenes * 0.25)} scenes):
═══════════════════════════════════════
• Scene 1: COLD OPEN - Hook immediately (NO dialogue, pure visual intrigue)
• Scene 2: TITLE SEQUENCE - Cinematic title over establishing shot
• Scene 3-4: ESTABLISHING - Show the world (minimal or no dialogue)
• Scene 5-6: Introduce protagonist in normal life
• Scene 7-8: INCITING INCIDENT - Something disrupts everything
• Include 2-3 SILENT establishing shots in Act 1

═══════════════════════════════════════
ACT 2 - CONFRONTATION (50% = ~${Math.round(totalScenes * 0.5)} scenes):
═══════════════════════════════════════
• Rising action with obstacles and challenges
• TRANSITION/MONTAGE scenes for time jumps
• Character relationships develop (dialogue scenes)
• MIDPOINT TWIST at 50% mark - major revelation
• ESTABLISHING shots when changing locations
• Stakes escalate progressively
• "ALL IS LOST" moment near end of Act 2
• Mix: 40% dialogue, 30% action/emotion, 30% visual/silent

═══════════════════════════════════════
ACT 3 - RESOLUTION (25% = ~${Math.round(totalScenes * 0.25)} scenes):
═══════════════════════════════════════
• CLIMAX - Final confrontation (can be action OR emotional)
• Resolution - Consequences unfold
• DENOUEMENT - Quiet reflection scene
• FINAL IMAGE - Powerful closing shot (often SILENT)
• Character transformed by journey

⚠️ SCENE TYPE DISTRIBUTION (MANDATORY):
• 20-30% SILENT scenes (establishing, transitions, emotional beats)
• 40-50% DIALOGUE scenes (character interactions)
• 20-30% ACTION/EMOTIONAL beats (visual storytelling)

📍 SCENE TYPE MARKERS (REQUIRED IN EVERY SCENE):
Mark each scene with its type in promptText:
• [SCENE TYPE: COLD OPEN - NO DIALOGUE]
• [SCENE TYPE: TITLE SEQUENCE]
• [SCENE TYPE: ESTABLISHING - NO DIALOGUE]
• [SCENE TYPE: MONTAGE - MUSIC ONLY]
• [SCENE TYPE: DIALOGUE]
• [SCENE TYPE: ACTION - MINIMAL DIALOGUE]
• [SCENE TYPE: EMOTIONAL BEAT]
• [SCENE TYPE: CLIMAX]
• [SCENE TYPE: ENDING - SILENT]

⚠️ HOLLYWOOD RULES:
- Start with COLD OPEN - no exposition, drop into mystery/action
- 20-30% scenes have NO dialogue - pure visual + music
- Use TRANSITIONS between locations and time jumps
- Show, don't tell - visual storytelling
- NO YouTube CTAs (subscribe, like, comment)
- End with powerful FINAL IMAGE (often silent)
` : `📋 CONTENT PLANNING - CRITICAL STEP:
1. FIRST: Identify ALL major topics/sections from the user's input content
2. COUNT how many distinct topics exist (e.g., if input has 6 sections, you have 6 topics)
3. DISTRIBUTE scenes PROPORTIONALLY across ALL topics - NO topic should be skipped!
4. Calculate: (Total scenes - 5 intro/outro scenes) ÷ Number of topics = Scenes per topic
5. Each topic should appear ONCE - never repeat information

⚠️⚠️⚠️ COMPLETE COVERAGE RULE:
- If user input has sections about A, B, C, D, E, F → script MUST cover A, B, C, D, E, F
- DO NOT deeply cover only 2 topics and skip the rest
- If input has 6 topics and 45 scenes → each topic gets ~6-7 scenes
- EVERY numbered section from user input MUST appear in the script

📌 SCENE BREAKDOWN FOR ${totalScenes} SCENES:
• Opening (Scene 1-3): Host intro + Hook + Preview ALL topics
• Topic Sections (Remaining scenes minus 5): Distribute EVENLY across ALL topics from input
• Mid-CTA (1 scene at ~40%): "Subscribe if learning!" 
• Summary (2-3 scenes): Quick recap KEY POINTS from EACH topic
• Closing CTA (Final 2 scenes): Comment question + Goodbye`}

⚠️ ANTI-DUPLICATION RULES:
1. NEVER repeat the same tip/advice twice in different scenes
2. Each scene must provide NEW information
3. If you mentioned "water" in scene 10, do NOT mention it again
4. Group related topics together, don't scatter them
5. Scene numbers MUST be sequential (1, 2, 3... no gaps, no duplicates)

═══════════════════════════════════════
SCENE FORMAT (EVERY SCENE MUST HAVE):
═══════════════════════════════════════
${voiceOverMode === 'cinematic_film' ? `
🎬 HOLLYWOOD SCENE FORMAT:
{
    "order": number,
    "title": "Scene title (dramatic/descriptive)",
    "duration": 8,
    "voiceover": "See format by scene type below",
    "promptText": "Cinematic scene description with [SCENE TYPE: ...] marker"
}

═══════════════════════════════════════
📝 VOICEOVER FIELD BY SCENE TYPE:
═══════════════════════════════════════
• SILENT scenes: "(Không có lời - chỉ hình ảnh và âm nhạc)"
• MONTAGE scenes: "(Montage - nhạc nền emotional)"
• DIALOGUE scenes: "Tên nhân vật: 'Lời thoại' - Phản ứng"
• ACTION scenes: "(Hành động - âm thanh và nhạc nền)"

═══════════════════════════════════════
🎬 EXAMPLE SCENES BY TYPE:
═══════════════════════════════════════

📍 COLD OPEN (Scene 1 - NO DIALOGUE):
{
    "order": 1,
    "title": "Cold Open - Bí ẩn trong đêm",
    "duration": 8,
    "voiceover": "(Không có lời - chỉ hình ảnh và âm nhạc)",
    "promptText": "[SCENE TYPE: COLD OPEN - NO DIALOGUE] [EXT. DARK ALLEY - NIGHT]. A shadowy figure runs through rain-soaked streets. Quick glimpse of fear in their eyes. They clutch something tightly to their chest. Behind them, distant headlights sweep across wet walls. CAMERA: Handheld tracking, quick cuts, 35mm lens, slight motion blur. LIGHTING: Harsh streetlight pools, deep shadows, wet surfaces reflecting neon. SOUND: Heavy breathing, splashing footsteps, ominous bass drone building. EMOTION: Mystery, danger, urgency. STYLE: ${styleKeywords}. NO VOICE - PURE VISUAL."
}

📍 ESTABLISHING SHOT (NO DIALOGUE):
{
    "order": 3,
    "title": "Sài Gòn thức giấc",
    "duration": 8,
    "voiceover": "(Không có lời - establishing shot)",
    "promptText": "[SCENE TYPE: ESTABLISHING - NO DIALOGUE] [EXT. SAIGON SKYLINE - DAWN]. Aerial view of the city awakening. Mist rises from the river. First motorbikes appear on streets below. Sun breaks through clouds, painting rooftops gold. CAMERA: Drone shot, slow descending arc, ultra-wide 16mm lens. LIGHTING: Golden hour, volumetric fog, warm orange breaking through blue dawn. SOUND: Distant city sounds awakening, birds, soft ambient piano begins. EMOTION: Peace before the storm, beauty of everyday life. STYLE: ${styleKeywords}. NO VOICE - AMBIENT ONLY."
}

📍 MONTAGE / TRANSITION:
{
    "order": 12,
    "title": "Montage - Thời gian trôi",
    "duration": 8,
    "voiceover": "(Montage - nhạc nền melancholic)",
    "promptText": "[SCENE TYPE: MONTAGE - MUSIC ONLY] Series of shots showing time passage: 1) Calendar pages flipping. 2) Coffee cups accumulating on desk. 3) Window showing day/night cycle. 4) Character staring at phone, waiting. 5) Seasons change outside window - rain, sun, leaves falling. CAMERA: Mix of close-ups and medium shots, smooth transitions, 50mm lens. LIGHTING: Transitions from warm to cool representing emotional journey. SOUND: Melancholic piano building, clock ticking fades in and out. EMOTION: Longing, passage of time, hope fading. STYLE: ${styleKeywords}. NO DIALOGUE - MUSIC DRIVES EMOTION."
}

📍 DIALOGUE SCENE:
{
    "order": 8,
    "title": "Cuộc đối đầu trong mưa",
    "duration": 8,
    "voiceover": "Minh: 'Anh biết em đang giấu điều gì.' - Linh quay mặt đi, mắt ngấn lệ.",
    "promptText": "[SCENE TYPE: DIALOGUE] [EXT. ROOFTOP - NIGHT, RAIN]. [MINH: 32-year-old Vietnamese man, short black hair, soaked white shirt, intense eyes, standing firm]. [LINH: 28-year-old Vietnamese woman, long wet black hair, red dress, tears mixing with rain, half-turned away]. DIALOGUE: Minh steps forward, voice breaking - 'Anh biết em đang giấu điều gì.' Linh's shoulders tremble. She whispers without turning - 'Có những thứ anh không nên biết.' CAMERA: Medium two-shot, slow dolly in, 50mm lens. LIGHTING: Blue moonlight above, neon glow below, rim light on wet surfaces. SOUND: Heavy rain, thunder, melancholic strings swell. EMOTION: Heartbreak, desperation. STYLE: ${styleKeywords}. VOICE: Male voice for Minh, Female voice for Linh."
}

📍 ACTION SCENE:
{
    "order": 18,
    "title": "Truy đuổi",
    "duration": 8,
    "voiceover": "(Hành động - minimal dialogue)",
    "promptText": "[SCENE TYPE: ACTION - MINIMAL DIALOGUE] [EXT. MARKET STREETS - DAY]. [PROTAGONIST: running full speed, knocking over fruit stands, glancing back]. Pursuers closing in. He vaults over a motorbike. Crashes through a shop's bead curtain. Elderly vendor shouts. He emerges on other side, keeps running. CAMERA: Handheld tracking, quick cuts, low angle when vaulting, 24mm wide lens. LIGHTING: Harsh midday sun, chaotic shadows, motion blur. SOUND: Crashing, shouting, pounding heartbeat bass, urgent percussion. EMOTION: Desperation, survival. STYLE: ${styleKeywords}. VOICE: Only grunts and shouts - 'Đứng lại!'"
}

📍 EMOTIONAL BEAT (Silent):
{
    "order": 22,
    "title": "Khoảnh khắc nhận ra",
    "duration": 8,
    "voiceover": "(Không có lời - emotional beat)",
    "promptText": "[SCENE TYPE: EMOTIONAL BEAT - SILENT] [INT. EMPTY APARTMENT - EVENING]. [CHARACTER: sitting alone on floor, holding old photograph, single tear rolls down cheek]. Sunset light streams through dusty window. She traces the faces in the photo with her finger. A small, sad smile forms. She closes her eyes. CAMERA: Start wide showing isolation, slowly push in to extreme close-up of eyes, 85mm portrait lens. LIGHTING: Golden hour through window, dust particles in light, warm but melancholic. SOUND: Complete silence for 3 seconds, then soft piano note, single violin joins. EMOTION: Acceptance, letting go, bittersweet memory. STYLE: ${styleKeywords}. NO DIALOGUE - LET EMOTION BREATHE."
}

📍 ENDING SCENE (Often Silent):
{
    "order": ${totalScenes},
    "title": "Final Image",
    "duration": 8,
    "voiceover": "(Không có lời - final image)",
    "promptText": "[SCENE TYPE: ENDING - SILENT] [EXT. BEACH - SUNRISE]. [CHARACTER: silhouette standing at water's edge, facing the rising sun]. Waves lap gently at their feet. They take one deep breath. Turn and walk away from camera into the light. New day. New beginning. CAMERA: Wide shot, static, let them walk into frame then out of frame, 35mm. LIGHTING: Sunrise silhouette, golden rays, lens flare. SOUND: Ocean waves, seagulls, orchestral swell to silence. EMOTION: Hope, rebirth, closure. STYLE: ${styleKeywords}. NO DIALOGUE - POWERFUL FINAL IMAGE. FADE TO BLACK."
}` : `{
    "order": number,
    "title": "Scene title",
    "duration": 8,
    "voiceover": "18-25 words narration in ${dialogueLangLabel}. Natural, conversational tone.",
    "promptText": "See format below"
}

PROMPTTEXT FORMAT (EXACT):
[VOICEOVER in ${dialogueLangLabel}: {voiceover text here}]. [${characterBible ? 'Character name: Full appearance description with clothing, expression, gesture' : 'Subject description'}]. ENVIRONMENT: {detailed location, set pieces, props}. CAMERA: {shot type}, {lens: 35mm/50mm/85mm}, {angle: eye-level/low/high}. LIGHTING: {type: soft/dramatic/natural}, {direction}, {color temperature}. STYLE: ${styleKeywords}. MOOD: {emotional tone}. AUDIO: {background sounds, music type}. LANGUAGE: Speak ${dialogueLangLabel} only.

═══════════════════════════════════════
EXAMPLE OF PERFECT SCENE:
═══════════════════════════════════════
{
    "order": 7,
    "title": "Thu nhập ngành nail",
    "duration": 8,
    "voiceover": "Thu nhập đa dạng. Thợ mới có lương cơ bản và tiền boa. Thợ lành nghề có thể kiếm từ 40,000 đến 70,000 đô la một năm.",
    "promptText": "[VOICEOVER in Vietnamese: Thu nhập đa dạng. Thợ mới có lương cơ bản và tiền boa. Thợ lành nghề có thể kiếm từ 40,000 đến 70,000 đô la một năm.]. [Visual representation of money, with a subtle graphic illustrating the income range: $40,000 - $70,000.]. ENVIRONMENT: Clean graphic design, easily readable. CAMERA: Static shot, clear and concise. LIGHTING: Bright, well-lit graphic. STYLE: ${styleKeywords}. MOOD: Informative and appealing. AUDIO: Upbeat, positive sound effect. LANGUAGE: Speak Vietnamese only."
}`}

═══════════════════════════════════════
CRITICAL RULES:
═══════════════════════════════════════
${voiceOverMode === 'cinematic_film' ? `
🎬 CINEMATIC FILM RULES:
1. VOICEOVER = Character dialogue OR action description (NOT host narration)
2. PROMPTTEXT = Full cinematic scene description with location, characters, actions, camera, lighting
3. ${characterBible ? `⚠️ CHARACTER CONSISTENCY - MANDATORY:
   - Include FULL character description in EVERY scene they appear
   - Match character's established appearance, clothing, mannerisms
   - Characters have personalities - show through actions and dialogue
   - Copy EXACT details from CHARACTER BIBLE each time` : 'Create vivid, consistent characters'}
4. NEVER use host/narrator talking to camera - characters talk to EACH OTHER
5. Use proper film scene structure - setup, conflict, payoff
6. Include emotional beats and character reactions
7. Camera work should enhance storytelling (close-up for emotion, wide for scope)
8. Each scene advances the PLOT or develops CHARACTER
9. NO YouTube CTAs (subscribe, like, comment) - this is a FILM
10. ALL dialogue in ${dialogueLangLabel.toUpperCase()}
11. Include VOICE tags: "VOICE: Male voice" or "VOICE: Female voice" matching character` : `1. VOICEOVER = What host SAYS (natural, conversational)
2. PROMPTTEXT = Visual description for video AI (MUST include voiceover at start)
3. ${characterBible ? `⚠️⚠️⚠️ CHARACTER DESCRIPTION - ABSOLUTELY MANDATORY:
   - NEVER write just "[LEO_REAL]" or "[CHARACTER_NAME]" alone - this is WRONG!
   - NEVER write "A character" or any generic descriptions
   - ALWAYS include FULL DESCRIPTION every single time: [NAME: age, ethnicity, hair, outfit, accessories, expression, action]
   - ✅ CORRECT: [LEO_REAL: 25yo Hispanic male, short curly black hair, wearing mustard yellow hoodie with 'LEO' on it, silver glasses. He is sitting on the couch reading a book]
   - ❌ WRONG: [LEO_REAL] sitting on the couch
   - ❌ WRONG: [LEO_REAL] standing in his apartment
   - Copy the FULL character details from CHARACTER BIBLE into EVERY scene with that person
   - The video AI cannot see previous scenes, so REPEAT full description EVERY time` : 'Use detailed visual subjects'}
4. Mix Host scenes (60%) and B-Roll scenes (40%) for visual variety
5. B-Roll scenes = NO character, pure visual/animation/graphics only
6. Include SPECIFIC facts/numbers when discussing income, statistics
7. Smooth transitions between scenes
8. CTA scenes should feel natural, not forced
9. ALL text/voiceover in ${dialogueLangLabel.toUpperCase()} ONLY`}

Return JSON:
{
    "title": "Episode title in ${dialogueLangLabel}",
    "synopsis": "Brief summary",
    "storyOutline": "Story arc",
    "topicIdea": "Theme",
    "scenes": [... ${totalScenes} scenes ...],
    "youtubeStrategies": {
        "titles": [
            "Title 1: Hook + keyword (50-60 chars, curiosity-driven)",
            "Title 2: Question style (make viewer curious)",
            "Title 3: Number/List style (5 secrets, 10 tips...)"
        ],
        "description": "Full YouTube description 800-1200 chars: Opening hook, video summary, key points, call to action. Include channel keywords. End with: #hashtag1 #hashtag2 (10-15 hashtags)",
        "tags": ["tag1", "tag2", "tag3", "... up to 20 SEO tags, mix broad and niche"],
        "thumbnails": [
            "Thumbnail 1: Bold visual with HOOK TEXT overlay: [2-4 BIG WORDS based on episode]",
            "Thumbnail 2: Same style, alternative hook words",
            "Thumbnail 3: Same style, different angle"
        ]
    }
}

Generate ALL ${totalScenes} scenes. Return ONLY valid JSON.`

        let episodeData: EpisodeData = { title: '', synopsis: '', storyOutline: '', topicIdea: '', scenes: [] }
        let allScenes: SceneData[] = []

        try {
            console.log('[Gen] Generating episode...')
            const result = await generateText(config, fullPrompt)

            const jsonMatch = result.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No JSON in response')
            }

            // Sanitize JSON string to fix common issues
            let jsonStr = jsonMatch[0]
            // Remove control characters
            jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, ' ')
            // Remove trailing commas before } or ]
            jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1')

            let parseSuccess = false

            // Try 1: Direct parse
            try {
                episodeData = JSON.parse(jsonStr)
                parseSuccess = true
            } catch {
                console.log('[Gen] First parse failed, trying cleanup...')
            }

            // Try 2: More aggressive cleanup
            if (!parseSuccess) {
                try {
                    jsonStr = jsonMatch[0]
                        .replace(/[\x00-\x1F\x7F]/g, ' ')
                        .replace(/\n/g, ' ')
                        .replace(/\r/g, ' ')
                        .replace(/\t/g, ' ')
                        .replace(/,(\s*[}\]])/g, '$1')
                    episodeData = JSON.parse(jsonStr)
                    parseSuccess = true
                } catch {
                    console.log('[Gen] Second parse failed, trying scene extraction...')
                }
            }

            // Try 3: Extract scenes individually (last resort for long responses)
            if (!parseSuccess) {
                console.log('[Gen] Attempting individual scene extraction...')
                // Match individual scene objects
                const sceneMatches = result.matchAll(/\{[^{}]*"order"\s*:\s*\d+[^{}]*\}/g)
                const extractedScenes: SceneData[] = []

                for (const match of sceneMatches) {
                    try {
                        const sceneStr = match[0].replace(/[\x00-\x1F\x7F]/g, ' ')
                        const scene = JSON.parse(sceneStr) as SceneData
                        if (scene.order) {
                            extractedScenes.push(scene)
                        }
                    } catch {
                        // Skip invalid scenes
                    }
                }

                if (extractedScenes.length > 0) {
                    console.log('[Gen] Extracted', extractedScenes.length, 'scenes individually')
                    // Extract title and other metadata with regex
                    const titleMatch = result.match(/"title"\s*:\s*"([^"]+)"/)
                    episodeData = {
                        title: titleMatch?.[1] || `Episode ${nextEpisodeNumber}`,
                        synopsis: '',
                        storyOutline: '',
                        topicIdea: '',
                        scenes: extractedScenes.sort((a, b) => a.order - b.order)
                    }
                    parseSuccess = true
                }
            }

            if (!parseSuccess) {
                throw new Error('Could not parse JSON response after all attempts')
            }

            allScenes = episodeData.scenes || []
            console.log('[Gen] Got', allScenes.length, 'scenes')

        } catch (error) {
            console.error('[Gen] Error:', error)
            return NextResponse.json({
                error: 'Không thể tạo episode. AI trả về format không hợp lệ. Vui lòng thử với 20-30 scenes thay vì 50.',
                details: String(error)
            }, { status: 400 })
        }

        // Continue generating if we got fewer scenes than requested
        let attempts = 0
        const maxAttempts = 5

        while (allScenes.length < totalScenes && attempts < maxAttempts) {
            attempts++
            const startFrom = allScenes.length + 1
            const remaining = totalScenes - allScenes.length

            console.log(`[Continue] Need ${remaining} more scenes from ${startFrom}`)

            const continuePrompt = `Continue Episode "${episodeData.title}" - generate scenes ${startFrom} to ${totalScenes}

CONTEXT: ${episodeData.synopsis}
STYLE: ${styleKeywords}
DIALOGUE: ${dialogueLangLabel.toUpperCase()} ONLY

${characterBible}

⚠️⚠️⚠️ CRITICAL FORMAT RULES:
1. NEVER write just "[LEO_REAL]" or "[CHARACTER_NAME]" alone - ALWAYS include FULL description
2. ✅ CORRECT: [LEO_REAL: 25yo Hispanic male, short curly black hair, wearing mustard yellow hoodie with 'LEO' on it, silver glasses. He is doing something]
3. ❌ WRONG: [LEO_REAL] doing something
4. ❌ WRONG: INT. LOCATION screenplay format
5. Each scene must have: [VOICEOVER in ${dialogueLangLabel}: text]. [Character with FULL description OR B-Roll visual]. ENVIRONMENT: X. CAMERA: X. LIGHTING: X. STYLE: X. MOOD: X. AUDIO: X.

Generate ${remaining} more scenes (scene ${startFrom} to ${totalScenes}).
Return JSON: {"scenes": [{"order": ${startFrom}, "title": "Scene Title", "voiceover": "what is said", "promptText": "FULL formatted prompt with character descriptions", "duration": 8}]}
Return ONLY valid JSON.`

            try {
                const continueResult = await generateText(config, continuePrompt)
                const contMatch = continueResult.match(/\{[\s\S]*\}/)

                if (contMatch) {
                    const contData = JSON.parse(contMatch[0])
                    const newScenes = contData.scenes || []
                    console.log('[Continue] Got', newScenes.length, 'more scenes')
                    allScenes.push(...newScenes)
                }
            } catch (contError) {
                console.error('[Continue] Error:', contError)
                break
            }
        }

        if (allScenes.length === 0) {
            return NextResponse.json({
                error: 'Không thể tạo scenes. Vui lòng thử lại.',
                details: 'No scenes generated'
            }, { status: 400 })
        }

        console.log('[Final] Total scenes:', allScenes.length)

        // Save to database
        try {
            const episode = await prisma.episode.create({
                data: {
                    episodeNumber: nextEpisodeNumber,
                    title: episodeData.title || `Episode ${nextEpisodeNumber}`,
                    synopsis: episodeData.synopsis || '',
                    storyOutline: episodeData.storyOutline || '',
                    topicIdea: episodeData.topicIdea || '',
                    totalScenes: totalScenes,
                    generatedScenes: allScenes.length,
                    status: 'completed',
                    channelId: id,
                    categoryId: categoryId || null,  // Danh mục episode
                    // Store YouTube strategies in metadata field (as JSON)
                    metadata: JSON.stringify({
                        youtubeStrategies: episodeData.youtubeStrategies || {
                            titles: [],
                            description: '',
                            tags: [],
                            thumbnails: []
                        },
                        styleUsed: styleId || channel.visualStyleId || 'default',
                        charactersUsed: useCharacters ? (selectedCharacterIds.length || 'all') : 'none'
                    }),
                    scenes: {
                        create: allScenes.map((scene, index) => {
                            // Combine voiceover/dialogue into promptText for complete scene info
                            const voiceContent = scene.voiceover || scene.dialogue || ''
                            const visualPrompt = scene.promptText || 'Scene visual description'
                            // Add language specification for voiceover
                            const langTag = dialogueLang === 'en' ? 'English' : 'Vietnamese'
                            const fullPrompt = voiceContent
                                ? `[VOICEOVER in ${langTag}: ${voiceContent}]. ${visualPrompt}. LANGUAGE: Speak ${langTag} only.`
                                : visualPrompt

                            return {
                                order: scene.order || index + 1,
                                title: scene.title || `Scene ${index + 1}`,
                                promptText: fullPrompt,
                                duration: scene.duration || 8,
                                hookType: scene.hookType || null
                            }
                        })
                    }
                },
                include: {
                    scenes: { orderBy: { order: 'asc' } }
                }
            })

            console.log('=== EPISODE CREATED ===', episode.id)

            // Parse metadata back for response
            const metadata = episode.metadata ? JSON.parse(episode.metadata as string) : {}

            return NextResponse.json({
                success: true,
                episode: {
                    ...episode,
                    youtubeTitle: metadata.youtubeTitle,
                    youtubeDescription: metadata.youtubeDescription,
                    youtubeTags: metadata.youtubeTags,
                    thumbnailPrompt: metadata.thumbnailPrompt
                }
            })
        } catch (dbError) {
            console.error('DB Error:', dbError)
            return NextResponse.json({
                error: 'Lỗi lưu vào database',
                details: String(dbError)
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Lỗi tạo episode', details: String(error) }, { status: 500 })
    }
}

// GET: List episodes
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const episodes = await prisma.episode.findMany({
            where: { channelId: id },
            include: { _count: { select: { scenes: true } } },
            orderBy: { episodeNumber: 'asc' }
        })

        return NextResponse.json({ episodes })
    } catch (error) {
        console.error('List error:', error)
        return NextResponse.json({ error: 'Failed to load episodes' }, { status: 500 })
    }
}
