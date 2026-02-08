import { NextResponse } from 'next/server'
import { authenticateApiRequest, isAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// Helper to get Stripe instance
async function getStripe(): Promise<Stripe | null> {
    try {
        const gateway = await prisma.paymentGateway.findUnique({
            where: { name: 'stripe' }
        })
        if (!gateway?.isEnabled) return null

        const creds = JSON.parse(gateway.credentials || '{}')
        if (!creds.secretKey) return null

        return new Stripe(creds.secretKey)
    } catch {
        return null
    }
}

// Auto-sync plan with Stripe
async function syncPlanWithStripe(plan: {
    id: string
    name: string
    slug: string
    description: string | null
    priceMonthly: number
    priceYearly: number
    stripeProductId: string | null
    stripePriceMonthly: string | null
    stripePriceYearly: string | null
}): Promise<{
    stripeProductId?: string
    stripePriceMonthly?: string
    stripePriceYearly?: string
} | null> {
    // Skip free plans
    if (plan.priceMonthly === 0 && plan.priceYearly === 0) return null

    const stripe = await getStripe()
    if (!stripe) return null

    try {
        let productId = plan.stripeProductId

        // Create or update product
        if (!productId) {
            const product = await stripe.products.create({
                name: `Veo Prompt - ${plan.name}`,
                description: plan.description || `${plan.name} subscription plan`,
                metadata: {
                    planId: plan.id,
                    planSlug: plan.slug
                }
            })
            productId = product.id
        } else {
            // Update existing product
            await stripe.products.update(productId, {
                name: `Veo Prompt - ${plan.name}`,
                description: plan.description || `${plan.name} subscription plan`
            })
        }

        // Create monthly price if needed
        let monthlyPriceId = plan.stripePriceMonthly
        if (!monthlyPriceId && plan.priceMonthly > 0) {
            const price = await stripe.prices.create({
                product: productId,
                unit_amount: Math.round(plan.priceMonthly * 100),
                currency: 'usd',
                recurring: { interval: 'month' },
                metadata: { planId: plan.id, billingCycle: 'monthly' }
            })
            monthlyPriceId = price.id
        }

        // Create yearly price if needed
        let yearlyPriceId = plan.stripePriceYearly
        if (!yearlyPriceId && plan.priceYearly > 0) {
            const price = await stripe.prices.create({
                product: productId,
                unit_amount: Math.round(plan.priceYearly * 100),
                currency: 'usd',
                recurring: { interval: 'year' },
                metadata: { planId: plan.id, billingCycle: 'yearly' }
            })
            yearlyPriceId = price.id
        }

        return {
            stripeProductId: productId,
            stripePriceMonthly: monthlyPriceId || undefined,
            stripePriceYearly: yearlyPriceId || undefined
        }
    } catch (err) {
        console.error('Stripe sync error:', err)
        return null
    }
}

/**
 * GET: List all plans (admin only for full details)
 */
export async function GET(request: Request) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!isAdmin(auth)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const plans = await prisma.plan.findMany({
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: { select: { subscriptions: true } }
            }
        })

        return NextResponse.json({
            plans: plans.map(p => ({
                ...p,
                features: JSON.parse(p.features),
                subscriberCount: p._count.subscriptions
            }))
        })
    } catch (error) {
        console.error('List plans error:', error)
        return NextResponse.json({ error: 'Failed to list plans' }, { status: 500 })
    }
}

/**
 * POST: Create new plan (admin only)
 * Auto-creates Stripe Product and Prices if Stripe is configured
 */
export async function POST(request: Request) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!isAdmin(auth)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const body = await request.json()
        const {
            name,
            slug,
            description,
            priceMonthly = 0,
            priceYearly = 0,
            yearlyDiscount = 0,
            maxChannels = 1,
            maxEpisodesPerMonth = 5,
            maxApiCalls = 0,
            features = {},
            isPopular = false,
            sortOrder = 0,
            isActive = true
        } = body

        if (!name || !slug) {
            return NextResponse.json({ error: 'Name and slug required' }, { status: 400 })
        }

        // Check slug uniqueness
        const existing = await prisma.plan.findUnique({ where: { slug } })
        if (existing) {
            return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
        }

        // Create plan in database
        let plan = await prisma.plan.create({
            data: {
                name,
                slug,
                description,
                priceMonthly,
                priceYearly,
                yearlyDiscount,
                maxChannels,
                maxEpisodesPerMonth,
                maxApiCalls,
                features: JSON.stringify(features),
                isPopular,
                sortOrder,
                isActive
            }
        })

        // Auto-sync with Stripe
        const stripeData = await syncPlanWithStripe({
            ...plan,
            stripeProductId: null,
            stripePriceMonthly: null,
            stripePriceYearly: null
        })

        if (stripeData) {
            plan = await prisma.plan.update({
                where: { id: plan.id },
                data: stripeData
            })
        }

        return NextResponse.json({
            success: true,
            plan: {
                ...plan,
                features: JSON.parse(plan.features)
            },
            stripeSync: !!stripeData
        }, { status: 201 })
    } catch (error) {
        console.error('Create plan error:', error)
        return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
    }
}

