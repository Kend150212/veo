import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/channels/[id]/categories - Lấy danh sách categories
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }

        const { id } = await params

        // Verify ownership
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Không tìm thấy channel' }, { status: 404 })
        }

        // Get categories with episode count
        const categories = await prisma.episodeCategory.findMany({
            where: { channelId: id },
            include: {
                _count: {
                    select: { episodes: true }
                }
            },
            orderBy: { order: 'asc' }
        })

        return NextResponse.json({ categories })

    } catch (error) {
        console.error('Get categories error:', error)
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
    }
}

// POST /api/channels/[id]/categories - Tạo category mới
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }

        const { id } = await params
        const { name, description, color } = await req.json()

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Tên danh mục không được để trống' }, { status: 400 })
        }

        // Verify ownership
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Không tìm thấy channel' }, { status: 404 })
        }

        // Get max order
        const lastCategory = await prisma.episodeCategory.findFirst({
            where: { channelId: id },
            orderBy: { order: 'desc' }
        })

        const category = await prisma.episodeCategory.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                color: color || '#6366f1',
                order: (lastCategory?.order || 0) + 1,
                channelId: id
            }
        })

        return NextResponse.json({ category }, { status: 201 })

    } catch (error) {
        console.error('Create category error:', error)
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
    }
}

// PUT /api/channels/[id]/categories - Cập nhật category
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }

        const { id } = await params
        const { categoryId, name, description, color, order } = await req.json()

        if (!categoryId) {
            return NextResponse.json({ error: 'Thiếu categoryId' }, { status: 400 })
        }

        // Verify ownership
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Không tìm thấy channel' }, { status: 404 })
        }

        const category = await prisma.episodeCategory.update({
            where: { id: categoryId },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(description !== undefined && { description: description?.trim() || null }),
                ...(color !== undefined && { color }),
                ...(order !== undefined && { order })
            }
        })

        return NextResponse.json({ category })

    } catch (error) {
        console.error('Update category error:', error)
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
    }
}

// DELETE /api/channels/[id]/categories - Xóa category
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }

        const { id } = await params
        const { searchParams } = new URL(req.url)
        const categoryId = searchParams.get('categoryId')

        if (!categoryId) {
            return NextResponse.json({ error: 'Thiếu categoryId' }, { status: 400 })
        }

        // Verify ownership
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Không tìm thấy channel' }, { status: 404 })
        }

        // Reset episodes to no category before deleting
        await prisma.episode.updateMany({
            where: { categoryId },
            data: { categoryId: null }
        })

        await prisma.episodeCategory.delete({
            where: { id: categoryId }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Delete category error:', error)
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
    }
}
