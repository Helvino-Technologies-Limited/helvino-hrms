import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_MANAGER']

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { prompt } = await req.json()
  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  const client = new Anthropic()

  const systemPrompt = `You are an expert HR professional and technical recruiter for Helvino Technologies Ltd, a technology company based in Siaya, Kenya specialising in IT infrastructure, software development, cybersecurity, and CCTV systems.

Generate a complete, professional job posting based on the user's prompt. Return ONLY valid JSON with no markdown, no explanation, no code fences — just the raw JSON object.

The JSON must have exactly these fields:
{
  "title": "exact job title",
  "description": "2-3 paragraph overview of the role and its impact at Helvino Technologies",
  "responsibilities": "bullet list of 6-8 key responsibilities, each on a new line starting with • ",
  "requirements": "bullet list of 5-7 qualifications/requirements, each on a new line starting with • ",
  "benefits": "comma-separated list of 4-6 benefits relevant to Kenya (e.g. medical cover, SACCO, airtime allowance)",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "experienceLevel": one of: "Entry Level" | "Mid Level" | "Senior Level" | "Lead" | "Manager" | "Director",
  "educationReq": one of: "High School" | "Diploma" | "Bachelor's Degree" | "Master's Degree" | "PhD" | "Professional Certification" | "Any",
  "type": one of: "Full-time" | "Part-time" | "Contract" | "Internship"
}

Make the content professional, specific to Kenya's job market, and relevant to a technology company. Skills should be an array of strings like ["React", "Node.js", "TypeScript"].`

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Generate a job posting for: ${prompt}` }],
    })

    const text = response.content.find(b => b.type === 'text')?.text ?? ''

    // Strip any accidental markdown fences
    const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error('generate-job error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate job posting' }, { status: 500 })
  }
}
