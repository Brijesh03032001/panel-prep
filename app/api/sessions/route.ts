import { NextResponse } from 'next/server'
import { ROLES, LEVELS } from '@/lib/catalog'
import { createSession, EngineError } from '@/lib/server/engine'
import { DEMO_RESUME_TEXT, sampleHistory } from '@/lib/server/demo/maya'
import { errorResponse } from '@/lib/server/http'
import { activeProvider, ProviderUnavailableError } from '@/lib/server/llm'
import { deleteAllSessions, listSessions, saveSession } from '@/lib/server/repo'
import { extractResumeText } from '@/lib/server/resume-text'
import type { Mode, SessionSetup } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    return NextResponse.json({ sessions: await listSessions() })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const mode: Mode = form.get('mode') === 'demo' ? 'demo' : 'live'

    if (mode === 'demo') {
      const existing = await listSessions()
      if (!existing.some(s => s.sample)) for (const doc of sampleHistory()) await saveSession(doc)
      const setup: SessionSetup = { roleKey: 'frontend', roleTitle: 'Frontend Developer', level: 'Internship', jobDescription: null, sourceName: 'maya-reyes-resume.pdf' }
      const session = await createSession({ resumeText: DEMO_RESUME_TEXT, setup, mode })
      return NextResponse.json({ session })
    }

    if (!activeProvider()) {
      throw new ProviderUnavailableError('Live mode needs an ASU CreateAI token. Add CREATEAI_API_KEY to .env.local, or watch the demo session.')
    }
    const roleKey = String(form.get('roleKey') ?? '')
    const customTitle = String(form.get('roleTitle') ?? '').trim().slice(0, 80)
    const role = ROLES.find(r => r.key === roleKey)
    const roleTitle = role?.title ?? customTitle
    if (!roleTitle) throw new EngineError('Pick a target role first.')
    const levelRaw = String(form.get('level') ?? 'Internship')
    const level = (LEVELS as readonly string[]).includes(levelRaw) ? levelRaw : 'Internship'
    const jd = String(form.get('jobDescription') ?? '').trim().slice(0, 6000) || null
    const file = form.get('file')
    const pasted = String(form.get('text') ?? '')
    const resumeText = await extractResumeText(file instanceof File ? file : null, pasted).catch(err => {
      throw new EngineError(err instanceof Error ? err.message : 'Could not read that resume.', 422)
    })
    const setup: SessionSetup = {
      roleKey: role?.key ?? 'custom',
      roleTitle,
      level,
      jobDescription: jd,
      sourceName: file instanceof File && file.size > 0 ? file.name.slice(0, 120) : 'Pasted resume',
    }
    const session = await createSession({ resumeText, setup, mode })
    return NextResponse.json({ session })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE() {
  try {
    await deleteAllSessions()
    return NextResponse.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
