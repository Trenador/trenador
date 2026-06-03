import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getOrgWorkoutAction } from '@/actions/workouts'
import { SaveWorkoutButton } from './save-workout-button'

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ workoutId: string }>
}) {
  const { workoutId } = await params
  const workout = await getOrgWorkoutAction(workoutId)
  if (!workout) notFound()

  return (
    <div className="px-4 md:px-6 py-8 pt-14 md:pt-8 max-w-2xl mx-auto">
      <div className="mb-2">
        <Link href="/workouts" className="label-mono text-muted-foreground hover:text-foreground transition-colors normal-case tracking-wide text-xs">
          ← Workout Library
        </Link>
      </div>

      <div className="mt-4 mb-8">
        <div className="flex flex-wrap gap-2 mb-3">
          {workout.category && (
            <span className="label-mono px-2.5 py-1 rounded-full bg-secondary normal-case tracking-wide text-xs">
              {workout.category}
            </span>
          )}
          {workout.level && (
            <span className="label-mono px-2.5 py-1 rounded-full bg-secondary normal-case tracking-wide text-xs">
              {workout.level}
            </span>
          )}
          {workout.durationMinutes && (
            <span className="label-mono px-2.5 py-1 rounded-full bg-secondary normal-case tracking-wide text-xs">
              {workout.durationMinutes} min
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{workout.title}</h1>
        {workout.coachNotes && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{workout.coachNotes}</p>
        )}
      </div>

      {/* exercises by block */}
      {workout.blocks.length > 0 ? (
        <div className="space-y-6 mb-10">
          {workout.blocks.map(block => {
            const exercises = block.exercises as Array<{
              name: string
              targetSets?: number
              targetReps?: number
              targetWeightKg?: number
              notes?: string
            }>
            return (
              <div key={block.id}>
                <div className="label-mono mb-3 normal-case tracking-wide text-xs">{block.name}</div>
                <div className="rounded-xl border divide-y overflow-hidden">
                  {exercises.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 bg-card">
                      <span className="text-sm font-medium">{ex.name}</span>
                      <span className="label-mono text-muted-foreground normal-case tracking-wide text-xs">
                        {[
                          ex.targetSets && ex.targetReps ? `${ex.targetSets}×${ex.targetReps}` : null,
                          ex.targetWeightKg ? `${ex.targetWeightKg}kg` : null,
                        ].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-10">No exercises listed for this workout.</p>
      )}

      <div className="flex gap-3">
        <SaveWorkoutButton workoutId={workout.id} />
        <Link
          href={`/log?from=org&id=${workout.id}`}
          className="flex-1 h-11 rounded-full border border-border flex items-center justify-center text-sm font-medium hover:bg-secondary transition-colors"
        >
          Start a Log
        </Link>
      </div>
    </div>
  )
}
