import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { getGateway } from '@/lib/payment-gateways'

/**
 * POST: Cancel subscription
 */
export async function POST() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { subscription: true }
        })

        if (!user?.subscription) {
            return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
        }

        const subscription = user.subscription

        if (subscription.status === 'canceled') {
            return NextResponse.json({ error: 'Subscription already canceled' }, { status: 400 })
        }

        // Cancel with payment gateway if it's a paid subscription
        if (subscription.gateway && subscription.externalId) {
            const gateway = getGateway(subscription.gateway)
            if (gateway) {
                await gateway.cancelSubscription(subscription.externalId)
            }
        }

        // Update subscription status
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: 'canceled',
                canceledAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Subscription canceled. Access continues until end of billing period.'
        })
    } catch (error) {
        console.error('Cancel subscription error:', error)
        return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
    }
}
