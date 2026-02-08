import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

/**
 * GET: Get current user's subscription
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                subscription: {
                    include: { plan: true }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (!user.subscription) {
            // Get free plan for reference
            const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } })
            return NextResponse.json({
                subscription: null,
                defaultPlan: freePlan ? {
                    ...freePlan,
                    features: JSON.parse(freePlan.features)
                } : null
            })
        }

        const subscription = user.subscription
        const plan = subscription.plan

        return NextResponse.json({
            subscription: {
                id: subscription.id,
                status: subscription.status,
                billingCycle: subscription.billingCycle,
                gateway: subscription.gateway,
                trialEndsAt: subscription.trialEndsAt,
                currentPeriodEnd: subscription.currentPeriodEnd,
                canceledAt: subscription.canceledAt,
                // Usage
                apiCallsUsed: subscription.apiCallsUsed,
                episodesCreated: subscription.episodesCreated,
                usageResetAt: subscription.usageResetAt,
                // Plan details
                plan: {
                    id: plan.id,
                    name: plan.name,
                    slug: plan.slug,
                    priceMonthly: plan.priceMonthly,
                    priceYearly: plan.priceYearly,
                    maxChannels: plan.maxChannels,
                    maxEpisodesPerMonth: plan.maxEpisodesPerMonth,
                    maxApiCalls: plan.maxApiCalls,
                    features: JSON.parse(plan.features)
                }
            }
        })
    } catch (error) {
        console.error('Get subscription error:', error)
        return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 })
    }
}
