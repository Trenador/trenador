import { getThreads } from '@/actions/chat'
import { ThreadSidebar } from '@/components/chat/thread-sidebar'

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const threads = await getThreads()

  return (
    <div className="flex h-screen overflow-hidden">
      <ThreadSidebar initialThreads={threads} />
      <main className="flex-1 min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
