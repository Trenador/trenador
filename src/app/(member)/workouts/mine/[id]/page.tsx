import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getMyWorkoutAction } from '@/actions/workouts'
import { getPublishedWorkout } from '@/lib/workouts'
import { MyWorkoutClient } from './workout-builder'
import MyWorkoutsLoading from '../loading'

export default function MyWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<MyWorkoutsLoading />}>
      <MyWorkoutContent params={params} />
    </Suspense>
  )
}

async function MyWorkoutContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const workout = await getMyWorkoutAction(id)
  if (!workout) notFound()

  // Fetch source workout meta for remixed workouts; fall back to own columns for scratch workouts
  const source = workout.sourceWorkoutId
    ? await getPublishedWorkout(workout.sourceWorkoutId)
    : null

  return (
    <MyWorkoutClient
      workout={{
        id: workout.id,
        title: workout.title,
        category: workout.category,
        sourceWorkoutId: workout.sourceWorkoutId ?? null,
        structure: workout.structure,
        level: source?.level ?? (workout as Record<string, unknown>).level as string | null ?? null,
        durationMinutes: source?.durationMinutes ?? (workout as Record<string, unknown>).durationMinutes as number | null ?? null,
        muscleGroups: source?.muscleGroups ?? (workout as Record<string, unknown>).tags as string[] | null ?? null,
        summary: source?.summary ?? (workout as Record<string, unknown>).summary as string | null ?? null,
      }}
    />
  )
}
