'use client'

declare global {
  interface Window { __shellSidebarCollapsed: boolean }
}

import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react'
import { usePathname } from 'next/navigation'
import { ThreadSidebar } from './thread-sidebar'

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

export function ChatShell({
  initialThreads,
  member,
  initialAvatarUrl = '',
  children,
  scrollableMain = false,
}: {
  initialThreads: ThreadItem[]
  member: Member
  initialAvatarUrl?: string
  children: React.ReactNode
  scrollableMain?: boolean
}) {
  const pathname = usePathname()
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)

  // Mobile push: 0 = closed, w = fully open
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [animating, setAnimating] = useState(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const startOffsetRef = useRef(0)
  const activeRef = useRef(false)
  const panelWRef = useRef(0)

  const isMobile = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches

  const onTouchStart = (e: ReactTouchEvent) => {
    if (!isMobile()) return
    const t = e.touches[0]
    if (!t) return
    startXRef.current = t.clientX
    startYRef.current = t.clientY
    panelWRef.current = window.innerWidth
    startOffsetRef.current = leftCollapsed ? 0 : panelWRef.current
    activeRef.current = true
  }

  const onTouchMove = (e: ReactTouchEvent) => {
    if (!activeRef.current) return
    const t = e.touches[0]
    if (!t) return
    const dx = t.clientX - startXRef.current
    const dy = t.clientY - startYRef.current
    if (!dragging) {
      if (Math.abs(dx) < 8) return
      if (Math.abs(dy) > Math.abs(dx)) { activeRef.current = false; return }
      setDragging(true)
      if (leftCollapsed) setLeftCollapsed(false)
    }
    const w = panelWRef.current
    setOffset(Math.max(0, Math.min(w, startOffsetRef.current + dx)))
  }

  const finishDrag = () => {
    if (!activeRef.current) return
    activeRef.current = false
    if (!dragging) return
    setDragging(false)
    const w = panelWRef.current
    const wasOpen = startOffsetRef.current > 0
    const traveled = offset - startOffsetRef.current
    const threshold = w * 0.3
    const shouldOpen = wasOpen ? traveled > -threshold : traveled > threshold
    setAnimating(true)
    setOffset(shouldOpen ? w : 0)
    setTimeout(() => {
      setAnimating(false)
      if (!shouldOpen) setLeftCollapsed(true)
    }, 240)
  }

  const toggleSidebar = () => {
    if (!isMobile()) { setLeftCollapsed((v) => !v); return }
    const w = window.innerWidth
    panelWRef.current = w
    if (leftCollapsed) {
      setLeftCollapsed(false)
      setOffset(0)
      requestAnimationFrame(() => {
        setAnimating(true)
        setOffset(w)
        setTimeout(() => setAnimating(false), 240)
      })
    } else {
      setAnimating(true)
      setOffset(0)
      setTimeout(() => { setAnimating(false); setLeftCollapsed(true) }, 240)
    }
  }

  // Init: collapse on mobile by default
  const didInit = useRef(false)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      setLeftCollapsed(true)
      setOffset(0)
    }
    didInit.current = true
  }, [])

  // Keep offset in sync with leftCollapsed when not dragging
  useEffect(() => {
    if (dragging || animating) return
    if (typeof window === 'undefined') return
    const ww = window.innerWidth
    panelWRef.current = ww
    setOffset(leftCollapsed ? 0 : ww)
  }, [leftCollapsed, isMobileView, dragging, animating])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const viewport = window.visualViewport
    const update = () => {
      setViewportHeight(Math.round(viewport?.height ?? window.innerHeight))
      setIsMobileView(window.matchMedia('(max-width: 1023px)').matches)
    }
    update()
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  // Listen for open-sidebar events from child components (e.g. chat window header)
  useEffect(() => {
    const open = () => {
      setLeftCollapsed(false)
      if (typeof window !== 'undefined') {
        const ww = window.innerWidth
        panelWRef.current = ww
        setOffset(ww)
      }
    }
    window.addEventListener('shell:open-sidebar', open)
    return () => window.removeEventListener('shell:open-sidebar', open)
  }, [])

  // Expose sidebar collapsed state globally for children to read
  useEffect(() => {
    window.__shellSidebarCollapsed = leftCollapsed
    window.dispatchEvent(new CustomEvent('shell:sidebar-state', { detail: { collapsed: leftCollapsed } }))
  }, [leftCollapsed])

  const w = panelWRef.current || (typeof window !== 'undefined' ? window.innerWidth : 1)
  const mainTx = `${offset}px`
  const parallax = 0.3
  const sideOffsetPx = -(w - offset) * parallax
  const sideTx = `${sideOffsetPx}px`
  const transition = dragging ? 'none' : 'transform 240ms ease-out, opacity 240ms ease-out'
  const progress = Math.min(1, offset / w)

  // On chat thread pages, the thread component renders its own 60px header;
  // show the shell header everywhere else on mobile.
  const isOnChatThread = /^\/chat\/.+/.test(pathname)

  return (
    <div
      className="relative flex w-screen overflow-hidden bg-background text-foreground"
      style={viewportHeight ? { height: `${viewportHeight}px` } : { height: '100dvh' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={finishDrag}
      onTouchCancel={finishDrag}
    >
      <ThreadSidebar
        initialThreads={initialThreads}
        member={member}
        initialAvatarUrl={initialAvatarUrl}
        collapsed={isMobileView ? false : leftCollapsed}
        onToggle={toggleSidebar}
        mobileTransform={isMobileView ? `translateX(${sideTx})` : ''}
        mobileTransition={isMobileView ? transition : ''}
        backdropOpacity={isMobileView ? progress : 0}
      />

      <div
        className="relative flex min-w-0 flex-1 flex-col bg-background"
        style={
          isMobileView
            ? {
                transform: `translateX(${mainTx})`,
                transition,
                willChange: dragging || animating ? 'transform' : undefined,
                zIndex: 40,
              }
            : undefined
        }
      >
        {/* Mobile header — shown on non-chat-thread pages */}
        {!isOnChatThread && (
          <header className="flex h-[60px] shrink-0 items-center px-3 lg:hidden bg-background border-b border-border/70">
            <button
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" />
              </svg>
            </button>
          </header>
        )}

        <div className={`flex min-h-0 flex-1 ${scrollableMain ? 'overflow-auto' : 'overflow-hidden'}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
