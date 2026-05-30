'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { Composer } from '@/components/chat/composer'
import { sendCoachMessage, markCoachMessagesRead } from '@/actions/messages'
import type { CoachMessage } from '@/db/schema'

type Props = {
  initialMessages: CoachMessage[]
}

function formatTime(date: Date) {
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function CoachConversation({ initialMessages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState(initialMessages)
  const [isPending, startTransition] = useTransition()

  // mark coach messages as read when the page mounts
  useEffect(() => {
    const hasUnread = initialMessages.some(
      (m) => m.senderRole === 'coach' && !m.readAt,
    )
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
    setMessages((prev) => [...prev, optimistic])

    startTransition(async () => {
      await sendCoachMessage(content)
    })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* message list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs text-muted-foreground">
                Send a message below and your coaching team will respond within 24 hours.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMember = msg.senderRole === 'member'
              return (
                <div
                  key={msg.id}
                  className={cn('flex flex-col gap-1', isMember ? 'items-end' : 'items-start')}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      isMember
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm',
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground px-1">
                    {isMember ? 'You' : 'Coach'} · {formatTime(msg.createdAt)}
                  </span>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* composer */}
      <div className="border-t bg-background shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Composer
            onSubmit={handleSubmit}
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  )
}
