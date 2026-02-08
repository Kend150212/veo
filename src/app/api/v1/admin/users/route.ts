import { NextResponse } from 'next/server'
import { authenticateApiRequest, isAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// GET: List all users (admin only)
export async function GET(request: Request) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!isAdmin(auth)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                apiKey: false, // Never expose API keys
                createdAt: true,
                _count: {
                    select: { channels: true, projects: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Add masked API key status
        const usersWithApiStatus = await Promise.all(users.map(async (user) => {
            const fullUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { apiKey: true }
            })
            return {
                ...user,
                hasApiKey: !!fullUser?.apiKey
            }
        }))

        return NextResponse.json({
            users: usersWithApiStatus,
            total: users.length
        })
    } catch (error) {
        console.error('List users error:', error)
        return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
    }
}
