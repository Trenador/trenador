'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { members } from '@/db/schema'
import {
  seedLogSession,
  saveWorkoutLog,
  getWorkoutLogHistory,
  getWorkoutLogDetail,
  type SeedSource,
  type LogExerciseInput,
} from '@/lib/workout-logging'

async function getAuthenticatedMember() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.authUserId, user.id))
    .limit(1)

  if (!member) redirect('/login')
  return member
}

function assertActiveSubscription(member: { subscriptionStatus: string }) {
  if (member.subscriptionStatus !== 'active') redirect('/subscribe')
}

// seeds the log composer — read, no subscription gate (available in read-only mode)
export async function seedLogSessionAction(source: SeedSource) {
  const member = await getAuthenticatedMember()

  // inject memberId for repeat_last source
  const resolvedSource: SeedSource =
    source.type === 'repeat_last'
      ? { type: 'repeat_last', memberId: member.id }
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
