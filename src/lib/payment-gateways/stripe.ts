// Stripe Payment Gateway Implementation

import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import {
    PaymentGatewayBase,
    CheckoutOptions,
    CheckoutResult,
    PortalResult,
    WebhookResult
} from './base'

export class StripeGateway extends PaymentGatewayBase {
    name = 'stripe'
    displayName = 'Stripe'
    private stripe: Stripe | null = null

    private async getStripe(): Promise<Stripe> {
        if (this.stripe) return this.stripe

        const gateway = await prisma.paymentGateway.findUnique({
            where: { name: 'stripe' }
        })

        if (!gateway || !gateway.isEnabled) {
            throw new Error('Stripe gateway is not configured or enabled')
        }

        const creds = JSON.parse(gateway.credentials)
        if (!creds.secretKey) {
            throw new Error('Stripe secret key is not configured')
        }

        this.stripe = new Stripe(creds.secretKey)
        return this.stripe
    }

    async createCheckout(options: CheckoutOptions): Promise<CheckoutResult> {
        const stripe = await this.getStripe()

        // Get plan details
        const plan = await prisma.plan.findUnique({
            where: { id: options.planId }
        })

        if (!plan) {
            throw new Error('Plan not found')
        }

        const priceId = options.billingCycle === 'yearly'
            ? plan.stripePriceYearly
            : plan.stripePriceMonthly

        if (!priceId) {
            throw new Error(`Stripe price not configured for ${plan.name} (${options.billingCycle})`)
        }

        // Create or get customer
        let customerId: string | undefined
        const existingSub = await prisma.subscription.findUnique({
            where: { userId: options.userId }
        })

        if (existingSub?.customerId && existingSub.gateway === 'stripe') {
            customerId = existingSub.customerId
        }

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            success_url: options.successUrl,
            cancel_url: options.cancelUrl,
            client_reference_id: options.userId,
            customer_email: customerId ? undefined : options.userEmail,
            customer: customerId,
            metadata: {
                userId: options.userId,
                planId: options.planId,
                billingCycle: options.billingCycle
            }
        }

        // Add trial if specified
        if (options.trialDays && options.trialDays > 0) {
            sessionParams.subscription_data = {
                trial_period_days: options.trialDays
            }
        }

        const session = await stripe.checkout.sessions.create(sessionParams)

        return {
            url: session.url!,
            sessionId: session.id
        }
    }

    async createPortal(customerId: string, returnUrl: string): Promise<PortalResult> {
        const stripe = await this.getStripe()

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl
        })

        return { url: session.url }
    }

    async cancelSubscription(subscriptionId: string): Promise<void> {
        const stripe = await this.getStripe()
        await stripe.subscriptions.cancel(subscriptionId)
    }

    async handleWebhook(payload: string | Buffer, signature: string): Promise<WebhookResult> {
        const stripe = await this.getStripe()

        const gateway = await prisma.paymentGateway.findUnique({
            where: { name: 'stripe' }
        })

        const creds = JSON.parse(gateway?.credentials || '{}')
        if (!creds.webhookSecret) {
            return { success: false, error: 'Webhook secret not configured' }
        }

        try {
            const event = stripe.webhooks.constructEvent(
                payload,
                signature,
                creds.webhookSecret
            )

            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object as Stripe.Checkout.Session
                    return {
                        success: true,
                        event: {
                            type: 'subscription.created',
                            subscriptionId: session.subscription as string,
                            customerId: session.customer as string,
                            raw: event
                        }
                    }
                }

                case 'customer.subscription.updated': {
                    const subscription = event.data.object as Stripe.Subscription
                    // Access raw data to handle API version differences
                    const subData = subscription as unknown as Record<string, unknown>
                    return {
                        success: true,
                        event: {
                            type: 'subscription.updated',
                            subscriptionId: subscription.id,
                            customerId: subscription.customer as string,
                            status: subscription.status,
                            currentPeriodStart: subData.current_period_start
                                ? new Date((subData.current_period_start as number) * 1000)
                                : undefined,
                            currentPeriodEnd: subData.current_period_end
                                ? new Date((subData.current_period_end as number) * 1000)
                                : undefined,
                            canceledAt: subscription.canceled_at
                                ? new Date(subscription.canceled_at * 1000)
                                : undefined,
                            raw: event
                        }
                    }
                }

                case 'customer.subscription.deleted': {
                    const subscription = event.data.object as Stripe.Subscription
                    return {
                        success: true,
                        event: {
                            type: 'subscription.deleted',
                            subscriptionId: subscription.id,
                            customerId: subscription.customer as string,
                            raw: event
                        }
                    }
                }

                case 'invoice.payment_succeeded': {
                    return {
                        success: true,
                        event: {
                            type: 'payment.succeeded',
                            raw: event
                        }
                    }
                }

                case 'invoice.payment_failed': {
                    return {
                        success: true,
                        event: {
                            type: 'payment.failed',
                            raw: event
                        }
                    }
                }

                default:
                    return { success: true }
            }
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Unknown error'
            return { success: false, error }
        }
    }

    async testConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            const stripe = await this.getStripe()
            await stripe.customers.list({ limit: 1 })
            return { success: true }
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Connection failed'
            return { success: false, error }
        }
    }
}

export const stripeGateway = new StripeGateway()
