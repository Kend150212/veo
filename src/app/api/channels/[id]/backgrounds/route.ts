import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// GET: Lấy danh sách backgrounds của channel
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Kiểm tra channel thuộc về user
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id },
            include: {
                backgrounds: {
                    orderBy: [
                        { isDefault: 'desc' },
                        { order: 'asc' },
                        { createdAt: 'asc' }
                    ]
                }
            }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        return NextResponse.json({ backgrounds: channel.backgrounds })
    } catch (error) {
        console.error('[Backgrounds GET] Error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch backgrounds' },
            { status: 500 }
        )
    }
}

// POST: Tạo background mới
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const { name, description, imageBase64, promptKeywords, isDefault } = await req.json()

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        // Kiểm tra channel thuộc về user
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        let imageUrl: string | null = null

        // Lưu hình ảnh nếu có
        if (imageBase64) {
            try {
                // Tạo thư mục nếu chưa có
                const uploadsDir = join(process.cwd(), 'public', 'uploads', 'backgrounds')
                if (!existsSync(uploadsDir)) {
                    await mkdir(uploadsDir, { recursive: true })
                }

                // Decode base64
                const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
                const buffer = Buffer.from(base64Data, 'base64')

                // Tạo tên file unique
                const fileName = `bg_${id}_${Date.now()}.${imageBase64.split(';')[0].split('/')[1] || 'png'}`
                const filePath = join(uploadsDir, fileName)

                // Lưu file
                await writeFile(filePath, buffer)

                // URL để truy cập từ web
                imageUrl = `/uploads/backgrounds/${fileName}`
            } catch (fileError) {
                console.error('[Background POST] File save error:', fileError)
                // Không fail nếu lưu file lỗi, vẫn tạo background
            }
        }

        // Nếu set làm default, bỏ default của các background khác
        if (isDefault) {
            await prisma.channelBackground.updateMany({
                where: { channelId: id, isDefault: true },
                data: { isDefault: false }
            })
        }

        // Tạo background mới
        const background = await prisma.channelBackground.create({
            data: {
                name,
                description: description || null,
                imageUrl,
                imageBase64: imageBase64 || null,
                promptKeywords: promptKeywords || null,
                isDefault: isDefault || false,
                channelId: id
            }
        })

        return NextResponse.json({ background })
    } catch (error) {
        console.error('[Background POST] Error:', error)
        return NextResponse.json(
            { error: 'Failed to create background' },
            { status: 500 }
        )
    }
}

// PUT: Cập nhật background
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const { backgroundId, name, description, imageBase64, promptKeywords, isDefault } = await req.json()

        if (!backgroundId) {
            return NextResponse.json({ error: 'Background ID is required' }, { status: 400 })
        }

        // Kiểm tra background thuộc về channel của user
        const background = await prisma.channelBackground.findFirst({
            where: {
                id: backgroundId,
                channel: {
                    id,
                    userId: session.user.id
                }
            }
        })

        if (!background) {
            return NextResponse.json({ error: 'Background not found' }, { status: 404 })
        }

        let imageUrl = background.imageUrl

        // Cập nhật hình ảnh nếu có
        if (imageBase64 && imageBase64 !== background.imageBase64) {
            try {
                const uploadsDir = join(process.cwd(), 'public', 'uploads', 'backgrounds')
                if (!existsSync(uploadsDir)) {
                    await mkdir(uploadsDir, { recursive: true })
                }

                const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
                const buffer = Buffer.from(base64Data, 'base64')
                const fileName = `bg_${id}_${Date.now()}.${imageBase64.split(';')[0].split('/')[1] || 'png'}`
                const filePath = join(uploadsDir, fileName)

                await writeFile(filePath, buffer)
                imageUrl = `/uploads/backgrounds/${fileName}`
            } catch (fileError) {
                console.error('[Background PUT] File save error:', fileError)
            }
        }

        // Nếu set làm default, bỏ default của các background khác
        if (isDefault && !background.isDefault) {
            await prisma.channelBackground.updateMany({
                where: { channelId: id, isDefault: true },
                data: { isDefault: false }
            })
        }

        // Cập nhật background
        const updated = await prisma.channelBackground.update({
            where: { id: backgroundId },
            data: {
                name: name || background.name,
                description: description !== undefined ? description : background.description,
                imageUrl,
                imageBase64: imageBase64 || background.imageBase64,
                promptKeywords: promptKeywords !== undefined ? promptKeywords : background.promptKeywords,
                isDefault: isDefault !== undefined ? isDefault : background.isDefault
            }
        })

        return NextResponse.json({ background: updated })
    } catch (error) {
        console.error('[Background PUT] Error:', error)
        return NextResponse.json(
            { error: 'Failed to update background' },
            { status: 500 }
        )
    }
}

// DELETE: Xóa background
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const { searchParams } = new URL(req.url)
        const backgroundId = searchParams.get('backgroundId')

        if (!backgroundId) {
            return NextResponse.json({ error: 'Background ID is required' }, { status: 400 })
        }

        // Kiểm tra background thuộc về channel của user
        const background = await prisma.channelBackground.findFirst({
            where: {
                id: backgroundId,
                channel: {
                    id,
                    userId: session.user.id
                }
            }
        })

        if (!background) {
            return NextResponse.json({ error: 'Background not found' }, { status: 404 })
        }

        // Xóa background
        await prisma.channelBackground.delete({
            where: { id: backgroundId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Background DELETE] Error:', error)
        return NextResponse.json(
            { error: 'Failed to delete background' },
            { status: 500 }
        )
    }
}
