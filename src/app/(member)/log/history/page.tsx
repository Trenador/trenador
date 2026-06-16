import { Suspense } from 'react'
import Link from 'next/link'
import { getWorkoutLogHistoryAction } from '@/actions/workout-logging'
import LogHistoryLoading from './loading'

export default function LogHistoryPage() {
  return (
    <Suspense fallback={<LogHistoryLoading />}>
      <LogHistoryContent />
    </Suspense>
  )
}

async function LogHistoryContent() {
  const logs = await getWorkoutLogHistoryAction()

  return (
    <div className="px-4 md:px-6 py-8 pt-14 md:pt-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="label-mono mb-1">Training</p>
        <h1 className="text-2xl font-bold tracking-tight">Workout History</h1>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <p className="text-muted-foreground text-sm">No workouts logged yet.</p>
          <Link
            href="/log"
            className="h-9 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Log your first workout
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <Link
              key={log.id}
              href={`/log/history/${log.id}`}
              className="flex items-center justify-between rounded-xl border bg-card px-5 py-4 hover:border-foreground/30 transition-colors group"
            >
              <div>
                <div className="font-medium text-[15px]">
                  {log.workoutType ?? 'Workout'}
                </div>
                <div className="label-mono text-muted-foreground mt-1 normal-case tracking-wide text-xs">
                  {new Date(log.loggedAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {log.durationMinutes ? ` · ${log.durationMinutes} min` : ''}
                </div>
              </div>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
