// Payment Gateways Index
// Registers all available gateways

import { registerGateway, getGateway, getAllGateways, PaymentGatewayBase } from './base'
import { stripeGateway } from './stripe'
import { paypalGateway } from './paypal'

// Register all gateways
registerGateway(stripeGateway)
registerGateway(paypalGateway)

// Export everything
export {
    PaymentGatewayBase,
    registerGateway,
    getGateway,
    getAllGateways,
    stripeGateway,
    paypalGateway
}

export type { CheckoutOptions, CheckoutResult, WebhookEvent, WebhookResult, PortalResult } from './base'
