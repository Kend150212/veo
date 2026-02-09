// Run on production server: node scripts/setup-admin.js ken.d150212@gmail.com
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const email = process.argv[2] || 'ken.d150212@gmail.com'

    const user = await prisma.user.update({
        where: { email },
        data: { role: 'admin' }
    })

    console.log(`✅ Set admin for: ${user.email}`)
    console.log(`   Role: ${user.role}`)
}

main()
    .catch(e => {
        console.error('Error:', e.message)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
