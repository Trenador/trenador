import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getMyWorkoutsAction } from '@/actions/workouts'

export default async function MyWorkoutsPage() {
  const workouts = await getMyWorkoutsAction()

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="label-mono mb-1">Personal Library</p>
          <h1 className="text-2xl font-bold tracking-tight">My Workouts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Workouts you've saved from the library or created yourself.
          </p>
        </div>
        <Link
          href="/workouts/mine/new"
          className="flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus className="size-4" />
          New workout
        </Link>
      </div>

      {workouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <p className="text-muted-foreground text-sm max-w-xs">
            No saved workouts yet. Browse the{' '}
            <Link href="/workouts" className="underline underline-offset-2 hover:text-foreground">
              Workout Library
            </Link>{' '}
            to save one, or create your own.
          </p>
          <Link
            href="/workouts/mine/new"
            className="h-9 px-5 rounded-full border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            Create from scratch
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {workouts.map(workout => (
            <div key={workout.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h2 className="font-semibold text-[15px] leading-snug">{workout.title}</h2>
                {workout.category && (
                  <span className="label-mono shrink-0 px-2 py-0.5 rounded-full bg-secondary normal-case tracking-wide text-xs">
                    {workout.category}
                  </span>
                )}
              </div>
              {workout.sourceWorkoutId && (
                <p className="label-mono text-muted-foreground mb-3 normal-case tracking-wide text-xs">
                  Saved from library
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <Link
                  href={`/log?from=mine&id=${workout.id}`}
                  className="flex-1 h-8 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  Start log
                </Link>
                <Link
                  href={`/workouts/mine/${workout.id}`}
                  className="flex-1 h-8 rounded-full border border-border text-xs font-medium flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
