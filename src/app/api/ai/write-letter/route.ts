import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'SALES_MANAGER']

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || !ADMIN_ROLES.includes(role)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { prompt, subject, toName, toOrganization } = await req.json()
  if (!prompt) {
    return new Response('Prompt is required', { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('AI service not configured. Please add ANTHROPIC_API_KEY to your environment variables.', { status: 503 })
  }

  const client = new Anthropic()

  const systemPrompt = `You are a professional business letter writer for Helvino Technologies Ltd, a technology company based in Kenya.
Write formal, professional business letters in proper English.
The letter body should start with "Dear Sir/Madam," or "Dear [Title]," if a name is provided.
Include a clear opening paragraph stating the purpose, well-structured body paragraphs, and a polite closing.
End with "Yours faithfully," or "Yours sincerely," as appropriate.
Do NOT include the letterhead, date, address, subject line, or signatory — only write the letter body text itself.
Keep the tone professional, concise, and courteous. Use Kenyan business letter conventions.`

  const userMessage = `Write a professional business letter body for the following:

${toName ? `Recipient: ${toName}` : ''}
${toOrganization ? `Organization: ${toOrganization}` : ''}
${subject ? `Subject: ${subject}` : ''}

Topic/Instructions: ${prompt}

Write only the letter body (from the salutation to the closing). Do not include any preamble or explanation.`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = client.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 2048,
          thinking: { type: 'adaptive' },
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        })

        for await (const event of response) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
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
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
