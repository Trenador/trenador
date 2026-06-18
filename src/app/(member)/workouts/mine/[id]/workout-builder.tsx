'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, ChevronDown, Copy, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  updateMyWorkoutStructureAction,
  updateMyWorkoutAction,
  deleteMyWorkoutAction,
} from '@/actions/workouts'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

// --- Types ---
export type SetRow = { reps: string; weight: string }
export type WorkoutBlock = { name: string; detail: string; deleted?: boolean; setRows?: SetRow[] }
export type WorkoutDay = { label: string; blocks: WorkoutBlock[] }
export type WorkoutWeek = { label: string; days: WorkoutDay[] }
export type WorkoutStructure = { weeks: WorkoutWeek[] }

type Workout = {
  id: string
  title: string
  category: string | null
  sourceWorkoutId: string | null
  structure: unknown
}

const CATEGORY_IMAGE: Record<string, string> = {
  Strength: '/assets/workout-strength.jpg',
  Hypertrophy: '/assets/workout-hypertrophy.jpg',
  Cardio: '/assets/workout-cardio.jpg',
  Mobility: '/assets/workout-mobility.jpg',
}
const CATEGORY_BANNER: Record<string, string> = {
  Strength: 'bg-[linear-gradient(135deg,#4a2a1c_0%,#2a1610_100%)]',
  Hypertrophy: 'bg-[linear-gradient(135deg,#4a1f2a_0%,#2a1018_100%)]',
  Cardio: 'bg-[linear-gradient(135deg,#1e3a2a_0%,#0f1f17_100%)]',
  Mobility: 'bg-[linear-gradient(135deg,#2e2a4a_0%,#171528_100%)]',
}
const CATEGORIES = ['Strength', 'Hypertrophy', 'Cardio', 'Mobility'] as const

// --- localStorage helpers ---
const LS_COMPLETED = 'workouts:completed'
const LS_DAYS_DONE = 'workouts:daysDone'

function lsRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}
function lsWrite(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

function useBlockCompletion(workoutId: string) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  useEffect(() => {
    const all = lsRead<Record<string, Record<string, boolean>>>(LS_COMPLETED, {})
    setCompleted(all[workoutId] ?? {})
  }, [workoutId])

  const toggle = (wi: number, di: number, bi: number) => {
    const k = `w${wi}-d${di}-b${bi}`
    setCompleted(prev => {
      const next = { ...prev, [k]: !prev[k] }
      const all = lsRead<Record<string, Record<string, boolean>>>(LS_COMPLETED, {})
      lsWrite(LS_COMPLETED, { ...all, [workoutId]: next })
      return next
    })
  }
  const isCompleted = (wi: number, di: number, bi: number) =>
    completed[`w${wi}-d${di}-b${bi}`] ?? false

  return { isCompleted, toggle }
}

function useDaysDone(workoutId: string) {
  const [daysDone, setDaysDone] = useState<Record<string, boolean>>({})
  useEffect(() => {
    const all = lsRead<Record<string, Record<string, boolean>>>(LS_DAYS_DONE, {})
    setDaysDone(all[workoutId] ?? {})
  }, [workoutId])

  const isDayDone = (wi: number, di: number) => daysDone[`w${wi}-d${di}`] ?? false
  const setDayDone = (wi: number, di: number, done: boolean) => {
    const k = `w${wi}-d${di}`
    setDaysDone(prev => {
      const next = { ...prev, [k]: done }
      const all = lsRead<Record<string, Record<string, boolean>>>(LS_DAYS_DONE, {})
      lsWrite(LS_DAYS_DONE, { ...all, [workoutId]: next })
      return next
    })
  }

  return { isDayDone, setDayDone }
}

function countDaysDoneTotal(workoutId: string, weeks: WorkoutWeek[]) {
  const all = lsRead<Record<string, Record<string, boolean>>>(LS_DAYS_DONE, {})
  const map = all[workoutId] ?? {}
  let count = 0
  weeks.forEach((w, wi) => w.days.forEach((_, di) => { if (map[`w${wi}-d${di}`]) count++ }))
  return count
}

