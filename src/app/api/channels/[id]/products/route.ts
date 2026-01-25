import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: Create a new product for the channel
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
        const data = await req.json()

        // Verify channel ownership
        const channel = await prisma.channel.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        const product = await prisma.product.create({
            data: {
                name: data.name,
                description: data.description,
                price: data.price ? parseFloat(data.price) : null,
                salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
                discount: data.discount,
                promotion: data.promotion,
                imageUrl: data.imageUrl,
                imageBase64: data.imageBase64,
                aiAnalysis: data.aiAnalysis ? JSON.stringify(data.aiAnalysis) : null,
                productType: data.productType,
                color: data.color,
                material: data.material,
                style: data.style,
                channelId: id,
                episodeId: data.episodeId || null
            }
        })

        return NextResponse.json({ product })
    } catch (error) {
        console.error('Create product error:', error)
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
}

// GET: List products for channel
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

        const products = await prisma.product.findMany({
            where: { channelId: id },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ products })
    } catch (error) {
        console.error('List products error:', error)
        return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
    }
}
