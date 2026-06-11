'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { Composer } from '@/components/chat/composer'
import { sendCoachMessage, markCoachMessagesRead } from '@/actions/messages'
import type { CoachMessage } from '@/db/schema'

type Props = {
  initialMessages: CoachMessage[]
}

function formatTimestamp(date: Date): string {
  const d = new Date(date)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return time
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' + time
}

export function CoachConversation({ initialMessages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState(initialMessages)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const hasUnread = initialMessages.some(m => m.senderRole === 'coach' && !m.readAt)
    if (hasUnread) markCoachMessagesRead()
  }, [initialMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(content: string) {
    const optimistic: CoachMessage = {
      id: crypto.randomUUID(),
      tenantId: '',
      memberId: '',
      senderRole: 'member',
      content,
      readAt: null,
      createdAt: new Date(),
    }
    setMessages(prev => [...prev, optimistic])
    startTransition(async () => { await sendCoachMessage(content) })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* message list */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-6 md:px-6">
          {messages.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No messages yet — send one below.
            </div>
          ) : (
            messages.map(msg => {
              const isCoach = msg.senderRole === 'coach'
              const ts = formatTimestamp(msg.createdAt)

              if (isCoach) {
                return (
                  <div key={msg.id} className="flex items-start gap-3">
                    {/* Coach avatar */}
                    <div className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-foreground/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/assets/coach-sam.jpg"
                        alt="Sam"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-[15px] leading-relaxed text-foreground">
                        {msg.content}
                      </p>
                      <span className="label-mono normal-case tracking-[0.1em]">{ts}</span>
                    </div>
                  </div>
                )
              }

              return (
                <div key={msg.id} className={cn('flex w-full max-w-[95%] flex-col gap-1 ml-auto items-end')}>
                  <div className="rounded-2xl bg-foreground px-4 py-2.5 text-sm leading-relaxed text-background">
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <span className="label-mono normal-case tracking-[0.1em]">{ts}</span>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* composer */}
      <div className="shrink-0 border-t border-border/70 bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-4 md:px-6">
          <Composer
            onSubmit={handleSubmit}
            disabled={isPending}
            placeholder="Message your coaching team…"
          />
        </div>
      </div>
    </div>
  )
}
