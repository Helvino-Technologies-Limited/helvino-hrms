import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

const sql = neon('postgresql://neondb_owner:npg_5HCXgdz7cRvt@ep-small-lab-aktiict4-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require')

async function main() {
  console.log('🌱 Seeding Helvino HRMS...')

  // Create departments
  const depts = [
    { name: 'Software Development', description: 'Custom software engineering and development' },
    { name: 'Network & Infrastructure', description: 'Network design, deployment, and management' },
    { name: 'Cybersecurity', description: 'Information security and compliance' },
    { name: 'CCTV & Security Systems', description: 'Physical security and surveillance solutions' },
    { name: 'IT Support', description: 'Helpdesk and technical support services' },
    { name: 'Sales & Marketing', description: 'Business development and marketing' },
    { name: 'Finance & Operations', description: 'Financial management and operations' },
    { name: 'Human Resources', description: 'People management and organizational development' },
  ]

  let hrDeptId = null
  for (const dept of depts) {
    const existing = await sql`SELECT id FROM "Department" WHERE name = ${dept.name}`
    if (existing.length === 0) {
      const result = await sql`
        INSERT INTO "Department" (id, name, description, "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${dept.name}, ${dept.description}, NOW(), NOW())
        RETURNING id
      `
      if (dept.name === 'Human Resources') hrDeptId = result[0].id
      console.log(`✅ Created department: ${dept.name}`)
    } else {
      if (dept.name === 'Human Resources') hrDeptId = existing[0].id
      console.log(`⏭️  Department exists: ${dept.name}`)
    }
  }

  // Create admin employee
  let adminEmpId = null
  const existingAdminEmp = await sql`SELECT id FROM "Employee" WHERE email = 'admin@helvino.org'`
  if (existingAdminEmp.length === 0) {
    const result = await sql`
      INSERT INTO "Employee" (
        id, "employeeCode", "firstName", "lastName", email, phone,
        "jobTitle", "employmentType", "employmentStatus", "dateHired",
        "departmentId", country, "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text, 'HTL0001', 'System', 'Administrator',
        'admin@helvino.org', '0703445756', 'System Administrator',
        'FULL_TIME', 'ACTIVE', '2020-01-01',
        ${hrDeptId}, 'Kenya', NOW(), NOW()
      ) RETURNING id
    `
    adminEmpId = result[0].id
    console.log('✅ Admin employee created')
  } else {
    adminEmpId = existingAdminEmp[0].id
    console.log('⏭️  Admin employee exists')
  }

  // Create HR employee
  let hrEmpId = null
  const existingHrEmp = await sql`SELECT id FROM "Employee" WHERE email = 'hr@helvino.org'`
  if (existingHrEmp.length === 0) {
    const result = await sql`
      INSERT INTO "Employee" (
        id, "employeeCode", "firstName", "lastName", email, phone,
        "jobTitle", "employmentType", "employmentStatus", "dateHired",
        "departmentId", country, "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text, 'HTL0002', 'HR', 'Manager',
        'hr@helvino.org', '0703445757', 'HR Manager',
        'FULL_TIME', 'ACTIVE', '2021-01-01',
        ${hrDeptId}, 'Kenya', NOW(), NOW()
      ) RETURNING id
    `
    hrEmpId = result[0].id
    console.log('✅ HR employee created')
  } else {
    hrEmpId = existingHrEmp[0].id
    console.log('⏭️  HR employee exists')
  }

  // Hash passwords
  const adminHash = await bcrypt.hash('Admin@123', 10)
  const hrHash = await bcrypt.hash('Hr@123456', 10)

  // Create admin user
  const existingAdminUser = await sql`SELECT id FROM "User" WHERE email = 'admin@helvino.org'`
  if (existingAdminUser.length === 0) {
    await sql`
      INSERT INTO "User" (id, email, name, password, role, "employeeId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, 'admin@helvino.org', 'System Administrator',
        ${adminHash}, 'SUPER_ADMIN', ${adminEmpId}, NOW(), NOW())
    `
    console.log('✅ Admin user created')
  } else {
    await sql`UPDATE "User" SET password = ${adminHash} WHERE email = 'admin@helvino.org'`
    console.log('✅ Admin user password updated')
  }

  // Create HR user
  const existingHrUser = await sql`SELECT id FROM "User" WHERE email = 'hr@helvino.org'`
  if (existingHrUser.length === 0) {
    await sql`
      INSERT INTO "User" (id, email, name, password, role, "employeeId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, 'hr@helvino.org', 'HR Manager',
        ${hrHash}, 'HR_MANAGER', ${hrEmpId}, NOW(), NOW())
    `
    console.log('✅ HR user created')
  } else {
    await sql`UPDATE "User" SET password = ${hrHash} WHERE email = 'hr@helvino.org'`
    console.log('✅ HR user password updated')
  }

  // Create leave balances
  const year = new Date().getFullYear()
  const leaveTypes = [
    { type: 'ANNUAL', days: 21 },
    { type: 'SICK', days: 14 },
    { type: 'MATERNITY', days: 90 },
    { type: 'PATERNITY', days: 14 },
    { type: 'COMPASSIONATE', days: 5 },
    { type: 'UNPAID', days: 30 },
    { type: 'STUDY', days: 10 },
  ]

  for (const emp of [{ id: adminEmpId }, { id: hrEmpId }]) {
    for (const lt of leaveTypes) {
      const existing = await sql`
        SELECT id FROM "LeaveBalance"
        WHERE "employeeId" = ${emp.id} AND "leaveType" = ${lt.type} AND year = ${year}
      `
      if (existing.length === 0) {
        await sql`
          INSERT INTO "LeaveBalance" (id, "employeeId", "leaveType", year, allocated, used, pending, remaining, "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${emp.id}, ${lt.type}, ${year}, ${lt.days}, 0, 0, ${lt.days}, NOW(), NOW())
        `
      }
    }
  }
  console.log('✅ Leave balances created')

  console.log('')
  console.log('🎉 Seed complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Admin:      admin@helvino.org')
  console.log('Password:   Admin@123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('HR Manager: hr@helvino.org')
  console.log('Password:   Hr@123456')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1) })
