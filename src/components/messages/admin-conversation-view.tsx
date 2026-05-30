'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Composer } from '@/components/chat/composer'
import { sendCoachReply, markMemberMessagesRead } from '@/actions/messages'
import type { CoachMessage } from '@/db/schema'

type Props = {
  memberId: string
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

export function AdminConversationView({ memberId, initialMessages }: Props) {
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState(initialMessages)
  const [isPending, startTransition] = useTransition()

  // mark unread member messages as read when admin opens the conversation
  useEffect(() => {
    const hasUnread = initialMessages.some(
      (m) => m.senderRole === 'member' && !m.readAt,
    )
    if (hasUnread) markMemberMessagesRead(memberId)
  }, [initialMessages, memberId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleReply(content: string) {
    const optimistic: CoachMessage = {
      id: crypto.randomUUID(),
      tenantId: '',
      memberId,
      senderRole: 'coach',
      content,
      readAt: null,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, optimistic])

    startTransition(async () => {
      await sendCoachReply(memberId, content)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">
              No messages yet. The member hasn&apos;t reached out.
            </p>
          ) : (
            messages.map((msg) => {
              const isCoach = msg.senderRole === 'coach'
              return (
                <div
                  key={msg.id}
                  className={cn('flex flex-col gap-1', isCoach ? 'items-end' : 'items-start')}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      isCoach
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm',
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground px-1">
                    {isCoach ? 'You (Coach)' : 'Member'} · {formatTime(msg.createdAt)}
                  </span>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t bg-background shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Composer onSubmit={handleReply} disabled={isPending} />
        </div>
      </div>
    </div>
  )
}
