'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Sparkles, Pencil, SquarePen } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'
import { cn } from '@/lib/utils'
import { Composer } from './composer'
import type { Message } from '@/db/schema'

type DisplayMessage = {
  id: string | undefined
  role: 'user' | 'assistant'
  content: string
  isStreaming: boolean | undefined
  createdAt: string | undefined
}

type Props = {
  threadId: string
  initialMessages: Message[]
  initialMessage: string | undefined
}

const SHORTCUTS = [
  'How should I structure my training week?',
  'What should I eat around my workouts?',
  "I'm a beginner — where do I start?",
  'How do I recover faster between sessions?',
]

function formatTimestamp(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return time
  const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return `${date} · ${time}`
}

function ShortcutsMenu({ onPick }: { onPick: (s: string) => void }) {
  const [open, setOpen] = useState(false)

  const panel = (
    <div
      className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${
        open ? 'mb-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="px-1 pb-2 pt-1">
          <span className="text-[13px] text-muted-foreground">Shortcuts</span>
        </div>
        <div className="max-h-[min(50vh,calc(100vh-12rem))] overflow-y-auto overscroll-contain px-2">
          {SHORTCUTS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => { setOpen(false); onPick(s) }}
              style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}
              className={`flex w-full items-center gap-3 rounded-lg py-3 text-left text-[15px] leading-snug text-foreground transition-all duration-300 hover:bg-foreground/[0.04] ${
                open ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
              }`}
            >
              <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{s}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="relative flex w-full flex-col items-stretch">
      {panel}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-1 py-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Shortcuts
        </button>
      )}
    </div>
  )
}

function ScrollToBottomButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()
  if (isAtBottom) return null
  return (
    <button
      onClick={() => scrollToBottom()}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-md hover:bg-muted transition-colors"
    >
      ↓ Jump to latest
    </button>
  )
}

export function MessageThread({ threadId, initialMessages, initialMessage }: Props) {
  const router = useRouter()
  const hasSentInitial = useRef(false)

  const [messages, setMessages] = useState<DisplayMessage[]>(
    initialMessages.map((m): DisplayMessage => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      isStreaming: undefined,
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : undefined,
    })),
  )
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    if (initialMessage && !hasSentInitial.current) {
      hasSentInitial.current = true
      router.replace(`/chat/${threadId}`, { scroll: false })
      sendMessage(initialMessage)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const msg = (partial: Partial<DisplayMessage> & Pick<DisplayMessage, 'role' | 'content'>): DisplayMessage => ({
    id: undefined,
    isStreaming: undefined,
    createdAt: undefined,
    ...partial,
  })

  async function sendMessage(content: string) {
    const now = new Date().toISOString()
    setMessages((prev) => [...prev, msg({ role: 'user', content, createdAt: now })])
    setMessages((prev) => [...prev, msg({ role: 'assistant', content: '', isStreaming: true })])
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
        setMessages((prev) => [...prev.slice(0, -1), msg({ role: 'assistant', content: errMsg })])
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
          try { event = JSON.parse(line.slice(6)) } catch { continue }

          if (event.type === 'delta' && event.text) {
            finalText += event.text
            setMessages((prev) => {
              const next = [...prev]
              next[next.length - 1] = msg({ role: 'assistant', content: finalText, isStreaming: true })
              return next
            })
          } else if (event.type === 'done') {
            setMessages((prev) => {
              const next = [...prev]
              next[next.length - 1] = msg({
                id: event.messageId,
                role: 'assistant',
                content: finalText,
                createdAt: new Date().toISOString(),
              })
              return next
            })
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
        msg({ role: 'assistant', content: 'Something went wrong. Please try again.' }),
      ])
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background">
      {/* 60px header */}
      <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-border/70 pl-2 pr-3 lg:pl-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('shell:open-sidebar'))}
            aria-label="Open sidebar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="label-mono">AI</span>
        </div>
        <Link
          href="/chat"
          aria-label="New chat"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
        >
          <SquarePen className="h-4 w-4" />
        </Link>
      </div>

      {/* Messages */}
      <div className="relative flex-1 min-h-0">
        <StickToBottom
          className="h-full overflow-y-auto"
          initial="smooth"
          resize="smooth"
          role="log"
        >
          <StickToBottom.Content className="mx-auto w-full max-w-3xl flex flex-col gap-8 p-4">
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id ?? i} message={msg} />
            ))}
            {isStreaming && messages[messages.length - 1]?.isStreaming === false && (
              <ThinkingBubble />
            )}
          </StickToBottom.Content>
          <ScrollToBottomButton />
        </StickToBottom>
      </div>

      {/* Composer */}
      <div
        className="shrink-0 border-t border-border/70 bg-background px-4 pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-2 flex w-full">
            <ShortcutsMenu onPick={sendMessage} />
          </div>
          <Composer onSubmit={sendMessage} disabled={isStreaming} />
        </div>
      </div>
    </div>
  )
}

function ThinkingBubble() {
  return (
    <div className="flex w-full max-w-[95%] flex-col gap-2">
      <div className="flex w-fit min-w-0 max-w-full flex-col gap-2 text-sm leading-relaxed text-foreground">
        <span className="label-mono animate-pulse">Thinking…</span>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === 'user'
  const ts = formatTimestamp(message.createdAt)

  return (
    <div className={cn('group flex w-full max-w-[95%] flex-col gap-2', isUser ? 'ml-auto items-end' : 'items-start')}>
      <div
        className={cn(
          'flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm leading-relaxed',
          isUser
            ? 'ml-auto rounded-2xl bg-foreground px-4 py-2.5 text-background'
            : 'text-foreground',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-0.5 h-3.5 ml-0.5 bg-current animate-pulse align-middle" />
            )}
          </p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {message.isStreaming ? (
              <p className="whitespace-pre-wrap break-words">
                {message.content}
                <span className="inline-block w-0.5 h-3.5 ml-0.5 bg-current animate-pulse align-middle" />
              </p>
            ) : (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
          </div>
        )}
      </div>
      {ts && (
        <span className={cn('label-mono normal-case tracking-[0.1em]', isUser ? 'self-end' : 'self-start')}>
          {ts}
        </span>
      )}
    </div>
  )
}
