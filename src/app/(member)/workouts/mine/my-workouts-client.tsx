'use client'

import { useMemo, useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Plus, Trash2, Copy, Search, Upload, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { deleteMyWorkoutAction, createMyWorkoutAction, duplicateMyWorkoutAction } from '@/actions/workouts'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'

type WorkoutStructure = {
  weeks?: Array<{ label: string; days: Array<{ label: string; blocks: unknown[] }> }>
}

type Workout = {
  id: string
  title: string
  category: string | null
  sourceWorkoutId: string | null
  structure: unknown
  createdAt: Date
  level: string | null
  muscleGroups: string[] | null
  durationMinutes: number | null
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
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'] as const
const ALL = '__all__'

const TAG_SUGGESTIONS = [
  'Full Body', 'Upper Body', 'Lower Body', 'Push', 'Pull', 'Legs', 'Core', 'Glutes',
  'Hamstrings', 'Quads', 'Calves', 'Chest', 'Back', 'Lats', 'Shoulders', 'Biceps',
  'Triceps', 'Forearms', 'Abs', 'Obliques', 'Hip Flexors',
  'Strength', 'Hypertrophy', 'Power', 'Endurance', 'Conditioning', 'HIIT', 'Cardio',
  'Mobility', 'Flexibility', 'Yoga', 'Pilates', 'Stretching', 'Recovery', 'Warm-up',
  'Cool-down', 'Plyometrics', 'Calisthenics', 'Bodyweight',
  'Barbell', 'Dumbbell', 'Kettlebell', 'Cable', 'Machine', 'Resistance Band',
  'Bench', 'Pull-up Bar', 'Medicine Ball', 'Foam Roller', 'No Equipment',
  'Fat Loss', 'Muscle Gain', 'Beginner Friendly', 'Quick', 'Low Impact',
  'High Intensity', 'At Home', 'Gym', 'Outdoor',
]

function getTotalDays(structure: unknown): number {
  const s = structure as WorkoutStructure
  if (!s?.weeks?.length) return 1
  return s.weeks.reduce((sum, w) => sum + (w.days?.length ?? 0), 0)
}

function formatDuration(min: number | null) {
  if (!min) return null
  if (min >= 60) return '1 hr'
  return `${min} min`
}

function FilterSelect({
  label,
  options,
  active,
  onChange,
}: {
  label: string
  options: string[]
  active: string | null
  onChange: (val: string | null) => void
}) {
  return (
    <Select value={active ?? ALL} onValueChange={v => onChange(v === ALL ? null : v)}>
      <SelectTrigger
        className={cn(
          'h-8 w-auto gap-1 rounded-full border-0 bg-foreground/[0.04] px-3 text-[12px] shadow-none focus:ring-0 [&>svg]:mt-1.5 [&>svg]:opacity-60',
          'text-muted-foreground hover:bg-foreground/[0.07]',
          active && 'bg-foreground text-background hover:bg-foreground/90 [&>svg]:opacity-80',
        )}
      >
        <span>{active ? `${label}:` : label}</span>
        {active && <SelectValue />}
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="rounded-xl border-border/60 bg-popover/95 p-1 shadow-lg backdrop-blur-xl" sideOffset={6}>
        <SelectItem value={ALL} className="rounded-lg text-[13px]">All</SelectItem>
        {options.map(o => (
          <SelectItem key={o} value={o} className="rounded-lg text-[13px]">{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function MobileFilterSheet({
  open, onOpenChange,
  functionOptions, levelOptions, muscleOptions, durationOptions,
  activeFunction, activeLevel, activeMuscle, activeDuration,
  setActiveFunction, setActiveLevel, setActiveMuscle, setActiveDuration,
  clearAll, resultCount,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  functionOptions: string[]
  levelOptions: string[]
  muscleOptions: string[]
  durationOptions: string[]
  activeFunction: string[]
  activeLevel: string[]
  activeMuscle: string[]
  activeDuration: string[]
  setActiveFunction: React.Dispatch<React.SetStateAction<string[]>>
  setActiveLevel: React.Dispatch<React.SetStateAction<string[]>>
  setActiveMuscle: React.Dispatch<React.SetStateAction<string[]>>
  setActiveDuration: React.Dispatch<React.SetStateAction<string[]>>
  clearAll: () => void
  resultCount: number
}) {
  const [openSection, setOpenSection] = useState<string | null>('Function')
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
  }
  const sections = [
    { label: 'Function', active: activeFunction, options: functionOptions, setter: setActiveFunction },
    { label: 'Level', active: activeLevel, options: levelOptions, setter: setActiveLevel },
    { label: 'Muscle', active: activeMuscle, options: muscleOptions, setter: setActiveMuscle },
    { label: 'Duration', active: activeDuration, options: durationOptions, setter: setActiveDuration },
  ]
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[88vh] w-full flex-col rounded-t-2xl p-0">
        <SheetHeader className="flex-row items-center justify-between border-b border-border/60 px-5 py-4">
          <SheetTitle className="font-serif text-[22px] font-normal tracking-tight">Filter</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5">
          {sections.map(s => {
            const isOpen = openSection === s.label
            return (
              <div key={s.label} className="border-b border-border/60">
                <button type="button" onClick={() => setOpenSection(isOpen ? null : s.label)} className="flex w-full items-center justify-between py-4 text-left">
                  <div className="flex items-center gap-2">
                    <span className="label-mono normal-case tracking-[0.18em]">{s.label.toUpperCase()}</span>
                    {s.active.length > 0 && (
                      <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[12px] text-foreground">
                        {s.active.length === 1 ? s.active[0] : `${s.active.length} selected`}
                      </span>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="flex flex-wrap gap-2 pb-5">
                    {s.options.map(opt => {
                      const selected = s.active.includes(opt)
                      return (
                        <button key={opt} type="button" onClick={() => toggle(s.setter, opt)}
                          className={cn('rounded-md border px-3 py-1.5 text-[13px] transition-colors',
                            selected ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-foreground hover:bg-foreground/[0.04]'
                          )}>{opt}</button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-background px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={clearAll} className="flex items-center gap-1.5 text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            <X className="h-3.5 w-3.5" /> Clear all
          </button>
          <button type="button" onClick={() => onOpenChange(false)} className="flex-1 rounded-full bg-foreground px-5 py-3 text-[14px] font-medium text-background transition-opacity hover:opacity-90">
            Show results ({resultCount})
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

const CREATE_CATEGORIES = ['Strength', 'Hypertrophy', 'Cardio', 'Mobility'] as const
const CREATE_LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'] as const

function CreateWorkoutSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (id: string) => void
}) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<string>('Strength')
  const [level, setLevel] = useState<string>('All Levels')
  const [durationMin, setDurationMin] = useState('')
  const [numWeeks, setNumWeeks] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tagFocused, setTagFocused] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [summary, setSummary] = useState('')
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const bannerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTitle(''); setCategory('Strength'); setLevel('All Levels')
      setDurationMin(''); setNumWeeks(''); setTagInput(''); setTagFocused(false); setTags([])
      setSummary(''); setBannerPreview(null)
    }
  }, [open])

  function handleBannerFile(file: File) {
    if (!file.type.startsWith('image/')) return
    if (file.size > 4 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = () => { if (typeof reader.result === 'string') setBannerPreview(reader.result) }
    reader.readAsDataURL(file)
  }

  function handleSubmit() {
    const t = title.trim()
    if (!t) return
    const dur = Number(durationMin)
    const wks = Number(numWeeks)
    startTransition(async () => {
      const payload: Parameters<typeof createMyWorkoutAction>[0] = { title: t.slice(0, 120), category, tags: tags.filter(Boolean) }
      if (level !== 'All Levels') payload.level = level
      if (Number.isFinite(dur) && dur > 0) payload.durationMinutes = Math.floor(dur)
      if (Number.isFinite(wks) && wks > 0) payload.numWeeks = Math.floor(wks)
      const trimmedSummary = summary.trim().slice(0, 1000)
      if (trimmedSummary) payload.summary = trimmedSummary
      const workout = await createMyWorkoutAction(payload)
      onCreated(workout.id)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'flex flex-col gap-0 p-0',
          isMobile
            ? 'h-[100dvh] w-full rounded-none sm:h-[95vh] sm:rounded-t-2xl'
            : 'h-full w-full max-w-md sm:max-w-md',
        )}
      >
        <SheetHeader className="border-b border-border/60 px-5 py-4 text-left">
          <SheetTitle>Create workout</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Banner image */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Banner image</label>
            <div
              className={cn('relative h-32 w-full overflow-hidden rounded-md bg-background', bannerPreview ? 'border border-input' : 'border-2 border-dashed border-input')}
            >
              {bannerPreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bannerPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/20" />
                  <button
                    type="button"
                    onClick={() => bannerRef.current?.click()}
                    className="absolute bottom-2 right-2 rounded-full bg-white/90 px-3 py-1 text-[12px] font-medium text-foreground hover:bg-white"
                  >
                    Replace
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => bannerRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition hover:bg-foreground/[0.04] hover:text-foreground"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-[13px] font-medium">Upload</span>
                </button>
              )}
              <input
                ref={bannerRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleBannerFile(f); e.target.value = '' }}
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={120}
              autoFocus
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Category + Level */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {CREATE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Level</label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {CREATE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Duration + # Wks */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Duration (min)</label>
              <input
                type="number"
                min={1}
                max={300}
                value={durationMin}
                onChange={e => setDurationMin(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium"># Wks</label>
              <input
                type="number"
                min={1}
                max={52}
                value={numWeeks}
                onChange={e => setNumWeeks(e.target.value)}
                placeholder="—"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tags</label>
            <div className="rounded-md border border-input bg-background px-2 py-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[12px]">
                    {t}
                    <button type="button" aria-label={`Remove ${t}`} onClick={() => setTags(tags.filter(x => x !== t))} className="text-muted-foreground hover:text-foreground">
                      ×
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onFocus={() => setTagFocused(true)}
                  onBlur={() => setTimeout(() => setTagFocused(false), 150)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault()
                      const v = tagInput.trim()
                      if (!tags.includes(v) && tags.length < 12) setTags([...tags, v])
                      setTagInput('')
                    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
                      setTags(tags.slice(0, -1))
                    }
                  }}
                  className="min-w-[120px] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
                />
              </div>
            </div>
            {tagFocused && (() => {
              const q = tagInput.trim().toLowerCase()
              const matches = TAG_SUGGESTIONS.filter(s => !tags.includes(s) && (!q || s.toLowerCase().includes(q))).slice(0, 12)
              if (!matches.length) return null
              return (
                <div className="mt-1 max-h-56 overflow-y-auto rounded-md border border-border/70 bg-popover p-1 shadow-md">
                  {matches.map(s => (
                    <button key={s} type="button"
                      onMouseDown={e => { e.preventDefault(); if (tags.length < 12) setTags([...tags, s]); setTagInput('') }}
                      className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Summary */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Summary</label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              maxLength={1000}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 px-5 py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || isPending}
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition hover:opacity-90 disabled:opacity-40 sm:h-10 sm:w-auto"
          >
            <Check className="h-4 w-4" />
            {isPending ? 'Creating…' : 'Submit'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function useWorkoutDaysDone(workoutId: string, weeks: Array<{ days: unknown[] }>) {
  const [done, setDone] = useState(0)
  useEffect(() => {
    try {
      const all = JSON.parse(window.localStorage.getItem('workouts:daysDone') ?? '{}') as Record<string, Record<string, boolean>>
      const map = all[workoutId] ?? {}
      let count = 0
      weeks.forEach((w, wi) => w.days.forEach((_, di) => { if (map[`w${wi}-d${di}`]) count++ }))
      setDone(count)
    } catch {}
  }, [workoutId, weeks])
  return done
}

function WorkoutRow({ workout, onRemove }: { workout: Workout; onRemove: (id: string) => void }) {
  const router = useRouter()
  const [isDuplicating, startDuplicate] = useTransition()
  const banner = workout.category ? (CATEGORY_BANNER[workout.category] ?? 'bg-muted') : 'bg-muted'
  const img = workout.category ? CATEGORY_IMAGE[workout.category] : undefined
  const createdDate = new Date(workout.createdAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  const totalDays = getTotalDays(workout.structure)
  const s = (workout.structure as { weeks?: Array<{ days: unknown[] }> } | null)
  const weeks = s?.weeks ?? [{ days: Array.from({ length: totalDays }) }]
  const daysDone = useWorkoutDaysDone(workout.id, weeks)

  return (
    <li className="relative grid cursor-pointer grid-cols-[88px_minmax(0,1fr)] items-stretch gap-4 overflow-hidden rounded-lg border border-border/60 py-3 pr-4 transition-colors hover:bg-foreground/[0.03] sm:grid-cols-[88px_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_44px_44px]">
      {/* Thumbnail with actual photo */}
      <div
        role="button" tabIndex={0}
        onClick={() => router.push(`/workouts/mine/${workout.id}`)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/workouts/mine/${workout.id}`) } }}
        className={cn('relative -my-3 h-auto w-[88px] self-stretch overflow-hidden', banner)}
      >
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover brightness-110" />
        )}
        {img && <div className="absolute inset-0 bg-black/20" />}
      </div>

      {/* Title + mobile meta */}
      <div
        role="button" tabIndex={0}
        onClick={() => router.push(`/workouts/mine/${workout.id}`)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/workouts/mine/${workout.id}`) } }}
        className="flex min-w-0 flex-col justify-center"
      >
        <div className="truncate font-serif text-[17px] italic leading-tight">{workout.title}</div>
        <div className="mt-1 flex flex-col gap-0.5 text-[12px] tabular-nums text-foreground/80 sm:hidden">
          <span>{daysDone}/{totalDays} days done</span>
          <span>{createdDate}</span>
        </div>
      </div>

      {/* Desktop: category */}
      <div className="hidden min-w-0 items-center sm:flex sm:pl-4">
        <span className="truncate text-[13px] text-foreground/80">{workout.category ?? '—'}</span>
      </div>

      {/* Desktop: days done */}
      <div className="hidden items-center text-[13px] tabular-nums text-foreground/80 sm:flex sm:pl-4">
        {daysDone}/{totalDays} days done
      </div>

      {/* Desktop: date */}
      <div className="hidden items-center text-[13px] tabular-nums text-foreground/80 sm:flex sm:pl-4">
        {createdDate}
      </div>

      {/* Actions */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 sm:static sm:contents">
        <button type="button"
          disabled={isDuplicating}
          onClick={e => {
            e.stopPropagation()
            startDuplicate(async () => {
              const copy = await duplicateMyWorkoutAction(workout.id)
              toast.success('Workout duplicated')
              router.push(`/workouts/mine/${copy.id}`)
            })
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground disabled:opacity-40"
          aria-label="Duplicate workout"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button type="button"
          onClick={e => { e.stopPropagation(); onRemove(workout.id) }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
          aria-label="Remove workout"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-[88px] right-0 h-[3px]">
        <div
          className="h-full bg-emerald-500 transition-[width] duration-300"
          style={{ width: `${totalDays > 0 ? Math.min(100, Math.round((daysDone / totalDays) * 100)) : 0}%` }}
        />
      </div>
    </li>
  )
}

export function MyWorkoutsClient({ workouts: initial }: { workouts: Workout[] }) {
  const router = useRouter()
  const [workouts, setWorkouts] = useState(initial)
  const [, startTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeLevel, setActiveLevel] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeDuration, setActiveDuration] = useState<string | null>(null)
  const [mobileCategories, setMobileCategories] = useState<string[]>([])
  const [mobileLevels, setMobileLevels] = useState<string[]>([])
  const [mobileTags, setMobileTags] = useState<string[]>([])
  const [mobileDurations, setMobileDurations] = useState<string[]>([])
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const tags = useMemo(() => {
    const set = new Set<string>()
    workouts.forEach(w => (w.muscleGroups ?? []).forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [workouts])

  const durationLabels = useMemo(() => {
    const set = new Set<string>()
    workouts.forEach(w => { const l = formatDuration(w.durationMinutes); if (l) set.add(l) })
    return Array.from(set)
  }, [workouts])

  const clearAllFilters = () => {
    setActiveCategory(null); setActiveLevel(null); setActiveTag(null); setActiveDuration(null)
    setMobileCategories([]); setMobileLevels([]); setMobileTags([]); setMobileDurations([])
  }

  const filtered = useMemo(() => workouts.filter(w => {
    if (activeCategory && w.category !== activeCategory) return false
    if (activeLevel && w.level !== activeLevel) return false
    if (activeTag && !(w.muscleGroups ?? []).includes(activeTag)) return false
    if (activeDuration && formatDuration(w.durationMinutes) !== activeDuration) return false
    if (mobileCategories.length && !mobileCategories.includes(w.category ?? '')) return false
    if (mobileLevels.length && !mobileLevels.includes(w.level ?? '')) return false
    if (mobileTags.length && !mobileTags.some(t => (w.muscleGroups ?? []).includes(t))) return false
    if (mobileDurations.length && !mobileDurations.includes(formatDuration(w.durationMinutes) ?? '')) return false
    const q = query.toLowerCase()
    if (q && !w.title.toLowerCase().includes(q)) return false
    return true
  }), [workouts, activeCategory, activeLevel, activeTag, activeDuration, mobileCategories, mobileLevels, mobileTags, mobileDurations, query])

  const activeFilterCount =
    (activeCategory ? 1 : 0) + (activeLevel ? 1 : 0) + (activeTag ? 1 : 0) + (activeDuration ? 1 : 0) +
    mobileCategories.length + mobileLevels.length + mobileTags.length + mobileDurations.length

  const handleRemove = (id: string) => {
    setWorkouts(prev => prev.filter(w => w.id !== id))
    startTransition(async () => { await deleteMyWorkoutAction(id) })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10 lg:px-10 lg:pt-14">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">My workouts</h1>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="hidden shrink-0 items-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-[13px] font-medium text-background ring-1 ring-foreground/10 transition hover:opacity-90 sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            Workout
          </button>
        </div>

        {/* Search + filters */}
        <div className="sticky top-0 z-20 mt-8 flex flex-col gap-4 bg-background pb-3 pt-2 lg:static lg:pb-0 lg:pt-0">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search workout"
              className="h-9 w-full rounded-none border-0 border-b border-border bg-transparent pl-8 pr-7 text-[13px] outline-none placeholder:text-muted-foreground focus:border-b-foreground"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="hidden flex-wrap gap-1.5 sm:flex">
            <FilterSelect label="Function" options={[...CATEGORIES]} active={activeCategory} onChange={setActiveCategory} />
            <FilterSelect label="Level" options={[...LEVELS]} active={activeLevel} onChange={setActiveLevel} />
            <FilterSelect label="Muscle" options={tags} active={activeTag} onChange={setActiveTag} />
            <FilterSelect label="Duration" options={durationLabels} active={activeDuration} onChange={setActiveDuration} />
          </div>
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center justify-center gap-2 self-start rounded-full border border-border bg-background px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-foreground/[0.04] sm:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-medium text-background">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="mt-8">
          {workouts.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              You haven&apos;t added any workouts yet.{' '}
              <button type="button" onClick={() => router.push('/workouts')} className="underline underline-offset-2 hover:text-foreground">
                Browse the library
              </button>{' '}
              to save one.
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No workouts match those filters.</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {filtered.map(w => <WorkoutRow key={w.id} workout={w} onRemove={handleRemove} />)}
            </ul>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-6 right-5 z-30 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-3 text-[13px] font-medium text-background shadow-lg ring-1 ring-foreground/10 transition hover:opacity-90 sm:hidden"
      >
        <Plus className="h-4 w-4" />
        Workout
      </button>

      <MobileFilterSheet
        open={mobileFilterOpen}
        onOpenChange={setMobileFilterOpen}
        functionOptions={[...CATEGORIES]}
        levelOptions={[...LEVELS]}
        muscleOptions={tags}
        durationOptions={durationLabels}
        activeFunction={mobileCategories}
        activeLevel={mobileLevels}
        activeMuscle={mobileTags}
        activeDuration={mobileDurations}
        setActiveFunction={setMobileCategories}
        setActiveLevel={setMobileLevels}
        setActiveMuscle={setMobileTags}
        setActiveDuration={setMobileDurations}
        clearAll={clearAllFilters}
        resultCount={filtered.length}
      />

      <CreateWorkoutSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={id => {
          setCreateOpen(false)
          router.push(`/workouts/mine/${id}`)
        }}
      />
    </div>
  )
}