/**
 * PUT: Update plan (admin only)
 * Auto-syncs with Stripe if prices are missing
 */
export async function PUT(request: Request) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!isAdmin(auth)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const body = await request.json()

        // Extract only valid update fields, filter out computed fields
        const {
            id,
            name,
            slug,
            description,
            priceMonthly,
            priceYearly,
            yearlyDiscount,
            maxChannels,
            maxEpisodesPerMonth,
            maxApiCalls,
            features,
            isPopular,
            sortOrder,
            isActive,
            stripePriceMonthly,
            stripePriceYearly,
            paypalPlanMonthly,
            paypalPlanYearly,
            syncStripe // Optional: force sync with Stripe
        } = body

        if (!id) {
            return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })
        }

        // Build update data with only defined values
        const updateData: Record<string, unknown> = {}
        if (name !== undefined) updateData.name = name
        if (slug !== undefined) updateData.slug = slug
        if (description !== undefined) updateData.description = description
        if (priceMonthly !== undefined) updateData.priceMonthly = priceMonthly
        if (priceYearly !== undefined) updateData.priceYearly = priceYearly
        if (yearlyDiscount !== undefined) updateData.yearlyDiscount = yearlyDiscount
        if (maxChannels !== undefined) updateData.maxChannels = maxChannels
        if (maxEpisodesPerMonth !== undefined) updateData.maxEpisodesPerMonth = maxEpisodesPerMonth
        if (maxApiCalls !== undefined) updateData.maxApiCalls = maxApiCalls
        if (isPopular !== undefined) updateData.isPopular = isPopular
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder
        if (isActive !== undefined) updateData.isActive = isActive
        if (stripePriceMonthly !== undefined) updateData.stripePriceMonthly = stripePriceMonthly
        if (stripePriceYearly !== undefined) updateData.stripePriceYearly = stripePriceYearly
        if (paypalPlanMonthly !== undefined) updateData.paypalPlanMonthly = paypalPlanMonthly
        if (paypalPlanYearly !== undefined) updateData.paypalPlanYearly = paypalPlanYearly
        if (features !== undefined) {
            updateData.features = typeof features === 'string' ? features : JSON.stringify(features)
        }

        let plan = await prisma.plan.update({
            where: { id },
            data: updateData
        })

        // Auto-sync with Stripe if requested or if prices are missing
        const needsSync = syncStripe ||
            (plan.priceMonthly > 0 && !plan.stripePriceMonthly) ||
            (plan.priceYearly > 0 && !plan.stripePriceYearly)

        let stripeSync = false
        if (needsSync) {
            const stripeData = await syncPlanWithStripe(plan)
            if (stripeData) {
                plan = await prisma.plan.update({
                    where: { id: plan.id },
                    data: stripeData
                })
                stripeSync = true
            }
        }

        return NextResponse.json({
            success: true,
            plan: {
                ...plan,
                features: JSON.parse(plan.features)
            },
            stripeSync
        })
    } catch (error) {
        console.error('Update plan error:', error)
        return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
    }
}

/**
 * DELETE: Delete plan (admin only)
 * Only if no active subscriptions
 */
export async function DELETE(request: Request) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!isAdmin(auth)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const url = new URL(request.url)
        const id = url.searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })
        }

        // Check for active subscriptions
        const activeCount = await prisma.subscription.count({
            where: { planId: id, status: 'active' }
        })

        if (activeCount > 0) {
            return NextResponse.json({
                error: `Cannot delete plan with ${activeCount} active subscriptions`
            }, { status: 400 })
        }

        await prisma.plan.delete({ where: { id } })

        return NextResponse.json({ success: true, message: 'Plan deleted' })
    } catch (error) {
        console.error('Delete plan error:', error)
        return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
    }
}
