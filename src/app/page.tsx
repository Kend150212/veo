'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  Check,
  Film,
  Layers,
  Download,
  Shield,
  Zap
} from 'lucide-react'

const features = [
  {
    icon: Layers,
    title: 'Structured Builder',
    titleVi: 'Công cụ cấu trúc',
    description: 'Tạo prompt theo 9 section chuyên nghiệp: Subject, Action, Scene, Camera, Style, Lighting, Mood, Audio, Negative'
  },
  {
    icon: Film,
    title: 'Video Templates',
    titleVi: 'Mẫu có sẵn',
    description: 'Thư viện template cho nhiều thể loại: Điện ảnh, Sản phẩm, Thiên nhiên, Sci-Fi, Lãng mạn, Kinh dị'
  },
  {
    icon: Download,
    title: 'Multi Export',
    titleVi: 'Đa định dạng',
    description: 'Export ra Text, JSON hoặc API Payload sẵn sàng cho Veo API với tùy chọn aspect ratio, resolution'
  },
  {
    icon: Zap,
    title: 'AI Suggestions',
    titleVi: 'Gợi ý AI',
    description: 'Tích hợp Google Gemini để gợi ý và cải thiện prompt theo từng section'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    titleVi: 'Bảo mật cao',
    description: 'Self-hosted, dữ liệu lưu local với SQLite, mật khẩu được mã hóa bcrypt'
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 container-app py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Veo Prompt</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/login" className="btn-secondary">
              Đăng nhập
            </Link>
            <Link href="/register" className="btn-primary">
              Đăng ký
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero section */}
      <section className="relative z-10 container-app py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] mb-6">
            <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className="text-sm text-[var(--text-secondary)]">Dành cho Google Veo AI</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Tạo Video Prompt
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-500">
              Chuyên Nghiệp
            </span>
          </h1>

          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
            Công cụ tạo prompt có cấu trúc cho Google Veo.
            Từ ý tưởng đến prompt hoàn chỉnh trong vài phút.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
              Bắt đầu miễn phí
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-4">
              Đăng nhập
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features section */}
      <section className="relative z-10 container-app py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Tính năng nổi bật</h2>
          <p className="text-[var(--text-secondary)]">Mọi thứ bạn cần để tạo prompt video chuyên nghiệp</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-[var(--accent-primary)]" />
              </div>
              <h3 className="font-semibold mb-2">{feature.titleVi}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section className="relative z-10 container-app py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card gradient-border p-12 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Sẵn sàng tạo video prompt?</h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
            Đăng ký miễn phí ngay hôm nay và bắt đầu tạo những prompt video chuyên nghiệp cho Google Veo.
          </p>
          <Link href="/register" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
            Bắt đầu ngay
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container-app py-8 border-t border-[var(--border-subtle)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">
              Veo Prompt Generator © 2026
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
            <span>Self-hosted</span>
            <span>•</span>
            <span>SQLite Database</span>
            <span>•</span>
            <span>Secure</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
