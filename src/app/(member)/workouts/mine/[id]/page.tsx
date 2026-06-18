import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getMyWorkoutAction } from '@/actions/workouts'
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

  return (
    <MyWorkoutClient
      workout={{
        id: workout.id,
        title: workout.title,
        category: workout.category,
        sourceWorkoutId: workout.sourceWorkoutId ?? null,
        structure: workout.structure,
      }}
    />
  )
}
