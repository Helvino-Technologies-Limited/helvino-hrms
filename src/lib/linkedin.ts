/**
 * LinkedIn Organization Post Utility
 *
 * Automatically posts job openings to the Helvino Technologies LinkedIn page
 * when a job is published (status → OPEN).
 *
 * Required env vars:
 *   LINKEDIN_ACCESS_TOKEN     — OAuth2 token with w_organization_social scope
 *   LINKEDIN_ORGANIZATION_ID  — Numeric org ID from the company page URL
 *   NEXT_PUBLIC_APP_URL       — e.g. https://helvino.org (used for job link)
 */

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
      `💰 KES ${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()} per month`
    )
  } else if (job.salaryMin) {
    lines.push(`💰 From KES ${job.salaryMin.toLocaleString()} per month`)
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

  // Short description (first 200 chars)
  const shortDesc = job.description.slice(0, 200).trim()
  lines.push(shortDesc + (job.description.length > 200 ? '...' : ''))

  lines.push('')
  lines.push(`🔗 Apply now: ${jobUrl}`)
  lines.push('')
  lines.push('#Hiring #JobOpening #Nairobi #Kenya #HelvionoTechnologies')

  return lines.join('\n')
}

export async function postJobToLinkedIn(job: JobForPost): Promise<{ success: boolean; error?: string }> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN
  const orgId = process.env.LINKEDIN_ORGANIZATION_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://helvino.org'

  // Silently skip if credentials not configured
  if (!token || !orgId) {
    console.log('[LinkedIn] Skipping post — LINKEDIN_ACCESS_TOKEN or LINKEDIN_ORGANIZATION_ID not set')
    return { success: false, error: 'LinkedIn credentials not configured' }
  }

  const jobUrl = job.slug
    ? `${appUrl}/careers/${job.slug}`
    : `${appUrl}/careers`

  const postText = buildPostText(job, jobUrl)

  const body = {
    author: `urn:li:organization:${orgId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: postText,
        },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            originalUrl: jobUrl,
            title: {
              text: `${job.title} — Helvino Technologies Limited`,
            },
            description: {
              text: job.description.slice(0, 256),
            },
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
        Authorization: `Bearer ${token}`,
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
