import { getMyWorkoutsAction } from '@/actions/workouts'
import { MyWorkoutsClient } from './my-workouts-client'

export default async function MyWorkoutsPage() {
  const workouts = await getMyWorkoutsAction()
  return <MyWorkoutsClient workouts={workouts} />
}
