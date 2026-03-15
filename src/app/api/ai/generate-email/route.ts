import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER']

const SYSTEM_PROMPTS: Record<string, string> = {
  INTERVIEW_INVITE: `You are an HR professional writing a formal interview invitation email for Helvino Technologies Ltd, a technology company based in Siaya, Kenya.
Write a warm, professional, and encouraging invitation. The tone should be welcoming and official.
Do NOT include the email subject, greeting ("Dear..."), or sign-off — only the body paragraphs.
Do NOT include interview details like date/time in the body — these will be added separately.
Keep it concise: 2-3 paragraphs. Mention the company name naturally.`,

  ONBOARDING_REQUEST: `You are an HR professional writing an onboarding documents request email for Helvino Technologies Ltd, Siaya, Kenya.
The candidate has successfully passed their interview and is being onboarded.
Write a warm congratulatory message and clear request for onboarding documents.
Do NOT list specific documents — they will be shown separately.
Do NOT include the email subject, greeting, or sign-off.
2-3 paragraphs. Professional and warm tone.`,

  REJECTION_BEFORE_INTERVIEW: `You are an HR professional writing a polite rejection email for a job applicant at Helvino Technologies Ltd, Siaya, Kenya.
The candidate is being rejected before/without an interview.
Be respectful, appreciative of their interest, and encouraging. Do not be harsh or dismissive.
Do NOT include the email subject, greeting, or sign-off.
2-3 paragraphs. Mention they are welcome to apply for future positions.`,

  REJECTION_AFTER_INTERVIEW: `You are an HR professional writing a post-interview rejection email for Helvino Technologies Ltd, Siaya, Kenya.
The candidate was interviewed but was not selected for the role.
Acknowledge their time and effort, deliver the decision professionally, and leave the door open for future applications.
Do NOT include the email subject, greeting, or sign-off.
2-3 paragraphs. Empathetic and professional tone.`,

  OFFER_LETTER: `You are an HR professional drafting the opening body of a formal employment offer letter for Helvino Technologies Ltd, a technology company based in Siaya, Kenya.

Helvino Technologies Ltd provides the following services: Software Development (custom web and mobile applications), Network & Wi-Fi Installation, Web Design and Development, CCTV & Surveillance Systems, Cybersecurity Solutions (vulnerability assessments, penetration testing, security audits), and IT Support & Consultancy (24/7 technical support).

Write a professional, formal opening body for the offer letter. Include:
- A warm congratulatory opening acknowledging the candidate's successful interview process
- Confirmation of the position offered and the company they are joining
- If salary is provided in context, state the gross monthly salary clearly
- If start date is provided, mention it; otherwise state it will be communicated separately
- State the probation period (use the one provided in context, default 3 months per Kenya employment standards)
- A paragraph on expected professionalism, confidentiality, and alignment with company values — especially important given the sensitive nature of IT, cybersecurity, and client data work
- A brief statement that full terms and conditions are set out in the attached schedule, and that the offer is conditional on successful document verification and submission of all required onboarding documents
- A closing sentence requesting the candidate sign and return this letter as formal acceptance within the stipulated deadline

Do NOT include letterhead, date, address, subject line, greeting ("Dear..."), sign-off, or signatory block — only the body paragraphs.
Keep it professional, formal, warm, and legally sound under the Kenya Employment Act, 2007. 4-6 paragraphs.`,
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || !ADMIN_ROLES.includes(role)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { type, candidateName, jobTitle, context } = await req.json()
  if (!type || !candidateName || !jobTitle) {
    return new Response('type, candidateName, jobTitle required', { status: 400 })
  }

  const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.INTERVIEW_INVITE
  const userMessage = `Write the email body for:
Candidate Name: ${candidateName}
Job Position: ${jobTitle}
${context ? `Additional Context: ${context}` : ''}

Write only the body paragraphs (no greeting, no sign-off, no subject line).`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = client.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: type === 'OFFER_LETTER' ? 2048 : 800,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        })
        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch (err: any) {
        controller.enqueue(encoder.encode(`\n\n[Error: ${err.message}]`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  })
}
