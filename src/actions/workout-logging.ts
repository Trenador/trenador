'use server'

import { revalidatePath } from 'next/cache'
import {
  seedLogSession,
  saveWorkoutLog,
  getWorkoutLogHistory,
  getWorkoutLogDetail,
  type SeedSourceInput,
  type LogExerciseInput,
} from '@/lib/workout-logging'
import { getAuthenticatedMember, assertActiveSubscription } from './_auth'

// seeds the log composer — read, no subscription gate (available in read-only mode)
export async function seedLogSessionAction(source: SeedSourceInput) {
  const member = await getAuthenticatedMember()

  // inject memberId for repeat_last source
  const resolvedSource: Parameters<typeof seedLogSession>[0] =
    source.type === 'repeat_last'
      ? { type: 'repeat_last', memberId: member.id }
      : source.type === 'member_workout'
        ? { type: 'member_workout', workoutId: source.workoutId, memberId: member.id }
        : source

  return seedLogSession(resolvedSource)
}

// saving a log is a write — requires active subscription
export async function saveWorkoutLogAction(input: {
  workoutType: string | undefined
  durationMinutes: number | undefined
  notes: string | undefined
  sourceWorkoutId: string | undefined
  sourceMemberWorkoutId: string | undefined
  exercises: LogExerciseInput[]
}) {
  const member = await getAuthenticatedMember()
  assertActiveSubscription(member)

  const log = await saveWorkoutLog(member.id, input)
  revalidatePath('/log/history')
  return log
}

// history reads — available in read-only mode
export async function getWorkoutLogHistoryAction() {
  const member = await getAuthenticatedMember()
  return getWorkoutLogHistory(member.id)
}

export async function getWorkoutLogDetailAction(logId: string) {
  const member = await getAuthenticatedMember()
  const log = await getWorkoutLogDetail(member.id, logId)
  if (!log) throw new Error('Log not found')
  return log
}
