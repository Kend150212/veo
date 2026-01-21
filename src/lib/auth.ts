import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email và mật khẩu là bắt buộc')
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user) {
                    throw new Error('Không tìm thấy tài khoản')
                }

                const isValidPassword = await bcrypt.compare(
                    credentials.password,
                    user.password
                )

                if (!isValidPassword) {
                    throw new Error('Mật khẩu không đúng')
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            }
        })
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60 // 30 days
    },
    pages: {
        signIn: '/login',
        error: '/login'
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        }
    },
    secret: process.env.NEXTAUTH_SECRET
}
