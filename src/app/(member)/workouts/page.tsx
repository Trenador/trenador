import { getOrgWorkoutsAction } from '@/actions/workouts'
import { WorkoutLibraryClient } from './workout-library-client'

export default async function WorkoutsPage() {
  const workouts = await getOrgWorkoutsAction()
  return <WorkoutLibraryClient workouts={workouts} />
}
