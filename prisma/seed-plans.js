// Seed default plans and payment gateways
// Run: node prisma/seed-plans.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const defaultPlans = [
    {
        name: 'Free',
        slug: 'free',
        description: 'Get started with basic features',
        priceMonthly: 0,
        priceYearly: 0,
        yearlyDiscount: 0,
        maxChannels: 1,
        maxEpisodesPerMonth: 5,
        maxApiCalls: 0,
        features: JSON.stringify({
            apiAccess: false,
            advancedCinematicStyles: false,
            allNarrativeTemplates: false,
            characterCustomization: true,
            youtubeStrategies: false,
            prioritySupport: false,
            customIntegrations: false
        }),
        isPopular: false,
        sortOrder: 0,
        isActive: true
    },
    {
        name: 'Starter',
        slug: 'starter',
        description: 'Perfect for content creators starting out',
        priceMonthly: 19,
        priceYearly: 190,
        yearlyDiscount: 17,
        maxChannels: 3,
        maxEpisodesPerMonth: 50,
        maxApiCalls: 500,
        features: JSON.stringify({
            apiAccess: true,
            advancedCinematicStyles: false,
            allNarrativeTemplates: false,
            characterCustomization: true,
            youtubeStrategies: true,
            prioritySupport: false,
            customIntegrations: false
        }),
        isPopular: false,
        sortOrder: 1,
        isActive: true
    },
    {
        name: 'Pro',
        slug: 'pro',
        description: 'For professional creators and agencies',
        priceMonthly: 49,
        priceYearly: 490,
        yearlyDiscount: 17,
        maxChannels: 10,
        maxEpisodesPerMonth: 200,
        maxApiCalls: 2000,
        features: JSON.stringify({
            apiAccess: true,
            advancedCinematicStyles: true,
            allNarrativeTemplates: true,
            characterCustomization: true,
            youtubeStrategies: true,
            prioritySupport: true,
            customIntegrations: false
        }),
        isPopular: true,
        sortOrder: 2,
        isActive: true
    },
    {
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'Unlimited access for large teams',
        priceMonthly: 149,
        priceYearly: 1490,
        yearlyDiscount: 17,
        maxChannels: -1, // -1 = unlimited
        maxEpisodesPerMonth: -1,
        maxApiCalls: -1,
        features: JSON.stringify({
            apiAccess: true,
            advancedCinematicStyles: true,
            allNarrativeTemplates: true,
            characterCustomization: true,
            youtubeStrategies: true,
            prioritySupport: true,
            customIntegrations: true
        }),
        isPopular: false,
        sortOrder: 3,
        isActive: true
    }
]

const defaultGateways = [
    {
        name: 'stripe',
        displayName: 'Stripe',
        isEnabled: false,
        credentials: JSON.stringify({
            publishableKey: '',
            secretKey: '',
            webhookSecret: ''
        }),
        testMode: true,
        sortOrder: 0
    },
    {
        name: 'paypal',
        displayName: 'PayPal',
        isEnabled: false,
        credentials: JSON.stringify({
            clientId: '',
            clientSecret: '',
            webhookId: ''
        }),
        testMode: true,
        sortOrder: 1
    }
]

async function main() {
    console.log('🌱 Seeding plans and gateways...\n')

    // Seed Plans
    for (const plan of defaultPlans) {
        const existing = await prisma.plan.findUnique({ where: { slug: plan.slug } })
        if (existing) {
            console.log(`  ⏭️  Plan "${plan.name}" already exists, skipping`)
        } else {
            await prisma.plan.create({ data: plan })
            console.log(`  ✅ Created plan: ${plan.name}`)
        }
    }

    // Seed Payment Gateways
    for (const gateway of defaultGateways) {
        const existing = await prisma.paymentGateway.findUnique({ where: { name: gateway.name } })
        if (existing) {
            console.log(`  ⏭️  Gateway "${gateway.displayName}" already exists, skipping`)
        } else {
            await prisma.paymentGateway.create({ data: gateway })
            console.log(`  ✅ Created gateway: ${gateway.displayName}`)
        }
    }

    // Assign Free plan to all users without subscription
    const usersWithoutSub = await prisma.user.findMany({
        where: { subscription: null }
    })

    const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } })

    if (freePlan && usersWithoutSub.length > 0) {
        console.log(`\n📋 Assigning Free plan to ${usersWithoutSub.length} users...`)
        for (const user of usersWithoutSub) {
            await prisma.subscription.create({
                data: {
                    userId: user.id,
                    planId: freePlan.id,
                    status: 'active',
                    billingCycle: 'monthly'
                }
            })
            console.log(`  ✅ Assigned Free plan to: ${user.email}`)
        }
    }

    console.log('\n✨ Seeding complete!')
}

main()
    .catch(e => {
        console.error('Error:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
