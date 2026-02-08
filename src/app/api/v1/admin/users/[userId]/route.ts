import { NextResponse } from 'next/server'
import { authenticateApiRequest, isAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// GET: Get user details (admin only)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!isAdmin(auth)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { userId } = await params

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: { channels: true, projects: true, prompts: true }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ user })
    } catch (error) {
        console.error('Get user error:', error)
        return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
    }
}

// PUT: Update user (admin only)
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!isAdmin(auth)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { userId } = await params
        const body = await request.json()

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                name: body.name,
                role: body.role, // 'admin' or 'user'
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        })

        return NextResponse.json({ user, message: 'User updated successfully' })
    } catch (error) {
        console.error('Update user error:', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}

// DELETE: Delete user (admin only)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const auth = await authenticateApiRequest(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!isAdmin(auth)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { userId } = await params

        // Prevent self-deletion
        if (userId === auth.userId) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
        }

        await prisma.user.delete({
            where: { id: userId }
        })

        return NextResponse.json({ message: 'User deleted successfully' })
    } catch (error) {
        console.error('Delete user error:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
