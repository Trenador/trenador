import { getThreads } from '@/actions/chat'
import { ChatShell } from '@/components/chat/chat-shell'
import { getAuthenticatedMember } from '@/actions/_auth'
import { requireActiveSubscription } from '@/lib/subscription'

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  await requireActiveSubscription()
  const [threads, member] = await Promise.all([getThreads(), getAuthenticatedMember()])

  return (
    <ChatShell initialThreads={threads} member={{ displayName: member.displayName }}>
      {children}
    </ChatShell>
  )
}
