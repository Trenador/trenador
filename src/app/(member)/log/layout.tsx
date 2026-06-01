import { getThreads } from '@/actions/chat'
import { ThreadSidebar } from '@/components/chat/thread-sidebar'
import { requireActiveSubscription } from '@/lib/subscription'

export default async function LogLayout({ children }: { children: React.ReactNode }) {
  await requireActiveSubscription()
  const threads = await getThreads()

  return (
    <div className="flex h-screen overflow-hidden">
      <ThreadSidebar initialThreads={threads} />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
