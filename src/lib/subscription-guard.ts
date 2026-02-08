/**
 * Subscription Guard - Middleware for enforcing subscription limits
 */

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export interface SubscriptionLimits {
    maxChannels: number
    maxEpisodesPerMonth: number
    maxApiCalls: number
    features: Record<string, boolean>
}

export interface SubscriptionStatus {
    isActive: boolean
    isTrialing: boolean
    planName: string
    planSlug: string
    limits: SubscriptionLimits
    usage: {
        apiCallsUsed: number
        episodesCreated: number
        channelCount: number
    }
    canCreateChannel: boolean
    canCreateEpisode: boolean
    canMakeApiCall: boolean
}

/**
 * Get subscription status for a user
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscription: {
                    include: { plan: true }
                },
                channels: { select: { id: true } }
            }
        })

        if (!user) return null

        // Default to free plan if no subscription
        let plan = user.subscription?.plan
        if (!plan) {
            plan = await prisma.plan.findUnique({ where: { slug: 'free' } }) ?? undefined
            if (!plan) return null
        }

        const subscription = user.subscription
        const features = JSON.parse(plan.features) as Record<string, boolean>
        const channelCount = user.channels.length

        const limits: SubscriptionLimits = {
            maxChannels: plan.maxChannels,
            maxEpisodesPerMonth: plan.maxEpisodesPerMonth,
            maxApiCalls: plan.maxApiCalls,
            features
        }

        const usage = {
            apiCallsUsed: subscription?.apiCallsUsed || 0,
            episodesCreated: subscription?.episodesCreated || 0,
            channelCount
        }

        // Check status
        const isActive = subscription?.status === 'active' || subscription?.status === 'trialing' || !subscription
        const isTrialing = subscription?.status === 'trialing'

        // Calculate permissions
        const canCreateChannel = limits.maxChannels === -1 || channelCount < limits.maxChannels
        const canCreateEpisode = limits.maxEpisodesPerMonth === -1 || usage.episodesCreated < limits.maxEpisodesPerMonth
        const canMakeApiCall = limits.maxApiCalls === -1 || (limits.maxApiCalls > 0 && usage.apiCallsUsed < limits.maxApiCalls)

        return {
            isActive,
            isTrialing,
            planName: plan.name,
            planSlug: plan.slug,
            limits,
            usage,
            canCreateChannel,
            canCreateEpisode,
            canMakeApiCall
        }
    } catch (error) {
        console.error('Error getting subscription status:', error)
        return null
    }
}

/**
 * Increment API call counter
 */
export async function incrementApiUsage(userId: string): Promise<boolean> {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { userId }
        })

        if (!subscription) return false

        await prisma.subscription.update({
            where: { id: subscription.id },
            data: { apiCallsUsed: { increment: 1 } }
        })

        return true
    } catch (error) {
        console.error('Error incrementing API usage:', error)
        return false
    }
}

/**
 * Increment episode counter
 */
export async function incrementEpisodeUsage(userId: string): Promise<boolean> {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { userId }
        })

        if (!subscription) return false

        await prisma.subscription.update({
            where: { id: subscription.id },
            data: { episodesCreated: { increment: 1 } }
        })

        return true
    } catch (error) {
        console.error('Error incrementing episode usage:', error)
        return false
    }
}

/**
 * Check if user can create a channel
 */
export async function checkChannelLimit(userId: string): Promise<{ allowed: boolean; error?: string }> {
    const status = await getSubscriptionStatus(userId)

    if (!status) {
        return { allowed: false, error: 'Unable to verify subscription' }
    }

    if (!status.isActive) {
        return { allowed: false, error: 'Subscription is not active' }
    }

    if (!status.canCreateChannel) {
        return {
            allowed: false,
            error: `Channel limit reached (${status.usage.channelCount}/${status.limits.maxChannels}). Upgrade your plan for more channels.`
        }
    }

    return { allowed: true }
}

/**
 * Check if user can create an episode
 */
export async function checkEpisodeLimit(userId: string): Promise<{ allowed: boolean; error?: string }> {
    const status = await getSubscriptionStatus(userId)

    if (!status) {
        return { allowed: false, error: 'Unable to verify subscription' }
    }

    if (!status.isActive) {
        return { allowed: false, error: 'Subscription is not active' }
    }

    if (!status.canCreateEpisode) {
        return {
            allowed: false,
            error: `Monthly episode limit reached (${status.usage.episodesCreated}/${status.limits.maxEpisodesPerMonth}). Upgrade your plan or wait until next billing cycle.`
        }
    }

    return { allowed: true }
}

/**
 * Check if user can make API call
 */
export async function checkApiLimit(userId: string): Promise<{ allowed: boolean; error?: string }> {
    const status = await getSubscriptionStatus(userId)

    if (!status) {
        return { allowed: false, error: 'Unable to verify subscription' }
    }

    if (!status.isActive) {
        return { allowed: false, error: 'Subscription is not active' }
    }

    if (status.limits.maxApiCalls === 0) {
        return {
            allowed: false,
            error: 'API access is not included in your plan. Upgrade to Starter or higher.'
        }
    }

    if (!status.canMakeApiCall) {
        return {
            allowed: false,
            error: `Monthly API limit reached (${status.usage.apiCallsUsed}/${status.limits.maxApiCalls}). Upgrade your plan or wait until next billing cycle.`
        }
    }

    return { allowed: true }
}

/**
 * Middleware helper for API routes to check subscription
 */
export function subscriptionGuard(limitType: 'api' | 'episode' | 'channel') {
    return async (userId: string): Promise<NextResponse | null> => {
        let check: { allowed: boolean; error?: string }

        switch (limitType) {
            case 'api':
                check = await checkApiLimit(userId)
                break
            case 'episode':
                check = await checkEpisodeLimit(userId)
                break
            case 'channel':
                check = await checkChannelLimit(userId)
                break
        }

        if (!check.allowed) {
            return NextResponse.json(
                { error: check.error, code: 'LIMIT_EXCEEDED' },
                { status: 403 }
            )
        }

        // Increment usage counter for API calls
        if (limitType === 'api') {
            await incrementApiUsage(userId)
        }

        return null // Allow the request
    }
}

/**
 * Check feature access
 */
export async function checkFeatureAccess(userId: string, featureKey: string): Promise<boolean> {
    const status = await getSubscriptionStatus(userId)
    if (!status) return false
    return status.limits.features[featureKey] === true
}
