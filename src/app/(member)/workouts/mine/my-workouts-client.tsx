'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Copy, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { deleteMyWorkoutAction } from '@/actions/workouts'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type Workout = {
  id: string
  title: string
  category: string | null
  sourceWorkoutId: string | null
  createdAt: Date
}

const CATEGORY_BANNER: Record<string, string> = {
  Strength: 'bg-[linear-gradient(135deg,#4a2a1c_0%,#2a1610_100%)]',
  Hypertrophy: 'bg-[linear-gradient(135deg,#4a1f2a_0%,#2a1018_100%)]',
  Cardio: 'bg-[linear-gradient(135deg,#1e3a2a_0%,#0f1f17_100%)]',
  Mobility: 'bg-[linear-gradient(135deg,#2e2a4a_0%,#171528_100%)]',
}

const CATEGORIES = ['Strength', 'Hypertrophy', 'Cardio', 'Mobility'] as const
const ALL = '__all__'

function CategoryFilter({
  active,
  onChange,
}: {
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
        <span>{active ? 'Function:' : 'Function'}</span>
        {active && <SelectValue />}
      </SelectTrigger>
      <SelectContent className="rounded-xl border-border/60 bg-popover/95 p-1 shadow-lg backdrop-blur-xl" sideOffset={6}>
        <SelectItem value={ALL} className="rounded-lg text-[13px]">All</SelectItem>
        {CATEGORIES.map(c => (
          <SelectItem key={c} value={c} className="rounded-lg text-[13px]">{c}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function WorkoutRow({
  workout,
  onRemove,
}: {
  workout: Workout
  onRemove: (id: string) => void
}) {
  const router = useRouter()
  const banner = workout.category ? (CATEGORY_BANNER[workout.category] ?? 'bg-muted') : 'bg-muted'
  const createdDate = new Date(workout.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <li className="relative grid cursor-pointer grid-cols-[88px_minmax(0,1fr)] items-stretch gap-4 overflow-hidden rounded-lg border border-border/60 bg-card py-3 pr-4 transition-colors hover:bg-foreground/[0.03] sm:grid-cols-[88px_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_44px_44px]">
      {/* Thumbnail */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/workouts/mine/${workout.id}`)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/workouts/mine/${workout.id}`) } }}
        className={cn('relative -my-3 h-auto w-[88px] self-stretch overflow-hidden', banner)}
      />

      {/* Title + mobile meta */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/workouts/mine/${workout.id}`)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/workouts/mine/${workout.id}`) } }}
        className="flex min-w-0 flex-col justify-center"
      >
        <div className="truncate font-serif text-[17px] italic leading-tight">{workout.title}</div>
        <div className="mt-1 flex flex-col gap-0.5 text-[12px] text-foreground/80 sm:hidden">
          {workout.category && <span>{workout.category}</span>}
          <span>{createdDate}</span>
        </div>
      </div>

      {/* Desktop: category */}
      <div className="hidden min-w-0 items-center sm:flex sm:pl-4">
        <span className="truncate text-[13px] text-foreground/80">{workout.category ?? '—'}</span>
      </div>

      {/* Desktop: created date */}
      <div className="hidden items-center text-[13px] text-foreground/80 sm:flex sm:pl-4">
        {createdDate}
      </div>

      {/* Actions */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 sm:static sm:contents">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); router.push(`/workouts/mine/${workout.id}`) }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
          aria-label="Edit workout"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(workout.id) }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
          aria-label="Remove workout"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  )
}

export function MyWorkoutsClient({ workouts: initial }: { workouts: Workout[] }) {
  const router = useRouter()
  const [workouts, setWorkouts] = useState(initial)
  const [, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = useMemo(() => workouts.filter(w => {
    if (activeCategory && w.category !== activeCategory) return false
    const q = query.toLowerCase()
    if (q && !w.title.toLowerCase().includes(q)) return false
    return true
  }), [workouts, activeCategory, query])

  const handleRemove = (id: string) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id))
    startTransition(async () => {
      await deleteMyWorkoutAction(id)
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 md:px-6 lg:px-10 lg:pt-14">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-serif text-[44px] leading-[1.05] tracking-tight">My workouts</h1>
          <button
            type="button"
            onClick={() => router.push('/workouts/mine/new')}
            className="hidden shrink-0 items-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-[13px] font-medium text-background ring-1 ring-foreground/10 transition hover:opacity-90 sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            Workout
          </button>
        </div>

        {/* Search + filters */}
        <div className="mt-6 flex flex-col gap-3">
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
          <div className="flex flex-wrap gap-1.5">
            <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
          </div>
        </div>

        <div className="mt-6">
          {workouts.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              You haven't added any workouts yet.{' '}
              <button
                type="button"
                onClick={() => router.push('/workouts')}
                className="underline underline-offset-2 hover:text-foreground"
              >
                Browse the library
              </button>{' '}
              to save one.
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No workouts match those filters.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {filtered.map((w) => (
                <WorkoutRow key={w.id} workout={w} onRemove={handleRemove} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => router.push('/workouts/mine/new')}
        className="fixed bottom-6 right-5 z-30 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-3 text-[13px] font-medium text-background shadow-lg ring-1 ring-foreground/10 transition hover:opacity-90 sm:hidden"
      >
        <Plus className="h-4 w-4" />
        Workout
      </button>
    </div>
  )
}
