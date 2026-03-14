import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const ADMIN_ROLES = ['SUPER_ADMIN', 'FINANCE_OFFICER']

const POLICY_TYPE_PROMPTS: Record<string, string> = {
  HR: 'Human Resources policy covering employee relations, recruitment, onboarding, performance management, disciplinary procedures, and employee welfare.',
  SECURITY: 'Physical and information security policy covering access control, incident response, CCTV/surveillance, data protection, visitor management, and security protocols.',
  CONFIDENTIALITY: 'Confidentiality and non-disclosure policy covering trade secrets, client data, proprietary information, data handling, and employee obligations regarding sensitive information.',
  CONDUCT: 'Code of conduct and workplace behaviour policy covering professional standards, anti-harassment, social media use, dress code, and disciplinary consequences.',
  IT: 'IT and technology acceptable use policy covering computer use, internet and email policy, software licensing, BYOD, cybersecurity responsibilities, and data backup.',
  FINANCIAL: 'Financial controls and expense policy covering procurement, expense claims, petty cash, authorisation limits, financial reporting, and anti-fraud measures.',
  GENERAL: 'General company policy.',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || !ADMIN_ROLES.includes(role)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { policyType, title, context } = await req.json()
  if (!policyType) return new Response('policyType is required', { status: 400 })

  const typeDesc = POLICY_TYPE_PROMPTS[policyType] || POLICY_TYPE_PROMPTS.GENERAL

  const systemPrompt = `You are an experienced HR and compliance professional writing formal company policies for Helvino Technologies Ltd, a technology company based in Siaya, Kenya.

Write comprehensive, professionally structured company policies. Each policy must follow this structure:
1. **Purpose** — Why this policy exists
2. **Scope** — Who this policy applies to
3. **Policy Statement** — The core policy principles (3-5 key statements)
4. **Responsibilities** — Who is responsible for what
5. **Procedures** — Step-by-step processes or rules (numbered list)
6. **Consequences** — What happens if the policy is violated
7. **Review** — When and how the policy will be reviewed

Use formal, clear language. Reference Kenyan law where applicable (Employment Act 2007, Data Protection Act 2019, etc.).
Keep sections concise but complete. Use bullet points and numbered lists for readability.
Do NOT include document headers, footers, version numbers, or signature blocks — only the policy content body.`

  const userMessage = `Write a complete company policy document for: ${title || policyType + ' Policy'}

Policy Type: ${typeDesc}
${context ? `Additional Instructions: ${context}` : ''}

Follow the 7-section structure. Make it specific and practical for a technology company in Kenya.`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = client.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 4096,
          thinking: { type: 'adaptive' },
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
