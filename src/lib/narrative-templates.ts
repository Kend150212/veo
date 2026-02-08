// Narrative Storytelling Templates
// Format để tạo kịch bản theo phong cách kể chuyện hấp dẫn (như Anh Dư Leo)
// Dùng cho: B-roll content, personal stories, social issues

export interface NarrativePhase {
    id: string
    name: string
    percentage: number          // % thời lượng video
    description: string
    dialoguePatterns: string[]  // Các mẫu câu thoại
    toneKeywords: string[]      // Từ khóa giọng điệu
    visualCues: string[]        // Gợi ý B-roll
}

export interface NarrativeTemplate {
    id: string
    name: string
    nameEn: string
    description: string
    suitableFor: string[]      // Loại content phù hợp
    phases: NarrativePhase[]
    voiceStyle: VoiceStyle
    promptInstructions: string // Hướng dẫn cho AI generate
}

export interface VoiceStyle {
    tone: string           // Giọng điệu chính
    pronouns: string       // Ngôi kể (anh/tôi/mình)
    characteristics: string[] // Đặc điểm giọng văn
    avoidPatterns: string[]   // Tránh những gì
    examplePhrases: string[]  // Câu mẫu
}

// ===== PHÂN TÍCH SÂU TỪ VIDEO ANH DƯ LEO =====

/**
 * GIỌNG ĐIỆU:
 * - Thân mật, nói chuyện trực tiếp với người xem ("mấy em")
 * - Tự nhiên như đang tâm sự, không formal
 * - Có humor nhẹ ("dán túa ra như phim Disney")
 * - Thẳng thắn, không vòng vo ("nói thật")
 * 
 * CÁCH DÙNG TỪ:
 * - Từ ngữ đời thường: "nhảm nhí", "xàm long", "sợ lông không"
 * - Số liệu cụ thể: "100 đô", "8 năm", "30 lượng", "1.6 triệu"
 * - Từ láy/cảm thán: "trời đất ơi", "mừng quá", "sạch trơn"
 * - Câu hỏi tu từ: "bây giờ mấy em làm sao?"
 * 
 * CẤU TRÚC CÂU:
 * - Ngắn gọn, dễ hiểu
 * - Xen kẽ câu ngắn và câu dài
 * - Dùng "Nhưng mà", "Bởi vì", "Tại vì" để nối ý
 * - Kết thúc ý bằng "vậy đó", "thôi", "à"
 */

