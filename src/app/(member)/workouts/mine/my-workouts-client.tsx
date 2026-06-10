'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { deleteMyWorkoutAction } from '@/actions/workouts'

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
    <li className="relative grid cursor-pointer grid-cols-[88px_minmax(0,1fr)] items-stretch gap-4 overflow-hidden rounded-lg border border-border/60 py-3 pr-4 transition-colors hover:bg-foreground/[0.03] sm:grid-cols-[88px_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_44px_44px]">
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

        <div className="mt-8">
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
          ) : (
            <ul className="flex flex-col gap-2">
              {workouts.map((w) => (
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
