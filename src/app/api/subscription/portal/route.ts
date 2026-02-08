import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { getGateway } from '@/lib/payment-gateways'

/**
 * POST: Get billing portal URL
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
            return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
        }

        const subscription = user.subscription

        if (!subscription.gateway || !subscription.customerId) {
            return NextResponse.json({ error: 'No payment method on file' }, { status: 400 })
        }

        const gateway = getGateway(subscription.gateway)
        if (!gateway) {
            return NextResponse.json({ error: 'Gateway not found' }, { status: 400 })
        }

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const returnUrl = `${baseUrl}/dashboard/billing`

        const result = await gateway.createPortal(subscription.customerId, returnUrl)

        return NextResponse.json({ portalUrl: result.url })
    } catch (error) {
        console.error('Portal error:', error)
        return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
    }
}
