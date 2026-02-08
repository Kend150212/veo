import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripeGateway } from '@/lib/payment-gateways/stripe'

export const dynamic = 'force-dynamic'

/**
 * POST: Handle Stripe webhooks
 */
export async function POST(request: Request) {
    try {
        const body = await request.text()
        const signature = request.headers.get('stripe-signature')

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
        }

        const result = await stripeGateway.handleWebhook(body, signature)

        if (!result.success) {
            console.error('Stripe webhook error:', result.error)
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        if (!result.event) {
            // No action needed for this event
            return NextResponse.json({ received: true })
        }

        const event = result.event

        switch (event.type) {
            case 'subscription.created': {
                // Extract metadata from session
                const rawEvent = event.raw as { data: { object: { metadata?: { userId: string; planId: string; billingCycle: string }; customer: string; subscription: string } } }
                const sessionObj = rawEvent.data.object
                const metadata = sessionObj?.metadata

                if (metadata?.userId && metadata?.planId) {
                    const existingSub = await prisma.subscription.findUnique({
                        where: { userId: metadata.userId }
                    })

                    if (existingSub) {
                        await prisma.subscription.update({
                            where: { id: existingSub.id },
                            data: {
                                planId: metadata.planId,
                                status: 'active',
                                billingCycle: metadata.billingCycle || 'monthly',
                                gateway: 'stripe',
                                externalId: sessionObj.subscription as string,
                                customerId: sessionObj.customer as string
                            }
                        })
                    } else {
                        await prisma.subscription.create({
                            data: {
                                userId: metadata.userId,
                                planId: metadata.planId,
                                status: 'active',
                                billingCycle: metadata.billingCycle || 'monthly',
                                gateway: 'stripe',
                                externalId: sessionObj.subscription as string,
                                customerId: sessionObj.customer as string
                            }
                        })
                    }
                }
                break
            }

            case 'subscription.updated': {
                if (event.subscriptionId) {
                    const subscription = await prisma.subscription.findFirst({
                        where: { externalId: event.subscriptionId }
                    })

                    if (subscription) {
                        await prisma.subscription.update({
                            where: { id: subscription.id },
                            data: {
                                status: mapStripeStatus(event.status),
                                currentPeriodStart: event.currentPeriodStart,
                                currentPeriodEnd: event.currentPeriodEnd,
                                canceledAt: event.canceledAt
                            }
                        })
                    }
                }
                break
            }

            case 'subscription.deleted': {
                if (event.subscriptionId) {
                    const subscription = await prisma.subscription.findFirst({
                        where: { externalId: event.subscriptionId }
                    })

                    if (subscription) {
                        // Downgrade to free plan
                        const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } })
                        if (freePlan) {
                            await prisma.subscription.update({
                                where: { id: subscription.id },
                                data: {
                                    planId: freePlan.id,
                                    status: 'active',
                                    gateway: null,
                                    externalId: null,
                                    customerId: null,
                                    currentPeriodStart: null,
                                    currentPeriodEnd: null,
                                    canceledAt: null
                                }
                            })
                        }
                    }
                }
                break
            }
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Stripe webhook error:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}

function mapStripeStatus(status?: string): string {
    switch (status) {
        case 'active': return 'active'
        case 'trialing': return 'trialing'
        case 'past_due': return 'past_due'
        case 'canceled': return 'canceled'
        case 'unpaid': return 'past_due'
        default: return 'active'
    }
}
