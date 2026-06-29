'use client'

import { useState, useEffect, useRef, useTransition, useOptimistic } from 'react'
import { Pin } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { messageTimestamp } from '@/lib/format-date'
import { Composer } from '@/components/chat/composer'
import { sendCoachMessage, markCoachMessagesRead, pinCoachMessageAction } from '@/actions/messages'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { CoachMessage } from '@/db/schema'
import type { CoachProfile } from '@/lib/coaches'

type Props = {
  initialMessages: CoachMessage[]
  coach: CoachProfile | null
}

function CoachAvatarImage({ coach, className }: { coach: CoachProfile | null; className?: string }) {
  if (coach?.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coach.photoUrl} alt={coach.displayName} className={cn('h-full w-full object-cover', className)} />
    )
  }
  return (
    <span className="font-mono text-[9px] font-semibold tracking-wider text-background">
      {getInitials(coach?.displayName ?? 'C')}
    </span>
  )
}

function CoachProfileSheet({ coach, open, onOpenChange }: {
  coach: CoachProfile
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const specialty = coach.specialties[0] ?? null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <div className="flex flex-col gap-5 p-6">
          {/* Header — photo + name + specialty/gym */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-foreground/10 flex items-center justify-center">
              {coach.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coach.photoUrl} alt={coach.displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="font-mono text-sm font-semibold text-background">
                  {getInitials(coach.displayName)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-[18px] font-semibold leading-snug">{coach.displayName}</h2>
              {(specialty || coach.gym) && (
                <p className="label-mono mt-0.5 normal-case tracking-[0.12em] text-muted-foreground">
                  {[specialty, coach.gym?.toUpperCase()].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          {/* Headline */}
          {coach.headline && (
            <p className="text-[14px] leading-relaxed text-foreground/80">{coach.headline}</p>
          )}

          {/* Bio */}
          {coach.bio && (
            <div className="flex flex-col gap-2">
              <span className="label-mono normal-case tracking-[0.18em] text-muted-foreground">Bio</span>
              <p className="text-[14px] leading-relaxed text-foreground">{coach.bio}</p>
            </div>
          )}

          {/* Certifications */}
          {coach.certifications.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="label-mono normal-case tracking-[0.18em] text-muted-foreground">Certifications</span>
              <ul className="flex flex-col gap-1.5">
                {coach.certifications.map((cert, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[13px] text-foreground">
                    <span className="mt-[3px] shrink-0 text-muted-foreground">·</span>
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function CoachConversation({ initialMessages, coach }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState(initialMessages)
  const [profileOpen, setProfileOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [optimisticPins, setOptimisticPins] = useOptimistic<Map<string, Date | null>>(
    new Map(initialMessages.filter(m => m.pinnedAt).map(m => [m.id, m.pinnedAt as Date]))
  )

  const firstName = coach?.displayName.split(' ')[0] ?? 'your advisor'
  const [openerTs, setOpenerTs] = useState<string | null>(null)
  const [openerPinned, setOpenerPinned] = useState(false)

  useEffect(() => {
    setOpenerTs(messageTimestamp(new Date()))
  }, [])

  useEffect(() => {
    const hasUnread = initialMessages.some(m => m.senderRole === 'coach' && !m.readAt)
    if (hasUnread) markCoachMessagesRead()
  }, [initialMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(content: string, _attachments?: unknown) {
    const optimistic: CoachMessage = {
      id: crypto.randomUUID(),
      tenantId: '',
      memberId: '',
      senderRole: 'member',
      senderCoachId: null,
      content,
      readAt: null,
      pinnedAt: null,
      createdAt: new Date(),
    }
    setMessages(prev => [...prev, optimistic])
    startTransition(async () => { await sendCoachMessage(content) })
  }

  function handlePinMessage(msg: CoachMessage) {
    const isPinned = optimisticPins.has(msg.id)
    const pin = !isPinned
    startTransition(async () => {
      setOptimisticPins(prev => {
        const next = new Map(prev)
        if (pin) next.set(msg.id, new Date())
        else next.delete(msg.id)
        return next
      })
      await pinCoachMessageAction(msg.id, pin)
    })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* message list */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-6 md:px-6">
          {/* Pinned opener */}
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => coach && setProfileOpen(true)}
              aria-label={coach ? `View ${coach.displayName}'s profile` : undefined}
              className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-foreground/10 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
            >
              <CoachAvatarImage coach={coach} />
            </button>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-[15px] leading-relaxed text-foreground">
                Hi — {firstName} here, your advisor. How can I help you today?
              </p>
              {openerTs && (
                <div className="flex items-center gap-1.5">
                  <span className="label-mono normal-case tracking-[0.1em]">{openerTs}</span>
                  <button
                    type="button"
                    onClick={() => setOpenerPinned(p => !p)}
                    aria-label={openerPinned ? 'Unpin message' : 'Pin message'}
                    className={cn(
                      'inline-flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-foreground/[0.06]',
                      openerPinned ? 'text-accent hover:text-accent' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Pin className={cn('h-3 w-3', openerPinned && 'fill-current')} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {messages.map(msg => {
            const isCoach = msg.senderRole === 'coach'
            const ts = messageTimestamp(msg.createdAt)
            const isPinned = optimisticPins.has(msg.id)

            if (isCoach) {
              return (
                <div key={msg.id} className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => coach && setProfileOpen(true)}
                    aria-label={coach ? `View ${coach.displayName}'s profile` : undefined}
                    className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-foreground/10 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                  >
                    <CoachAvatarImage coach={coach} />
                  </button>
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-[15px] leading-relaxed text-foreground">{msg.content}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="label-mono normal-case tracking-[0.1em]">{ts}</span>
                      <button
                        type="button"
                        onClick={() => handlePinMessage(msg)}
                        aria-label={isPinned ? 'Unpin message' : 'Pin message'}
                        className={cn(
                          'inline-flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-foreground/[0.06]',
                          isPinned ? 'text-accent hover:text-accent' : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <Pin className={cn('h-3 w-3', isPinned && 'fill-current')} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div key={msg.id} className="flex w-full max-w-[95%] flex-col gap-1 ml-auto items-end">
                <div className="rounded-2xl bg-foreground px-4 py-2.5 text-sm leading-relaxed text-background">
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                <span className="label-mono normal-case tracking-[0.1em]">{ts}</span>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* composer */}
      <div className="shrink-0 border-t border-border/70 bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-4 md:px-6">
          <Composer onSubmit={handleSubmit} disabled={isPending} placeholder="" />
        </div>
      </div>

      {/* Coach profile sheet */}
      {coach && (
        <CoachProfileSheet coach={coach} open={profileOpen} onOpenChange={setProfileOpen} />
      )}
    </div>
  )
}
