import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/recruitment?linkedin_error=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/recruitment?linkedin_error=no_code`
    )
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID!
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!
  const redirectUri = `${appUrl}/api/linkedin/callback`

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('[LinkedIn callback] Token exchange failed:', err)
      return NextResponse.redirect(
        `${appUrl}/dashboard/recruitment?linkedin_error=token_exchange_failed`
      )
    }

    const tokenData = await tokenRes.json()
    const accessToken: string = tokenData.access_token
    const expiresIn: number = tokenData.expires_in // seconds

    // Fetch the organizations this user manages
    const orgRes = await fetch(
      'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName)))',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    )

    let orgId = process.env.LINKEDIN_ORGANIZATION_ID || ''

    if (orgRes.ok) {
      const orgData = await orgRes.json()
      const elements = orgData.elements || []
      // Pick the first org (or the one matching "helvino")
      const helvinoOrg = elements.find((el: any) =>
        el['organization~']?.localizedName?.toLowerCase().includes('helvino')
      ) || elements[0]

      if (helvinoOrg) {
        const rawUrn: string = helvinoOrg.organization || ''
        // URN format: urn:li:organization:12345678
        const match = rawUrn.match(/(\d+)$/)
        if (match) orgId = match[1]
      }
    }

    // Persist to CompanySettings (key/value store)
    await prisma.companySettings.upsert({
      where: { key: 'LINKEDIN_ACCESS_TOKEN' },
      update: { value: accessToken },
      create: { key: 'LINKEDIN_ACCESS_TOKEN', value: accessToken },
    })

    if (orgId) {
      await prisma.companySettings.upsert({
        where: { key: 'LINKEDIN_ORGANIZATION_ID' },
        update: { value: orgId },
        create: { key: 'LINKEDIN_ORGANIZATION_ID', value: orgId },
      })
    }

    const expiryDate = new Date(Date.now() + expiresIn * 1000).toISOString()
    await prisma.companySettings.upsert({
      where: { key: 'LINKEDIN_TOKEN_EXPIRES_AT' },
      update: { value: expiryDate },
      create: { key: 'LINKEDIN_TOKEN_EXPIRES_AT', value: expiryDate },
    })

    return NextResponse.redirect(
      `${appUrl}/dashboard/recruitment?linkedin_connected=true&org=${encodeURIComponent(orgId)}`
    )
  } catch (err) {
    console.error('[LinkedIn callback] Error:', err)
    return NextResponse.redirect(
      `${appUrl}/dashboard/recruitment?linkedin_error=server_error`
    )
  }
}
