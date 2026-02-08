import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateApiKey } from '@/lib/api-auth'

// POST: Generate new API key for current user
export async function POST() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const newApiKey = generateApiKey()

        await prisma.user.update({
            where: { id: session.user.id },
            data: { apiKey: newApiKey }
        })

        return NextResponse.json({
            apiKey: newApiKey,
            message: 'API key generated successfully. Store it securely - it won\'t be shown again in full.'
        })
    } catch (error) {
        console.error('Generate API key error:', error)
        return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 })
    }
}

// DELETE: Revoke API key
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { apiKey: null }
        })

        return NextResponse.json({ message: 'API key revoked successfully' })
    } catch (error) {
        console.error('Revoke API key error:', error)
        return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 })
    }
}

// GET: Check if user has API key (returns masked version)
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { apiKey: true }
        })

        if (!user?.apiKey) {
            return NextResponse.json({ hasApiKey: false, apiKey: null })
        }

        // Return masked API key (show only last 8 chars)
        const maskedKey = `veo_****${user.apiKey.slice(-8)}`

        return NextResponse.json({
            hasApiKey: true,
            apiKey: maskedKey
        })
    } catch (error) {
        console.error('Get API key error:', error)
        return NextResponse.json({ error: 'Failed to get API key' }, { status: 500 })
    }
}
