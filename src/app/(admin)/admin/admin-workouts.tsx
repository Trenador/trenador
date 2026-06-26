'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CheckCircle2, Clock, ImageIcon, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { MobileFilterButton, MobileFilterSheet, type FilterSection } from './admin-filter-sheet'
import {
  adminGetWorkouts,
  adminPublishWorkout,
  adminUnpublishWorkout,
  adminCreateWorkout,
  adminUpdateWorkout,
  adminDeleteWorkout,
  adminUploadWorkoutBanner,
} from '@/actions/admin'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────────────────────

type WorkoutBlock = { name: string; detail: string; aiNotes?: string; videoUrl?: string }
type WorkoutDay = { label: string; blocks: WorkoutBlock[] }
type WorkoutWeek = { label: string; days: WorkoutDay[] }

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

type DraftWorkout = {
  title: string
  category: string
  level: string
  durationMinutes: number
  summary: string
  coachNotes: string
  coachId: string
  bannerUrl: string
  tags: string
  weeks: WorkoutWeek[]
}

function emptyDraft(): DraftWorkout {
  return {
    title: '',
    category: 'Strength',
    level: 'Beginner',
    durationMinutes: 45,
    summary: '',
    coachNotes: '',
    coachId: '',
    bannerUrl: '',
    tags: '',
    weeks: [{ label: 'Week 1', days: [{ label: 'Day 1', blocks: [{ name: '', detail: '' }] }] }],
  }
}

