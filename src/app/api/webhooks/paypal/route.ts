import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { paypalGateway } from '@/lib/payment-gateways/paypal'

export const dynamic = 'force-dynamic'

/**
 * POST: Handle PayPal webhooks
 */
export async function POST(request: Request) {
    try {
        const body = await request.text()

        // Collect PayPal headers for verification
        const headers = {
            'paypal-auth-algo': request.headers.get('paypal-auth-algo') || '',
            'paypal-cert-url': request.headers.get('paypal-cert-url') || '',
            'paypal-transmission-id': request.headers.get('paypal-transmission-id') || '',
            'paypal-transmission-sig': request.headers.get('paypal-transmission-sig') || '',
            'paypal-transmission-time': request.headers.get('paypal-transmission-time') || ''
        }

        const result = await paypalGateway.handleWebhook(body, JSON.stringify(headers))

        if (!result.success) {
            console.error('PayPal webhook error:', result.error)
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        if (!result.event) {
            return NextResponse.json({ received: true })
        }

        const event = result.event

        switch (event.type) {
            case 'subscription.created': {
                const rawEvent = event.raw as { resource: { custom_id?: string; id: string; subscriber?: { payer_id: string } } }
                const resource = rawEvent.resource
                const userId = resource.custom_id

                if (userId && event.subscriptionId) {
                    // Find the pending subscription
                    const existingSub = await prisma.subscription.findUnique({
                        where: { userId }
                    })

                    if (existingSub) {
                        await prisma.subscription.update({
                            where: { id: existingSub.id },
                            data: {
                                status: 'active',
                                gateway: 'paypal',
                                externalId: event.subscriptionId,
                                customerId: resource.subscriber?.payer_id
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
                                status: mapPayPalStatus(event.status)
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
                                    customerId: null
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
        console.error('PayPal webhook error:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}

function mapPayPalStatus(status?: string): string {
    switch (status?.toLowerCase()) {
        case 'active': return 'active'
        case 'suspended': return 'past_due'
        case 'cancelled': return 'canceled'
        case 'expired': return 'expired'
        default: return 'active'
    }
}
