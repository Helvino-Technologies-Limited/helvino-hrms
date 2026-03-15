import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Original provider: SUPER_ADMIN + CLIENT via email/password ──
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            employee: { include: { department: true } },
            clientRecord: true,
          },
        })
        if (!user || !user.password) throw new Error('User not found')
        if (!user.isActive) throw new Error('Account has been deactivated. Contact your administrator.')
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) throw new Error('Invalid password')
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          employeeId: user.employeeId,
          employee: user.employee,
          clientId: user.clientId,
          client: user.clientRecord,
        }
      },
    }),

    // ── Employee identity provider: DOB + National ID + Secret Code ──
    CredentialsProvider({
      id: 'employee-identity',
      name: 'Employee Identity',
      credentials: {
        nationalId: { label: 'National ID', type: 'text' },
        dateOfBirth: { label: 'Date of Birth', type: 'text' },
        secretCode: { label: 'Secret Code', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.nationalId || !credentials?.dateOfBirth || !credentials?.secretCode) {
          throw new Error('All three identity fields are required')
        }

        try {
          const ipAddress = (req as any)?.headers?.['x-forwarded-for'] ||
                            (req as any)?.headers?.['x-real-ip'] || 'unknown'
          const userAgent = (req as any)?.headers?.['user-agent'] || ''

          // Find employee by National ID
          const employee = await prisma.employee.findFirst({
            where: { nationalId: credentials.nationalId },
            include: {
              user: { include: { clientRecord: true } },
              department: true,
            },
          })

          // Non-fatal: log auth attempt but never let logging errors cause a 500
          async function logAttempt(status: string, reason?: string) {
            try {
              await prisma.employeeAuthLog.create({
                data: {
                  employeeId: employee?.id,
                  nationalId: credentials!.nationalId,
                  status,
                  reason,
                  ipAddress: String(ipAddress),
                  userAgent: String(userAgent),
                },
              })
            } catch {
              // Logging failure should not block authentication
            }
          }

          if (!employee) {
            await logAttempt('failed', 'National ID not found')
            throw new Error('Invalid credentials. Please check your details.')
          }

          // Check lockout
          if (employee.accountLockedUntil && employee.accountLockedUntil > new Date()) {
            const unlockAt = employee.accountLockedUntil.toLocaleTimeString()
            await logAttempt('failed', 'Account locked')
            throw new Error(`Account is temporarily locked. Try again after ${unlockAt}.`)
          }

          // Verify Date of Birth (compare date only, ignore time)
          if (!employee.dateOfBirth) {
            await logAttempt('failed', 'DOB not configured')
            throw new Error('Identity credentials not fully configured. Contact HR.')
          }
          const empDOB = employee.dateOfBirth.toISOString().split('T')[0]
          const inputDOB = new Date(credentials.dateOfBirth).toISOString().split('T')[0]
          if (empDOB !== inputDOB) {
            await incrementFailures(employee.id, logAttempt)
            throw new Error('Invalid credentials. Please check your details.')
          }

          // Verify secret code
          if (!employee.secretCodeHash) {
            await logAttempt('failed', 'Secret code not set')
            throw new Error('Identity credentials not configured. Contact HR.')
          }
          const codeValid = await bcrypt.compare(credentials.secretCode, employee.secretCodeHash)
          if (!codeValid) {
            await incrementFailures(employee.id, logAttempt)
            throw new Error('Invalid credentials. Please check your details.')
          }

          // Success — reset failures
          await prisma.employee.update({
            where: { id: employee.id },
            data: { loginAttempts: 0, accountLockedUntil: null },
          })
          await logAttempt('success')

          // Get or create linked User record
          let user = employee.user
          if (!user) {
            const email = employee.email || `${employee.employeeCode}@helvino.internal`
            const tempPassword = await bcrypt.hash(Math.random().toString(36), 10)
            user = await prisma.user.upsert({
              where: { employeeId: employee.id },
              update: {},
              create: {
                email,
                name: `${employee.firstName} ${employee.lastName}`,
                password: tempPassword,
                role: 'EMPLOYEE',
                isActive: true,
                employeeId: employee.id,
              },
              include: { clientRecord: true },
            }) as any
          }

          return {
            id: user!.id,
            email: user!.email,
            name: user!.name,
            role: user!.role,
            employeeId: employee.id,
            employee: { ...employee, user: undefined },
            clientId: null,
            client: null,
          }
        } catch (err: any) {
          // Re-throw known auth errors as-is; wrap unexpected errors
          if (err?.message) throw err
          throw new Error('Authentication failed. Please try again.')
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.employeeId = (user as any).employeeId
        token.clientId = (user as any).clientId
        // Only store minimal employee fields to keep JWT small & serializable
        const emp = (user as any).employee
        token.employee = emp
          ? { id: emp.id, firstName: emp.firstName, lastName: emp.lastName, departmentId: emp.departmentId }
          : null
        const client = (user as any).client
        token.client = client
          ? { id: client.id, name: client.name, email: client.email, contactPerson: client.contactPerson }
          : null
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.employeeId = token.employeeId as string
        session.user.employee = token.employee as any
        session.user.clientId = token.clientId as string
        session.user.client = token.client as any
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
}

async function incrementFailures(
  employeeId: string,
  logAttempt: (status: string, reason?: string) => Promise<void>
) {
  const MAX_ATTEMPTS = 5
  const LOCK_MINUTES = 30

  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: { loginAttempts: { increment: 1 } },
  })

  if (updated.loginAttempts >= MAX_ATTEMPTS) {
    const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
    await prisma.employee.update({
      where: { id: employeeId },
      data: { accountLockedUntil: lockUntil },
    })
    await logAttempt('failed', `Account locked after ${MAX_ATTEMPTS} attempts`)
  } else {
    await logAttempt('failed', `Invalid credentials (attempt ${updated.loginAttempts}/${MAX_ATTEMPTS})`)
  }
}