// Template chính: Personal Journey / Social Issues
export const NARRATIVE_TEMPLATES: NarrativeTemplate[] = [
    {
        id: 'personal-journey-broll',
        name: 'Hành Trình Cá Nhân (B-roll)',
        nameEn: 'Personal Journey B-roll',
        description: 'Kể chuyện cá nhân với 100% B-roll, giọng voiceover hấp dẫn',
        suitableFor: ['personal-story', 'social-issues', 'life-lessons', 'financial-advice', 'motivation'],
        
        voiceStyle: {
            tone: 'Thân mật, tâm sự, như đang nói chuyện với bạn trẻ',
            pronouns: 'anh/em hoặc tôi/bạn - xưng hô gần gũi',
            characteristics: [
                'Thẳng thắn, không vòng vo',
                'Có humor nhẹ, tự nhiên',
                'Dùng số liệu cụ thể để tăng độ tin cậy',
                'Đặt câu hỏi tu từ để tương tác với người xem',
                'Thỉnh thoảng dùng tiếng lóng đời thường',
                'Xen kẽ câu ngắn và câu dài tạo nhịp điệu'
            ],
            avoidPatterns: [
                'Ngôn ngữ formal, cứng nhắc',
                'Câu quá dài, phức tạp',
                'Lý thuyết suông không có ví dụ',
                'Giọng điệu rao giảng, lên lớp',
                'Hứa hẹn viển vông không thực tế'
            ],
            examplePhrases: [
                'Nghe xong cái này là bảo đảm nhiều người sẽ...',
                'Nhưng mà khoan, vấn đề là ở chỗ này...',
                'Mấy em biết không? Thời điểm đó...',
                'Nói thật nha, cái này...',
                'Đó là chuyện đương nhiên rồi, nhưng...',
                'Trời đất ơi, lúc đó tôi mới nhận ra...',
                'Đơn giản vô cùng mấy em ơi.',
                'Chuyện đó nó là như vậy thôi.',
                'Có hết rồi, phần còn lại là chuyện của mấy em.'
            ]
        },

        phases: [
            {
                id: 'hook',
                name: 'Hook - Gây Tò Mò',
                percentage: 5,
                description: 'Tuyên bố kết quả ấn tượng ngay từ đầu',
                dialoguePatterns: [
                    'Đây là câu chuyện về... [kết quả ấn tượng]',
                    'Trong [thời gian], từ [điểm A] đến [điểm B]',
                    '[Con số cụ thể] - đó là những gì đã xảy ra'
                ],
                toneKeywords: ['mạnh mẽ', 'tự tin', 'thu hút'],
                visualCues: ['Hình ảnh kết quả', 'Số liệu nổi bật', 'Before/After nhanh']
            },
            {
                id: 'skeptic-counter',
                name: 'Đối Đầu Người Hoài Nghi',
                percentage: 10,
                description: 'Acknowledge những ý kiến phản đối, tăng độ tin cậy',
                dialoguePatterns: [
                    'Chắc nhiều người sẽ nói: [phản biện]... Nhưng clip này không dành cho những người như vậy.',
                    'Ai cũng biết xã hội này nói rằng... Nhưng nếu ai đã [trải nghiệm] thì sẽ hiểu...',
                    'Đừng nghe những thứ [nhảm nhí] kia. Bởi vì...'
                ],
                toneKeywords: ['thẳng thắn', 'tự tin', 'không né tránh'],
                visualCues: ['Hình ảnh đối lập', 'Memes/Viral clips', 'Tin tức xã hội']
            },
            {
                id: 'context-setting',
                name: 'Bối Cảnh Hóa',
                percentage: 15,
                description: 'Thiết lập hoàn cảnh ban đầu với chi tiết cụ thể',
                dialoguePatterns: [
                    'Thời điểm đó là năm [năm], cách đây [số năm] rồi.',
                    '[Năm đó] là một cái năm mà... Mấy em bây giờ chắc không hình dung được...',
                    'Lương lúc đó chỉ có [số tiền]. [Số tiền] đó so với bây giờ là...',
                    'Nhà tôi lúc đó... [mô tả hoàn cảnh]'
                ],
                toneKeywords: ['hoài niệm', 'chân thật', 'chi tiết'],
                visualCues: ['Hình ảnh thời kỳ đó', 'So sánh giá cả', 'Cuộc sống ngày xưa']
            },
            {
                id: 'struggle-journey',
                name: 'Khó Khăn & Hành Trình',
                percentage: 25,
                description: 'Chi tiết quá trình với những thử thách cụ thể',
                dialoguePatterns: [
                    'Mỗi tháng tôi chỉ còn [số tiền] để xài. [Số tiền] đó phải chia cho...',
                    'Trong suốt [thời gian] đó, tôi không có [điều gì]. Tôi chỉ...',
                    'Có nhiều người sẽ thấy cuộc sống đó tẻ nhạt. Nhưng chính vì...',
                    'Tại vì nhà nghèo, tôi phải... Không thể nào mà...'
                ],
                toneKeywords: ['chân thật', 'cảm xúc', 'chi tiết cụ thể'],
                visualCues: ['Cuộc sống hàng ngày', 'Công việc', 'Tiết kiệm', 'Hy sinh']
            },
            {
                id: 'turning-point',
                name: 'Điểm Chuyển - Bài Học',
                percentage: 15,
                description: 'Insight quan trọng, bài học rút ra',
                dialoguePatterns: [
                    'Và đó cũng là một cái quan trọng mà tôi muốn nói...',
                    'Khi tôi nhìn lại thì mới phát hiện ra...',
                    'Chính vì bởi vì những cái mà tôi làm như vậy, nó dẫn tới...',
                    'Trời đất ơi, lúc đó tôi mới nhận ra...'
                ],
                toneKeywords: ['nhận ra', 'bất ngờ', 'enlightenment'],
                visualCues: ['Khoảnh khắc aha', 'Thành quả đầu tiên', 'Biểu đồ tiến bộ']
            },
            {
                id: 'result-proof',
                name: 'Kết Quả & Chứng Minh',
                percentage: 20,
                description: 'Cho thấy kết quả cụ thể, bằng chứng',
                dialoguePatterns: [
                    'Đến khi nhìn lại thì số tiền của tôi đã có thể...',
                    '[Số năm] trời để có được [kết quả] là bởi vì...',
                    'Tôi làm được như vậy là bởi vì: [liệt kê]. Đơn giản vô cùng.',
                    'Đúng vậy. [Kết quả] mà nhìn mà không thể nào tưởng tượng được.'
                ],
                toneKeywords: ['tự hào', 'thỏa mãn', 'chứng minh'],
                visualCues: ['Kết quả cuối cùng', 'Số liệu thành công', 'Before/After chi tiết']
            },
            {
                id: 'practical-advice',
                name: 'Lời Khuyên Thực Tiễn',
                percentage: 7,
                description: 'Takeaway actionable cho người xem',
                dialoguePatterns: [
                    'Muốn [mục tiêu] thì mấy em cần phải biết [hành động].',
                    'Tất cả những cái đó bây giờ nó quá trời nhiều luôn. Mấy em [làm gì] thôi cũng được.',
                    'Nó đơn giản vô cùng thôi. Mà lúc đó tôi không hề nghĩ gì về chuyện đó.',
                    'Có hết rồi. Phần còn lại là chuyện của mấy em mà thôi.'
                ],
                toneKeywords: ['thực tế', 'actionable', 'đơn giản'],
                visualCues: ['Checklist', 'Action steps', 'Tools/Resources']
            },
            {
                id: 'cta-closing',
                name: 'CTA & Kết Thúc',
                percentage: 3,
                description: 'Kêu gọi hành động, kết thúc ấn tượng',
                dialoguePatterns: [
                    'Nếu mấy em thấy những gì tôi nói hay thì...',
                    'Clip tới đây dài rồi. Hi vọng mấy em [hành động].',
                    'Còn bây giờ thì bye bye, hẹn gặp vào những clip khác.'
                ],
                toneKeywords: ['thân thiện', 'positive', 'nhẹ nhàng'],
                visualCues: ['Subscribe button', 'Social links', 'Logo/Branding']
            }
        ],

        promptInstructions: `
BẠN LÀ MỘT BIÊN KỊCH VIDEO CHUYÊN NGHIỆP. Hãy viết kịch bản theo phong cách sau:

GIỌNG ĐIỆU:
- Thân mật, như đang tâm sự với bạn trẻ
- Xưng "anh/em" hoặc "tôi/mấy em" 
- Tự nhiên, có humor nhẹ, không gượng ép
- Thẳng thắn, nói thật, không vòng vo

CÁCH VIẾT:
1. Dùng SỐ LIỆU CỤ THỂ (năm, số tiền, thời gian, phần trăm)
2. Xen kẽ câu ngắn và câu dài tạo nhịp điệu
3. Đặt câu hỏi tu từ để tương tác: "Mấy em biết không?", "Vậy làm sao?"
4. Dùng từ nối tự nhiên: "Nhưng mà", "Bởi vì", "Thành ra", "Cho nên"
5. Kết thúc ý bằng: "vậy đó", "thôi", "à", "nha"
6. Thỉnh thoảng dùng tiếng lóng: "nhảm nhí", "xàm long", "sờ lờ"

MẪU CÂU HAY:
- "Nghe xong cái này là bảo đảm..."
- "Nhưng mà khoan, vấn đề là ở chỗ này..."
- "Nói thật nha, cái này..."
- "Trời đất ơi, lúc đó..."
- "Đơn giản vô cùng thôi."
- "Có hết rồi, phần còn lại là chuyện của mấy em."

TRÁNH:
- Ngôn ngữ formal, cứng nhắc
- Câu quá dài, phức tạp
- Lý thuyết suông không ví dụ
- Giọng rao giảng, lên lớp
- Hứa hẹn viển vông

LƯU Ý B-ROLL:
- Kịch bản này dùng cho 100% B-roll với voiceover
- Mỗi câu/đoạn cần gợi ý visual phù hợp
- Visual phải tự nhiên, liên quan đến nội dung
`
    },

    // Template 2: Social Issues / Vấn đề xã hội
    {
        id: 'social-commentary-broll',
        name: 'Bình Luận Xã Hội (B-roll)',
        nameEn: 'Social Commentary B-roll',
        description: 'Phân tích vấn đề xã hội với góc nhìn thực tế',
        suitableFor: ['social-issues', 'current-events', 'analysis', 'opinion'],
        
        voiceStyle: {
            tone: 'Phân tích, có góc nhìn riêng, không phán xét',
            pronouns: 'chúng ta/mình - inclusive',
            characteristics: [
                'Đặt vấn đề rõ ràng',
                'Đưa ra nhiều góc nhìn',
                'Dùng ví dụ thực tế',
                'Kết luận có insight',
                'Không áp đặt quan điểm'
            ],
            avoidPatterns: [
                'Phán xét một chiều',
                'Kích động, cực đoan',
                'Thiếu bằng chứng',
                'Lý thuyết suông'
            ],
            examplePhrases: [
                'Chúng ta thấy rất nhiều... nhưng liệu có ai tự hỏi...',
                'Vấn đề ở đây không phải là... mà là...',
                'Nhìn bề ngoài thì... nhưng thực chất...',
                'Có người sẽ nói... nhưng cũng có góc nhìn khác...',
                'Cuối cùng thì, mỗi người tự quyết định...'
            ]
        },

        phases: [
            {
                id: 'hook',
                name: 'Hook - Vấn Đề Nóng',
                percentage: 8,
                description: 'Đặt vấn đề gây chú ý',
                dialoguePatterns: [
                    '[Hiện tượng] đang lan tràn khắp nơi. Nhưng có ai tự hỏi...',
                    'Mới hôm qua, [sự kiện]. Chuyện này nói lên điều gì?',
                    '[Số liệu sốc]. Đó là thực trạng của [vấn đề] hiện nay.'
                ],
                toneKeywords: ['gây chú ý', 'quan trọng', 'cấp bách'],
                visualCues: ['Tin tức', 'Số liệu', 'Hiện tượng xã hội']
            },
            {
                id: 'context',
                name: 'Bối Cảnh Vấn Đề',
                percentage: 15,
                description: 'Giải thích nguồn gốc, hoàn cảnh',
                dialoguePatterns: [
                    'Để hiểu được [vấn đề], chúng ta cần nhìn lại...',
                    'Chuyện này không phải mới. Từ [thời điểm]...',
                    'Có nhiều yếu tố dẫn đến [vấn đề]...'
                ],
                toneKeywords: ['phân tích', 'khách quan', 'lịch sử'],
                visualCues: ['Timeline', 'Historical footage', 'Diagrams']
            },
            {
                id: 'multiple-perspectives',
                name: 'Nhiều Góc Nhìn',
                percentage: 25,
                description: 'Trình bày các quan điểm khác nhau',
                dialoguePatterns: [
                    'Một bên cho rằng... Bên kia lại nghĩ...',
                    'Có người sẽ nói [quan điểm A]. Nhưng cũng có góc nhìn khác...',
                    'Nếu chúng ta nhìn từ [góc độ], thì...'
                ],
                toneKeywords: ['cân bằng', 'đa chiều', 'fair'],
                visualCues: ['Các nhóm người khác nhau', 'Debates', 'Contrasting images']
            },
            {
                id: 'analysis',
                name: 'Phân Tích Sâu',
                percentage: 25,
                description: 'Đưa ra insight và phân tích',
                dialoguePatterns: [
                    'Vấn đề ở đây không phải là... mà là...',
                    'Nhìn bề ngoài thì... nhưng thực chất...',
                    'Điều mà ít người nhận ra là...'
                ],
                toneKeywords: ['sâu sắc', 'insight', 'phát hiện'],
                visualCues: ['Data visualization', 'Expert interviews', 'Case studies']
            },
            {
                id: 'solution-discussion',
                name: 'Thảo Luận Giải Pháp',
                percentage: 17,
                description: 'Đề xuất hướng giải quyết',
                dialoguePatterns: [
                    'Vậy chúng ta có thể làm gì?',
                    'Có một số cách tiếp cận...',
                    'Không có giải pháp hoàn hảo, nhưng...'
                ],
                toneKeywords: ['constructive', 'hopeful', 'thực tế'],
                visualCues: ['Solutions', 'Success stories', 'Action items']
            },
            {
                id: 'closing-thought',
                name: 'Suy Nghĩ Kết',
                percentage: 10,
                description: 'Để ngỏ suy nghĩ cho người xem',
                dialoguePatterns: [
                    'Cuối cùng thì, mỗi người tự quyết định...',
                    'Câu hỏi đặt ra là... Và câu trả lời nằm ở mỗi chúng ta.',
                    'Đây chỉ là góc nhìn của tôi. Còn mấy em nghĩ sao?'
                ],
                toneKeywords: ['open-ended', 'reflective', 'inclusive'],
                visualCues: ['Contemplative shots', 'Question on screen', 'Community']
            }
        ],

        promptInstructions: `
BẠN LÀ MỘT NHÀ BÌNH LUẬN XÃ HỘI. Hãy viết kịch bản theo phong cách sau:

GIỌNG ĐIỆU:
- Phân tích, có góc nhìn riêng nhưng không phán xét
- Xưng "chúng ta/mình" để inclusive
- Khách quan, đưa nhiều góc nhìn
- Kết luận có insight nhưng không áp đặt

CÁCH VIẾT:
1. Mở đầu bằng câu hỏi hoặc hiện tượng gây chú ý
2. Đưa ra bối cảnh và lịch sử của vấn đề
3. Trình bày ít nhất 2 góc nhìn khác nhau
4. Phân tích sâu với insight riêng
5. Đề xuất hướng giải quyết thực tế
6. Kết thúc với câu hỏi mở để người xem suy nghĩ

TRÁNH:
- Phán xét một chiều
- Kích động, cực đoan
- Thiếu bằng chứng
- Áp đặt quan điểm
`
    }
]

