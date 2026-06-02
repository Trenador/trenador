'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  getPublishedWorkouts,
  getPublishedWorkout,
  getExerciseCatalog,
} from '@/lib/workouts'
import {
  getMemberWorkouts,
  getMemberWorkout,
  remixWorkout,
  createMemberWorkout,
  updateMemberWorkout,
  deleteMemberWorkout,
  upsertMemberWorkoutExercises,
} from '@/lib/member-workouts'
import type { NewMemberWorkoutExercise } from '@/db/schema'
import { getAuthenticatedMember, assertActiveSubscription } from './_auth'

// --- Org Library (reads only — available in read-only mode) ---

export async function getOrgWorkoutsAction(filters?: {
  category?: string
  level?: string
}) {
  await getAuthenticatedMember()
  return getPublishedWorkouts(filters)
}

export async function getOrgWorkoutAction(workoutId: string) {
  await getAuthenticatedMember()
  return getPublishedWorkout(workoutId)
}

export async function getExerciseCatalogAction(search?: string) {
  await getAuthenticatedMember()
  return getExerciseCatalog(search)
}

// --- Personal Library ---

export async function getMyWorkoutsAction() {
  const member = await getAuthenticatedMember()
  return getMemberWorkouts(member.id)
}

export async function getMyWorkoutAction(workoutId: string) {
  const member = await getAuthenticatedMember()
  return getMemberWorkout(member.id, workoutId)
}

export async function remixWorkoutAction(sourceWorkoutId: string) {
  const member = await getAuthenticatedMember()
  assertActiveSubscription(member)

  const workout = await remixWorkout(member.id, sourceWorkoutId)
  revalidatePath('/workouts/mine')
  return workout
}

export async function createMyWorkoutAction(title: string, category?: string) {
  const member = await getAuthenticatedMember()
  assertActiveSubscription(member)

  const workout = await createMemberWorkout(member.id, title, category)
  revalidatePath('/workouts/mine')
  return workout
}

export async function updateMyWorkoutAction(
  workoutId: string,
  data: { title?: string; category?: string; notes?: string }
) {
  const member = await getAuthenticatedMember()
  assertActiveSubscription(member)

  const workout = await updateMemberWorkout(member.id, workoutId, data)
  revalidatePath('/workouts/mine')
  revalidatePath(`/workouts/mine/${workoutId}`)
  return workout
}

export async function saveMyWorkoutExercisesAction(
  workoutId: string,
  exercises: NewMemberWorkoutExercise[]
) {
  const member = await getAuthenticatedMember()
  assertActiveSubscription(member)

  // verify ownership before mutating
  const existing = await getMemberWorkout(member.id, workoutId)
  if (!existing) throw new Error('Workout not found')

  await upsertMemberWorkoutExercises(workoutId, exercises)
  revalidatePath(`/workouts/mine/${workoutId}`)
}

export async function deleteMyWorkoutAction(workoutId: string) {
  const member = await getAuthenticatedMember()
  assertActiveSubscription(member)

  await deleteMemberWorkout(member.id, workoutId)
  revalidatePath('/workouts/mine')
  redirect('/workouts/mine')
}
