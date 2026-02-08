'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Sparkles,
  ArrowRight,
  Check,
  Film,
  Layers,
  Shield,
  Zap,
  Play,
  Users,
  Video,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

// Visual style showcase images
const styleShowcase = [
  { src: '/styles/style_cinematic_1769037598589.png', name: 'Cinematic', desc: 'Phong cách điện ảnh chuyên nghiệp' },
  { src: '/styles/style_anime_1769037444802.png', name: 'Anime', desc: 'Hoạt hình Nhật Bản' },
  { src: '/styles/style_pixar_3d_1769037478528.png', name: 'Pixar 3D', desc: 'Hoạt hình 3D cao cấp' },
  { src: '/styles/style_watercolor_1769037679503.png', name: 'Watercolor', desc: 'Nghệ thuật màu nước' },
  { src: '/styles/style_documentary_1769037613360.png', name: 'Documentary', desc: 'Phong cách phim tài liệu' },
  { src: '/styles/style_comic_book_1769037547624.png', name: 'Comic Book', desc: 'Phong cách truyện tranh' },
]

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  priceMonthly: number
  priceYearly: number
  maxChannels: number
  maxEpisodesPerMonth: number
  maxApiCalls: number
  isPopular: boolean
  features: {
    prioritySupport?: boolean
    apiAccess?: boolean
    advancedCinematicStyles?: boolean
    allNarrativeTemplates?: boolean
    characterCustomization?: boolean
    youtubeStrategies?: boolean
    customIntegrations?: boolean
  }
}

const features = [
  {
    icon: Layers,
    titleVi: 'Công cụ tạo prompt',
    description: 'Tạo prompt theo cấu trúc chuyên nghiệp với AI hỗ trợ',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: Film,
    titleVi: 'Thư viện Style',
    description: '20+ visual styles từ Cinematic đến Anime, Watercolor',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    icon: Video,
    titleVi: 'Tạo tập hoàn chỉnh',
    description: 'Tự động tạo script, scene prompts và Youtube metadata',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    icon: Zap,
    titleVi: 'Tích hợp API',
    description: 'Kết nối với Make.com, Zapier và các automation tools',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: Shield,
    titleVi: 'Bảo mật cao',
    description: 'Dữ liệu được mã hóa, tuân thủ tiêu chuẩn bảo mật',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    icon: Users,
    titleVi: 'Làm việc nhóm',
    description: 'Quản lý nhiều kênh và thành viên trong team',
    gradient: 'from-pink-500 to-rose-500'
  }
]

const stats = [
  { value: '10K+', label: 'Video prompts' },
  { value: '500+', label: 'Creators' },
  { value: '20+', label: 'Visual Styles' },
  { value: '99.9%', label: 'Uptime' },
]

