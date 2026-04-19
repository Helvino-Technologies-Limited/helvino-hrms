import { neon } from '@neondatabase/serverless'

const sql = neon("postgresql://neondb_owner:npg_5HCXgdz7cRvt@ep-small-lab-aktiict4.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require")

// Step 1: Find Joseph's Employee record
const employees = await sql`
  SELECT id, "employeeCode", "firstName", "lastName", email, "employmentStatus"
  FROM "Employee"
  WHERE LOWER("firstName") LIKE '%joseph%' AND LOWER("lastName") LIKE '%waithaka%'
`
console.log('Employee records:', JSON.stringify(employees, null, 2))

// Step 2: Find User with matching email or linked to Joseph
for (const emp of employees) {
  const users = await sql`
    SELECT id, email, role, "employeeId"
    FROM "User"
    WHERE email = ${emp.email} OR "employeeId" = ${emp.id}
  `
  console.log(`\nUsers for employee ${emp.employeeCode} (${emp.firstName} ${emp.lastName}):`, JSON.stringify(users, null, 2))

  // Step 3: Count leads
  const leads = await sql`
    SELECT COUNT(*)::int as total,
      SUM(CASE WHEN "createdById" = ${emp.id} THEN 1 ELSE 0 END)::int as created,
      SUM(CASE WHEN "assignedToId" = ${emp.id} THEN 1 ELSE 0 END)::int as assigned
    FROM "Lead"
    WHERE "createdById" = ${emp.id} OR "assignedToId" = ${emp.id}
  `
  console.log('Leads:', leads[0])

  // Step 4: If user email matches employee email but employeeId is wrong/null, fix it
  const matchingUser = users.find(u => u.email === emp.email)
  if (matchingUser && matchingUser.employeeId !== emp.id) {
    console.log(`\nFIXING: Setting User ${matchingUser.email} employeeId from "${matchingUser.employeeId}" to "${emp.id}"`)
    await sql`UPDATE "User" SET "employeeId" = ${emp.id} WHERE id = ${matchingUser.id}`
    console.log('DONE - Fixed!')
  } else if (matchingUser && matchingUser.employeeId === emp.id) {
    console.log('\nLink is already correct — employeeId matches')
  } else {
    console.log('\nNo matching user found by email — checking by role...')
    // Try to find any user whose email contains joseph or waithaka
    const usersByName = await sql`
      SELECT id, email, role, "employeeId" FROM "User"
      WHERE LOWER(email) LIKE '%joseph%' OR LOWER(email) LIKE '%waithaka%'
    `
    console.log('Users by name search:', JSON.stringify(usersByName, null, 2))
  }
}
