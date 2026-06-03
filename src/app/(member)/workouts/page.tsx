import Link from 'next/link'
import { getOrgWorkoutsAction } from '@/actions/workouts'

const CATEGORIES = ['Push', 'Pull', 'Legs', 'Full body', 'Cardio', 'Mobility']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; level?: string }>
}) {
  const { category, level } = await searchParams
  const filters: { category?: string; level?: string } = {}
  if (category) filters.category = category
  if (level) filters.level = level
  const workouts = await getOrgWorkoutsAction(filters)

  return (
    <div className="px-4 md:px-6 py-8 pt-14 md:pt-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="label-mono mb-1">Workout Library</p>
        <h1 className="text-2xl font-bold tracking-tight">
          PowerhouseSoFlo Workouts
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse workouts published by your gym. Save any to your personal library to customize and log.
        </p>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/workouts"
          className={`label-mono px-3 py-1.5 rounded-full border transition-colors normal-case tracking-wide text-xs ${!category && !level ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-foreground/40'}`}
        >
          All
        </Link>
        {CATEGORIES.map(cat => (
          <Link
            key={cat}
            href={`/workouts?category=${encodeURIComponent(cat.toLowerCase())}`}
            className={`label-mono px-3 py-1.5 rounded-full border transition-colors normal-case tracking-wide text-xs ${category === cat.toLowerCase() ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-foreground/40'}`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {workouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground text-sm">
            {category || level
              ? 'No workouts match those filters yet.'
              : 'No workouts published yet. Check back soon.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {workouts.map(workout => (
            <Link
              key={workout.id}
              href={`/workouts/${workout.id}`}
              className="group rounded-xl border bg-card p-5 hover:border-foreground/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h2 className="font-semibold text-[15px] leading-snug group-hover:text-foreground">
                  {workout.title}
                </h2>
                {workout.level && (
                  <span className="label-mono shrink-0 px-2 py-0.5 rounded-full bg-secondary normal-case tracking-wide text-xs">
                    {workout.level}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {workout.category && (
                  <span className="label-mono normal-case tracking-wide text-xs">{workout.category}</span>
                )}
                {workout.durationMinutes && (
                  <span className="label-mono normal-case tracking-wide text-xs text-muted-foreground">
                    {workout.durationMinutes} min
                  </span>
                )}
              </div>
              {workout.muscleGroups.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {workout.muscleGroups.slice(0, 4).map(mg => (
                    <span key={mg} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      {mg}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
