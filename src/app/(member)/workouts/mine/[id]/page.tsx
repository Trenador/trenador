import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMyWorkoutAction } from '@/actions/workouts'
import { WorkoutBuilder } from './workout-builder'

export default async function MyWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workout = await getMyWorkoutAction(id)
  if (!workout) notFound()

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-2">
        <Link href="/workouts/mine" className="label-mono text-muted-foreground hover:text-foreground transition-colors normal-case tracking-wide text-xs">
          ← My Workouts
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mt-4 mb-8">
        <div>
          {workout.category && (
            <span className="label-mono px-2.5 py-1 rounded-full bg-secondary normal-case tracking-wide text-xs inline-block mb-2">
              {workout.category}
            </span>
          )}
          <h1 className="text-2xl font-bold tracking-tight">{workout.title}</h1>
          {workout.sourceWorkoutId && (
            <p className="label-mono text-muted-foreground mt-1 normal-case tracking-wide text-xs">Saved from library</p>
          )}
        </div>
        <Link
          href={`/log?from=mine&id=${workout.id}`}
          className="shrink-0 h-9 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center hover:opacity-90 transition-opacity"
        >
          Start log
        </Link>
      </div>

      <WorkoutBuilder workout={workout} />
    </div>
  )
}
