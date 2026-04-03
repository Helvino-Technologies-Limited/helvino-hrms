/**
 * CRM Audit Logger
 * Fire-and-forget – never blocks the API response.
 * Writes to the existing AuditLog model in Prisma.
 */
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export type AuditAction =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'DEACTIVATED'
  | 'STATUS_CHANGED'
  | 'SENT'
  | 'ASSIGNED'
  | 'LOGGED_ACTIVITY'

export interface AuditParams {
  employeeId?: string | null
  action: AuditAction | string
  entity: string          // e.g. LEAD, CLIENT, QUOTATION
  entityId?: string | null
  label?: string          // human-readable: "LEAD-0001 — John Doe"
  oldValues?: Record<string, any> | null
  newValues?: Record<string, any> | null
  req?: NextRequest
}

export function logAudit(params: AuditParams): void {
  const { employeeId, action, entity, entityId, label, oldValues, newValues, req } = params

  const ipAddress =
    req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req?.headers.get('x-real-ip') ??
    null
  const userAgent = req?.headers.get('user-agent') ?? null

  const enrichedNew = label
    ? { _label: label, ...(newValues ?? {}) }
    : newValues ?? undefined

  prisma.auditLog
    .create({
      data: {
        employeeId: employeeId || null,
        action,
        entity,
        entityId: entityId || null,
        oldValues: oldValues ?? undefined,
        newValues: enrichedNew ?? undefined,
        ipAddress,
        userAgent,
      },
    })
    .catch((err) => console.error('[AuditLog] write failed:', err))
}