function totalDays(weeks: WorkoutWeek[]) {
  return weeks.reduce((sum, w) => sum + w.days.length, 0)
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

// --- AddBlockSheet ---
function AddBlockSheet({
  open, onOpenChange, onAdd,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAdd: (block: WorkoutBlock) => void
}) {
  const [name, setName] = useState('')
  const [detail, setDetail] = useState('')
  const [rows, setRows] = useState<SetRow[]>([])

  useEffect(() => {
    if (open) { setName(''); setDetail(''); setRows([]) }
  }, [open])

  function handleSave() {
    if (!name.trim()) return
    onAdd({
      name: name.trim().slice(0, 120),
      detail: detail.trim().slice(0, 600),
      ...(rows.length ? { setRows: rows } : {}),
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[75vh] w-full flex-col gap-0 rounded-t-2xl p-0">
        <SheetHeader className="border-b border-border/60 px-5 py-4 text-left">
          <SheetTitle>Add block</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Exercise name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              maxLength={120}
              placeholder="e.g. Goblet Squat"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={detail}
              onChange={e => setDetail(e.target.value)}
              maxLength={600}
              rows={3}
              placeholder="Sets, reps, tempo, cues…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sets</label>
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="label-mono w-10 shrink-0 text-[11px] normal-case tracking-[1px] text-muted-foreground">SET {i + 1}</span>
                <input
                  placeholder="reps"
                  value={row.reps}
                  onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, reps: e.target.value } : x))}
                  className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none"
                />
                <input
                  placeholder="weight"
                  value={row.weight}
                  onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, weight: e.target.value } : x))}
                  className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setRows(r => r.filter((_, j) => j !== i))}
                  className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRows(r => [...r, { reps: '', weight: '' }])}
              className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-border/70 px-2.5 py-2 text-[12px] text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Add set
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end border-t border-border/60 px-5 py-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="h-4 w-4" /> Save
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// --- EditWorkoutSheet ---
function EditWorkoutSheet({
  open, onOpenChange, workout, onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  workout: Workout
  onSave: (title: string, category: string) => void
}) {
  const [title, setTitle] = useState(workout.title)
  const [category, setCategory] = useState(workout.category ?? 'Strength')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open) { setTitle(workout.title); setCategory(workout.category ?? 'Strength') }
  }, [open, workout])

  function handleSave() {
    const t = title.trim()
    if (!t) return
    startTransition(async () => {
      await updateMyWorkoutAction(workout.id, { title: t, category })
      onSave(t, category)
      onOpenChange(false)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex h-full w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border/60 px-5 py-4 text-left">
          <SheetTitle>Edit workout</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={120}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end border-t border-border/60 px-5 py-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || isPending}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition hover:opacity-90 disabled:opacity-40"
          >
            <Check className="h-4 w-4" /> {isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// --- BlockItem ---
function BlockItem({
  block, wi, di, bi,
  completed, onToggle,
  onDelete, onEdit,
  showActions,
}: {
  block: WorkoutBlock
  wi: number; di: number; bi: number
  completed: boolean
  onToggle: () => void
  onDelete: () => void
  onEdit: (updated: WorkoutBlock) => void
  showActions: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(block.name)
  const [detail, setDetail] = useState(block.detail)
  const [rows, setRows] = useState<SetRow[]>(block.setRows ?? [])

  useEffect(() => {
    if (!editing) { setName(block.name); setDetail(block.detail); setRows(block.setRows ?? []) }
  }, [block, editing])

  function saveEdit() {
    onEdit({ ...block, name: name.trim() || block.name, detail: detail.trim(), ...(rows.length ? { setRows: rows } : {}) })
    setEditing(false)
  }

  const id = `block-w${wi}-d${di}-b${bi}`

  if (editing) {
    return (
      <div id={id} className="border-t border-border/40 px-4 py-4">
        <div className="space-y-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={120}
            autoFocus
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          <textarea
            value={detail}
            onChange={e => setDetail(e.target.value)}
            maxLength={600}
            rows={2}
            placeholder="Notes…"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="label-mono w-10 shrink-0 text-[11px] normal-case tracking-[1px] text-muted-foreground">SET {i + 1}</span>
                <input
                  placeholder="reps"
                  value={row.reps}
                  onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, reps: e.target.value } : x))}
                  className="h-7 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none"
                />
                <input
                  placeholder="weight"
                  value={row.weight}
                  onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, weight: e.target.value } : x))}
                  className="h-7 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none"
                />
                <button type="button" onClick={() => setRows(r => r.filter((_, j) => j !== i))} className="shrink-0 text-muted-foreground hover:text-red-500">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRows(r => [...r, { reps: '', weight: '' }])}
              className="text-[12px] text-muted-foreground hover:text-foreground"
            >
              + Add set
            </button>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={saveEdit} className="inline-flex h-8 items-center gap-1 rounded-full bg-foreground px-3 text-[12px] font-medium text-background hover:opacity-90">
              <Check className="h-3 w-3" /> Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-[12px] text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id={id} className={cn('group flex items-start gap-3 border-t border-border/40 px-4 py-3', completed && 'opacity-60')}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition',
          completed ? 'border-foreground bg-foreground text-background' : 'border-border/60 text-transparent hover:border-foreground/40',
        )}
      >
        <Check className="h-3 w-3" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('text-[14px] font-medium leading-snug', completed && 'line-through')}>{block.name}</p>
        {block.detail && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{block.detail}</p>}
        {block.setRows && block.setRows.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {block.setRows.map((row, i) => (
              <span key={i} className="label-mono rounded-full border border-border/60 px-2 py-0.5 text-[11px] normal-case tracking-[0.08em] text-muted-foreground">
                {[row.reps && `${row.reps} reps`, row.weight && `@ ${row.weight}`].filter(Boolean).join(' ')}
              </span>
            ))}
          </div>
        )}
      </div>
      {showActions && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button type="button" onClick={() => setEditing(true)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onDelete} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// --- Main Component ---
export function MyWorkoutClient({ workout }: { workout: Workout }) {
  const router = useRouter()
  const raw = (workout.structure ?? {}) as { weeks?: WorkoutWeek[] }
  const [structure, setStructure] = useState<WorkoutStructure>({
    weeks: raw.weeks?.length ? raw.weeks : [{ label: 'Week 1', days: [{ label: 'Day 1', blocks: [] }] }],
  })
  const [title, setTitle] = useState(workout.title)
  const [category, setCategory] = useState(workout.category ?? '')
  const [openWeek, setOpenWeek] = useState<number>(0)
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [addBlockTarget, setAddBlockTarget] = useState<{ wi: number; di: number } | null>(null)
  const [, startTransition] = useTransition()

  const { isCompleted, toggle } = useBlockCompletion(workout.id)
  const { isDayDone, setDayDone } = useDaysDone(workout.id)

  const weeks = structure.weeks
  const done = countDaysDoneTotal(workout.id, weeks)
  const total = totalDays(weeks)

  const cat = category || ''
  const bannerClass = CATEGORY_BANNER[cat] ?? 'bg-foreground/80'
  const img = CATEGORY_IMAGE[cat]

  function saveStructure(next: WorkoutStructure) {
    setStructure(next)
    startTransition(async () => {
      await updateMyWorkoutStructureAction(workout.id, next as unknown as Record<string, unknown>)
    })
  }

  function deleteBlock(wi: number, di: number, bi: number) {
    const next = clone(structure)
    next.weeks[wi]!.days[di]!.blocks.splice(bi, 1)
    saveStructure(next)
  }

  function editBlock(wi: number, di: number, bi: number, updated: WorkoutBlock) {
    const next = clone(structure)
    next.weeks[wi]!.days[di]!.blocks[bi] = updated
    saveStructure(next)
  }

  function addBlock(wi: number, di: number, block: WorkoutBlock) {
    const next = clone(structure)
    next.weeks[wi]!.days[di]!.blocks.push(block)
    saveStructure(next)
  }

  function duplicateDay(wi: number, di: number) {
    const next = clone(structure)
    const w = next.weeks[wi]!
    const day = clone(w.days[di]!)
    day.label = `Day ${w.days.length + 1}`
    w.days.splice(di + 1, 0, day)
    saveStructure(next)
  }

  function deleteDay(wi: number, di: number) {
    if (weeks[wi]!.days.length <= 1) return
    const next = clone(structure)
    next.weeks[wi]!.days.splice(di, 1)
    saveStructure(next)
  }

  function addDay(wi: number) {
    const next = clone(structure)
    const w = next.weeks[wi]!
    w.days.push({ label: `Day ${w.days.length + 1}`, blocks: [] })
    saveStructure(next)
    setOpenDay(`w${wi}-d${w.days.length - 1}`)
  }

  function addWeek() {
    const next = clone(structure)
    next.weeks.push({ label: `Week ${next.weeks.length + 1}`, days: [{ label: 'Day 1', blocks: [] }] })
    saveStructure(next)
    setOpenWeek(next.weeks.length - 1)
  }

  function deleteWeek(wi: number) {
    if (weeks.length <= 1) return
    const next = clone(structure)
    next.weeks.splice(wi, 1)
    saveStructure(next)
    setOpenWeek(Math.min(wi, next.weeks.length - 1))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background">

      {/* Hero */}
      <div className={cn('relative h-[44vh] overflow-hidden sm:h-[280px]', bannerClass)}>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover brightness-110" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-black/30" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />

        <div className="relative mx-auto flex h-full w-full max-w-4xl items-end px-6 py-6 lg:px-10">
          <Link
            href="/workouts/mine"
            className="absolute left-6 top-6 hidden items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-[13px] font-medium text-white ring-1 ring-inset ring-white/30 backdrop-blur-sm transition hover:bg-white/25 sm:inline-flex lg:left-10"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> My workouts
          </Link>

          {total > 0 && (
            <span className="label-mono absolute right-6 top-6 inline-flex items-center rounded-full bg-black/40 px-3 py-1 normal-case tracking-[0.15em] !text-white backdrop-blur-sm lg:right-10">
              {done}/{total} days done
            </span>
          )}

          <div className="relative min-w-0 flex-1">
            {cat && (
              <span className="label-mono normal-case tracking-[0.18em] !text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">{cat}</span>
            )}
            <h1 className="mt-2 font-serif text-[32px] italic leading-[1.05] !text-white sm:text-[40px] [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
              {title}
            </h1>
          </div>

          <div className="absolute bottom-6 right-6 lg:right-10">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-inset ring-white/30 backdrop-blur-sm transition hover:bg-white/25"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile back */}
      <div className="flex items-center gap-3 px-4 pt-3 sm:hidden">
        <Link href="/workouts/mine" className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> My workouts
        </Link>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {/* Workout content */}
      <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-4 lg:px-8">
        {workout.sourceWorkoutId && (
          <p className="label-mono mb-4 normal-case tracking-[0.15em] text-muted-foreground">Remixed from library</p>
        )}

        {/* Weeks */}
        <div className="border-t border-border/60">
          {weeks.map((week, wi) => {
            const weekOpen = openWeek === wi
            const allWeekDone = week.days.every((_, di) => isDayDone(wi, di))
            return (
              <div key={wi} className="border-b border-border/60">
                {/* Week header */}
                <button
                  type="button"
                  onClick={() => setOpenWeek(weekOpen ? -1 : wi)}
                  className="flex w-full items-center justify-between py-4 text-left"
                >
                  <div className="flex min-w-0 flex-1 items-baseline gap-4 pr-3">
                    <span className={cn('label-mono normal-case tracking-[0.12em] text-muted-foreground', allWeekDone && 'line-through opacity-60')}>
                      {week.label}
                    </span>
                    {allWeekDone && (
                      <span className="text-[12px] font-medium text-green-500">Week complete!</span>
                    )}
                  </div>
                  <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', weekOpen && 'rotate-180')} />
                </button>

                {weekOpen && (
                  <>
                    {/* Days */}
                    <div className="space-y-2 pb-3">
                      {week.days.map((day, di) => {
                        const dayKey = `w${wi}-d${di}`
                        const dayOpen = openDay === dayKey
                        const dayDone = isDayDone(wi, di)
                        const visibleBlocks = day.blocks.filter(b => !b.deleted)
                        const allBlocksDone = visibleBlocks.length > 0 && visibleBlocks.every((_, bi) => isCompleted(wi, di, bi))

                        return (
                          <div key={di} className="overflow-hidden rounded-lg border border-border/60 bg-background">
                            {/* Day header */}
                            <button
                              type="button"
                              onClick={() => setOpenDay(dayOpen ? null : dayKey)}
                              className="flex w-full items-center justify-between px-4 py-3 text-left hover:no-underline"
                            >
                              <span className={cn('text-[15px] font-medium sm:text-[14px]', dayDone && 'line-through opacity-60')}>
                                {`Day ${di + 1}`}
                              </span>
                              <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', dayOpen && 'rotate-180')} />
                            </button>

                            {dayOpen && (
                              <>
                                {/* Blocks */}
                                <div className="divide-y-0">
                                  {visibleBlocks.length === 0 && (
                                    <div className="flex items-center justify-center border-t border-border/40 px-4 py-6">
                                      <button
                                        type="button"
                                        onClick={() => setAddBlockTarget({ wi, di })}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background transition hover:opacity-90"
                                      >
                                        <Plus className="h-3.5 w-3.5" /> Add block
                                      </button>
                                    </div>
                                  )}
                                  {visibleBlocks.map((block, bi) => (
                                    <BlockItem
                                      key={bi}
                                      block={block}
                                      wi={wi} di={di} bi={bi}
                                      completed={isCompleted(wi, di, bi)}
                                      onToggle={() => toggle(wi, di, bi)}
                                      onDelete={() => deleteBlock(wi, di, bi)}
                                      onEdit={updated => editBlock(wi, di, bi, updated)}
                                      showActions
                                    />
                                  ))}
                                </div>

                                {/* Day action bar */}
                                <div className="flex items-stretch border-t border-border/60">
                                  <button
                                    type="button"
                                    onClick={() => setAddBlockTarget({ wi, di })}
                                    className="inline-flex flex-1 items-center justify-center border-r border-border/60 px-4 py-3 text-foreground transition hover:bg-foreground/[0.06]"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => duplicateDay(wi, di)}
                                    className="inline-flex flex-1 items-center justify-center border-r border-border/60 px-4 py-3 text-foreground transition hover:bg-foreground/[0.06]"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  {week.days.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => deleteDay(wi, di)}
                                      className="inline-flex flex-1 items-center justify-center border-r border-border/60 px-4 py-3 text-foreground transition hover:bg-foreground/[0.06]"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={allBlocksDone}
                                    onClick={() => {
                                      setDayDone(wi, di, !dayDone)
                                    }}
                                    className={cn(
                                      'inline-flex flex-1 items-center justify-center px-4 py-3 transition',
                                      dayDone ? 'text-foreground hover:bg-foreground/[0.06]' : 'bg-foreground text-background hover:opacity-90',
                                      allBlocksDone && 'cursor-not-allowed opacity-40',
                                    )}
                                  >
                                    {dayDone ? <RotateCcw className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Week action bar */}
                    <div className="mb-3 flex items-stretch overflow-hidden rounded-lg border border-border/60 bg-background">
                      <button
                        type="button"
                        onClick={() => addDay(wi)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 border-r border-border/60 px-2 py-3 text-[13px] font-medium text-foreground transition hover:bg-foreground/[0.06] sm:px-4"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="sm:hidden">Add day</span>
                        <span className="hidden sm:inline">Add day</span>
                      </button>
                      <button
                        type="button"
                        onClick={addWeek}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 border-r border-border/60 px-2 py-3 text-[13px] font-medium text-foreground transition hover:bg-foreground/[0.06] sm:px-4"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="sm:hidden">Add wk</span>
                        <span className="hidden sm:inline">Add week</span>
                      </button>
                      {weeks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteWeek(wi)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 px-2 py-3 text-[13px] font-medium text-foreground transition hover:bg-foreground/[0.06] sm:px-4"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sm:hidden">Del wk</span>
                          <span className="hidden sm:inline">Delete week</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Sheets */}
      <AddBlockSheet
        open={addBlockTarget !== null}
        onOpenChange={v => { if (!v) setAddBlockTarget(null) }}
        onAdd={block => {
          if (addBlockTarget) addBlock(addBlockTarget.wi, addBlockTarget.di, block)
          setAddBlockTarget(null)
        }}
      />

      <EditWorkoutSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        workout={{ ...workout, title, category }}
        onSave={(t, c) => { setTitle(t); setCategory(c) }}
      />
    </div>
  )
}
