#!/usr/bin/env node
/**
 * Sync Plans with Stripe
 * This script creates Stripe Products and Prices for each Plan in the database
 * 
 * Usage: node scripts/sync-stripe-plans.js
 */

const { PrismaClient } = require('@prisma/client')
const Stripe = require('stripe')

const prisma = new PrismaClient()

async function main() {
    console.log('🔄 Syncing Plans with Stripe...\n')

    // Get Stripe credentials from database
    const gateway = await prisma.paymentGateway.findUnique({
        where: { name: 'stripe' }
    })

    if (!gateway || !gateway.isEnabled) {
        console.error('❌ Stripe gateway is not configured or enabled')
        console.log('\nPlease go to Admin → Payment Gateways and add Stripe credentials:')
        console.log('  { "secretKey": "sk_test_xxx" }')
        process.exit(1)
    }

    const creds = JSON.parse(gateway.credentials || '{}')
    if (!creds.secretKey) {
        console.error('❌ Stripe secret key not found in gateway credentials')
        process.exit(1)
    }

    const stripe = new Stripe(creds.secretKey)

    // Test connection
    try {
        await stripe.customers.list({ limit: 1 })
        console.log('✅ Connected to Stripe\n')
    } catch (err) {
        console.error('❌ Failed to connect to Stripe:', err.message)
        process.exit(1)
    }

    // Get all plans
    const plans = await prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { priceMonthly: 'asc' }
    })

    console.log(`Found ${plans.length} active plans\n`)

    for (const plan of plans) {
        console.log(`\n📦 Processing: ${plan.name}`)

        // Skip free plan
        if (plan.priceMonthly === 0) {
            console.log('   Skipping free plan (no Stripe product needed)')
            continue
        }

        // Check if product already exists
        let productId = plan.stripeProductId

        if (!productId) {
            // Create new product
            console.log('   Creating Stripe product...')
            const product = await stripe.products.create({
                name: `Veo Prompt - ${plan.name}`,
                description: plan.description || `${plan.name} subscription plan`,
                metadata: {
                    planId: plan.id,
                    planSlug: plan.slug
                }
            })
            productId = product.id
            console.log(`   ✅ Product created: ${productId}`)
        } else {
            console.log(`   Product exists: ${productId}`)
        }

        // Create monthly price if needed
        let monthlyPriceId = plan.stripePriceMonthly
        if (!monthlyPriceId && plan.priceMonthly > 0) {
            console.log('   Creating monthly price...')
            const monthlyPrice = await stripe.prices.create({
                product: productId,
                unit_amount: Math.round(plan.priceMonthly * 100), // cents
                currency: 'usd',
                recurring: { interval: 'month' },
                metadata: {
                    planId: plan.id,
                    billingCycle: 'monthly'
                }
            })
            monthlyPriceId = monthlyPrice.id
            console.log(`   ✅ Monthly price: ${monthlyPriceId} ($${plan.priceMonthly}/month)`)
        }

        // Create yearly price if needed
        let yearlyPriceId = plan.stripePriceYearly
        if (!yearlyPriceId && plan.priceYearly > 0) {
            console.log('   Creating yearly price...')
            const yearlyPrice = await stripe.prices.create({
                product: productId,
                unit_amount: Math.round(plan.priceYearly * 100), // cents
                currency: 'usd',
                recurring: { interval: 'year' },
                metadata: {
                    planId: plan.id,
                    billingCycle: 'yearly'
                }
            })
            yearlyPriceId = yearlyPrice.id
            console.log(`   ✅ Yearly price: ${yearlyPriceId} ($${plan.priceYearly}/year)`)
        }

        // Update plan in database
        await prisma.plan.update({
            where: { id: plan.id },
            data: {
                stripeProductId: productId,
                stripePriceMonthly: monthlyPriceId,
                stripePriceYearly: yearlyPriceId
            }
        })
        console.log('   ✅ Plan updated in database')
    }

    console.log('\n\n🎉 Sync complete!')
    console.log('\nNow users can subscribe via Stripe checkout.')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
