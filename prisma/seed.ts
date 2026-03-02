import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Helvino HRMS...')

  // Create departments
  const deptNames = [
    { name: 'Software Development', description: 'Custom software engineering and development' },
    { name: 'Network & Infrastructure', description: 'Network design, deployment, and management' },
    { name: 'Cybersecurity', description: 'Information security and compliance' },
    { name: 'CCTV & Security Systems', description: 'Physical security and surveillance solutions' },
    { name: 'IT Support', description: 'Helpdesk and technical support services' },
    { name: 'Sales & Marketing', description: 'Business development and marketing' },
    { name: 'Finance & Operations', description: 'Financial management and operations' },
    { name: 'Human Resources', description: 'People management and organizational development' },
  ]

  const departments: any[] = []
  for (const dept of deptNames) {
    const d = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    })
    departments.push(d)
  }
  console.log(`✅ Created ${departments.length} departments`)

  // Create Super Admin employee
  const hrDept = departments.find(d => d.name === 'Human Resources')

  const adminEmployee = await prisma.employee.upsert({
    where: { email: 'admin@helvino.org' },
    update: {},
    create: {
      employeeCode: 'HTL0001',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@helvino.org',
      phone: '0703445756',
      jobTitle: 'System Administrator',
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      dateHired: new Date('2020-01-01'),
      departmentId: hrDept?.id,
    },
  })

  const hrManagerEmployee = await prisma.employee.upsert({
    where: { email: 'hr@helvino.org' },
    update: {},
    create: {
      employeeCode: 'HTL0002',
      firstName: 'HR',
      lastName: 'Manager',
      email: 'hr@helvino.org',
      phone: '0703445757',
      jobTitle: 'HR Manager',
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      dateHired: new Date('2021-01-01'),
      departmentId: hrDept?.id,
    },
  })

  // Create User accounts
  const adminPassword = await bcrypt.hash('Admin@123', 10)
  const hrPassword = await bcrypt.hash('Hr@123456', 10)

  await prisma.user.upsert({
    where: { email: 'admin@helvino.org' },
    update: {},
    create: {
      email: 'admin@helvino.org',
      name: 'System Administrator',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      employeeId: adminEmployee.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'hr@helvino.org' },
    update: {},
    create: {
      email: 'hr@helvino.org',
      name: 'HR Manager',
      password: hrPassword,
      role: 'HR_MANAGER',
      employeeId: hrManagerEmployee.id,
    },
  })

  // Initialize leave balances
  const year = new Date().getFullYear()
  const leaveAllocations: Record<string, number> = {
    ANNUAL: 21,
    SICK: 14,
    MATERNITY: 90,
    PATERNITY: 14,
    COMPASSIONATE: 5,
    UNPAID: 30,
    STUDY: 10,
  }
  const leaveTypes = Object.keys(leaveAllocations)

  for (const emp of [adminEmployee, hrManagerEmployee]) {
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.upsert({
        where: { employeeId_leaveType_year: { employeeId: emp.id, leaveType: lt as any, year } },
        update: {},
        create: {
          employeeId: emp.id,
          leaveType: lt as any,
          year,
          allocated: leaveAllocations[lt],
          used: 0,
          pending: 0,
          remaining: leaveAllocations[lt],
        },
      })
    }
  }

  // Create sample open job
  await prisma.job.upsert({
    where: { id: 'sample-job-1' },
    update: {},
    create: {
      id: 'sample-job-1',
      title: 'Senior Software Engineer',
      description: 'We are looking for an experienced software engineer to join our growing development team. You will work on cutting-edge web and mobile applications for our diverse client base across Kenya and East Africa.',
      requirements: 'BSc in Computer Science or related field\n3+ years experience in React/Next.js\nStrong TypeScript skills\nExperience with PostgreSQL\nGood communication skills',
      responsibilities: 'Design and develop scalable web applications\nCollaborate with cross-functional teams\nCode reviews and mentoring junior developers\nParticipate in agile ceremonies',
      departmentId: departments.find(d => d.name === 'Software Development')?.id,
      type: 'Full-time',
      location: 'Nairobi, Kenya',
      salaryMin: 80000,
      salaryMax: 150000,
      status: 'OPEN',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('✅ Seeded successfully!')
  console.log('')
  console.log('🔐 Login Credentials:')
  console.log('   Super Admin: admin@helvino.org / Admin@123')
  console.log('   HR Manager:  hr@helvino.org / Hr@123456')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
