'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn, getInitials } from '@/lib/utils'
import { inboxBucket, inboxRelative } from '@/lib/format-date'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Mail, MailOpen, Pencil, Trash2, Check, X, Send } from 'lucide-react'
import { MobileFilterButton, MobileFilterSheet, type FilterSection } from './admin-filter-sheet'
import {
  adminGetInbox,
  adminGetConversation,
  adminSendReply,
  adminMarkThreadRead,
  adminDeleteMessage,
  adminEditMessage,
} from '@/actions/admin'

type InboxItem = {
  memberId: string
  displayName: string
  photoUrl: string | null
  assignedCoachId: string | null
  lastMessageText: string
  lastMessageFrom: 'member' | 'coach'
  lastMessageAt: string
  unreadCount: number
}

type Message = {
  id: string
  memberId: string
  senderRole: string
  content: string
  createdAt: string
  readAt: string | null
}

type Coach = { id: string; displayName: string }


export function AdminInbox({ coaches }: { coaches: Coach[] }) {
  const [conversations, setConversations] = useState<InboxItem[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all')
  const [coachFilter, setCoachFilter] = useState('all')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [readMap, setReadMap] = useState<Record<string, string>>({})
  const scrollEndRef = useRef<HTMLDivElement | null>(null)
  const replyRef = useRef<HTMLTextAreaElement>(null)

  const load = useCallback(async () => {
    const data = await adminGetInbox()
    setConversations(data)
  }, [])

  useEffect(() => { load() }, [load])

  // poll every 5s
  useEffect(() => {
    const t = setInterval(load, 5000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus) }
  }, [load])

  // load thread when selected
  useEffect(() => {
    if (!activeThreadId) { setMessages([]); return }
    adminGetConversation(activeThreadId).then((msgs) => setMessages(msgs as Message[]))
  }, [activeThreadId])

  // auto-scroll to bottom of thread
  useEffect(() => { scrollEndRef.current?.scrollIntoView({ block: 'end' }) }, [activeThreadId, messages.length])

  // mark thread read when opened
  const openThread = useCallback((memberId: string, lastAt: string) => {
    setActiveThreadId(memberId)
    setReadMap((prev) => ({ ...prev, [memberId]: lastAt }))
    adminMarkThreadRead(memberId)
  }, [])

  const isUnread = (c: InboxItem) => {
    const markedAt = readMap[c.memberId]
    if (markedAt) return false
    return c.unreadCount > 0
  }

  const sendReply = async () => {
    const text = replyText.trim()
    if (!text || !activeThreadId) return
    setSending(true)
    const optimistic: Message = { id: crypto.randomUUID(), memberId: activeThreadId, senderRole: 'coach', content: text, createdAt: new Date().toISOString(), readAt: null }
    setMessages((prev) => [...prev, optimistic])
    setReplyText('')
    await adminSendReply(activeThreadId, text)
    setSending(false)
    await load()
  }

  const deleteMsg = async (m: Message) => {
    if (!confirm('Delete this message?')) return
    setMessages((prev) => prev.filter((x) => x.id !== m.id))
    await adminDeleteMessage(m.id)
  }

  const saveEdit = async (m: Message) => {
    const next = editingText.trim()
    if (!next) return
    setSavingEdit(true)
    setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, content: next } : x))
    setEditingId(null)
    await adminEditMessage(m.id, next)
    setSavingEdit(false)
  }

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const now = Date.now()
    const windowMs = dateFilter === 'today' ? 86_400_000 : dateFilter === '7d' ? 7 * 86_400_000 : dateFilter === '30d' ? 30 * 86_400_000 : null
    return conversations.filter((c) => {
      if (coachFilter !== 'all' && c.assignedCoachId !== coachFilter) return false
      if (windowMs !== null && now - new Date(c.lastMessageAt).getTime() > windowMs) return false
      if (readFilter === 'unread' && !isUnread(c)) return false
      if (readFilter === 'read' && isUnread(c)) return false
      if (!q) return true
      return (c.displayName ?? '').toLowerCase().includes(q) || (c.lastMessageText ?? '').toLowerCase().includes(q)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, coachFilter, dateFilter, readFilter, readMap, searchQuery])

  const grouped = useMemo(() => {
    const out: Record<string, InboxItem[]> = {}
    for (const c of filteredConversations) {
      const k = inboxBucket(c.lastMessageAt)
      ;(out[k] ??= []).push(c)
    }
    return out
  }, [filteredConversations])

  const activeConversation = useMemo(() => conversations.find((c) => c.memberId === activeThreadId) ?? null, [conversations, activeThreadId])

  const filterSections: FilterSection[] = [
    {
      label: 'Status', value: readFilter, defaultValue: 'all',
      setValue: (v) => setReadFilter(v as 'all' | 'unread' | 'read'),
      options: [{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }, { value: 'read', label: 'Read' }],
    },
    {
      label: 'Coach', value: coachFilter, defaultValue: 'all',
      setValue: setCoachFilter,
      options: [{ value: 'all', label: 'All coaches' }, ...coaches.map((c) => ({ value: c.id, label: c.displayName }))],
    },
    {
      label: 'Date', value: dateFilter, defaultValue: 'all',
      setValue: (v) => setDateFilter(v as 'all' | 'today' | '7d' | '30d'),
      options: [{ value: 'all', label: 'Any time' }, { value: 'today', label: 'Last 24 hours' }, { value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }],
    },
  ]

  const ORDER = ['Today', 'This week', 'Earlier']

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex h-[60px] shrink-0 items-center justify-between px-5 pt-4">
        <div>
          <div className="text-sm font-medium">Inbox</div>
          <div className="text-[11px] text-muted-foreground">
            {filteredConversations.length}{filteredConversations.length !== conversations.length ? ` of ${conversations.length}` : ''} conversation{conversations.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-5 pb-3 pt-5 sm:gap-3">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-[12px] outline-none placeholder:text-muted-foreground/70 focus:border-foreground/30 sm:w-72 sm:flex-none"
        />
        <select value={readFilter} onChange={(e) => setReadFilter(e.target.value as 'all' | 'unread' | 'read')} className="hidden h-8 rounded-md border border-border bg-background px-2 text-[12px] outline-none sm:block">
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        <select value={coachFilter} onChange={(e) => setCoachFilter(e.target.value)} className="hidden h-8 rounded-md border border-border bg-background px-2 text-[12px] outline-none sm:block">
          <option value="all">All coaches</option>
          {coaches.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
        </select>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | '7d' | '30d')} className="hidden h-8 rounded-md border border-border bg-background px-2 text-[12px] outline-none sm:block">
          <option value="all">Any time</option>
          <option value="today">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
        <MobileFilterButton sections={filterSections} onOpen={() => setMobileFilterOpen(true)} />
      </div>
      <MobileFilterSheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen} sections={filterSections} resultCount={filteredConversations.length} resultLabel="conversations" />

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-muted-foreground">
            {conversations.length === 0 ? 'No conversations yet.' : 'No conversations match your filters.'}
          </div>
        ) : (
          ORDER.map((b) =>
            grouped[b] ? (
              <div key={b}>
                <div className="sticky top-0 z-10 bg-background/95 px-5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">{b}</div>
                {grouped[b].map((c) => {
                  const unread = isUnread(c)
                  const isActive = activeThreadId === c.memberId
                  const ini = getInitials(c.displayName)
                  const assignedCoach = coaches.find((co) => co.id === c.assignedCoachId)
                  return (
                    <div
                      key={c.memberId}
                      role="button"
                      tabIndex={0}
                      onClick={() => openThread(c.memberId, c.lastMessageAt)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openThread(c.memberId, c.lastMessageAt) } }}
                      className={cn(
                        'group flex w-full cursor-pointer items-center gap-3 border-b border-border/40 px-5 py-3 text-left transition-colors',
                        isActive ? 'bg-muted/60' : unread ? 'bg-background hover:bg-foreground/[0.03]' : 'bg-muted/40 hover:bg-muted/60',
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted sm:h-8 sm:w-8">
                        {c.photoUrl ? (
                          <img src={c.photoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">{ini}</div>
                        )}
                      </div>
                      {/* Row content */}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-0">
                        <span className={cn('truncate text-sm sm:w-36 sm:shrink-0', unread ? 'font-semibold' : 'font-medium text-muted-foreground')}>{c.displayName}</span>
                        <span className="hidden w-32 shrink-0 truncate text-[12px] text-muted-foreground sm:block" title="Assigned coach">
                          {assignedCoach ? assignedCoach.displayName : <span className="italic text-muted-foreground/70">Unassigned</span>}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground sm:text-[13px]">
                          {c.lastMessageFrom === 'coach' && <span className="mr-1 text-muted-foreground/60">You:</span>}
                          {c.lastMessageText || <span className="italic text-muted-foreground/70">No messages yet</span>}
                        </span>
                      </div>
                      {/* Read badge */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (unread) {
                            setReadMap((prev) => ({ ...prev, [c.memberId]: c.lastMessageAt }))
                            adminMarkThreadRead(c.memberId)
                          } else {
                            setReadMap((prev) => { const next = { ...prev }; delete next[c.memberId]; return next })
                          }
                        }}
                        title={unread ? 'Mark as read' : 'Mark as unread'}
                        className={cn('shrink-0 rounded px-2 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors hover:bg-foreground/10', unread ? 'text-primary' : 'text-muted-foreground')}
                      >
                        {unread ? 'Unread' : 'Read'}
                      </button>
                      <span className="w-16 shrink-0 text-right text-[11px] text-muted-foreground sm:w-24">{inboxRelative(c.lastMessageAt)}</span>
                    </div>
                  )
                })}
              </div>
            ) : null,
          )
        )}
      </div>

      {/* Thread slide-out */}
      <Sheet open={!!activeConversation} onOpenChange={(open) => { if (!open) setActiveThreadId(null) }}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
          {activeConversation && (
            <>
              {/* Thread header */}
              <div className="flex h-[60px] shrink-0 items-center border-b border-border/60 px-5 pr-12">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{activeConversation.displayName}</div>
                  {activeConversation.assignedCoachId && (
                    <div className="text-[11px] text-muted-foreground">
                      with {coaches.find((c) => c.id === activeConversation.assignedCoachId)?.displayName ?? 'Coach'}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-6">
                <div className="flex flex-col gap-6">
                  {messages.length === 0 ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">No messages yet.</p>
                  ) : (
                    messages.map((m) => {
                      const fromMember = m.senderRole === 'member'
                      const ts = new Date(m.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                      const isEditing = editingId === m.id

                      if (isEditing) {
                        return (
                          <div key={m.id} className="flex w-full justify-end">
                            <div className="flex w-full max-w-[85%] flex-col gap-2 rounded-2xl border border-border bg-background p-2">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                rows={Math.min(8, Math.max(2, editingText.split('\n').length))}
                                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                autoFocus
                              />
                              <div className="flex justify-end gap-1.5">
                                <button type="button" onClick={() => setEditingId(null)} disabled={savingEdit} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /> Cancel</button>
                                <button type="button" onClick={() => saveEdit(m)} disabled={savingEdit || !editingText.trim()} className="flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-sm text-background hover:opacity-90 disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Save</button>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div key={m.id} className={cn('group flex flex-col', fromMember ? 'items-start' : 'items-end')}>
                          <div className={cn('flex max-w-[85%] items-end gap-2', fromMember ? 'flex-row' : 'flex-row-reverse')}>
                            {fromMember && (
                              <div className="mb-0.5 h-7 w-7 shrink-0 overflow-hidden rounded-full bg-muted border border-border/60 flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                                {getInitials(activeConversation.displayName)}
                              </div>
                            )}
                            <div className={cn('rounded-2xl px-4 py-2.5 text-sm leading-relaxed', fromMember ? 'rounded-bl-sm bg-muted text-foreground' : 'rounded-br-sm bg-foreground text-background')}>
                              <p className="whitespace-pre-wrap break-words">{m.content}</p>
                            </div>
                          </div>
                          <div className={cn('mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground', fromMember ? 'pl-9' : '')}>
                            <span>{fromMember ? activeConversation.displayName : 'Coach'} · {ts}</span>
                            {!fromMember && (
                              <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                                <button type="button" onClick={() => { setEditingId(m.id); setEditingText(m.content) }} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit">
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button type="button" onClick={() => deleteMsg(m)} className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500" title="Delete">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={scrollEndRef} />
                </div>
              </div>

              {/* Reply composer */}
              <div className="border-t border-border/60 bg-background px-5 py-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={replyRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                    placeholder={`Reply to ${activeConversation.displayName}…`}
                    disabled={sending}
                    rows={1}
                    className="min-h-[40px] flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground disabled:opacity-50"
                    style={{ fieldSizing: 'content' } as React.CSSProperties}
                  />
                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={!replyText.trim() || sending}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-30"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
