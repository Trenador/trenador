'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, Trash2, PanelLeft, Inbox, LogOut, Dumbbell, BookOpen, ClipboardList, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { deleteThread } from '@/actions/chat'
import { createClient } from '@/lib/supabase/client'

type ThreadItem = {
  id: string
  title: string | null
  lastMessageAt: Date | null
  createdAt: Date
}

type Props = {
  initialThreads: ThreadItem[]
  mobileOpen?: boolean
  onMobileClose?: () => void
}

function dateBucket(date: Date | null): string {
  if (!date) return 'Older'
  const diffDays = (Date.now() - new Date(date).getTime()) / 86_400_000
  if (diffDays < 1) return 'Today'
  if (diffDays < 7) return 'Last 7 days'
  if (diffDays < 30) return 'Last 30 days'
  return 'Older'
}

function relativeTime(date: Date | null): string {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const BUCKET_ORDER = ['Today', 'Last 7 days', 'Last 30 days', 'Older']

export function ThreadSidebar({ initialThreads, mobileOpen = false, onMobileClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [threads, setThreads] = useState(initialThreads)
  const [collapsed, setCollapsed] = useState(false)

  // close sidebar on mobile when navigating
  const prevPathRef = useRef(pathname)
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname
      onMobileClose?.()
    }
  }, [pathname, onMobileClose])
  const [, startTransition] = useTransition()

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

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // group threads into date buckets
  const grouped = threads.reduce<Record<string, ThreadItem[]>>((acc, t) => {
    const key = dateBucket(t.lastMessageAt ?? t.createdAt)
    ;(acc[key] ??= []).push(t)
    return acc
  }, {})

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-sidebar shrink-0',
        // mobile: fixed overlay, slides in/out
        'fixed inset-y-0 left-0 z-40 w-72 transition-transform duration-300 shadow-xl',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        // desktop: static, collapsible width
        'md:static md:z-auto md:shadow-none md:translate-x-0 md:transition-[width] md:duration-200',
        collapsed ? 'md:w-12' : 'md:w-60',
      )}
    >
      {/* header */}
      <div className={cn('flex items-center h-[60px] px-2 border-b gap-1', !collapsed && 'px-3')}>
        {!collapsed && (
          <Link
            href="/chat"
            className="flex-1 text-sm font-bold text-sidebar-foreground truncate px-1 tracking-tight"
          >
            Trenador
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft className="size-4" />
        </Button>
      </div>

      {/* new chat */}
      <div className={cn('p-2', !collapsed && 'px-3 pt-3')}>
        <Link href="/chat">
          <Button
            variant="outline"
            size={collapsed ? 'icon-sm' : 'sm'}
            className={cn(
              'w-full border-border/80 bg-background/60 font-normal text-foreground hover:bg-foreground/[0.06]',
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
        <nav className="flex-1 overflow-y-auto px-2 pb-4 mt-2">
          {threads.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-6 text-center">
              No conversations yet
            </p>
          ) : (
            BUCKET_ORDER.filter((b) => grouped[b]?.length).map((bucket) => (
              <div key={bucket} className="mb-4">
                <div className="label-mono px-3 pb-2 pt-1">{bucket}</div>
                <div className="space-y-px">
                  {grouped[bucket]!.map((thread) => {
                    const isActive = pathname === `/chat/${thread.id}`
                    const title = thread.title ?? 'New conversation'
                    const truncated = title.length > 24 ? title.slice(0, 24) + '…' : title
                    return (
                      <Link
                        key={thread.id}
                        href={`/chat/${thread.id}`}
                        className={cn(
                          'group flex items-start gap-2 rounded-md px-3 py-2 cursor-pointer',
                          isActive
                            ? 'bg-foreground/[0.06]'
                            : 'hover:bg-foreground/[0.04]',
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium leading-tight text-sidebar-foreground">
                            {truncated}
                          </div>
                          <div className="label-mono normal-case tracking-[0.08em] mt-1">
                            {relativeTime(thread.lastMessageAt ?? thread.createdAt)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDelete(e, thread.id)}
                          className="mt-0.5 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                          aria-label="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </nav>
      )}

      {/* collapsed icon list */}
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
                  'flex items-center justify-center size-8 rounded-md text-muted-foreground hover:bg-sidebar-accent transition-colors text-xs font-medium',
                  isActive && 'bg-sidebar-accent text-foreground',
                )}
              >
                {(thread.title ?? 'N')[0]?.toUpperCase()}
              </Link>
            )
          })}
        </nav>
      )}

      {/* training nav */}
      <div className={cn('border-t pt-2 pb-1', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed && <div className="label-mono px-1 pb-2">Training</div>}
        {[
          { href: '/workouts', icon: Dumbbell, label: 'Workout Library' },
          { href: '/workouts/mine', icon: BookOpen, label: 'My Workouts' },
          { href: '/log', icon: ClipboardList, label: 'Log Workout' },
          { href: '/log/history', icon: History, label: 'History' },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}>
            <Button
              variant="ghost"
              size={collapsed ? 'icon-sm' : 'sm'}
              className={cn(
                'w-full text-muted-foreground hover:text-foreground',
                !collapsed && 'justify-start gap-2',
                pathname.startsWith(href) && 'bg-sidebar-accent text-foreground',
              )}
            >
              <Icon className="size-4" />
              {!collapsed && label}
            </Button>
          </Link>
        ))}
      </div>

      {/* coach inbox */}
      <div className={cn('px-2', !collapsed && 'px-3')}>
        <Link href="/messages">
          <Button
            variant="ghost"
            size={collapsed ? 'icon-sm' : 'sm'}
            className={cn(
              'w-full text-muted-foreground hover:text-foreground',
              !collapsed && 'justify-start gap-2',
              pathname === '/messages' && 'bg-sidebar-accent text-foreground',
            )}
          >
            <Inbox className="size-4" />
            {!collapsed && 'Coach Inbox'}
          </Button>
        </Link>
      </div>

      {/* user menu */}
      <div className={cn('border-t mt-1', collapsed ? 'p-2' : 'px-3 py-3')}>
        <button
          onClick={handleSignOut}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-colors',
            collapsed && 'justify-center px-0',
          )}
          aria-label="Sign out"
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
