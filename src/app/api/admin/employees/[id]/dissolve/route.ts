import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/employees/[id]/dissolve   body: { keepId: string }
// Transfers all records from [id] → keepId, then permanently deletes [id] and its user.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id: deleteId } = await params
    const { keepId } = await req.json()

    if (!keepId) return NextResponse.json({ error: 'keepId is required' }, { status: 400 })
    if (deleteId === keepId) return NextResponse.json({ error: 'deleteId and keepId must be different' }, { status: 400 })

    const [toDelete, toKeep] = await Promise.all([
      prisma.employee.findUnique({
        where: { id: deleteId },
        include: { user: { select: { id: true } } },
      }),
      prisma.employee.findUnique({ where: { id: keepId }, select: { id: true, firstName: true, lastName: true } }),
    ])

    if (!toDelete) return NextResponse.json({ error: 'Employee to dissolve not found' }, { status: 404 })
    if (!toKeep) return NextResponse.json({ error: 'Target employee not found' }, { status: 404 })

    let leadsTransferred = 0

    await prisma.$transaction(async (tx) => {
      // ── Sales / CRM ─────────────────────────────────────────────────────────
      const [assignedLeads, createdLeads] = await Promise.all([
        tx.lead.updateMany({ where: { assignedToId: deleteId }, data: { assignedToId: keepId } }),
        tx.lead.updateMany({ where: { createdById: deleteId }, data: { createdById: keepId } }),
      ])
      leadsTransferred = assignedLeads.count + createdLeads.count

      await Promise.all([
        tx.client.updateMany({ where: { assignedToId: deleteId }, data: { assignedToId: keepId } }),
        tx.client.updateMany({ where: { createdById: deleteId }, data: { createdById: keepId } }),
        tx.salesTask.updateMany({ where: { assignedToId: deleteId }, data: { assignedToId: keepId } }),
        tx.salesTask.updateMany({ where: { createdById: deleteId }, data: { createdById: keepId } }),
        tx.quotation.updateMany({ where: { createdById: deleteId }, data: { createdById: keepId } }),
      ])

      // ── HR records ──────────────────────────────────────────────────────────
      await Promise.all([
        tx.leave.updateMany({ where: { employeeId: deleteId }, data: { employeeId: keepId } }),
        tx.leave.updateMany({ where: { approvedBy: deleteId }, data: { approvedBy: null } }),
        tx.attendance.updateMany({ where: { employeeId: deleteId }, data: { employeeId: keepId } }),
        tx.payroll.updateMany({ where: { employeeId: deleteId }, data: { employeeId: keepId } }),
        tx.goal.updateMany({ where: { employeeId: deleteId }, data: { employeeId: keepId } }),
        tx.leaveBalance.deleteMany({ where: { employeeId: deleteId } }),
      ])

      // ── Performance ─────────────────────────────────────────────────────────
      await Promise.all([
        tx.performanceReview.updateMany({ where: { employeeId: deleteId }, data: { employeeId: keepId } }),
        tx.performanceReview.updateMany({ where: { reviewerId: deleteId }, data: { reviewerId: keepId } }),
        tx.interviewEvaluation.updateMany({ where: { evaluatedById: deleteId }, data: { evaluatedById: null } }),
      ])

      // ── Recruitment ─────────────────────────────────────────────────────────
      await Promise.all([
        tx.job.updateMany({ where: { hiringManagerId: deleteId }, data: { hiringManagerId: null } }),
        tx.applicant.updateMany({ where: { salesManagerId: deleteId }, data: { salesManagerId: null } }),
        tx.interview.updateMany({ where: { interviewerId: deleteId }, data: { interviewerId: null } }),
        tx.jobOffer.updateMany({ where: { createdById: deleteId }, data: { createdById: null } }),
      ])

      // ── Announcements ───────────────────────────────────────────────────────
      await tx.announcement.updateMany({ where: { authorId: deleteId }, data: { authorId: keepId } })

      // ── Sales team models ────────────────────────────────────────────────────
      // SalesManagerRecruitmentLink has a unique managerId — delete it for the dissolved account
      await tx.salesManagerRecruitmentLink.deleteMany({ where: { managerId: deleteId } })
      await Promise.all([
        tx.salesTeamMeeting.updateMany({ where: { managerId: deleteId }, data: { managerId: keepId } }),
        tx.salesTeamTask.updateMany({ where: { managerId: deleteId }, data: { managerId: keepId } }),
        tx.salesTeamTask.updateMany({ where: { assignedToId: deleteId }, data: { assignedToId: keepId } }),
      ])

      // ── Policy records ───────────────────────────────────────────────────────
      // EmployeePolicyAcceptance has a unique [employeeId, policyVersionId] — just delete for the dissolved account
      await Promise.all([
        tx.employeePolicyAcceptance.deleteMany({ where: { employeeId: deleteId } }),
        tx.policyNotification.deleteMany({ where: { employeeId: deleteId } }),
      ])

      // ── Misc nullable FKs ────────────────────────────────────────────────────
      await Promise.all([
        tx.employee.updateMany({ where: { managerId: deleteId }, data: { managerId: null } }),
        tx.department.updateMany({ where: { headId: deleteId }, data: { headId: null } }),
        tx.leadActivity.updateMany({ where: { performedById: deleteId }, data: { performedById: null } }),
        tx.auditLog.updateMany({ where: { employeeId: deleteId }, data: { employeeId: null } }),
        tx.employeeAuthLog.deleteMany({ where: { employeeId: deleteId } }),
      ])

      // ── Delete user account ───────────────────────────────────────────────────
      if (toDelete.user) {
        await tx.user.delete({ where: { id: toDelete.user.id } })
      }

      // ── Finally delete the employee ──────────────────────────────────────────
      await tx.employee.delete({ where: { id: deleteId } })
    })

    await prisma.auditLog.create({
      data: {
        action: 'DISSOLVE_DUPLICATE',
        entity: 'Employee',
        entityId: deleteId,
        newValues: {
          dissolvedInto: keepId,
          leadsTransferred,
          dissolvedBy: session.user.id,
        },
      },
    })

    return NextResponse.json({
      message: `Duplicate account dissolved. ${leadsTransferred} lead assignment(s) transferred to ${toKeep.firstName} ${toKeep.lastName}.`,
      leadsTransferred,
    })
  } catch (error: any) {
    console.error('Dissolve employee error:', error)
    if (error.code === 'P2003') {
      return NextResponse.json({
        error: 'Cannot dissolve: this account still has linked records that could not be transferred. Check the server logs for details.',
      }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to dissolve employee' }, { status: 500 })
  }
}
