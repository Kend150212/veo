import { NextResponse } from 'next/server'
import { authenticateApiRequest, isAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getGateway } from '@/lib/payment-gateways'

/**
 * GET: List all payment gateways (admin only)
 */
export async function GET(request: Request) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!isAdmin(auth)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const gateways = await prisma.paymentGateway.findMany({
            orderBy: { sortOrder: 'asc' }
        })

        // Mask sensitive credentials
        const maskedGateways = gateways.map(g => {
            const creds = JSON.parse(g.credentials)
            const maskedCreds: Record<string, string> = {}

            for (const [key, value] of Object.entries(creds)) {
                if (typeof value === 'string' && value.length > 0) {
                    maskedCreds[key] = value.length > 8
                        ? value.substring(0, 4) + '****' + value.substring(value.length - 4)
                        : '****'
                } else {
                    maskedCreds[key] = ''
                }
            }

            return {
                ...g,
                credentials: maskedCreds,
                hasCredentials: Object.values(creds).some((v: unknown) => typeof v === 'string' && v.length > 0)
            }
        })

        return NextResponse.json({ gateways: maskedGateways })
    } catch (error) {
        console.error('List gateways error:', error)
        return NextResponse.json({ error: 'Failed to list gateways' }, { status: 500 })
    }
}

/**
 * PUT: Update payment gateway settings (admin only)
 * Body: { name, isEnabled, credentials, testMode }
 */
export async function PUT(request: Request) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!isAdmin(auth)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const body = await request.json()
        const { name, isEnabled, credentials, testMode } = body

        if (!name) {
            return NextResponse.json({ error: 'Gateway name required' }, { status: 400 })
        }

        const gateway = await prisma.paymentGateway.findUnique({
            where: { name }
        })

        if (!gateway) {
            return NextResponse.json({ error: 'Gateway not found' }, { status: 404 })
        }

        // Merge new credentials with existing (only update non-empty values)
        let updatedCredentials = gateway.credentials
        if (credentials) {
            const existingCreds = JSON.parse(gateway.credentials)
            const newCreds = { ...existingCreds }

            for (const [key, value] of Object.entries(credentials)) {
                if (typeof value === 'string' && value.length > 0 && !value.includes('****')) {
                    newCreds[key] = value
                }
            }

            updatedCredentials = JSON.stringify(newCreds)
        }

        const updated = await prisma.paymentGateway.update({
            where: { name },
            data: {
                isEnabled: isEnabled !== undefined ? isEnabled : gateway.isEnabled,
                credentials: updatedCredentials,
                testMode: testMode !== undefined ? testMode : gateway.testMode
            }
        })

        return NextResponse.json({
            success: true,
            gateway: {
                name: updated.name,
                displayName: updated.displayName,
                isEnabled: updated.isEnabled,
                testMode: updated.testMode
            }
        })
    } catch (error) {
        console.error('Update gateway error:', error)
        return NextResponse.json({ error: 'Failed to update gateway' }, { status: 500 })
    }
}

/**
 * POST: Test gateway connection (admin only)
 * Body: { name }
 */
export async function POST(request: Request) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!isAdmin(auth)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const body = await request.json()
        const { name, action } = body

        if (!name) {
            return NextResponse.json({ error: 'Gateway name required' }, { status: 400 })
        }

        if (action !== 'test') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        const gateway = getGateway(name)
        if (!gateway) {
            return NextResponse.json({ error: 'Gateway not found' }, { status: 404 })
        }

        const result = await gateway.testConnection()

        return NextResponse.json({
            success: result.success,
            error: result.error,
            message: result.success
                ? `${gateway.displayName} connection successful`
                : `${gateway.displayName} connection failed: ${result.error}`
        })
    } catch (error) {
        console.error('Test gateway error:', error)
        return NextResponse.json({ error: 'Failed to test gateway' }, { status: 500 })
    }
}
