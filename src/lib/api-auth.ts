import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import crypto from 'crypto'

export interface AuthResult {
    userId: string
    email: string
    role: string
    method: 'api-key' | 'session'
}

/**
 * Authenticate API request using either API key or session
 * Supports: x-api-key header for external automation (Make.com, Zapier)
 */
export async function authenticateApiRequest(request: Request): Promise<AuthResult | null> {
    // Check for API key in header
    const apiKey = request.headers.get('x-api-key')

    if (apiKey) {
        const user = await prisma.user.findFirst({
            where: { apiKey }
        })

        if (user) {
            return {
                userId: user.id,
                email: user.email,
                role: user.role,
                method: 'api-key'
            }
        }
        // Invalid API key - don't fallback to session
        return null
    }

    // Fallback to session auth
    const session = await getServerSession(authOptions)
    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (user) {
            return {
                userId: user.id,
                email: user.email,
                role: user.role,
                method: 'session'
            }
        }
    }

    return null
}

/**
 * Generate a new API key
 * Format: veo_xxxxxxxxxxxxxxxxxxxxxxxxxxxx (32 random chars)
 */
export function generateApiKey(): string {
    const randomBytes = crypto.randomBytes(24)
    return `veo_${randomBytes.toString('hex')}`
}

/**
 * Check if user is admin
 */
export function isAdmin(auth: AuthResult | null): boolean {
    return auth?.role === 'admin'
}