function getWeeks(w: Workout): WorkoutWeek[] {
  const s = w.structure as { weeks?: WorkoutWeek[] } | null
  if (s?.weeks?.length) return s.weeks
  return [{ label: 'Week 1', days: [{ label: 'Day 1', blocks: [{ name: '', detail: '' }] }] }]
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

// ─── Component ───────────────────────────────────────────────────────────────

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
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingVideos, setUploadingVideos] = useState<Set<string>>(new Set())
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const data = await adminGetWorkouts()
    setRows(data as Workout[])
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setDraft(emptyDraft()); setEditing(null); setCreating(true) }

  const openEdit = (w: Workout) => {
    setDraft({
      title: w.title,
      category: w.category ?? 'Strength',
      level: w.level ?? 'Beginner',
      durationMinutes: w.durationMinutes ?? 45,
      summary: w.summary ?? '',
      coachNotes: w.coachNotes ?? '',
      coachId: w.coachId ?? '',
      bannerUrl: w.bannerUrl ?? '',
      tags: (w.muscleGroups ?? []).join(', '),
      weeks: getWeeks(w),
    })
    setEditing(w)
    setCreating(true)
  }

  // ─── Week/day/block mutations ─────────────────────────────────────────────

  const mutWeeks = (fn: (weeks: WorkoutWeek[]) => WorkoutWeek[]) =>
    setDraft((d) => ({ ...d, weeks: fn(d.weeks.map((w) => ({ ...w, days: w.days.map((day) => ({ ...day, blocks: [...day.blocks] })) }))) }))

  const addWeek = () => mutWeeks((ws) => [...ws, { label: `Week ${ws.length + 1}`, days: [{ label: 'Day 1', blocks: [{ name: '', detail: '' }] }] }])
  const removeWeek = (wi: number) => mutWeeks((ws) => ws.length === 1 ? ws : ws.filter((_, i) => i !== wi))
  const setWeekLabel = (wi: number, label: string) => mutWeeks((ws) => ws.map((w, i) => i === wi ? { ...w, label } : w))

  const addDay = (wi: number) => mutWeeks((ws) => ws.map((w, i) => i === wi ? { ...w, days: [...w.days, { label: `Day ${w.days.length + 1}`, blocks: [{ name: '', detail: '' }] }] } : w))
  const removeDay = (wi: number, di: number) => mutWeeks((ws) => ws.map((w, i) => i === wi ? { ...w, days: w.days.length === 1 ? w.days : w.days.filter((_, j) => j !== di) } : w))
  const setDayLabel = (wi: number, di: number, label: string) => mutWeeks((ws) => ws.map((w, i) => i === wi ? { ...w, days: w.days.map((d, j) => j === di ? { ...d, label } : d) } : w))

  const addBlock = (wi: number, di: number) => mutWeeks((ws) => ws.map((w, i) => i === wi ? { ...w, days: w.days.map((d, j) => j === di ? { ...d, blocks: [...d.blocks, { name: '', detail: '' }] } : d) } : w))
  const removeBlock = (wi: number, di: number, bi: number) => mutWeeks((ws) => ws.map((w, i) => i === wi ? { ...w, days: w.days.map((d, j) => j === di ? { ...d, blocks: d.blocks.filter((_, k) => k !== bi) } : d) } : w))
  const patchBlock = (wi: number, di: number, bi: number, patch: Partial<WorkoutBlock>) =>
    mutWeeks((ws) => ws.map((w, i) => i === wi ? { ...w, days: w.days.map((d, j) => j === di ? { ...d, blocks: d.blocks.map((b, k) => k === bi ? { ...b, ...patch } : b) } : d) } : w))
  const removeBlockVideo = (wi: number, di: number, bi: number) =>
    mutWeeks((ws) => ws.map((w, i) => i === wi ? { ...w, days: w.days.map((d, j) => j === di ? { ...d, blocks: d.blocks.map((b, k) => { if (k !== bi) return b; const { videoUrl: _v, ...rest } = b; return rest }) } : d) } : w))

  // ─── Save ─────────────────────────────────────────────────────────────────

  const save = async () => {
    if (!draft.title.trim()) return
    setSaving(true)
    const cleanWeeks = draft.weeks.map((w) => ({
      ...w,
      days: w.days.map((d) => ({ ...d, blocks: d.blocks.filter((b) => b.name.trim() || b.detail.trim()) })),
    }))
    const payload = {
      title: draft.title,
      category: draft.category,
      level: draft.level,
      durationMinutes: draft.durationMinutes,
      summary: draft.summary,
      coachNotes: draft.coachNotes,
      structure: { weeks: cleanWeeks } as object,
      muscleGroups: draft.tags.split(',').map((t) => t.trim()).filter(Boolean),
    }
    const coachSpread = draft.coachId ? { coachId: draft.coachId } : {}
    const bannerSpread = draft.bannerUrl ? { bannerUrl: draft.bannerUrl } : {}
    const finalPayload = { ...payload, ...coachSpread, ...bannerSpread }
    if (editing) {
      await adminUpdateWorkout(editing.id, finalPayload)
    } else {
      await adminCreateWorkout(finalPayload)
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

  // ─── Banner upload ────────────────────────────────────────────────────────

  const handleBannerFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10 MB'); return }
    setUploadingBanner(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const url = await adminUploadWorkoutBanner(fd)
      setDraft((d) => ({ ...d, bannerUrl: url }))
    } finally {
      setUploadingBanner(false)
      if (bannerInputRef.current) bannerInputRef.current.value = ''
    }
  }

  // ─── Video upload (client-side directly to Supabase) ──────────────────────

  const handleVideoFile = async (wi: number, di: number, bi: number, file: File) => {
    if (!file.type.startsWith('video/')) return
    if (file.size > 500 * 1024 * 1024) { alert('Video must be under 500 MB'); return }
    const key = `${wi}:${di}:${bi}`
    setUploadingVideos((s) => new Set(s).add(key))
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'mp4'
      const path = `block-${Date.now()}-${wi}-${di}-${bi}.${ext}`
      const { error } = await supabase.storage.from('workout-videos').upload(path, file, { contentType: file.type, upsert: false })
      if (error) throw error
      const { data } = supabase.storage.from('workout-videos').getPublicUrl(path)
      patchBlock(wi, di, bi, { videoUrl: data.publicUrl })
    } catch (e: unknown) {
      alert((e as Error)?.message ?? 'Upload failed')
    } finally {
      setUploadingVideos((s) => { const n = new Set(s); n.delete(key); return n })
    }
  }

  // ─── Filtering ────────────────────────────────────────────────────────────

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
    { label: 'Function', value: categoryFilter, defaultValue: 'all', setValue: setCategoryFilter, options: [{ value: 'all', label: 'All functions' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))] },
    { label: 'Coach', value: coachFilter, defaultValue: 'all', setValue: setCoachFilter, options: [{ value: 'all', label: 'All coaches' }, ...coaches.map((c) => ({ value: c.id, label: c.displayName }))] },
  ]

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-[60px] shrink-0 items-center justify-between px-5 pt-4">
        <div>
          <div className="text-sm font-medium">Workouts</div>
          <div className="text-[11px] text-muted-foreground">
            {rows.filter((w) => !w.publishedAt).length} pending · {rows.filter((w) => !!w.publishedAt).length} visible to users
          </div>
        </div>
      </div>

      {/* Filter bar */}
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
            <option value="all">All functions</option>
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

      {/* List */}
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

            {/* Desktop table */}
            <table className="hidden w-full text-sm md:table">
              <thead className="sticky top-0 z-10 bg-background font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="px-5 py-2.5 text-left">Title</th>
                  <th className="px-5 py-2.5 text-left">Status</th>
                  <th className="px-5 py-2.5 text-left">Function</th>
                  <th className="px-5 py-2.5 text-left">Level</th>
                  <th className="px-5 py-2.5 text-left">Duration</th>
                  <th className="px-5 py-2.5 text-left">Author</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => {
                  const coach = coaches.find((c) => c.id === w.coachId)
                  return (
                    <tr key={w.id} className="border-b border-border/40 text-sm">
                      <td className="px-5 py-3">
                        <div className="font-medium">{w.title}</div>
                      </td>
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

      {/* ── Full-page editor ────────────────────────────────────────────────── */}
      <Sheet open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <SheetContent side="right" className="flex w-screen flex-col gap-0 overflow-hidden p-0 sm:max-w-none">

          {/* Banner hero */}
          <div className="relative h-52 shrink-0 overflow-hidden border-b border-border/60 bg-muted">
            {draft.bannerUrl ? (
              <>
                <img src={draft.bannerUrl} alt="" className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-10 w-10" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-6 pb-4">
              <div className="min-w-0">
                <div className={cn('text-[10px] font-semibold uppercase tracking-wider', draft.bannerUrl ? 'text-white/80' : 'text-muted-foreground')}>
                  {editing ? 'Edit workout' : 'New workout'}
                </div>
                <SheetHeader className="space-y-0">
                  <SheetTitle className={cn('truncate text-2xl', draft.bannerUrl && '!text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]')}>
                    {draft.title || 'Untitled workout'}
                  </SheetTitle>
                </SheetHeader>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleBannerFile(f) }} />
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="flex items-center gap-1.5 rounded-md bg-black/40 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur hover:bg-black/60 disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingBanner ? 'Uploading…' : draft.bannerUrl ? 'Replace banner' : 'Upload banner'}
                </button>
                {draft.bannerUrl && (
                  <button type="button" onClick={() => setDraft((d) => ({ ...d, bannerUrl: '' }))} className="flex items-center gap-1 rounded-md bg-black/40 px-2.5 py-1.5 text-[12px] font-medium text-white backdrop-blur hover:bg-black/60">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Body: two-column */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-6 lg:grid-cols-[320px_minmax(0,1fr)]">

              {/* Left: metadata */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Title</label>
                  <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Category</label>
                    <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Level</label>
                    <select value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
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
                  <label className="text-sm font-medium">Tags <span className="font-normal text-muted-foreground">(comma-separated)</span></label>
                  <input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Summary</label>
                  <textarea rows={4} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Coach notes</label>
                  <textarea rows={3} value={draft.coachNotes} onChange={(e) => setDraft({ ...draft, coachNotes: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>

              {/* Right: program structure */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Program structure</div>
                    <div className="text-[11px] text-muted-foreground">Organize blocks by week and day.</div>
                  </div>
                  <button type="button" onClick={addWeek} className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[12px] font-medium hover:bg-muted">
                    <Plus className="h-3.5 w-3.5" /> Add week
                  </button>
                </div>

                <div className="space-y-4">
                  {draft.weeks.map((week, wi) => (
                    <div key={wi} className="rounded-lg border border-border/60 bg-card/40">
                      {/* Week header */}
                      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
                        <input value={week.label} onChange={(e) => setWeekLabel(wi, e.target.value)} className="h-8 max-w-xs rounded-md border border-input bg-background px-2 text-sm font-medium outline-none focus:ring-1 focus:ring-ring" />
                        <div className="ml-auto flex items-center gap-1">
                          <button type="button" onClick={() => addDay(wi)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground">
                            <Plus className="h-3 w-3" /> Add day
                          </button>
                          {draft.weeks.length > 1 && (
                            <button type="button" onClick={() => removeWeek(wi)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 p-3">
                        {week.days.map((day, di) => (
                          <div key={di} className="rounded-md border border-border/60 bg-background">
                            {/* Day header */}
                            <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
                              <input value={day.label} onChange={(e) => setDayLabel(wi, di, e.target.value)} className="h-8 max-w-xs rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring" />
                              <div className="ml-auto flex items-center gap-1">
                                <button type="button" onClick={() => addBlock(wi, di)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground">
                                  <Plus className="h-3 w-3" /> Add block
                                </button>
                                {week.days.length > 1 && (
                                  <button type="button" onClick={() => removeDay(wi, di)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2 p-3">
                              {day.blocks.length === 0 && (
                                <div className="rounded-md border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">No blocks yet.</div>
                              )}
                              {day.blocks.map((block, bi) => (
                                <div key={bi} className="rounded-md border border-border/60 p-2">
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 space-y-1.5">
                                      <input
                                        value={block.name}
                                        onChange={(e) => patchBlock(wi, di, bi, { name: e.target.value })}
                                        placeholder="Exercise name"
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                                      />
                                      <textarea
                                        rows={2}
                                        value={block.detail}
                                        onChange={(e) => patchBlock(wi, di, bi, { detail: e.target.value })}
                                        placeholder="Sets, reps, cues…"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                                      />
                                      {/* AI Notes */}
                                      <div className="space-y-1">
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI Notes</div>
                                        <textarea
                                          rows={2}
                                          value={block.aiNotes ?? ''}
                                          onChange={(e) => patchBlock(wi, di, bi, { aiNotes: e.target.value })}
                                          placeholder="Training context for the AI (cues, intent, regressions)…"
                                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                                        />
                                      </div>
                                      {/* Demo video */}
                                      <div className="space-y-1">
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Demo video</div>
                                        {block.videoUrl ? (
                                          <div className="space-y-1.5">
                                            <video src={block.videoUrl} controls preload="metadata" className="max-h-40 w-full rounded border border-border/60 bg-black" />
                                            <div className="flex gap-1.5">
                                              <button type="button" onClick={() => removeBlockVideo(wi, di, bi)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-destructive">
                                                <Trash2 className="h-3 w-3" /> Remove
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground hover:bg-foreground/[0.04]">
                                            <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoFile(wi, di, bi, f); e.target.value = '' }} />
                                            <Upload className="h-3.5 w-3.5" />
                                            {uploadingVideos.has(`${wi}:${di}:${bi}`) ? 'Uploading…' : 'Upload demo video (max 100 MB)'}
                                          </label>
                                        )}
                                      </div>
                                    </div>
                                    <button type="button" onClick={() => removeBlock(wi, di, bi)} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/60 bg-background px-6 py-3">
            <button onClick={() => setCreating(false)} disabled={saving} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">Cancel</button>
            <button onClick={save} disabled={saving || !draft.title.trim()} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Save' : 'Create draft'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