// Helper: Get template by ID
export function getNarrativeTemplate(id: string): NarrativeTemplate | undefined {
    return NARRATIVE_TEMPLATES.find(t => t.id === id)
}

// Helper: Get all template summaries for UI
export function getNarrativeTemplateSummaries(): { id: string; name: string; description: string; suitableFor: string[] }[] {
    return NARRATIVE_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        suitableFor: t.suitableFor
    }))
}

// Helper: Get prompt instructions for AI
export function getTemplatePromptInstructions(templateId: string): string {
    const template = getNarrativeTemplate(templateId)
    if (!template) return ''
    
    const phaseGuide = template.phases.map(p => 
        `${p.name} (${p.percentage}%): ${p.description}\n   Mẫu câu: ${p.dialoguePatterns[0]}`
    ).join('\n')
    
    return `
${template.promptInstructions}

CẤU TRÚC KỊCH BẢN (theo % thời lượng):
${phaseGuide}

VOICE STYLE:
- Tone: ${template.voiceStyle.tone}
- Ngôi kể: ${template.voiceStyle.pronouns}
- Đặc điểm: ${template.voiceStyle.characteristics.join(', ')}
- Câu mẫu tham khảo: ${template.voiceStyle.examplePhrases.slice(0, 3).join(' | ')}
`
}

// Generate B-roll visual suggestions based on script
export function generateBrollSuggestions(phase: NarrativePhase, scriptContent: string): string[] {
    // Combine phase visual cues with content-specific suggestions
    return [
        ...phase.visualCues,
        // Add more specific suggestions based on content keywords
    ]
}
