// Helper to get AI config from user settings
import prisma from './prisma'
import type { AIConfig, AIProvider } from './ai-story'

type SettingsRecord = Record<string, unknown>

export async function getAIConfigFromSettings(userId: string): Promise<AIConfig | null> {
    const settings = await prisma.userSettings.findUnique({
        where: { userId }
    })

    if (!settings) {
        return null
    }

    const provider = (settings.preferredAI || 'gemini') as AIProvider

    // Get the API key for the preferred provider
    const keyMap: Record<string, string | null> = {
        gemini: settings.geminiKey,
        openai: settings.openaiKey,
        deepseek: settings.deepseekKey,
        anthropic: settings.anthropicKey
    }

    const apiKey = keyMap[provider]
    if (!apiKey) {
        return null
    }

    // Get the model for the preferred provider
    const settingsRecord = settings as SettingsRecord
    const modelMap: Record<string, string> = {
        gemini: (settingsRecord.geminiModel as string) || 'gemini-2.0-flash',
        openai: (settingsRecord.openaiModel as string) || 'gpt-4o-mini',
        deepseek: (settingsRecord.deepseekModel as string) || 'deepseek-chat',
        anthropic: (settingsRecord.anthropicModel as string) || 'claude-3-haiku-20240307'
    }

    return {
        provider,
        apiKey,
        model: modelMap[provider]
    }
}
