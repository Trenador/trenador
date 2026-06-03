'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock, Gauge, Bookmark, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type Workout = {
  id: string
  title: string
  category: string | null
  level: string | null
  muscleGroups: string[]
  durationMinutes: number | null
  summary: string | null
  lengthLabel: string | null
  savesCount: number
  coachName: string | null
  coachPhotoUrl: string | null
}

const CATEGORIES = ['Strength', 'Hypertrophy', 'Cardio', 'Mobility'] as const
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'] as const

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

function coachInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map(p => p[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function levelShort(level: string | null) {
  if (!level) return ''
  if (level === 'All Levels') return 'All'
  return level.slice(0, 3) + '.'
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const img = workout.category ? CATEGORY_IMAGE[workout.category] : undefined
  const banner = workout.category ? (CATEGORY_BANNER[workout.category] ?? 'bg-muted') : 'bg-muted'

  return (
    <Link
      href={`/workouts/${workout.id}`}
      className="group flex w-[272px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:border-border hover:shadow-md sm:w-[240px] lg:w-[272px]"
    >
      {/* Banner */}
      <div className={cn('relative h-[170px] overflow-hidden', banner)}>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            className="absolute inset-0 h-full w-full object-cover brightness-110 transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between">
          {workout.category && (
            <span className="label-mono text-[10px] normal-case tracking-widest text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
              {workout.category}
            </span>
          )}
          {workout.lengthLabel && (
            <span className="rounded bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {workout.lengthLabel}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-serif text-[17px] italic leading-snug tracking-[0.02em]">
          {workout.title}
        </h3>

        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          {workout.durationMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {workout.durationMinutes} min
            </span>
          )}
          {workout.level && (
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              {levelShort(workout.level)}
            </span>
          )}
        </div>

        {workout.muscleGroups.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {workout.muscleGroups.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Coach row */}
        {workout.coachName && (
          <div className="mt-auto flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {workout.coachPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={workout.coachPhotoUrl}
                  alt={workout.coachName}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[9px] font-semibold text-background">
                  {coachInitials(workout.coachName)}
                </div>
              )}
              <span className="text-[12px] text-muted-foreground">{workout.coachName}</span>
            </div>
            {workout.savesCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Bookmark className="h-3 w-3" />
                {workout.savesCount}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

const ALL = '__all__'

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
          'h-8 w-auto gap-1 rounded-full border-0 bg-foreground/[0.04] px-3 text-[12px] shadow-none focus:ring-0',
          'text-muted-foreground hover:bg-foreground/[0.07]',
          active && 'bg-foreground text-background hover:bg-foreground/90',
        )}
      >
        <span>{active ? `${label}:` : label}</span>
        {active && <SelectValue />}
      </SelectTrigger>
      <SelectContent className="rounded-xl border-border/60 bg-popover/95 p-1 shadow-lg backdrop-blur-xl" sideOffset={6}>
        <SelectItem value={ALL} className="rounded-lg text-[13px]">All</SelectItem>
        {options.map(o => (
          <SelectItem key={o} value={o} className="rounded-lg text-[13px]">{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function formatDuration(min: number | null) {
  if (!min) return null
  if (min >= 60) return '1 hr'
  return `${min} min`
}

export function WorkoutLibraryClient({ workouts }: { workouts: Workout[] }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeLevel, setActiveLevel] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeDuration, setActiveDuration] = useState<string | null>(null)

  const tags = useMemo(() => {
    const set = new Set<string>()
    workouts.forEach(w => w.muscleGroups.forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [workouts])

  const durationLabels = useMemo(() => {
    const set = new Set<string>()
    workouts.forEach(w => { const l = formatDuration(w.durationMinutes); if (l) set.add(l) })
    return Array.from(set)
  }, [workouts])

  const filtered = useMemo(() => workouts.filter(w => {
    if (activeCategory && w.category !== activeCategory) return false
    if (activeLevel && w.level !== activeLevel) return false
    if (activeTag && !w.muscleGroups.includes(activeTag)) return false
    if (activeDuration && formatDuration(w.durationMinutes) !== activeDuration) return false
    const q = query.toLowerCase()
    if (q && !w.title.toLowerCase().includes(q) && !(w.summary ?? '').toLowerCase().includes(q) && !w.muscleGroups.some(t => t.toLowerCase().includes(q))) return false
    return true
  }), [workouts, activeCategory, activeLevel, activeTag, activeDuration, query])

  const isFiltered = !!(activeCategory || activeLevel || activeTag || activeDuration || query.trim())

  const grouped = CATEGORIES.reduce<Record<string, Workout[]>>((acc, cat) => {
    const items = filtered.filter(w => w.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Header + filters */}
      <div className="sticky top-0 z-10 bg-background pb-3 pt-10 md:pt-14 px-4 md:px-6 lg:px-10">
        <h1 className="font-serif text-[44px] leading-[1.05] tracking-tight">
          Workout library
        </h1>

        <div className="mt-6 flex flex-col gap-3">
          {/* Search */}
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

          {/* Filter pills */}
          <div className="flex flex-wrap gap-1.5">
            <FilterSelect label="Function" options={[...CATEGORIES]} active={activeCategory} onChange={setActiveCategory} />
            <FilterSelect label="Level" options={[...LEVELS]} active={activeLevel} onChange={setActiveLevel} />
            <FilterSelect label="Muscle" options={tags} active={activeTag} onChange={setActiveTag} />
            <FilterSelect label="Duration" options={durationLabels} active={activeDuration} onChange={setActiveDuration} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 md:px-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-muted-foreground">No workouts match those filters yet.</p>
          </div>
        ) : isFiltered ? (
          /* Filtered grid */
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(w => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
          </div>
        ) : (
          /* Default: category sections */
          <div className="space-y-10">
            {CATEGORIES.filter(cat => grouped[cat]?.length).map(cat => (
              <div key={cat}>
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="font-serif text-2xl italic tracking-[0.02em]">{cat}</h2>
                  <span className="label-mono text-[10px] normal-case tracking-widest text-muted-foreground">
                    {grouped[cat]!.length} workout{grouped[cat]!.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="relative">
                  <div className="flex gap-4 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden">
                    {grouped[cat]!.map(w => (
                      <WorkoutCard key={w.id} workout={w} />
                    ))}
                  </div>
                  {/* Right fade */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
