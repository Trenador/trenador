import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getWorkoutLogDetailAction } from '@/actions/workout-logging'

export default async function LogDetailPage({
  params,
}: {
  params: Promise<{ logId: string }>
}) {
  const { logId } = await params
  const log = await getWorkoutLogDetailAction(logId)
  if (!log) notFound()

  return (
    <div className="px-4 md:px-6 py-8 pt-14 md:pt-8 max-w-2xl mx-auto">
      <div className="mb-2">
        <Link href="/log/history" className="label-mono text-muted-foreground hover:text-foreground transition-colors normal-case tracking-wide text-xs">
          ← History
        </Link>
      </div>

      <div className="mt-4 mb-8">
        <div className="flex flex-wrap gap-2 mb-3">
          {log.workoutType && (
            <span className="label-mono px-2.5 py-1 rounded-full bg-secondary normal-case tracking-wide text-xs">
              {log.workoutType}
            </span>
          )}
          {log.durationMinutes && (
            <span className="label-mono px-2.5 py-1 rounded-full bg-secondary normal-case tracking-wide text-xs">
              {log.durationMinutes} min
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {new Date(log.loggedAt).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </h1>
        {log.notes && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{log.notes}</p>
        )}
      </div>

      <div className="space-y-6">
        {log.exercises.map(exercise => (
          <div key={exercise.id}>
            <div className="font-semibold text-[15px] mb-2">{exercise.exerciseName}</div>
            <div className="rounded-xl border overflow-hidden">
              <div className="grid grid-cols-3 px-4 py-2 bg-secondary/60">
                {['Set', 'lbs', 'Reps'].map(h => (
                  <span key={h} className="label-mono text-[10px] normal-case tracking-wide">{h}</span>
                ))}
              </div>
              {exercise.sets.map(set => (
                <div key={set.id} className="grid grid-cols-3 px-4 py-3 border-t bg-card text-sm">
                  <span className={set.isWarmup ? 'text-muted-foreground' : ''}>
                    {set.setNumber}{set.isWarmup ? ' W' : ''}
                  </span>
                  <span>{set.weightLbs ? `${Number(set.weightLbs)}` : '—'}</span>
                  <span>{set.reps ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
