'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Plus, Trash2, Menu, LogOut, Dumbbell, Bookmark,
  MessageCircle, User, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { deleteThread } from '@/actions/chat'
import { createClient } from '@/lib/supabase/client'

type ThreadItem = {
  id: string
  title: string | null
  lastMessageAt: Date | null
  createdAt: Date
}

type Member = {
  displayName: string
  photoUrl?: string | null
}

type Props = {
  initialThreads: ThreadItem[]
  member: Member
  collapsed: boolean
  onToggle: () => void
  mobileTransform: string
  mobileTransition: string
  backdropOpacity: number
  initialAvatarUrl?: string
}

function dateBucket(date: Date | null): string {
  if (!date) return 'Older'
  const diff = (Date.now() - new Date(date).getTime()) / 86_400_000
  if (diff < 7) return 'Recent'
  if (diff < 30) return 'Last 30 Days'
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

const BUCKET_ORDER = ['Recent', 'Last 30 Days', 'Older']

function SidebarTab({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-foreground transition-colors',
        active ? 'bg-foreground/[0.06]' : 'hover:bg-foreground/[0.04]',
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </button>
  )
}

export function ThreadSidebar({
  initialThreads,
  member,
  collapsed,
  onToggle,
  mobileTransform,
  mobileTransition,
  backdropOpacity,
  initialAvatarUrl = '',
}: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [threads, setThreads] = useState(initialThreads)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [, startTransition] = useTransition()

  const prevRef = useRef(initialThreads)
  useEffect(() => {
    if (prevRef.current !== initialThreads) {
      prevRef.current = initialThreads
      setThreads(initialThreads)
    }
  }, [initialThreads])

  useEffect(() => {
    const onRefresh = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('members')
        .select('photo_url')
        .eq('auth_user_id', user.id)
        .single()
      const path = (data as { photo_url: string | null } | null)?.photo_url ?? null
      if (!path) { setAvatarUrl(''); return }
      if (path.startsWith('http')) { setAvatarUrl(path); return }
      const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60 * 24 * 7)
      setAvatarUrl(signed?.signedUrl ?? '')
    }
    window.addEventListener('profile:refresh', onRefresh)
    return () => window.removeEventListener('profile:refresh', onRefresh)
  }, [])

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

  const closeOnMobile = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      onToggle()
    }
  }

  const grouped = threads.reduce<Record<string, ThreadItem[]>>((acc, t) => {
    const key = dateBucket(t.lastMessageAt ?? t.createdAt)
    ;(acc[key] ??= []).push(t)
    return acc
  }, {})

  const initial = (member.displayName[0] ?? '?').toUpperCase()

  // Collapsed desktop icon rail
  if (collapsed) {
    return (
      <div
        role="button"
        aria-label="Open sidebar"
        onClick={onToggle}
        className="hidden h-full w-12 shrink-0 cursor-pointer flex-col items-center border-r border-border/70 bg-sidebar lg:flex"
      >
        <div className="flex h-[60px] w-full items-center justify-center">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => { e.stopPropagation(); onToggle() }}
            aria-label="Open sidebar"
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-1 flex-col items-center gap-2 pt-1">
          <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('chat:new')); router.push('/chat') }} aria-label="New chat">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="pb-3">
          <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); handleSignOut() }} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile backdrop tap-to-close */}
      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onToggle}
        style={{ pointerEvents: (backdropOpacity ?? 1) < 0.05 ? 'none' : undefined }}
        className="fixed inset-0 z-20 lg:hidden"
      />

      <div
        style={{ transform: mobileTransform, transition: mobileTransition }}
        className="fixed inset-y-0 left-0 z-30 flex h-full w-full shrink-0 flex-col border-r border-border/70 bg-sidebar lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:transform-none"
      >
        {/* Header: logo + collapse */}
        <div className="flex h-[60px] items-center justify-between pl-5 pr-3">
          <div className="w-[42%] sm:w-[30%] lg:w-[60%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/trenador-logo-mark.svg" alt="Trenador" className="h-auto w-full object-contain" />
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* New chat button (desktop) */}
        <div className="hidden px-3 pb-2 pt-2 lg:block">
          <Button
            onClick={() => { window.dispatchEvent(new CustomEvent('chat:new')); router.push('/chat'); closeOnMobile() }}
            className="w-full justify-start border-border/80 bg-background/60 font-normal text-foreground hover:bg-foreground/[0.06] hover:text-foreground"
            variant="outline"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Chat
          </Button>
        </div>

        {/* Nav tabs */}
        <nav className="space-y-px px-2 pb-3">
          <SidebarTab
            icon={<Dumbbell className="h-4 w-4" />}
            label="Workout library"
            onClick={() => { router.push('/workouts'); closeOnMobile() }}
            active={pathname === '/workouts' || pathname.startsWith('/workouts/')}
          />
          <SidebarTab
            icon={<Bookmark className="h-4 w-4" />}
            label="My workouts"
            onClick={() => { router.push('/workouts/mine'); closeOnMobile() }}
            active={pathname === '/workouts/mine' || pathname.startsWith('/workouts/mine/')}
          />
          {/* Log Workout and History are hidden until enabled by product
          <SidebarTab
            icon={<ClipboardList className="h-4 w-4" />}
            label="Log workout"
            onClick={() => { router.push('/log'); closeOnMobile() }}
            active={pathname === '/log'}
          />
          <SidebarTab
            icon={<History className="h-4 w-4" />}
            label="History"
            onClick={() => { router.push('/log/history'); closeOnMobile() }}
            active={pathname.startsWith('/log/history')}
          />
          */}
          <SidebarTab
            icon={<MessageCircle className="h-4 w-4" />}
            label="Message center"
            onClick={() => { router.push('/messages'); closeOnMobile() }}
            active={pathname === '/messages'}
          />
        </nav>

        {/* Thread list */}
        <ScrollArea className="flex-1 px-2">
          <div className="pb-4">
            {threads.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">No conversations yet</p>
            ) : (
              BUCKET_ORDER.filter((b) => grouped[b]?.length).map((bucket) => (
                <div key={bucket} className="mb-4">
                  <div className="label-mono px-3 pb-2 pt-1">{bucket}</div>
                  <div className="space-y-px">
                    {grouped[bucket]!.map((thread) => {
                      const isActive = pathname === `/chat/${thread.id}`
                      const title = thread.title ?? 'New conversation'
                      const truncated = title.length > 22 ? title.slice(0, 22) + '…' : title
                      return (
                        <div
                          key={thread.id}
                          onClick={() => { router.push(`/chat/${thread.id}`); closeOnMobile() }}
                          className={cn(
                            'group flex cursor-pointer items-start gap-2 rounded-md px-3 py-2',
                            isActive ? 'bg-foreground/[0.06]' : 'hover:bg-foreground/[0.04]',
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-medium leading-tight">{truncated}</div>
                            <div className="label-mono normal-case tracking-[0.12em] mt-1">
                              {relativeTime(thread.lastMessageAt ?? thread.createdAt)}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDelete(e, thread.id)}
                            className="mt-0.5 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Delete conversation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* User menu */}
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-auto w-full cursor-pointer items-center justify-start gap-2 rounded-none bg-transparent px-3 py-3 text-foreground outline-none hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.04]">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground text-[10px] font-semibold text-background">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[13px]">{member.displayName}</span>
                <span className="text-[11px] font-medium text-primary">Pro</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-[220px]">
              <DropdownMenuItem onClick={() => { router.push('/profile'); closeOnMobile() }}>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile FAB */}
        <Button
          onClick={() => { window.dispatchEvent(new CustomEvent('chat:new')); router.push('/chat'); closeOnMobile() }}
          aria-label="New chat"
          size="icon"
          className="absolute bottom-20 right-4 z-10 h-12 w-12 rounded-full shadow-lg lg:hidden"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </>
  )
}
