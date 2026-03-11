/**
 * LinkedIn Organization Post Utility
 *
 * Posts job openings to the Helvino Technologies LinkedIn company page
 * when a job is published (status → OPEN).
 *
 * Setup:
 *   1. Visit /dashboard/recruitment and click "Connect LinkedIn"
 *   2. Authorize the app — token is stored automatically in CompanySettings
 *
 * Env vars (in .env):
 *   LINKEDIN_CLIENT_ID       — from LinkedIn Developer Portal
 *   LINKEDIN_CLIENT_SECRET   — from LinkedIn Developer Portal
 *   NEXT_PUBLIC_APP_URL      — e.g. https://hrm-seven-kohl.vercel.app
 */

import { prisma } from '@/lib/prisma'

interface JobForPost {
  title: string
  slug?: string | null
  description: string
  type?: string | null
  location?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  experienceLevel?: string | null
  deadline?: Date | null
}

async function getLinkedInCredentials(): Promise<{ token: string; orgId: string } | null> {
  try {
    const settings = await prisma.companySettings.findMany({
      where: {
        key: { in: ['LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_ORGANIZATION_ID', 'LINKEDIN_TOKEN_EXPIRES_AT'] },
      },
    })

    const map = Object.fromEntries(settings.map(s => [s.key, s.value]))

    const token = map['LINKEDIN_ACCESS_TOKEN'] || process.env.LINKEDIN_ACCESS_TOKEN || ''
    const orgId = map['LINKEDIN_ORGANIZATION_ID'] || process.env.LINKEDIN_ORGANIZATION_ID || ''
    const expiresAt = map['LINKEDIN_TOKEN_EXPIRES_AT']

    if (!token || !orgId) return null

    // Check if token is expired
    if (expiresAt && new Date(expiresAt) < new Date()) {
      console.warn('[LinkedIn] Access token has expired. Re-authorize at /dashboard/recruitment.')
      return null
    }

    return { token, orgId }
  } catch {
    // Fall back to env vars if DB unavailable
    const token = process.env.LINKEDIN_ACCESS_TOKEN || ''
    const orgId = process.env.LINKEDIN_ORGANIZATION_ID || ''
    if (!token || !orgId) return null
    return { token, orgId }
  }
}

function buildPostText(job: JobForPost, jobUrl: string): string {
  const lines: string[] = []

  lines.push(`🚀 We're Hiring: ${job.title}`)
  lines.push('')

  if (job.type || job.location) {
    const meta = [job.type, job.location].filter(Boolean).join(' · ')
    lines.push(`📍 ${meta}`)
  }

  if (job.salaryMin && job.salaryMax) {
    lines.push(
      `💰 KES ${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()} / month`
    )
  } else if (job.salaryMin) {
    lines.push(`💰 From KES ${job.salaryMin.toLocaleString()} / month`)
  }

  if (job.experienceLevel) {
    lines.push(`🎯 Experience: ${job.experienceLevel}`)
  }

  if (job.deadline) {
    lines.push(
      `⏰ Apply by: ${new Date(job.deadline).toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`
    )
  }

  lines.push('')
  const shortDesc = job.description.slice(0, 200).trim()
  lines.push(shortDesc + (job.description.length > 200 ? '...' : ''))
  lines.push('')
  lines.push(`🔗 Apply now: ${jobUrl}`)
  lines.push('')
  lines.push('#Hiring #JobOpening #Nairobi #Kenya #HelvinoTechnologies #Jobs')

  return lines.join('\n')
}

export async function postJobToLinkedIn(
  job: JobForPost
): Promise<{ success: boolean; error?: string }> {
  const creds = await getLinkedInCredentials()

  if (!creds) {
    console.log('[LinkedIn] Skipping — not connected. Visit /dashboard/recruitment to connect.')
    return { success: false, error: 'LinkedIn not connected' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://helvinocrm.org'
  const jobUrl = job.slug ? `${appUrl}/careers/${job.slug}` : `${appUrl}/careers`
  const postText = buildPostText(job, jobUrl)

  const body = {
    author: `urn:li:organization:${creds.orgId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: postText },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            originalUrl: jobUrl,
            title: { text: `${job.title} — Helvino Technologies Limited` },
            description: { text: job.description.slice(0, 256) },
          },
        ],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  }

  try {
    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[LinkedIn] Post failed:', res.status, errText)
      return { success: false, error: `LinkedIn API ${res.status}: ${errText}` }
    }

    const data = await res.json()
    console.log('[LinkedIn] Job posted successfully:', data.id)
    return { success: true }
  } catch (err) {
    console.error('[LinkedIn] Network error:', err)
    return { success: false, error: String(err) }
  }
}
