const { PrismaClient } = require('/home/kevob/helvino-hrms/node_modules/.pnpm/@prisma+client@7.4.2_prisma@7.4.2_@types+react@19.2.14_react-dom@19.2.3_react@19.2.3__r_6e3ba3dfe5bf958e06a14e126c070379/node_modules/@prisma/client')
const { PrismaNeon } = require('/home/kevob/helvino-hrms/node_modules/.pnpm/@prisma+adapter-neon@7.4.2/node_modules/@prisma/adapter-neon/dist/index.js')
const { neonConfig } = require('/home/kevob/helvino-hrms/node_modules/.pnpm/@neondatabase+serverless@1.0.2/node_modules/@neondatabase/serverless/index.js')
const WebSocket = require('/home/kevob/helvino-hrms/node_modules/.pnpm/ws@8.19.0/node_modules/ws')

neonConfig.webSocketConstructor = WebSocket

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const results = await prisma.user.findMany({
    include: { employee: { select: { firstName: true, lastName: true } } },
    where: {
      OR: [
        { employee: { firstName: { contains: 'thomas', mode: 'insensitive' } } },
        { employee: { firstName: { contains: 'james', mode: 'insensitive' } } },
        { employee: { lastName: { contains: 'njoroge', mode: 'insensitive' } } },
        { employee: { lastName: { contains: 'joseph', mode: 'insensitive' } } },
      ]
    }
  })
  console.log(JSON.stringify(results.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    name: (u.employee?.firstName || '') + ' ' + (u.employee?.lastName || ''),
    empId: u.employeeId
  })), null, 2))
  await prisma.$disconnect()
}
main().catch(e => { console.error(e.message); process.exit(1) })
