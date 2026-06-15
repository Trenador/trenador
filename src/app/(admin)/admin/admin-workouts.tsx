'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Plus, Pencil, Trash2, CheckCircle2, Clock } from 'lucide-react'
import { MobileFilterButton, MobileFilterSheet, type FilterSection } from './admin-filter-sheet'
import {
  adminGetWorkouts,
  adminPublishWorkout,
  adminUnpublishWorkout,
  adminCreateWorkout,
  adminUpdateWorkout,
  adminDeleteWorkout,
} from '@/actions/admin'

type Workout = {
  id: string
  title: string
  category: string | null
  level: string | null
  durationMinutes: number | null
  summary: string | null
  coachNotes: string | null
  bannerUrl: string | null
  coachId: string | null
  structure: unknown
  muscleGroups: string[]
  lengthLabel: string | null
  publishedAt: string | null
  createdAt: string
}

type Coach = { id: string; displayName: string; isAuthor?: boolean }

const CATEGORIES = ['Strength', 'Cardio', 'Mobility', 'HIIT', 'Endurance', 'Recovery', 'Sport', 'Other']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

type DraftWorkout = { title: string; category: string; level: string; durationMinutes: number; summary: string; coachNotes: string; coachId: string; structure: object; muscleGroups: string[] }

function emptyDraft(): DraftWorkout {
  return { title: '', category: 'Strength', level: 'Beginner', durationMinutes: 45, summary: '', coachNotes: '', coachId: '', structure: {}, muscleGroups: [] }
}

function StatusPill({ published }: { published: boolean }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
      published ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' : 'border-amber-500/30 bg-amber-500/10 text-amber-600',
    )}>
      {published ? 'Published' : 'Draft'}
    </span>
  )
}