export default function HomePage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch('/api/plans')
      .then(res => res.json())
      .then(data => setPlans(data.plans || []))
      .catch(err => console.error('Failed to load plans:', err))
  }, [])

  // Auto-rotate carousel
  useEffect(() => {
    if (!mounted) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % styleShowcase.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [mounted])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % styleShowcase.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + styleShowcase.length) % styleShowcase.length)

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[var(--border-subtle)] backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <div className="container-app py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">Veo Prompt</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-[var(--text-secondary)] hover:text-white transition-colors">
                Tính năng
              </Link>
              <Link href="#styles" className="text-[var(--text-secondary)] hover:text-white transition-colors">
                Visual Styles
              </Link>
              <Link href="#pricing" className="text-[var(--text-secondary)] hover:text-white transition-colors">
                Bảng giá
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="btn-secondary">
                Đăng nhập
              </Link>
              <Link href="/register" className="btn-primary">
                Bắt đầu miễn phí
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="container-app">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 mb-6">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">Dành cho Google Veo AI</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Tạo Video AI{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                  Chuyên Nghiệp
                </span>
              </h1>

              <p className="text-xl text-[var(--text-secondary)] mb-8 leading-relaxed">
                Nền tảng tạo prompt và quản lý nội dung video AI.
                Từ ý tưởng đến episodes hoàn chỉnh trong vài phút với visual styles độc quyền.
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <Link href="/register" className="btn-primary flex items-center gap-2 text-lg px-8 py-4 group">
                  Bắt đầu miễn phí
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="#styles" className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
                  <Play className="w-5 h-5" />
                  Xem Visual Styles
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center md:text-left">
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                      {stat.value}
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Visual Showcase Carousel */}
            <div className="relative animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-2xl shadow-purple-500/20">
                {styleShowcase.map((style, i) => (
                  <div
                    key={style.name}
                    className={`absolute inset-0 transition-opacity duration-500 ${i === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  >
                    <Image
                      src={style.src}
                      alt={style.name}
                      fill
                      className="object-cover"
                      priority={i === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold mb-1">{style.name}</h3>
                      <p className="text-sm text-white/70">{style.desc}</p>
                    </div>
                  </div>
                ))}

                {/* Navigation */}
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {styleShowcase.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-white w-6' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Floating Card */}
              <div className="absolute -top-4 -right-4 glass-card px-4 py-2 flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">AI-Powered</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Styles Gallery */}
      <section id="styles" className="relative z-10 py-20 bg-[var(--bg-secondary)]/50">
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              20+ Visual Styles{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                Độc Quyền
              </span>
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              Thư viện style đa dạng từ Cinematic chuyên nghiệp đến Anime, Watercolor, Comic Book và nhiều hơn nữa
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {styleShowcase.map((style, index) => (
              <div
                key={style.name}
                className="group relative aspect-square rounded-xl overflow-hidden border border-[var(--border-subtle)] hover:border-purple-500/50 transition-all cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Image
                  src={style.src}
                  alt={style.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-sm font-medium">{style.name}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/register" className="btn-secondary inline-flex items-center gap-2">
              Xem tất cả styles
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20">
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tính năng nổi bật</h2>
            <p className="text-[var(--text-secondary)]">Mọi thứ bạn cần để tạo video AI chuyên nghiệp</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6 group hover:border-purple-500/30 transition-all"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.titleVi}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-20 bg-[var(--bg-secondary)]/50">
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Bảng giá minh bạch</h2>
            <p className="text-[var(--text-secondary)] mb-8">Chọn gói phù hợp với nhu cầu của bạn</p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1 bg-[var(--bg-tertiary)] rounded-full">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-purple-600 text-white' : 'text-[var(--text-secondary)]'
                  }`}
              >
                Hàng tháng
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-purple-600 text-white' : 'text-[var(--text-secondary)]'
                  }`}
              >
                Hàng năm
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => {
              const planFeatures = plan.features || {}
              const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly / 12

              return (
                <div
                  key={plan.id}
                  className={`glass-card p-6 relative ${plan.isPopular ? 'border-purple-500 ring-2 ring-purple-500/20' : ''
                    }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-xs font-medium rounded-full">
                      Phổ biến nhất
                    </div>
                  )}

                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      {price === 0 ? 'Miễn phí' : `$${price.toFixed(0)}`}
                    </span>
                    {price > 0 && <span className="text-[var(--text-muted)]">/tháng</span>}
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400" />
                      {plan.maxChannels === -1 ? 'Không giới hạn' : plan.maxChannels} kênh
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400" />
                      {plan.maxEpisodesPerMonth === -1 ? 'Không giới hạn' : plan.maxEpisodesPerMonth} episodes/tháng
                    </li>
                    {plan.maxApiCalls > 0 && (
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-400" />
                        {plan.maxApiCalls === -1 ? 'Không giới hạn' : plan.maxApiCalls.toLocaleString()} API calls
                      </li>
                    )}
                    {planFeatures.prioritySupport && (
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-400" />
                        Hỗ trợ ưu tiên
                      </li>
                    )}
                  </ul>

                  <Link
                    href={plan.slug === 'free' ? '/register' : `/pricing?plan=${plan.slug}`}
                    className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${plan.isPopular
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90'
                      : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]'
                      }`}
                  >
                    {plan.slug === 'free' ? 'Bắt đầu miễn phí' : 'Chọn gói này'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="container-app">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 border border-purple-500/30 p-12 text-center">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Sẵn sàng tạo video AI?</h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
                Tham gia cùng hàng trăm creators đang sử dụng Veo Prompt để tạo nội dung video chuyên nghiệp
              </p>
              <Link href="/register" className="btn-primary inline-flex items-center gap-2 text-lg px-10 py-4">
                Bắt đầu miễn phí ngay
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border-subtle)] py-12">
        <div className="container-app">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">Veo Prompt</span>
              </Link>
              <p className="text-sm text-[var(--text-muted)]">
                Nền tảng tạo prompt và quản lý nội dung video AI hàng đầu.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Sản phẩm</h4>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li><Link href="#features" className="hover:text-white transition-colors">Tính năng</Link></li>
                <li><Link href="#styles" className="hover:text-white transition-colors">Visual Styles</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Bảng giá</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li><Link href="/public/api-docs.html" className="hover:text-white transition-colors">API Documentation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Liên hệ</h4>
              <p className="text-sm text-[var(--text-secondary)]">
                support@veo.kendymarketing.com
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-[var(--border-subtle)] text-sm text-[var(--text-muted)]">
            <span>© 2026 Veo Prompt. All rights reserved.</span>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <span>Secure & Private</span>
              <span>•</span>
              <span>SQLite Database</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
