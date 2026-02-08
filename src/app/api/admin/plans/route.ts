import { NextResponse } from 'next/server'
import { authenticateApiRequest, isAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

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

        const plan = await prisma.plan.create({
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

        return NextResponse.json({
            success: true,
            plan: {
                ...plan,
                features: JSON.parse(plan.features)
            }
        }, { status: 201 })
    } catch (error) {
        console.error('Create plan error:', error)
        return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
    }
}

/**
 * PUT: Update plan (admin only)
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
            paypalPlanYearly
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

        const plan = await prisma.plan.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json({
            success: true,
            plan: {
                ...plan,
                features: JSON.parse(plan.features)
            }
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
