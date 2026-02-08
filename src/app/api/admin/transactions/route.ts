import { NextResponse } from 'next/server'
import { authenticateApiRequest, isAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

/**
 * GET: List all transactions (admin only)
 * Query params: page, limit, status, gateway, userId
 */
export async function GET(request: Request) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!isAdmin(auth)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '20')
        const status = url.searchParams.get('status')
        const gateway = url.searchParams.get('gateway')
        const userId = url.searchParams.get('userId')
        const type = url.searchParams.get('type')

        const where: Record<string, unknown> = {}
        if (status) where.status = status
        if (gateway) where.gateway = gateway
        if (userId) where.userId = userId
        if (type) where.type = type

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: { select: { id: true, email: true, name: true } },
                    subscription: { select: { id: true, planId: true, status: true } }
                }
            }),
            prisma.transaction.count({ where })
        ])

        // Calculate stats
        const stats = await prisma.transaction.groupBy({
            by: ['status'],
            _sum: { amount: true },
            _count: true
        })

        const totalRevenue = await prisma.transaction.aggregate({
            where: { status: 'completed', type: 'payment' },
            _sum: { amount: true }
        })

        return NextResponse.json({
            transactions: transactions.map(t => ({
                ...t,
                metadata: JSON.parse(t.metadata)
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            stats: {
                byStatus: stats,
                totalRevenue: totalRevenue._sum.amount || 0
            }
        })
    } catch (error) {
        console.error('List transactions error:', error)
        return NextResponse.json({ error: 'Failed to list transactions' }, { status: 500 })
    }
}

/**
 * POST: Create manual transaction (admin only)
 */
export async function POST(request: Request) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!isAdmin(auth)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const body = await request.json()
        const {
            userId,
            subscriptionId,
            type = 'payment',
            status = 'completed',
            amount,
            currency = 'USD',
            gateway = 'manual',
            externalId,
            description,
            metadata = {}
        } = body

        if (!userId || amount === undefined) {
            return NextResponse.json({ error: 'userId and amount required' }, { status: 400 })
        }

        const transaction = await prisma.transaction.create({
            data: {
                userId,
                subscriptionId,
                type,
                status,
                amount,
                currency,
                gateway,
                externalId,
                description,
                metadata: JSON.stringify(metadata)
            },
            include: {
                user: { select: { id: true, email: true, name: true } }
            }
        })

        return NextResponse.json({
            success: true,
            transaction: {
                ...transaction,
                metadata: JSON.parse(transaction.metadata)
            }
        }, { status: 201 })
    } catch (error) {
        console.error('Create transaction error:', error)
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }
}
