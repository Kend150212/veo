import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET: List all active plans (public endpoint)
 * Returns pricing information for the pricing page
 */
export async function GET() {
    try {
        const plans = await prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                priceMonthly: true,
                priceYearly: true,
                yearlyDiscount: true,
                maxChannels: true,
                maxEpisodesPerMonth: true,
                maxApiCalls: true,
                features: true,
                isPopular: true
            }
        })

        return NextResponse.json({
            plans: plans.map(p => ({
                ...p,
                features: JSON.parse(p.features),
                // Calculate yearly savings
                yearlySavings: (p.priceMonthly * 12) - p.priceYearly
            }))
        })
    } catch (error) {
        console.error('List plans error:', error)
        return NextResponse.json({ error: 'Failed to list plans' }, { status: 500 })
    }
}
