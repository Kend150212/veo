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
    audienceAddressPool?: string[] // Pool đa dạng cách gọi khán giả (tránh lặp)
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
                'Xen kẽ câu ngắn và câu dài tạo nhịp điệu',
                'MỖI TẬP phải dùng cách mở đầu câu hoàn toàn khác nhau — KHÔNG lặp format'
            ],
            avoidPatterns: [
                'Ngôn ngữ formal, cứng nhắc',
                'Câu quá dài, phức tạp',
                'Lý thuyết suông không có ví dụ',
                'Giọng điệu rao giảng, lên lớp',
                'Hứa hẹn viển vông không thực tế',
                // ❌ CÁC MẪU CÂU BỊ CẤM DÙNG LẠI NHIỀU LẦN:
                '"Mấy đứa nghĩ..." — ĐÃ BỊ DÙNG QUÁ NHIỀU, TUYỆT ĐỐI KHÔNG ĐƯỢC DÙNG LẠI',
                '"Mấy bạn nghĩ..." — ĐÃ BỊ DÙNG QUÁ NHIỀU, TUYỆT ĐỐI KHÔNG ĐƯỢC DÙNG LẠI',
                '"Mấy em nghĩ..." — ĐÃ BỊ DÙNG QUÁ NHIỀU, TUYỆT ĐỐI KHÔNG ĐƯỢC DÙNG LẠI',
                '"Nhiều đứa nghĩ..." — ĐÃ BỊ DÙNG QUÁ NHIỀU, TUYỆT ĐỐI KHÔNG ĐƯỢC DÙNG LẠI',
                '"Nhiều người nghĩ..." — ĐÃ BỊ DÙNG QUÁ NHIỀU, TUYỆT ĐỐI KHÔNG ĐƯỢC DÙNG LẠI',
                'Bắt đầu mỗi câu thoại với khán giả theo cùng một format xưng hô'
            ],
            // Pool đa dạng để AI ĐẶT CÂU HỎI / GỌI KHÁN GIẢ — mỗi tập CHỌN NGẪU NHIÊN, KHÔNG ĐƯỢC LẶP LẠI:
            audienceAddressPool: [
                // Dạng câu hỏi bất ngờ
                'Bạn có tin không?',
                'Bạn đã bao giờ tự hỏi...',
                'Bạn có bao giờ nghĩ rằng...',
                'Bạn có biết không?',
                'Thử đoán xem...',
                'Nghe có vẻ vô lý, nhưng...',
                // Dạng tuyên bố gây sốc
                'Sự thật là...',
                'Điều ít ai biết là...',
                'Hầu hết mọi người không nhận ra rằng...',
                'Cái mà ít ai kể cho bạn nghe là...',
                'Con số này sẽ làm bạn ngạc nhiên...',
                // Dạng kể chuyện tự nhiên
                'Câu chuyện bắt đầu từ...',
                'Hãy tưởng tượng...',
                'Nếu tôi nói với bạn rằng...',
                'Có một điều thú vị là...',
                'Thật ra thì...',
                // Dạng đặt bối cảnh
                'Hồi đó, không ai ngờ rằng...',
                'Trước khi mọi thứ thay đổi...',
                'Nhìn lại thì mới thấy...',
                'Chỉ cần nhìn vào con số này thôi...',
                // Dạng kết nối cảm xúc
                'Nói thật nha...',
                'Điều khiến tôi tò mò nhất là...',
                'Cái hay là ở chỗ này...',
                'Nghe mà không tin được luôn...'
            ],
            examplePhrases: [
                'Bạn có tin không? Từ xưởng nhỏ bé năm đó giờ đã thành đế chế tỷ đô.',
                'Nghe có vẻ vô lý, nhưng đây là sự thật: họ từng bán cả mì ăn liền.',
                'Hầu hết mọi người không nhận ra rằng thất bại chính là bước đệm quan trọng nhất.',
                'Nói thật nha, cái này ít ai kể cho bạn nghe đâu...',
                'Trời đất ơi, lúc đó tôi mới nhận ra...',
                'Đơn giản vô cùng, nhưng lúc đó không ai nghĩ ra.',
                'Chuyện đó nó là như vậy thôi — nhưng bài học thì sâu vô cùng.',
                'Nhìn lại thì mới thấy mọi quyết định đó đều có lý do của nó.',
                'Điều ít ai biết là họ đã gần sụp đổ hoàn toàn trước khi thành công.',
                'Có hết rồi, phần còn lại là chuyện của bạn mà thôi.'
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
- Có thể xưng "anh/em", "tôi/bạn", hoặc "mình" — LINH HOẠT theo cảm giác tự nhiên của từng đoạn
- Tự nhiên, có humor nhẹ, không gượng ép
- Thẳng thắn, nói thật, không vòng vo

❌ TUYỆT ĐỐI KHÔNG ĐƯỢC DÙNG CÁC MẪU CÂU SAU (đã bị dùng lặp lại quá nhiều):
- "Mấy đứa nghĩ..." / "Mấy bạn nghĩ..." / "Mấy em nghĩ..."
- "Nhiều đứa nghĩ..." / "Nhiều người nghĩ..."
- Bất kỳ câu nào bắt đầu bằng "Mấy [đại từ] nghĩ" đều BỊ CẤM
- Dùng cùng một format gọi khán giả nhiều hơn 1 lần trong toàn bộ kịch bản

✅ SÁNG TẠO NGẪU NHIÊN — mỗi khi cần gọi khán giả, hãy CHỌN MỘT CÁCH KHÁC NHAU:
- Dạng câu hỏi bất ngờ: "Bạn có tin không?", "Thử đoán xem...", "Nghe có vẻ vô lý nhưng..."
- Dạng tuyên bố: "Sự thật là...", "Điều ít ai biết là...", "Con số này sẽ làm bạn ngạc nhiên..."
- Dạng kể chuyện: "Hãy tưởng tượng...", "Câu chuyện bắt đầu từ...", "Nếu tôi nói với bạn rằng..."
- Dạng cảm thán: "Thật ra thì...", "Nói thật nha...", "Điều khiến tôi tò mò nhất là..."
- Dạng dẫn dắt: "Hồi đó, không ai ngờ rằng...", "Nhìn lại thì mới thấy...", "Trước khi mọi thứ thay đổi..."

CÁCH VIẾT:
1. Dùng SỐ LIỆU CỤ THỂ (năm, số tiền, thời gian, phần trăm)
2. Xen kẽ câu ngắn và câu dài tạo nhịp điệu
3. Mỗi câu hỏi tu từ phải dùng cách diễn đạt KHÁC NHAU — không lặp format
4. Dùng từ nối tự nhiên: "Nhưng mà", "Bởi vì", "Thành ra", "Cho nên"
5. Kết thúc ý bằng: "vậy đó", "thôi", "à", "nha" — xen kẽ, không lặp
6. Thỉnh thoảng dùng tiếng lóng: "nhảm nhí", "chắc kèo", "không phải dạng vừa"

MẪU CÂU ĐA DẠNG (không được dùng chỉ một vài câu này mà PHẢI SÁNG TẠO THÊM):
- "Bạn có tin không? Từ [điểm A] đến [điểm B]..."
- "Nghe có vẻ vô lý, nhưng đây là sự thật..."
- "Điều ít ai kể cho bạn nghe là..."
- "Hầu hết mọi người không nhận ra rằng..."
- "Nói thật nha, cái này..."
- "Nhìn lại thì mới thấy..."
- "Trời đất ơi, lúc đó tôi mới nhận ra..."
- "Đơn giản vô cùng — nhưng ít ai làm được."
- "Một điều khiến tôi tò mò là..."
- "Con số này sẽ làm bạn bật ngửa..."

CHIỀU SÂU SÁNG TẠO:
- Mỗi kịch bản phải có ÍT NHẤT 5 cách khác nhau để dẫn dắt câu chuyện
- Thỉnh thoảng để câu chuyện TỰ KỂ — không cần lúc nào cũng gọi khán giả
- Xen kẽ giữa: kể trực tiếp, đặt câu hỏi, tuyên bố bất ngờ, mô tả cảnh, trích dẫn

TRÁNH:
- Ngôn ngữ formal, cứng nhắc
- Câu quá dài, phức tạp
- Lý thuyết suông không ví dụ
- Giọng rao giảng, lên lớp
- Hứa hẹn viển vông
- Lặp lại cùng một format gọi khán giả

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
    },

    // Template 3: Truyện Ma / Ghost Story
    {
        id: 'ghost-story-broll',
        name: '👻 Kể Chuyện Ma (B-roll)',
        nameEn: 'Ghost Story B-roll',
        description: 'Kể chuyện kinh dị/ma quái thuần Việt, không khí rùng rợn, dẫn dắt tâm lý từng bước',
        suitableFor: ['ghost-story', 'horror', 'paranormal', 'mystery', 'supernatural', 'urban-legend', 'folk-tale'],

        voiceStyle: {
            tone: 'Điềm tĩnh nhưng đầy ẩn ý, nhịp chậm, không khí nặng nề rùng rợn',
            pronouns: 'tôi/chúng tôi - ngôi thứ nhất hoặc người kể chuyện thứ ba',
            characteristics: [
                'Mở đầu bằng thời gian/địa điểm cụ thể tạo cảm giác có thật',
                'Miêu tả cảm giác nhằm cho người nghe "thấy" và "cảm nhận"',
                'Xây dựng sự kỳ lạ từ từ — không bao giờ tiết lộ ngay',
                'Dùng câu ngắn đột ngột để tạo nhịp tension',
                'Dừng lại đúng chỗ — để người nghe tự điền vào khoảng trống rùng rợn',
                'Dùng chi tiết dân gian Việt Nam: cô hồn, âm dương, bàn thờ, đêm Rằm, ngã ba đường',
                'Kết thúc mở hoặc bài học cảnh tỉnh'
            ],
            avoidPatterns: [
                'Giải thích quá rõ — mất đi sự bí ẩn',
                'Ngôn ngữ khoa học, lý trí quá mức',
                'Hài hước không phù hợp',
                'Kết thúc dứt khoát 100% — truyện ma hay để lại dư âm',
                'Dùng từ "ma" quá nhiều — thay bằng mô tả gián tiếp'
            ],
            examplePhrases: [
                'Đêm hôm đó, trời không có lấy một ánh sao...',
                'Không ai biết chuyện gì đã xảy ra trong căn phòng đó. Cho đến bây giờ.',
                'Cô ấy nói với tôi rằng... nhưng tôi không thể kể hết ở đây.',
                'Bỗng nhiên, tất cả đèn trong nhà tắt cùng một lúc.',
                'Tôi quay lại. Không có ai. Nhưng mùi nhang vẫn còn đó.',
                'Người ta kể lại rằng... những ai nghe câu chuyện này đều không dám đi qua đó một mình.',
                'Đó là lần cuối cùng chúng tôi nhìn thấy cô ấy.',
                'Kể từ đêm đó, tôi không bao giờ ngủ được với đèn tắt nữa.'
            ]
        },

        phases: [
            {
                id: 'setup-hook',
                name: '🌑 Mở Đầu — Kéo Người Nghe Vào',
                percentage: 8,
                description: 'Tuyên bố câu chuyện này là có thật, thiết lập cảm giác bất an ngay từ đầu',
                dialoguePatterns: [
                    'Câu chuyện này xảy ra vào [thời điểm cụ thể], tại [địa điểm cụ thể]. Đến bây giờ tôi vẫn không giải thích được.',
                    'Tôi sẽ kể cho bạn nghe một câu chuyện mà tôi đã giữ trong lòng suốt [thời gian].',
                    'Nếu bạn đang xem video này vào ban đêm, hãy bật đèn lên trước đi đã.'
                ],
                toneKeywords: ['bí ẩn', 'có thật', 'không giải thích được', 'rùng mình'],
                visualCues: ['Cảnh đêm khuya vắng lặng', 'Ngọn nến leo lét', 'Con đường tối', 'Bầu trời không sao']
            },
            {
                id: 'world-atmosphere',
                name: '🌫️ Dựng Bối Cảnh — Không Khí Nặng Nề',
                percentage: 12,
                description: 'Mô tả địa điểm, thời gian, nhân vật chi tiết — xây dựng thế giới truyện',
                dialoguePatterns: [
                    'Đó là một [địa điểm] ở [vùng/tỉnh]. Người dân địa phương biết rõ về [điều bí ẩn] ở đây.',
                    '[Nhân vật] là người [mô tả], sống ở [nơi]. Họ không tin vào [điều gì]. Cho đến đêm đó.',
                    'Ngôi nhà đã bỏ hoang từ [thời gian]. Không ai dám vào. Trừ [nhân vật].'
                ],
                toneKeywords: ['u ám', 'cô đơn', 'bỏ hoang', 'dân gian', 'âm u'],
                visualCues: ['Ngôi nhà cũ rêu', 'Nghĩa địa sương mù', 'Con đường làng vắng', 'Cánh đồng đêm', 'Bàn thờ khói hương']
            },
            {
                id: 'normal-before-storm',
                name: '☁️ Cuộc Sống Bình Thường — Trước Khi Mọi Thứ Thay Đổi',
                percentage: 10,
                description: 'Thiết lập cuộc sống bình thường của nhân vật — để sau đó phá vỡ nó mạnh hơn',
                dialoguePatterns: [
                    'Trước đêm đó, mọi thứ vẫn bình thường. [Nhân vật] vẫn [hoạt động thường ngày].',
                    'Không có gì báo trước điều sắp xảy ra. Cuộc sống vẫn trôi qua đều đặn.',
                    'Ngày hôm đó, [nhân vật] làm một điều gì đó khác thường. Một điều nhỏ thôi. Nhưng chính điều đó đã thay đổi tất cả.'
                ],
                toneKeywords: ['bình thường', 'yên ả', 'trước bão', 'chi tiết đời thường'],
                visualCues: ['Buổi sáng bình thường', 'Gia đình quây quần', 'Công việc hàng ngày', 'Bữa cơm tối']
            },
            {
                id: 'first-signs',
                name: '👁️ Dấu Hiệu Đầu Tiên — Điều Gì Đó Không Đúng',
                percentage: 15,
                description: 'Sự kiện kỳ lạ đầu tiên — nhỏ thôi nhưng ám ảnh, nhân vật chưa hiểu',
                dialoguePatterns: [
                    'Đó là lần đầu tiên [nhân vật] cảm thấy có gì đó không đúng. Nhưng chưa thể xác định được.',
                    'Tiếng động phát ra từ [nơi]. Nhỏ thôi. Có thể chỉ là gió. Nhưng [nhân vật] biết — đó không phải gió.',
                    'Nhìn lại sau này, [nhân vật] nói rằng đó là lần đầu tiên [hiện tượng lạ]. Nhưng lúc đó họ không để ý.'
                ],
                toneKeywords: ['kỳ lạ', 'bất thường', 'không giải thích', 'linh cảm xấu'],
                visualCues: ['Cửa tự động', 'Bóng đổ kỳ lạ', 'Ánh đèn chớp tắt', 'Vật rơi không lý do', 'Tiếng thì thầm']
            },
            {
                id: 'escalating-dread',
                name: '😱 Leo Thang — Mọi Thứ Trở Nên Tệ Hơn',
                percentage: 25,
                description: 'Sự kiện liên tiếp leo thang, không khí ngột ngạt, nhân vật bắt đầu hoảng sợ',
                dialoguePatterns: [
                    'Rồi điều thứ hai xảy ra. Rồi điều thứ ba. Mỗi lần lại tệ hơn.',
                    '[Nhân vật] không còn có thể giải thích bằng lý trí nữa. Điều gì đó — thứ gì đó — đang theo họ.',
                    'Đêm đó, [nhân vật] không ngủ được. Tiếng động từ [nơi] cứ lặp đi lặp lại. Đều đặn. Như nhịp thở.'
                ],
                toneKeywords: ['sợ hãi', 'theo dõi', 'không thoát được', 'leo thang', 'ngột ngạt'],
                visualCues: ['Bóng tối chuyển động', 'Gương phản chiếu', 'Cửa mở trong đêm', 'Chân đi trong đêm', 'Âm thanh kỳ dị']
            },
            {
                id: 'climax-horror',
                name: '💀 Đỉnh Điểm — Khoảnh Khắc Kinh Hoàng Nhất',
                percentage: 15,
                description: 'Cảnh kinh dị cao trào — điều tệ nhất xảy ra',
                dialoguePatterns: [
                    'Và rồi [nhân vật] nhìn thấy nó. Thứ mà họ không bao giờ muốn thấy trong đời.',
                    'Đúng lúc đó — cửa phòng mở ra. Không có ai đứng đó. Nhưng giường ở góc phòng... đang lõm xuống.',
                    'Họ quay lại. Và trong bóng tối, [mô tả kinh hoàng]. Đó là khoảnh khắc [nhân vật] biết rằng mọi thứ đã quá muộn.'
                ],
                toneKeywords: ['kinh hoàng', 'tột cùng', 'không thể quay đầu', 'đóng băng'],
                visualCues: ['Toàn màn hình tối đột ngột', 'Ánh đèn cuối cùng tắt', 'Bóng hình không rõ', 'Tay run rẩy']
            },
            {
                id: 'aftermath',
                name: '🕯️ Hậu Quả — Cuộc Sống Sau Đêm Đó',
                percentage: 10,
                description: 'Điều gì xảy ra sau đó — với nhân vật, với gia đình, với nơi chốn',
                dialoguePatterns: [
                    'Sau đêm đó, [nhân vật] không bao giờ trở lại [nơi]. Và cũng không bao giờ kể cho ai nghe — cho đến tận bây giờ.',
                    'Người ta nói rằng [địa điểm] đó vẫn còn [ám ảnh]. Đã có [số người] trải qua điều tương tự.',
                    '[Nhân vật] đã sống sót. Nhưng điều gì đó trong họ đã thay đổi mãi mãi.'
                ],
                toneKeywords: ['dư chấn', 'thay đổi mãi mãi', 'không quên được', 'ám ảnh'],
                visualCues: ['Nơi đó bỏ hoang', 'Ngày mới bình thường nhưng khác', 'Hương khói cầu siêu', 'Ánh nắng nhưng trống rỗng']
            },
            {
                id: 'closing-moral',
                name: '🔮 Kết Thúc — Bài Học Và Dư Âm',
                percentage: 5,
                description: 'Để lại suy nghĩ, bài học hoặc câu hỏi mở cho người xem',
                dialoguePatterns: [
                    'Bạn có tin câu chuyện này không? Tôi không biết. Nhưng tôi chỉ biết một điều: có những thứ trên đời này mà khoa học chưa giải thích được.',
                    'Nếu bạn đang sống gần [địa điểm tương tự]... hãy cẩn thận. Hãy tôn trọng những thứ không thuộc về thế giới này.',
                    'Đó là câu chuyện của [nhân vật]. Và cho đến hôm nay, chúng tôi vẫn chưa biết sự thật là gì.'
                ],
                toneKeywords: ['dư âm', 'bí ẩn còn đó', 'cảnh tỉnh', 'tôn trọng'],
                visualCues: ['Mặt trăng', 'Ngọn nến cháy dần', 'Ảnh cũ', 'Đêm khuya yên tĩnh']
            }
        ],

        promptInstructions: `
BẠN LÀ NGƯỜI KỂ CHUYỆN MA CHUYÊN NGHIỆP. Hãy viết theo phong cách sau:

GIỌNG ĐIỆU:
- Điềm tĩnh, chậm rãi — không bao giờ vội vàng
- Như đang ngồi kể cho người thân nghe vào ban đêm
- Không giải thích quá nhiều — để bí ẩn tồn tại
- Xen kẽ câu DÀI (miêu tả không khí) và câu RẤT NGẮN (tạo shock)

KỸ THUẬT KỂ CHUYỆN MA:
1. THỜI GIAN & ĐỊA ĐIỂM CỤ THỂ: "Đêm 23 tháng Chạp năm đó, tại căn nhà cuối ngõ..."
2. CHI TIẾT CẢM GIÁC: tiếng, mùi, nhiệt độ, xúc giác — không chỉ thị giác
3. NHỊP CHẬM RỒI ĐỘT NGỘT: xây dựng chậm... rồi một câu ngắn phá vỡ tất cả
4. ELEMENT DÂN GIAN VIỆT: bàn thờ, nhang khói, đêm Rằm, ngã ba đường, cô hồn, âm dương
5. KHÔNG TIẾT LỘ NGAY: để người nghe tự hình dung điều tệ hơn những gì được kể
6. CÂU HỎI TU TỪ: "Bạn có bao giờ cảm thấy...?", "Điều gì sẽ xảy ra nếu...?"

VÍ DỤ NHỊP ĐIỆU TỐT:
"Căn phòng im lặng hoàn toàn. [dừng] Quá im lặng. [dừng] Bởi vì trước đó — tiếng thở từ chiếc giường trống đột nhiên... dừng lại."

TRÁNH:
- Giải thích rõ ràng (phá hỏng không khí)
- Hài hước không phù hợp
- Dùng từ "ma" quá nhiều — dùng: "thứ đó", "nó", "hình bóng", "sự hiện diện"
- Kết thúc quá dứt khoát — truyện ma hay để lại dư âm

B-ROLL SUGGESTIONS CHO TRUYỆN MA:
- Cảnh thiên nhiên đêm khuya
- Địa điểm bỏ hoang, rêu phong
- Ánh nến, ánh đèn leo lét
- Bóng đổ, gương, cửa sổ đêm
- Nghĩa địa, đình làng, đường đêm vắng
- Chi tiết vật dụng cũ: tấm ảnh, chiếc đồng hồ dừng, chén trà nguội
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
