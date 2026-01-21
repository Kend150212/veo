import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { registerSchema } from '@/lib/validators'

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validate input
        const validationResult = registerSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            )
        }

        const { email, password, name } = validationResult.data

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email đã được sử dụng' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'user'
            }
        })

        return NextResponse.json({
            message: 'Đăng ký thành công',
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        })
    } catch (error) {
        console.error('Register error:', error)
        return NextResponse.json(
            { error: 'Đã xảy ra lỗi khi đăng ký' },
            { status: 500 }
        )
    }
}
