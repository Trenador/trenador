'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { cn, getInitials } from '@/lib/utils'
import { fmtLongDate, relativeAge } from '@/lib/format-date'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Mail, MessageSquare, Plus, UserPlus } from 'lucide-react'
import { adminGetMembers, adminAssignCoach, adminResendInvite, adminInviteUser } from '@/actions/admin'

type Member = {
  id: string
  authUserId: string
  displayName: string
  email: string
  photoUrl: string | null
  yearOfBirth: number | null
  gender: string | null
  weightLbs: string | null
  assignedCoachId: string | null
  subscriptionStatus: string
  memberVerifiedAt: string | null
  suspendedAt: string | null
  createdAt: string
}

type Coach = { id: string; displayName: string }
type SortKey = 'firstName' | 'created'
type SortDir = 'asc' | 'desc'

function splitName(displayName: string) {
  const parts = displayName.trim().split(' ')
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
}

export function AdminUsers({ coaches, onMessage }: { coaches: Coach[]; onMessage?: (memberId: string) => void }) {
  const [rows, setRows] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [coachFilter, setCoachFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('created')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addCoach, setAddCoach] = useState('')
  const [adding, startAdding] = useTransition()
  const [resendingId, setResendingId] = useState<string | null>(null)

  useEffect(() => {
    adminGetMembers().then((data) => { setRows(data as Member[]); setLoading(false) })
  }, [])

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setSortDir(k === 'created' ? 'desc' : 'asc') }
  }

  const assign = async (memberId: string, coachId: string | null) => {
    setRows((rs) => rs.map((r) => r.id === memberId ? { ...r, assignedCoachId: coachId } : r))
    await adminAssignCoach(memberId, coachId)
  }

  const resendInvite = async (member: Member) => {
    if (!member.email) return
    setResendingId(member.id)
    try { await adminResendInvite(member.email) } finally { setResendingId(null) }
  }

  const handleAddUser = () => {
    if (!addEmail.trim() || !addName.trim()) return
    startAdding(async () => {
      await adminInviteUser(addCoach ? { email: addEmail.trim(), displayName: addName.trim(), coachId: addCoach } : { email: addEmail.trim(), displayName: addName.trim() })
      const data = await adminGetMembers()
      setRows(data as Member[])
      setAddOpen(false)
      setAddName('')
      setAddEmail('')
      setAddCoach('')
    })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let base = rows
    if (coachFilter === '__none__') base = base.filter((r) => !r.assignedCoachId)
    else if (coachFilter !== 'all') base = base.filter((r) => r.assignedCoachId === coachFilter)
    if (q) base = base.filter((r) =>
      (r.displayName ?? '').toLowerCase().includes(q) ||
      (r.email ?? '').toLowerCase().includes(q),
    )
    return [...base].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'created') return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
      return a.displayName.localeCompare(b.displayName) * dir
    })
  }, [rows, query, coachFilter, sortKey, sortDir])

  const selectedMember = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId])

  const SortTh = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th className="px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-left">
      <button type="button" onClick={() => toggleSort(k)} className={cn('flex items-center gap-1 hover:text-foreground', sortKey === k && 'text-foreground')}>
        {children} <span className="text-[9px] opacity-70">{sortKey === k ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  )

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex h-[60px] shrink-0 items-center justify-between px-5 pt-4">
        <div>
          <div className="text-sm font-medium">Users</div>
          <div className="text-[11px] text-muted-foreground">{rows.length} total</div>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[12px] font-medium text-background hover:opacity-90"
        >
          <UserPlus className="h-3.5 w-3.5" /> Add user
        </button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 px-5 pb-3 pt-5 sm:gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-[12px] outline-none placeholder:text-muted-foreground/70 focus:border-foreground/30 sm:w-72 sm:flex-none"
        />
        <select value={coachFilter} onChange={(e) => setCoachFilter(e.target.value)} className="h-8 rounded-md border border-border bg-background px-2 text-[12px] outline-none">
          <option value="all">All coaches</option>
          <option value="__none__">Unassigned</option>
          {coaches.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-5 py-8 text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-8 text-sm text-muted-foreground">No users found.</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="flex flex-col gap-3 px-5 py-3 md:hidden">
              {filtered.map((r) => {
                const { firstName, lastName } = splitName(r.displayName)
                return (
                  <div key={`card-${r.id}`} className="rounded-lg border border-border/60 bg-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                        {r.photoUrl ? <img src={r.photoUrl} alt="" className="h-full w-full object-cover" /> : getInitials(r.displayName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <button type="button" className="block w-full text-left text-sm font-medium hover:underline" onClick={() => setSelectedId(r.id)}>
                          {firstName} {lastName}
                        </button>
                        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{r.email}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">Joined {fmtLongDate(r.createdAt)} · {relativeAge(r.createdAt)}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div className="flex-1">
                        <select
                          value={r.assignedCoachId ?? '__none__'}
                          onChange={(e) => assign(r.id, e.target.value === '__none__' ? null : e.target.value)}
                          className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm outline-none"
                        >
                          <option value="__none__">Unassigned</option>
                          {coaches.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                        </select>
                      </div>
                      <button
                        onClick={() => onMessage?.(r.id)}
                        title="Open conversation"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => resendInvite(r)}
                        disabled={!r.email || resendingId === r.id}
                        className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-[12px] font-medium hover:bg-muted disabled:opacity-40"
                      >
                        <Mail className="h-3 w-3" /> {resendingId === r.id ? 'Sending…' : 'Resend invite'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <table className="hidden w-full text-sm md:table">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b border-border/60 text-left">
                  <SortTh k="firstName">First name</SortTh>
                  <th className="px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-left">Last name</th>
                  <th className="px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-left">Email</th>
                  <SortTh k="created">Signed up</SortTh>
                  <th className="px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-left">Assigned coach</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const { firstName, lastName } = splitName(r.displayName)
                  return (
                    <tr key={r.id} className="border-b border-border/40 transition-colors hover:bg-foreground/[0.03]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                            {r.photoUrl ? <img src={r.photoUrl} alt="" className="h-full w-full object-cover" /> : getInitials(r.displayName)}
                          </div>
                          <button type="button" className="cursor-pointer text-left font-medium hover:underline" onClick={() => setSelectedId(r.id)}>
                            {firstName}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{lastName || '—'}</td>
                      <td className="px-5 py-3 text-[12px] text-muted-foreground">{r.email || '—'}</td>
                      <td className="px-5 py-3">
                        <span>{fmtLongDate(r.createdAt)}</span>
                        <span className="ml-2 text-[11px] text-muted-foreground">{relativeAge(r.createdAt)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={r.assignedCoachId ?? '__none__'}
                          onChange={(e) => assign(r.id, e.target.value === '__none__' ? null : e.target.value)}
                          className="h-8 w-48 rounded-md border border-border bg-background px-2 text-sm outline-none"
                        >
                          <option value="__none__">Unassigned</option>
                          {coaches.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onMessage?.(r.id)}
                            title="Open conversation"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => resendInvite(r)}
                            disabled={!r.email || resendingId === r.id}
                            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] font-medium hover:bg-muted disabled:opacity-40 transition-colors"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            {resendingId === r.id ? 'Sending…' : 'Resend invite'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Profile sheet */}
      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Member profile</SheetTitle>
            <SheetDescription>Account details and activity.</SheetDescription>
          </SheetHeader>
          {selectedMember && (
            <div className="mt-6 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full bg-muted border border-border/60 flex items-center justify-center text-xl font-medium text-muted-foreground">
                  {selectedMember.photoUrl ? <img src={selectedMember.photoUrl} alt="" className="h-full w-full object-cover" /> : getInitials(selectedMember.displayName)}
                </div>
                <div className="min-w-0">
                  <div className="font-serif text-xl leading-tight">{selectedMember.displayName}</div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{selectedMember.email}</div>
                  <div className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{selectedMember.id}</div>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border/60 pt-4 text-sm">
                {[
                  ['Signed up', fmtLongDate(selectedMember.createdAt)],
                  ['Subscription', selectedMember.subscriptionStatus],
                  ['Assigned coach', coaches.find((c) => c.id === selectedMember.assignedCoachId)?.displayName ?? 'Unassigned'],
                  ['Verified', selectedMember.memberVerifiedAt ? fmtLongDate(selectedMember.memberVerifiedAt) : '—'],
                  ['Age', selectedMember.yearOfBirth ? `${new Date().getFullYear() - selectedMember.yearOfBirth} (born ${selectedMember.yearOfBirth})` : '—'],
                  ['Gender', selectedMember.gender ?? '—'],
                  ['Weight', selectedMember.weightLbs ? `${selectedMember.weightLbs} lbs` : '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 truncate text-sm capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add user sheet */}
      <Sheet open={addOpen} onOpenChange={(o) => !o && setAddOpen(false)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Add user</SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Full name</label>
              <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Jane Smith" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} type="email" placeholder="jane@example.com" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Assign coach <span className="font-normal text-muted-foreground">(optional)</span></label>
              <select value={addCoach} onChange={(e) => setAddCoach(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                <option value="">No coach</option>
                {coaches.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
              </select>
            </div>
            <p className="text-[11px] text-muted-foreground">An invite email will be sent to the user with a link to set up their account.</p>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/60 bg-background px-6 py-3">
            <button onClick={() => setAddOpen(false)} disabled={adding} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">Cancel</button>
            <button onClick={handleAddUser} disabled={adding || !addEmail.trim() || !addName.trim()} className="flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" />{adding ? 'Inviting…' : 'Send invite'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
