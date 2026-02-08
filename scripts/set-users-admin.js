// Script to update all existing users to admin role
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const result = await prisma.user.updateMany({
        where: { role: 'user' },
        data: { role: 'admin' }
    })
    console.log(`Updated ${result.count} users to admin role`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
