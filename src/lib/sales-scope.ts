/**
 * Resolves the current user's role and team employee IDs from the database.
 * Always reads from DB (not JWT) to avoid stale-token issues.
 *
 * Returns:
 *   role      – current UserRole string
 *   empId     – the caller's own Employee ID (or null)
 *   teamIds   – for SALES_MANAGER: [empId, ...agentIds]; for SALES_AGENT: [empId]; else []
 */
import { prisma } from '@/lib/prisma'

export async function getSalesScope(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, employeeId: true },
  })

  const role = (user?.role as string) ?? 'EMPLOYEE'
  const empId = user?.employeeId ?? null

  if (role === 'SALES_MANAGER' && empId) {
    const agents = await prisma.employee.findMany({
      where: { managerId: empId },
      select: { id: true },
    })
    const teamIds = [empId, ...agents.map((a) => a.id)]
    return { role, empId, teamIds, isManager: true, isAgent: false }
  }

  if (role === 'SALES_AGENT' && empId) {
    return { role, empId, teamIds: [empId], isManager: false, isAgent: true }
  }

  return { role, empId, teamIds: empId ? [empId] : [], isManager: false, isAgent: false }
}

/**
 * Builds a Prisma `where` filter that scopes a lead/client query to the
 * caller's visible scope.  Returns an empty object for admins (see all).
 */
export function buildOwnerFilter(
  scope: Awaited<ReturnType<typeof getSalesScope>>,
  fields: { assignedTo: string; createdBy: string } = { assignedTo: 'assignedToId', createdBy: 'createdById' }
) {
  const { role, empId, teamIds } = scope
  if (['SUPER_ADMIN', 'HR_MANAGER', 'FINANCE_OFFICER'].includes(role)) return {}

  if (role === 'SALES_MANAGER' && teamIds.length > 0) {
    return {
      OR: [
        { [fields.assignedTo]: { in: teamIds } },
        { [fields.createdBy]: { in: teamIds } },
      ],
    }
  }

  if (empId) {
    return {
      OR: [{ [fields.assignedTo]: empId }, { [fields.createdBy]: empId }],
    }
  }

  return { id: '__none__' } // fallback – show nothing
}

export function buildCreatorFilter(scope: Awaited<ReturnType<typeof getSalesScope>>) {
  const { role, empId, teamIds } = scope
  if (['SUPER_ADMIN', 'HR_MANAGER', 'FINANCE_OFFICER'].includes(role)) return {}

  if (role === 'SALES_MANAGER' && teamIds.length > 0) {
    return { createdById: { in: teamIds } }
  }

  if (empId) return { createdById: empId }
  return { id: '__none__' }
}

export function buildAssigneeFilter(scope: Awaited<ReturnType<typeof getSalesScope>>) {
  const { role, empId, teamIds } = scope
  if (['SUPER_ADMIN', 'HR_MANAGER', 'FINANCE_OFFICER'].includes(role)) return {}

  if (role === 'SALES_MANAGER' && teamIds.length > 0) {
    return { assignedToId: { in: teamIds } }
  }

  if (empId) return { assignedToId: empId }
  return { id: '__none__' }
}
