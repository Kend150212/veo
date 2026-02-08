import { NextResponse } from 'next/server'
import { authenticateApiRequest, isAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

/**
 * GET: Get reports data (admin only)
 * Query params: period (7d, 30d, 90d, 1y)
 */
export async function GET(request: Request) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!isAdmin(auth)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const url = new URL(request.url)
        const period = url.searchParams.get('period') || '30d'

        // Calculate date range
        const now = new Date()
        let startDate: Date
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                break
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                break
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
                break
            default: // 30d
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }

        // Get all data in parallel
        const [
            totalUsers,
            newUsers,
            activeSubscriptions,
            totalChannels,
            totalEpisodes,
            transactions,
            subscriptionsByPlan,
            recentUsers
        ] = await Promise.all([
            // Total users
            prisma.user.count(),
            // New users in period
            prisma.user.count({
                where: { createdAt: { gte: startDate } }
            }),
            // Active subscriptions
            prisma.subscription.count({
                where: { status: 'active' }
            }),
            // Total channels
            prisma.channel.count(),
            // Total episodes
            prisma.episode.count(),
            // Transactions in period
            prisma.transaction.findMany({
                where: { createdAt: { gte: startDate } },
                orderBy: { createdAt: 'asc' }
            }),
            // Subscriptions by plan
            prisma.subscription.groupBy({
                by: ['planId'],
                where: { status: 'active' },
                _count: true
            }),
            // Recent users
            prisma.user.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { id: true, email: true, name: true, createdAt: true }
            })
        ])

        // Calculate revenue by day
        const revenueByDay: Record<string, number> = {}
        const transactionsByDay: Record<string, number> = {}

        for (const t of transactions) {
            const day = t.createdAt.toISOString().split('T')[0]
            if (t.status === 'completed' && t.type === 'payment') {
                revenueByDay[day] = (revenueByDay[day] || 0) + t.amount
            }
            transactionsByDay[day] = (transactionsByDay[day] || 0) + 1
        }

        // Calculate totals
        const totalRevenue = transactions
            .filter(t => t.status === 'completed' && t.type === 'payment')
            .reduce((sum, t) => sum + t.amount, 0)

        // Get plan names for subscriptions
        const plans = await prisma.plan.findMany({
            select: { id: true, name: true }
        })
        const planMap = Object.fromEntries(plans.map(p => [p.id, p.name]))

        return NextResponse.json({
            period,
            startDate: startDate.toISOString(),
            endDate: now.toISOString(),
            overview: {
                totalUsers,
                newUsers,
                activeSubscriptions,
                totalChannels,
                totalEpisodes,
                totalRevenue,
                totalTransactions: transactions.length
            },
            charts: {
                revenueByDay: Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount })),
                transactionsByDay: Object.entries(transactionsByDay).map(([date, count]) => ({ date, count }))
            },
            subscriptionsByPlan: subscriptionsByPlan.map(s => ({
                planName: planMap[s.planId] || 'Unknown',
                count: s._count
            })),
            recentUsers
        })
    } catch (error) {
        console.error('Reports error:', error)
        return NextResponse.json({ error: 'Failed to generate reports' }, { status: 500 })
    }
}
