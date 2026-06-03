'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, Gauge, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

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
const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'] as const

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

export function WorkoutLibraryClient({ workouts }: { workouts: Workout[] }) {
  const [activeLevel, setActiveLevel] = useState<string>('All Levels')
  const [search, setSearch] = useState('')

  const filtered = workouts.filter(w => {
    const matchLevel = activeLevel === 'All Levels' || w.level === activeLevel
    const q = search.toLowerCase()
    const matchSearch = !q ||
      w.title.toLowerCase().includes(q) ||
      (w.summary ?? '').toLowerCase().includes(q) ||
      w.muscleGroups.some(t => t.toLowerCase().includes(q))
    return matchLevel && matchSearch
  })

  const isFiltered = activeLevel !== 'All Levels' || search.length > 0

  const grouped = CATEGORIES.reduce<Record<string, Workout[]>>((acc, cat) => {
    const items = filtered.filter(w => w.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-14 pb-4 md:px-6 md:pt-8">
        <h1 className="font-serif text-[2.75rem] italic leading-tight tracking-[0.02em]">
          Workout library
        </h1>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 overflow-x-auto px-4 py-3 md:px-6 [&::-webkit-scrollbar]:hidden">
          {LEVELS.map(lvl => (
            <button
              key={lvl}
              type="button"
              onClick={() => setActiveLevel(lvl)}
              className={cn(
                'label-mono shrink-0 rounded-full border px-3 py-1.5 text-[11px] normal-case tracking-wide transition-colors',
                activeLevel === lvl
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground/40',
              )}
            >
              {lvl}
            </button>
          ))}
          <div className="ml-2 shrink-0">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-8 rounded-full border border-border bg-transparent px-3 text-[13px] outline-none placeholder:text-muted-foreground focus:border-foreground/40"
            />
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
