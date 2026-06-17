'use client'

import { useEffect, useMemo, useState } from 'react'
import { cn, getInitials } from '@/lib/utils'
import { fmtLongDate, relativeAge } from '@/lib/format-date'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { adminGetMembers, adminAssignCoach } from '@/actions/admin'

type Member = {
  id: string
  displayName: string
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
type SortKey = 'name' | 'created'
type SortDir = 'asc' | 'desc'


export function AdminUsers({ coaches }: { coaches: Coach[] }) {
  const [rows, setRows] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [coachFilter, setCoachFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('created')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedId, setSelectedId] = useState<string | null>(null)

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let base = rows
    if (coachFilter === '__none__') base = base.filter((r) => !r.assignedCoachId)
    else if (coachFilter !== 'all') base = base.filter((r) => r.assignedCoachId === coachFilter)
    if (q) base = base.filter((r) => (r.displayName ?? '').toLowerCase().includes(q))
    return [...base].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'created') return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
      return a.displayName.localeCompare(b.displayName) * dir
    })
  }, [rows, query, coachFilter, sortKey, sortDir])

  const selectedMember = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId])

  const SortTh = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th className="px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
              {filtered.map((r) => (
                <div key={`card-${r.id}`} className="rounded-lg border border-border/60 bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                      {r.photoUrl ? <img src={r.photoUrl} alt="" className="h-full w-full object-cover" /> : getInitials(r.displayName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <button type="button" className="block w-full text-left text-sm font-medium hover:underline" onClick={() => setSelectedId(r.id)}>
                        {r.displayName}
                      </button>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">Joined {fmtLongDate(r.createdAt)} · {relativeAge(r.createdAt)}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Assigned coach</div>
                    <select
                      value={r.assignedCoachId ?? '__none__'}
                      onChange={(e) => assign(r.id, e.target.value === '__none__' ? null : e.target.value)}
                      className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm outline-none"
                    >
                      <option value="__none__">Unassigned</option>
                      {coaches.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <table className="hidden w-full text-sm md:table">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b border-border/60 text-left">
                  <SortTh k="name">Name</SortTh>
                  <SortTh k="created">Signed up</SortTh>
                  <th className="px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-left">Status</th>
                  <th className="px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-left">Assigned coach</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/40 transition-colors hover:bg-foreground/[0.03]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                          {r.photoUrl ? <img src={r.photoUrl} alt="" className="h-full w-full object-cover" /> : getInitials(r.displayName)}
                        </div>
                        <button type="button" className="cursor-pointer text-left font-medium hover:underline" onClick={() => setSelectedId(r.id)}>
                          {r.displayName}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span>{fmtLongDate(r.createdAt)}</span>
                      <span className="ml-2 text-[11px] text-muted-foreground">{relativeAge(r.createdAt)}</span>
                    </td>
                    <td className="px-5 py-3">
                      {r.subscriptionStatus === 'active' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="text-[11px] capitalize text-muted-foreground">{r.subscriptionStatus}</span>
                      )}
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
                  </tr>
                ))}
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
    </div>
  )
}
