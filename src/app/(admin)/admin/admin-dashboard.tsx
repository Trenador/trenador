'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Inbox, Dumbbell, Users, UserRound, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AdminInbox } from './admin-inbox'
import { AdminUsers } from './admin-users'
import { AdminWorkouts } from './admin-workouts'
import { AdminCoaches } from './admin-coaches'
import { adminGetCoaches } from '@/actions/admin'

type View = 'inbox' | 'users' | 'workouts' | 'coaches'
type Coach = { id: string; displayName: string; isAuthor?: boolean }
export type ThreadMember = { id: string; displayName: string; photoUrl: string | null; assignedCoachId: string | null }

const TABS: { key: View; label: string; icon: React.ElementType }[] = [
  { key: 'inbox', label: 'Inbox', icon: Inbox },
  { key: 'users', label: 'Users', icon: UserRound },
  { key: 'workouts', label: 'Workouts', icon: Dumbbell },
  { key: 'coaches', label: 'Coaches', icon: Users },
]

export function AdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = (searchParams.get('view') ?? 'inbox') as View
  const initialThreadId = searchParams.get('t')
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [pendingThread, setPendingThread] = useState<ThreadMember | null>(null)

  const setView = (v: View) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', v)
    params.delete('t')
    setPendingThread(null)
    router.push(`/admin?${params.toString()}`)
  }

  const openInboxThread = (member: ThreadMember) => {
    setPendingThread(member)
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', 'inbox')
    params.set('t', member.id)
    router.push(`/admin?${params.toString()}`)
  }

  const loadCoaches = useCallback(async () => {
    const data = await adminGetCoaches()
    setCoaches(data.map((c) => ({ id: c.id, displayName: c.displayName, isAuthor: c.isAuthor })))
  }, [])

  useEffect(() => { loadCoaches() }, [loadCoaches])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top bar */}
      <header className="flex h-[56px] shrink-0 items-center justify-between gap-2 px-3 sm:px-4">
        {/* Logo + ADMIN label */}
        <div className="flex flex-col items-start leading-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/trenador-logo-mark.svg" alt="Trenador" className="h-4 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <span className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">ADMIN</span>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          {/* Tab pills */}
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                aria-label={label}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-medium transition-colors sm:px-3',
                  view === key ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {view === 'inbox' && <AdminInbox coaches={coaches} initialThreadId={initialThreadId} pendingThread={pendingThread} />}
        {view === 'users' && <AdminUsers coaches={coaches} onMessage={openInboxThread} />}
        {view === 'workouts' && <AdminWorkouts coaches={coaches} />}
        {view === 'coaches' && <AdminCoaches onCoachesChange={setCoaches} />}
      </div>
    </div>
  )
}
