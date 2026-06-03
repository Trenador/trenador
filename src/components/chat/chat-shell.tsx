'use client'

import { useState } from 'react'
import { PanelLeft } from 'lucide-react'
import { ThreadSidebar } from './thread-sidebar'

type ThreadItem = {
  id: string
  title: string | null
  lastMessageAt: Date | null
  createdAt: Date
}

export function ChatShell({
  initialThreads,
  children,
  scrollableMain = false,
}: {
  initialThreads: ThreadItem[]
  children: React.ReactNode
  scrollableMain?: boolean
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <ThreadSidebar
        initialThreads={initialThreads}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* mobile hamburger — fixed, only visible when sidebar is closed */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-20 md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Open sidebar"
        >
          <PanelLeft className="size-5" />
        </button>
      )}

      <main className={`flex-1 min-w-0 ${scrollableMain ? 'overflow-auto' : 'overflow-hidden'}`}>
        {children}
      </main>
    </div>
  )
}
