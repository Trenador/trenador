'use client'

import { useTransition, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Pencil } from 'lucide-react'
import { createThread } from '@/actions/chat'
import { Composer } from '@/components/chat/composer'

type SeedPrompt = {
  label: string
  userText?: string
  assistantOpener?: string
  navigateTo?: string
  action?: 'message-center'
}

const SHORTCUTS: SeedPrompt[] = [
  { label: 'Browse the workout library.', navigateTo: '/workouts' },
  { label: 'Talk with an advisor.', action: 'message-center' },
  {
    label: 'Modify my workout.',
    assistantOpener:
      "Of course — describe what you'd like to modify. For example: swap an exercise, change the duration, adjust the difficulty, or focus on a different muscle group. The more detail you share, the better I can tailor it.",
  },
  {
    label: 'Tell me fun facts about the human body.',
    userText:
      'Tell me one fun, surprising fact about the human body and fitness. Just one fact, kept short.',
  },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function ShortcutsMenu({ onPick, direction = 'up' }: { onPick: (p: SeedPrompt) => void; direction?: 'up' | 'down' }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('chat:new', close)
    return () => window.removeEventListener('chat:new', close)
  }, [])

  const panel = (
    <div
      className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${
        open
          ? `${direction === 'down' ? 'mt-3' : 'mb-3'} grid-rows-[1fr] opacity-100`
          : 'grid-rows-[0fr] opacity-0'
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="px-1 pb-2 pt-1">
          <span className="text-[13px] text-muted-foreground">Shortcuts</span>
        </div>
        <div className="max-h-[min(50vh,calc(100vh-12rem))] overflow-y-auto overscroll-contain">
          {SHORTCUTS.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => { setOpen(false); onPick(p) }}
              style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-[15px] leading-snug text-foreground transition-all duration-300 hover:bg-foreground/[0.04] ${
                open ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
              }`}
            >
              <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const trigger = !open && (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 px-1 py-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
    >
      <Sparkles className="h-3.5 w-3.5" />
      Shortcuts
    </button>
  )

  return (
    <div className="relative w-full">
      {direction === 'down' ? <>{trigger}{panel}</> : <>{panel}{trigger}</>}
    </div>
  )
}

export function ChatWelcomeClient({ displayName }: { displayName: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const firstName = displayName.split(' ')[0] ?? displayName
  const greeting = `${getGreeting()}, ${firstName}`

  function handleSubmit(content: string) {
    startTransition(async () => {
      const { id } = await createThread()
      router.push(`/chat/${id}?message=${encodeURIComponent(content)}`)
    })
  }

  function handlePick(p: SeedPrompt) {
    if (p.navigateTo) { router.push(p.navigateTo); return }
    if (p.action === 'message-center') { router.push('/messages'); return }
    const text = p.userText ?? p.assistantOpener ?? p.label
    handleSubmit(text)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Mobile hero */}
      <div className="flex flex-col px-4 pt-6 pb-4 md:hidden">
        <div className="flex w-full items-center gap-3 text-left">
          <div className="h-14 w-14 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/greeting-icon.svg" alt="" width={56} height={56} className="h-full w-full" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h2 className="font-serif leading-tight tracking-[0.05em] text-xl">
              {greeting}
            </h2>
            <p className="text-muted-foreground uppercase tracking-widest text-[10px]">
              How may I be of service?
            </p>
          </div>
        </div>
      </div>

      {/* Spacer / desktop hero */}
      <div className="flex flex-1 min-h-0 flex-col justify-end md:justify-center">
        {/* Desktop hero */}
        <div className="hidden px-4 pb-10 md:block">
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/greeting-icon.svg" alt="" width={64} height={64} className="h-full w-full" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <h2 className="font-serif leading-tight tracking-[0.05em] text-5xl">
                {greeting}
              </h2>
              <p className="text-muted-foreground uppercase tracking-widest text-xs">
                How may I be of service?
              </p>
            </div>
          </div>
        </div>

        {/* Composer block */}
        <div
          className="w-full px-4 pb-2"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
        >
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-2 flex md:hidden">
              <ShortcutsMenu onPick={handlePick} direction="up" />
            </div>
            <Composer onSubmit={handleSubmit} disabled={isPending} />
            <div className="mt-3 hidden md:flex md:justify-center">
              <ShortcutsMenu onPick={handlePick} direction="down" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
