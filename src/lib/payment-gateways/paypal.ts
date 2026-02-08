// PayPal Payment Gateway Implementation

import { prisma } from '@/lib/prisma'
import {
    PaymentGatewayBase,
    CheckoutOptions,
    CheckoutResult,
    PortalResult,
    WebhookResult
} from './base'

interface PayPalCredentials {
    clientId: string
    clientSecret: string
    webhookId: string
}

interface PayPalToken {
    access_token: string
    expires_in: number
}

export class PayPalGateway extends PaymentGatewayBase {
    name = 'paypal'
    displayName = 'PayPal'
    private accessToken: string | null = null
    private tokenExpiry: number = 0

    private async getCredentials(): Promise<PayPalCredentials & { testMode: boolean }> {
        const gateway = await prisma.paymentGateway.findUnique({
            where: { name: 'paypal' }
        })

        if (!gateway || !gateway.isEnabled) {
            throw new Error('PayPal gateway is not configured or enabled')
        }

        const creds = JSON.parse(gateway.credentials) as PayPalCredentials
        if (!creds.clientId || !creds.clientSecret) {
            throw new Error('PayPal credentials are not configured')
        }

        return { ...creds, testMode: gateway.testMode }
    }

    private getBaseUrl(testMode: boolean): string {
        return testMode
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com'
    }

    private async getAccessToken(): Promise<string> {
        // Return cached token if still valid
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken
        }

        const creds = await this.getCredentials()
        const baseUrl = this.getBaseUrl(creds.testMode)

        const auth = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')

        const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        })

        if (!response.ok) {
            throw new Error('Failed to get PayPal access token')
        }

        const data = await response.json() as PayPalToken
        this.accessToken = data.access_token
        this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // 1 min buffer

        return this.accessToken
    }

    async createCheckout(options: CheckoutOptions): Promise<CheckoutResult> {
        const creds = await this.getCredentials()
        const accessToken = await this.getAccessToken()
        const baseUrl = this.getBaseUrl(creds.testMode)

        // Get plan details
        const plan = await prisma.plan.findUnique({
            where: { id: options.planId }
        })

        if (!plan) {
            throw new Error('Plan not found')
        }

        const paypalPlanId = options.billingCycle === 'yearly'
            ? plan.paypalPlanYearly
            : plan.paypalPlanMonthly

        if (!paypalPlanId) {
            throw new Error(`PayPal plan not configured for ${plan.name} (${options.billingCycle})`)
        }

        // Create subscription
        const subscriptionData: Record<string, unknown> = {
            plan_id: paypalPlanId,
            subscriber: {
                email_address: options.userEmail
            },
            application_context: {
                brand_name: 'Veo Prompt Generator',
                locale: 'en-US',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'SUBSCRIBE_NOW',
                return_url: options.successUrl,
                cancel_url: options.cancelUrl
            },
            custom_id: options.userId
        }

        // Add trial if specified
        if (options.trialDays && options.trialDays > 0) {
            const trialEnd = new Date()
            trialEnd.setDate(trialEnd.getDate() + options.trialDays)
            subscriptionData.start_time = trialEnd.toISOString()
        }

        const response = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(subscriptionData)
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`PayPal subscription creation failed: ${error}`)
        }

        const subscription = await response.json()
        const approveLink = subscription.links?.find((l: { rel: string }) => l.rel === 'approve')

        if (!approveLink) {
            throw new Error('PayPal approval link not found')
        }

        return {
            url: approveLink.href,
            sessionId: subscription.id
        }
    }

    async createPortal(customerId: string, returnUrl: string): Promise<PortalResult> {
        // PayPal doesn't have a built-in billing portal like Stripe
        // Redirect to PayPal's subscription management page
        const creds = await this.getCredentials()
        const portalUrl = creds.testMode
            ? 'https://www.sandbox.paypal.com/myaccount/autopay'
            : 'https://www.paypal.com/myaccount/autopay'

        return {
            url: `${portalUrl}?return_url=${encodeURIComponent(returnUrl)}`
        }
    }

    async cancelSubscription(subscriptionId: string): Promise<void> {
        const creds = await this.getCredentials()
        const accessToken = await this.getAccessToken()
        const baseUrl = this.getBaseUrl(creds.testMode)

        const response = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason: 'User requested cancellation'
            })
        })

        if (!response.ok && response.status !== 204) {
            const error = await response.text()
            throw new Error(`PayPal cancellation failed: ${error}`)
        }
    }

    async handleWebhook(payload: string | Buffer, signature: string): Promise<WebhookResult> {
        try {
            const creds = await this.getCredentials()
            const accessToken = await this.getAccessToken()
            const baseUrl = this.getBaseUrl(creds.testMode)

            // Verify webhook signature
            const headers = JSON.parse(signature) // Expect signature to be JSON of headers
            const verifyResponse = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    auth_algo: headers['paypal-auth-algo'],
                    cert_url: headers['paypal-cert-url'],
                    transmission_id: headers['paypal-transmission-id'],
                    transmission_sig: headers['paypal-transmission-sig'],
                    transmission_time: headers['paypal-transmission-time'],
                    webhook_id: creds.webhookId,
                    webhook_event: JSON.parse(payload.toString())
                })
            })

            if (!verifyResponse.ok) {
                return { success: false, error: 'Webhook verification failed' }
            }

            const verifyResult = await verifyResponse.json()
            if (verifyResult.verification_status !== 'SUCCESS') {
                return { success: false, error: 'Invalid webhook signature' }
            }

            const event = JSON.parse(payload.toString())

            switch (event.event_type) {
                case 'BILLING.SUBSCRIPTION.ACTIVATED':
                case 'BILLING.SUBSCRIPTION.CREATED':
                    return {
                        success: true,
                        event: {
                            type: 'subscription.created',
                            subscriptionId: event.resource.id,
                            customerId: event.resource.subscriber?.payer_id,
                            raw: event
                        }
                    }

                case 'BILLING.SUBSCRIPTION.UPDATED':
                    return {
                        success: true,
                        event: {
                            type: 'subscription.updated',
                            subscriptionId: event.resource.id,
                            status: event.resource.status?.toLowerCase(),
                            raw: event
                        }
                    }

                case 'BILLING.SUBSCRIPTION.CANCELLED':
                case 'BILLING.SUBSCRIPTION.EXPIRED':
                    return {
                        success: true,
                        event: {
                            type: 'subscription.deleted',
                            subscriptionId: event.resource.id,
                            raw: event
                        }
                    }

                case 'PAYMENT.SALE.COMPLETED':
                    return {
                        success: true,
                        event: {
                            type: 'payment.succeeded',
                            raw: event
                        }
                    }

                case 'PAYMENT.SALE.DENIED':
                    return {
                        success: true,
                        event: {
                            type: 'payment.failed',
                            raw: event
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
            await this.getAccessToken()
            return { success: true }
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Connection failed'
            return { success: false, error }
        }
    }
}

export const paypalGateway = new PayPalGateway()
