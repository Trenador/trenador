import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getMyWorkoutsAction } from '@/actions/workouts'

export const metadata: Metadata = { title: 'My Workouts' }
import { MyWorkoutsClient } from './my-workouts-client'
import MyWorkoutsLoading from './loading'

export default function MyWorkoutsPage() {
  return (
    <Suspense fallback={<MyWorkoutsLoading />}>
      <MyWorkoutsContent />
    </Suspense>
  )
}

async function MyWorkoutsContent() {
  const workouts = await getMyWorkoutsAction()
  return <MyWorkoutsClient workouts={workouts} />
}
