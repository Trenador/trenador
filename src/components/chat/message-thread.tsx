'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Composer } from './composer'
import type { Message } from '@/db/schema'

type DisplayMessage = {
  id?: string | undefined
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean | undefined
}

type Props = {
  threadId: string
  initialMessages: Message[]
  initialMessage?: string | undefined
}

export function MessageThread({ threadId, initialMessages, initialMessage }: Props) {
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasSentInitial = useRef(false)

  const [messages, setMessages] = useState<DisplayMessage[]>(
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  )
  const [isStreaming, setIsStreaming] = useState(false)

  // auto-send initial message that came from the welcome page via URL param
  useEffect(() => {
    if (initialMessage && !hasSentInitial.current) {
      hasSentInitial.current = true
      router.replace(`/chat/${threadId}`, { scroll: false })
      sendMessage(initialMessage)
    }
  // sendMessage is stable — only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // keep scroll pinned to bottom as messages grow
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(content: string) {
    setMessages((prev) => [...prev, { role: 'user', content }])
    setMessages((prev) => [...prev, { role: 'assistant', content: '', isStreaming: true }])
    setIsStreaming(true)

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, content }),
      })

      if (!response.ok || !response.body) {
        const errMsg =
          response.status === 429
            ? "You've reached your daily message limit. Come back tomorrow!"
            : 'Something went wrong. Please try again.'
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: errMsg },
        ])
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finalText = ''

      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let event: { type: string; text?: string; messageId?: string; message?: string }
          try {
            event = JSON.parse(line.slice(6))
          } catch {
            continue
          }

          if (event.type === 'delta' && event.text) {
            finalText += event.text
            setMessages((prev) => {
              const next = [...prev]
              next[next.length - 1] = { role: 'assistant', content: finalText, isStreaming: true }
              return next
            })
          } else if (event.type === 'done') {
            setMessages((prev) => {
              const next = [...prev]
              next[next.length - 1] = { id: event.messageId, role: 'assistant', content: finalText }
              return next
            })
            // refresh the layout so the sidebar re-fetches threads (updated lastMessageAt + title)
            router.refresh()
            break outer
          } else if (event.type === 'error') {
            throw new Error(event.message)
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* message list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {messages.map((msg, i) => (
            <MessageBubble key={msg.id ?? i} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* composer */}
      <div className="border-t bg-background">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Composer onSubmit={sendMessage} disabled={isStreaming} />
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm',
        )}
      >
        <p className="whitespace-pre-wrap break-words">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-0.5 h-3.5 ml-0.5 bg-current animate-pulse align-middle" />
          )}
        </p>
      </div>
    </div>
  )
}
