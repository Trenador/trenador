import type { Metadata } from 'next'
import { getOrgWorkoutsAction } from '@/actions/workouts'
import { WorkoutLibraryClient } from './workout-library-client'

export const metadata: Metadata = { title: 'Library' }

export default async function WorkoutsPage() {
  const workouts = await getOrgWorkoutsAction()
  return <WorkoutLibraryClient workouts={workouts} />
}
