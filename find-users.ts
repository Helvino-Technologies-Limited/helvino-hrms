import { prisma } from './src/lib/prisma'

async function main() {
  const results = await prisma.user.findMany({
    include: { employee: { select: { firstName: true, lastName: true, id: true } } },
    where: {
      OR: [
        { employee: { firstName: { contains: 'thomas', mode: 'insensitive' } } },
        { employee: { lastName: { contains: 'thomas', mode: 'insensitive' } } },
        { employee: { firstName: { contains: 'joseph', mode: 'insensitive' } } },
        { employee: { lastName: { contains: 'joseph', mode: 'insensitive' } } },
        { employee: { firstName: { contains: 'james', mode: 'insensitive' } } },
        { employee: { lastName: { contains: 'james', mode: 'insensitive' } } },
        { employee: { lastName: { contains: 'njoroge', mode: 'insensitive' } } },
      ]
    }
  })
  console.log(JSON.stringify(results.map(u => ({ id: u.id, email: u.email, role: u.role, name: u.employee?.firstName + ' ' + u.employee?.lastName, empId: u.employeeId })), null, 2))
  await prisma.$disconnect()
}
main().catch(console.error)
