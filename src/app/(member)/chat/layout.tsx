import { getThreads } from '@/actions/chat'
import { ChatShell } from '@/components/chat/chat-shell'
import { requireActiveSubscription } from '@/lib/subscription'

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  await requireActiveSubscription()
  const threads = await getThreads()

  return (
    <ChatShell initialThreads={threads}>
      {children}
    </ChatShell>
  )
}
