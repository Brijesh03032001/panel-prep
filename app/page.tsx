"use client"

import { WarningCircleIcon, XIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { AssembleScreen } from '@/components/pp/screens/assemble'
import { AuditScreen } from '@/components/pp/screens/audit'
import { HomeScreen } from '@/components/pp/screens/home'
import { HuddleScreen } from '@/components/pp/screens/huddle'
import { InterviewScreen } from '@/components/pp/screens/interview'
import { ReelScreen } from '@/components/pp/screens/reel'
import { VerdictScreen } from '@/components/pp/screens/verdict'
import { WrappedScreen } from '@/components/pp/screens/wrapped'
import { usePanel } from '@/lib/store'

const BUSY_STEPS: Record<string, string[]> = {
  'The panel is conferring…': ['Comparing notes on your answers', 'Checking which resume lines held up', 'Writing your coaching plan'],
  'Reading your resume…': ['Removing contact details', 'Splitting your resume into claims', 'Flagging what an interviewer would ask about'],
}

function BusySteps({ busy }: { busy: string }) {
  const steps = BUSY_STEPS[busy]
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!steps) return
    setI(0)
    const t = setInterval(() => setI(n => Math.min(n + 1, steps.length - 1)), 2800)
    return () => clearInterval(t)
  }, [steps])
  if (!steps) return null
  return (
    <AnimatePresence mode="wait">
      <motion.p key={i} className="text-sm text-ink-muted" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
        {steps[i]}…
      </motion.p>
    </AnimatePresence>
  )
}

export default function Page() {
  const { screen, busy, error, booted } = usePanel()
  const init = usePanel(s => s.init)
  const clearError = usePanel(s => s.clearError)

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  return (
    <main className="relative min-h-screen bg-stage">
      <AnimatePresence mode="wait">
        {booted && screen === 'home' && <HomeScreen key="home" />}
        {booted && screen === 'audit' && <AuditScreen key="audit" />}
        {booted && screen === 'assemble' && <AssembleScreen key="assemble" />}
        {booted && screen === 'interview' && <InterviewScreen key="interview" />}
        {booted && screen === 'huddle' && <HuddleScreen key="huddle" />}
        {booted && screen === 'verdict' && <VerdictScreen key="verdict" />}
        {booted && screen === 'reel' && <ReelScreen key="reel" />}
        {booted && screen === 'wrapped' && <WrappedScreen key="wrapped" />}
      </AnimatePresence>

      <AnimatePresence>
        {busy && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-stage/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-5">
              <div className="flex gap-2.5">
                {['#A78BFA', '#2DD4BF', '#FB923C'].map((c, i) => (
                  <motion.span
                    key={c}
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ background: c }}
                    animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
              <p className="font-display text-lg text-ink">{busy}</p>
              <BusySteps busy={busy} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            role="alert"
            className="fixed bottom-6 left-1/2 z-[100] flex w-[min(560px,calc(100vw-32px))] -translate-x-1/2 items-start gap-3 rounded-2xl border border-bad/30 bg-[#2a1220]/95 p-4 shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <WarningCircleIcon weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-bad" />
            <p className="flex-1 text-sm leading-relaxed text-ink">{error}</p>
            <button type="button" onClick={clearError} aria-label="Dismiss" className="rounded-md p-1 text-ink-faint hover:text-ink">
              <XIcon weight="bold" className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
