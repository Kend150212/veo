import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { getGateway } from '@/lib/payment-gateways'

const TRIAL_DAYS = 14

/**
 * POST: Create checkout session for subscription
 * Body: { planId, billingCycle, gateway }
 */
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { planId, billingCycle = 'monthly', gateway = 'stripe' } = body

        if (!planId) {
            return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })
        }

        // Get plan
        const plan = await prisma.plan.findUnique({ where: { id: planId } })
        if (!plan || !plan.isActive) {
            return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 })
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { subscription: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if gateway is enabled
        const gatewayDb = await prisma.paymentGateway.findUnique({
            where: { name: gateway }
        })

        if (!gatewayDb?.isEnabled) {
            return NextResponse.json({ error: `${gateway} is not enabled` }, { status: 400 })
        }

        // Get gateway implementation
        const paymentGateway = getGateway(gateway)
        if (!paymentGateway) {
            return NextResponse.json({ error: 'Gateway not found' }, { status: 400 })
        }

        // Build URLs
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const successUrl = `${baseUrl}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`
        const cancelUrl = `${baseUrl}/pricing?canceled=true`

        // Determine if user is eligible for trial
        const isNewUser = !user.subscription || user.subscription.status === 'expired'
        const trialDays = isNewUser && plan.priceMonthly > 0 ? TRIAL_DAYS : 0

        // Create checkout
        const result = await paymentGateway.createCheckout({
            planId,
            userId: user.id,
            userEmail: user.email,
            billingCycle: billingCycle as 'monthly' | 'yearly',
            successUrl,
            cancelUrl,
            trialDays
        })

        return NextResponse.json({
            checkoutUrl: result.url,
            sessionId: result.sessionId
        })
    } catch (error) {
        console.error('Checkout error:', error)
        const message = error instanceof Error ? error.message : 'Failed to create checkout'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
