import { Suspense } from 'react'
import { getThreads } from '@/actions/chat'
import { ChatShell } from '@/components/chat/chat-shell'
import { getAuthenticatedMember } from '@/actions/_auth'
import { requireActiveSubscription } from '@/lib/subscription'
import { signAvatarUrl } from '@/lib/avatar'

function AppShellSkeleton() {
  return (
    <div className="flex h-full">
      <div className="hidden w-64 shrink-0 border-r border-border/70 bg-sidebar lg:block" />
      <div className="flex-1 bg-background" />
    </div>
  )
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <MessagesLayoutContent>{children}</MessagesLayoutContent>
    </Suspense>
  )
}

async function MessagesLayoutContent({ children }: { children: React.ReactNode }) {
  await requireActiveSubscription()
  const [threads, member] = await Promise.all([getThreads(), getAuthenticatedMember()])
  const avatarUrl = await signAvatarUrl(member.photoUrl ?? null)

  return (
    <ChatShell
      initialThreads={threads}
      member={{ displayName: member.displayName }}
      initialAvatarUrl={avatarUrl}
    >
      {children}
    </ChatShell>
  )
}
