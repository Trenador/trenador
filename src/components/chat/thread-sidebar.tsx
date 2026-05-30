'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, Trash2, MessageSquare, PanelLeft, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { deleteThread } from '@/actions/chat'

type ThreadItem = {
  id: string
  title: string | null
  lastMessageAt: Date | null
  createdAt: Date
}

type Props = {
  initialThreads: ThreadItem[]
}

function relativeTime(date: Date | null): string {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export function ThreadSidebar({ initialThreads }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [threads, setThreads] = useState(initialThreads)
  const [collapsed, setCollapsed] = useState(false)
  const [, startTransition] = useTransition()

  // when the server re-renders (e.g. after router.refresh()), sync the new thread list
  const prevRef = useRef(initialThreads)
  useEffect(() => {
    if (prevRef.current !== initialThreads) {
      prevRef.current = initialThreads
      setThreads(initialThreads)
    }
  }, [initialThreads])

  function handleDelete(e: React.MouseEvent, threadId: string) {
    e.preventDefault()
    e.stopPropagation()
    setThreads((prev) => prev.filter((t) => t.id !== threadId))
    startTransition(async () => {
      await deleteThread(threadId)
      if (pathname === `/chat/${threadId}`) router.push('/chat')
    })
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-sidebar shrink-0 transition-[width] duration-200',
        collapsed ? 'w-12' : 'w-60',
      )}
    >
      {/* header */}
      <div className={cn('flex items-center h-14 px-2 border-b gap-1', !collapsed && 'px-3')}>
        {!collapsed && (
          <Link
            href="/chat"
            className="flex-1 text-sm font-semibold text-sidebar-foreground truncate px-1"
          >
            Trenador AI
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0 text-sidebar-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft className="size-4" />
        </Button>
      </div>

      {/* new chat button */}
      <div className={cn('p-2', !collapsed && 'px-3')}>
        <Link href="/chat">
          <Button
            variant="ghost"
            size={collapsed ? 'icon-sm' : 'sm'}
            className={cn(
              'w-full text-sidebar-foreground',
              !collapsed && 'justify-start gap-2',
            )}
          >
            <Plus className="size-4" />
            {!collapsed && 'New chat'}
          </Button>
        </Link>
      </div>

      {/* thread list — expanded */}
      {!collapsed && (
        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {threads.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-6 text-center">
              No conversations yet
            </p>
          ) : (
            threads.map((thread) => {
              const isActive = pathname === `/chat/${thread.id}`
              return (
                <Link
                  key={thread.id}
                  href={`/chat/${thread.id}`}
                  className={cn(
                    'group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground',
                    'hover:bg-sidebar-accent transition-colors',
                    isActive && 'bg-sidebar-accent',
                  )}
                >
                  <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">
                    {thread.title ?? 'New conversation'}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 group-hover:hidden">
                    {relativeTime(thread.lastMessageAt ?? thread.createdAt)}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, thread.id)}
                    className="hidden group-hover:flex items-center justify-center size-5 rounded hover:text-destructive shrink-0"
                    aria-label="Delete thread"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </Link>
              )
            })
          )}
        </nav>
      )}

      {/* thread list — collapsed (icons only) */}
      {collapsed && (
        <nav className="flex-1 overflow-y-auto py-2 flex flex-col items-center gap-0.5">
          {threads.map((thread) => {
            const isActive = pathname === `/chat/${thread.id}`
            return (
              <Link
                key={thread.id}
                href={`/chat/${thread.id}`}
                title={thread.title ?? 'New conversation'}
                className={cn(
                  'flex items-center justify-center size-8 rounded-md hover:bg-sidebar-accent transition-colors',
                  isActive && 'bg-sidebar-accent',
                )}
              >
                <MessageSquare className="size-4 text-muted-foreground" />
              </Link>
            )
          })}
        </nav>
      )}

      {/* coach inbox link — bottom of sidebar */}
      <div className={cn('border-t p-2', !collapsed && 'px-3')}>
        <Link href="/messages">
          <Button
            variant="ghost"
            size={collapsed ? 'icon-sm' : 'sm'}
            className={cn(
              'w-full text-sidebar-foreground',
              !collapsed && 'justify-start gap-2',
              pathname === '/messages' && 'bg-sidebar-accent',
            )}
          >
            <Inbox className="size-4" />
            {!collapsed && 'Coach Inbox'}
          </Button>
        </Link>
      </div>
    </aside>
  )
}
