import { notFound } from 'next/navigation'
import { getOrgWorkoutAction } from '@/actions/workouts'
import { WorkoutDetailClient } from './workout-detail-client'

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ workoutId: string }>
}) {
  const { workoutId } = await params
  const workout = await getOrgWorkoutAction(workoutId)
  if (!workout) notFound()

  return <WorkoutDetailClient workout={workout} />
}
