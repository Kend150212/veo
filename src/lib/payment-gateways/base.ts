// Base Payment Gateway Interface
// Extensible architecture for adding new gateways

export interface CheckoutOptions {
    planId: string
    userId: string
    userEmail: string
    billingCycle: 'monthly' | 'yearly'
    successUrl: string
    cancelUrl: string
    trialDays?: number
}

export interface CheckoutResult {
    url: string
    sessionId?: string
}

export interface WebhookEvent {
    type: 'subscription.created' | 'subscription.updated' | 'subscription.deleted' | 'payment.succeeded' | 'payment.failed'
    subscriptionId?: string
    customerId?: string
    planId?: string
    status?: string
    currentPeriodStart?: Date
    currentPeriodEnd?: Date
    canceledAt?: Date
    raw: unknown
}

export interface WebhookResult {
    success: boolean
    event?: WebhookEvent
    error?: string
}

export interface PortalResult {
    url: string
}

export abstract class PaymentGatewayBase {
    abstract name: string
    abstract displayName: string

    // Create checkout session for new subscription
    abstract createCheckout(options: CheckoutOptions): Promise<CheckoutResult>

    // Create billing portal for managing subscription
    abstract createPortal(customerId: string, returnUrl: string): Promise<PortalResult>

    // Cancel subscription
    abstract cancelSubscription(subscriptionId: string): Promise<void>

    // Handle webhook
    abstract handleWebhook(payload: string | Buffer, signature: string): Promise<WebhookResult>

    // Verify credentials are valid
    abstract testConnection(): Promise<{ success: boolean; error?: string }>
}

// Gateway registry for dynamic loading
const gateways: Map<string, PaymentGatewayBase> = new Map()

export function registerGateway(gateway: PaymentGatewayBase): void {
    gateways.set(gateway.name, gateway)
}

export function getGateway(name: string): PaymentGatewayBase | undefined {
    return gateways.get(name)
}

export function getAllGateways(): PaymentGatewayBase[] {
    return Array.from(gateways.values())
}