export function AdminWorkouts({ coaches }: { coaches: Coach[] }) {
  const [rows, setRows] = useState<Workout[]>([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [coachFilter, setCoachFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [editing, setEditing] = useState<Workout | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<DraftWorkout>(emptyDraft())
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const data = await adminGetWorkouts()
    setRows(data as Workout[])
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setDraft(emptyDraft()); setEditing(null); setCreating(true) }
  const openEdit = (w: Workout) => {
    setDraft({ title: w.title, category: w.category ?? 'Strength', level: w.level ?? 'Beginner', durationMinutes: w.durationMinutes ?? 45, summary: w.summary ?? '', coachNotes: w.coachNotes ?? '', coachId: w.coachId ?? '', structure: (w.structure as object) ?? {}, muscleGroups: w.muscleGroups ?? [] })
    setEditing(w)
    setCreating(true)
  }

  const save = async () => {
    if (!draft.title.trim()) return
    setSaving(true)
    const { coachId: rawCoach, ...rest } = draft
    const coachIdPayload = rawCoach ? { coachId: rawCoach } : {}
    if (editing) {
      await adminUpdateWorkout(editing.id, { ...rest, ...coachIdPayload, structure: draft.structure as object })
    } else {
      await adminCreateWorkout({ ...rest, ...coachIdPayload, structure: draft.structure as object })
    }
    setSaving(false)
    setCreating(false)
    setEditing(null)
    await load()
  }

  const remove = async (w: Workout) => {
    if (!confirm(`Delete "${w.title}"?`)) return
    await adminDeleteWorkout(w.id)
    await load()
  }

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return rows.filter((w) => {
      if (statusFilter === 'published' && !w.publishedAt) return false
      if (statusFilter === 'draft' && w.publishedAt) return false
      if (categoryFilter !== 'all' && w.category !== categoryFilter) return false
      if (coachFilter !== 'all' && w.coachId !== coachFilter) return false
      if (q && !w.title.toLowerCase().includes(q) && !(w.category ?? '').toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, statusFilter, categoryFilter, coachFilter, searchQuery])

  const filterSections: FilterSection[] = [
    { label: 'Status', value: statusFilter, defaultValue: 'all', setValue: (v) => setStatusFilter(v as 'all' | 'draft' | 'published'), options: [{ value: 'all', label: 'All' }, { value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }] },
    { label: 'Category', value: categoryFilter, defaultValue: 'all', setValue: setCategoryFilter, options: [{ value: 'all', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))] },
    { label: 'Coach', value: coachFilter, defaultValue: 'all', setValue: setCoachFilter, options: [{ value: 'all', label: 'All coaches' }, ...coaches.map((c) => ({ value: c.id, label: c.displayName }))] },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[60px] shrink-0 items-center justify-between px-5 pt-4">
        <div>
          <div className="text-sm font-medium">Workouts</div>
          <div className="text-[11px] text-muted-foreground">
            {rows.filter((w) => !w.publishedAt).length} drafts · {rows.filter((w) => !!w.publishedAt).length} published
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 px-5 pb-3 pt-5">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-[12px] outline-none placeholder:text-muted-foreground/70 focus:border-foreground/30 sm:w-[220px] sm:flex-none"
        />
        <div className="hidden items-center gap-2 sm:flex">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'published')} className="h-8 rounded-md border border-border bg-background px-2 text-[12px] outline-none">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-8 rounded-md border border-border bg-background px-2 text-[12px] outline-none">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={coachFilter} onChange={(e) => setCoachFilter(e.target.value)} className="h-8 rounded-md border border-border bg-background px-2 text-[12px] outline-none">
            <option value="all">All coaches</option>
            {coaches.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
          </select>
        </div>
        <MobileFilterButton sections={filterSections} onOpen={() => setMobileFilterOpen(true)} />
        <button onClick={openCreate} className="ml-auto hidden items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-[12px] font-medium text-background hover:opacity-90 sm:flex">
          <Plus className="h-3.5 w-3.5" /> New workout
        </button>
      </div>
      <div className="flex shrink-0 justify-end px-5 pb-3 sm:hidden">
        <button onClick={openCreate} className="flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-[12px] font-medium text-background hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> New workout
        </button>
      </div>
      <MobileFilterSheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen} sections={filterSections} resultCount={filtered.length} resultLabel="workouts" />

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="mx-5 my-3 rounded-lg border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">No workouts match the current filters.</div>
        ) : (
          <>
            {/* Mobile */}
            <div className="flex flex-col gap-3 px-5 py-3 md:hidden">
              {filtered.map((w) => (
                <div key={`card-${w.id}`} className="rounded-lg border border-border/60 bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{w.title}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{w.category} · {w.level} · {w.durationMinutes ? `${w.durationMinutes}min` : '—'}</div>
                    </div>
                    <StatusPill published={!!w.publishedAt} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5">
                    {!w.publishedAt ? (
                      <button onClick={() => adminPublishWorkout(w.id).then(load)} className="flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1 text-[12px] font-medium text-background hover:opacity-90">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Publish
                      </button>
                    ) : (
                      <button onClick={() => adminUnpublishWorkout(w.id).then(load)} className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium hover:bg-muted">
                        <Clock className="h-3.5 w-3.5" /> Unpublish
                      </button>
                    )}
                    <button onClick={() => openEdit(w)} className="rounded-md p-1.5 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(w)} className="rounded-md p-1.5 hover:bg-muted"><Trash2 className="h-4 w-4 text-destructive" /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop */}
            <table className="hidden w-full text-sm md:table">
              <thead className="sticky top-0 z-10 bg-background font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="px-5 py-2.5 text-left">Title</th>
                  <th className="px-5 py-2.5 text-left">Status</th>
                  <th className="px-5 py-2.5 text-left">Category</th>
                  <th className="px-5 py-2.5 text-left">Level</th>
                  <th className="px-5 py-2.5 text-left">Duration</th>
                  <th className="px-5 py-2.5 text-left">Coach</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => {
                  const coach = coaches.find((c) => c.id === w.coachId)
                  return (
                    <tr key={w.id} className="border-b border-border/40 text-sm">
                      <td className="px-5 py-3 font-medium">{w.title}</td>
                      <td className="px-5 py-3"><StatusPill published={!!w.publishedAt} /></td>
                      <td className="px-5 py-3 text-muted-foreground">{w.category ?? '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground">{w.level ?? '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground">{w.durationMinutes ? `${w.durationMinutes}min` : '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground">{coach?.displayName ?? '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex shrink-0 items-center justify-end gap-1">
                          {!w.publishedAt ? (
                            <button onClick={() => adminPublishWorkout(w.id).then(load)} className="flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1 text-[12px] font-medium text-background hover:opacity-90">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Publish
                            </button>
                          ) : (
                            <button onClick={() => adminUnpublishWorkout(w.id).then(load)} className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium hover:bg-muted">
                              <Clock className="h-3.5 w-3.5" /> Unpublish
                            </button>
                          )}
                          <button onClick={() => openEdit(w)} className="rounded-md p-1.5 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => remove(w)} className="rounded-md p-1.5 hover:bg-muted"><Trash2 className="h-4 w-4 text-destructive" /></button>
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

      {/* Edit / Create sheet */}
      <Sheet open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-xl">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>{editing ? 'Edit workout' : 'New workout'}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title</label>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category</label>
                <select value={draft.category ?? ''} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Level</label>
                <select value={draft.level ?? ''} onChange={(e) => setDraft({ ...draft, level: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Duration (min)</label>
                <input type="number" min={5} max={240} value={draft.durationMinutes} onChange={(e) => setDraft({ ...draft, durationMinutes: Number(e.target.value) || 45 })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Coach</label>
                <select value={draft.coachId || '__none__'} onChange={(e) => setDraft({ ...draft, coachId: e.target.value === '__none__' ? '' : e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                  <option value="__none__">No coach</option>
                  {coaches.filter((c) => c.isAuthor).map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Summary</label>
              <textarea rows={3} value={draft.summary ?? ''} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Coach notes</label>
              <textarea rows={3} value={draft.coachNotes ?? ''} onChange={(e) => setDraft({ ...draft, coachNotes: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/60 bg-background px-6 py-3">
            <button onClick={() => setCreating(false)} disabled={saving} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">Cancel</button>
            <button onClick={save} disabled={saving || !draft.title.trim()} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create draft'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
