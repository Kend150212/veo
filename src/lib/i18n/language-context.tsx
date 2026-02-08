'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, translations, Translations } from './translations'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Detect browser language
function detectLanguage(): Language {
    if (typeof window === 'undefined') return 'en'

    // Check localStorage first
    const saved = localStorage.getItem('preferred-language')
    if (saved && ['en', 'vi', 'es'].includes(saved)) {
        return saved as Language
    }

    // Detect from browser
    const browserLang = navigator.language.toLowerCase()

    if (browserLang.startsWith('vi')) return 'vi'
    if (browserLang.startsWith('es')) return 'es'

    return 'en' // Default to English
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const detected = detectLanguage()
        setLanguageState(detected)
    }, [])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem('preferred-language', lang)
    }

    const t = translations[language]

    // During SSR, use English as default
    if (!mounted) {
        return (
            <LanguageContext.Provider value={{ language: 'en', setLanguage, t: translations.en }}>
                {children}
            </LanguageContext.Provider>
        )
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}

// Language names for selector
export const languageNames: Record<Language, string> = {
    en: 'English',
    vi: 'Tiếng Việt',
    es: 'Español',
}

// Language flags for selector
export const languageFlags: Record<Language, string> = {
    en: '🇺🇸',
    vi: '🇻🇳',
    es: '🇪🇸',
}
