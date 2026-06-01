import 'server-only'
import { eq, and, isNull, isNotNull, gte, desc, sql, inArray } from 'drizzle-orm'
import { db } from '@/db'
import {
  workoutLogs,
  workoutLogExercises,
  workoutLogSets,
  memberWorkouts,
  memberWorkoutExercises,
  workouts,
  workoutBlocks,
} from '@/db/schema'
import { APP_CONFIG } from '@/lib/config'
import type { NewWorkoutLog, NewWorkoutLogExercise, NewWorkoutLogSet } from '@/db/schema'

export type SeedSource =
  | { type: 'blank' }
  | { type: 'repeat_last'; memberId: string }
  | { type: 'org_workout'; workoutId: string }
  | { type: 'member_workout'; workoutId: string }

export type LogExerciseInput = {
  exerciseId: string | undefined
  exerciseName: string
  orderIndex: number
  notes: string | undefined
  sets: Array<{
    setNumber: number
    reps: number | undefined
    weightKg: number | undefined
    durationSeconds: number | undefined
    distanceMeters: number | undefined
    rpe: number | undefined
    isWarmup: boolean | undefined
    notes: string | undefined
  }>
}

// builds the pre-fill data for a new logging session from a seed source
export async function seedLogSession(source: SeedSource): Promise<{
  title: string
  exercises: Array<{ name: string; exerciseId: string | undefined; targetSets: number | undefined; targetReps: number | undefined; targetWeightKg: number | undefined }>
  sourceWorkoutId: string | undefined
  sourceMemberWorkoutId: string | undefined
}> {
  if (source.type === 'blank') {
    return { title: 'New Workout', exercises: [], sourceWorkoutId: undefined, sourceMemberWorkoutId: undefined }
  }

  if (source.type === 'repeat_last') {
    const [lastLog] = await db
      .select({ id: workoutLogs.id })
      .from(workoutLogs)
      .where(
        and(
          eq(workoutLogs.memberId, source.memberId),
          eq(workoutLogs.tenantId, APP_CONFIG.tenantId),
          isNull(workoutLogs.deletedAt),
        )
      )
      .orderBy(desc(workoutLogs.loggedAt))
      .limit(1)

    if (!lastLog) return { title: 'New Workout', exercises: [], sourceWorkoutId: undefined, sourceMemberWorkoutId: undefined }

    const exercises = await db
      .select()
      .from(workoutLogExercises)
      .where(eq(workoutLogExercises.workoutLogId, lastLog.id))
      .orderBy(workoutLogExercises.orderIndex)

    return {
      title: 'Repeat Last Workout',
      exercises: exercises.map(e => ({ name: e.exerciseName, exerciseId: e.exerciseId ?? undefined, targetSets: undefined, targetReps: undefined, targetWeightKg: undefined })),
      sourceWorkoutId: undefined,
      sourceMemberWorkoutId: undefined,
    }
  }

  if (source.type === 'org_workout') {
    const [workout] = await db
      .select({ title: workouts.title })
      .from(workouts)
      .where(eq(workouts.id, source.workoutId))
      .limit(1)

    if (!workout) return { title: 'New Workout', exercises: [], sourceWorkoutId: undefined, sourceMemberWorkoutId: undefined }

    const blocks = await db
      .select()
      .from(workoutBlocks)
      .where(eq(workoutBlocks.workoutId, source.workoutId))
      .orderBy(workoutBlocks.dayIndex, workoutBlocks.orderIndex)

    const exercises = blocks.flatMap(block => {
      const exList = block.exercises as Array<{
        name: string
        exerciseId?: string
        targetSets?: number
        targetReps?: number
        targetWeightKg?: number
      }>
      return exList.map(ex => ({
        name: ex.name,
        exerciseId: ex.exerciseId,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        targetWeightKg: ex.targetWeightKg,
      }))
    })

    return { title: workout.title, exercises, sourceWorkoutId: source.workoutId, sourceMemberWorkoutId: undefined }
  }

  // member_workout
  const [workout] = await db
    .select({ title: memberWorkouts.title })
    .from(memberWorkouts)
    .where(eq(memberWorkouts.id, source.workoutId))
    .limit(1)

  if (!workout) return { title: 'New Workout', exercises: [], sourceWorkoutId: undefined, sourceMemberWorkoutId: undefined }

  const exercises = await db
    .select()
    .from(memberWorkoutExercises)
    .where(eq(memberWorkoutExercises.memberWorkoutId, source.workoutId))
    .orderBy(memberWorkoutExercises.dayIndex, memberWorkoutExercises.orderIndex)

  return {
    title: workout.title,
    exercises: exercises.map(e => ({
      name: e.exerciseName,
      exerciseId: e.exerciseId ?? undefined,
      targetSets: e.targetSets ?? undefined,
      targetReps: e.targetReps ?? undefined,
      targetWeightKg: e.targetWeightKg ? Number(e.targetWeightKg) : undefined,
    })),
    sourceMemberWorkoutId: source.workoutId,
    sourceWorkoutId: undefined,
  }
}

export async function saveWorkoutLog(
  memberId: string,
  input: {
    workoutType: string | undefined
    durationMinutes: number | undefined
    notes: string | undefined
    sourceWorkoutId: string | undefined
    sourceMemberWorkoutId: string | undefined
    exercises: LogExerciseInput[]
  }
) {
  const [log] = await db
    .insert(workoutLogs)
    .values({
      tenantId: APP_CONFIG.tenantId,
      memberId,
      workoutType: input.workoutType,
      durationMinutes: input.durationMinutes,
      notes: input.notes,
      sourceWorkoutId: input.sourceWorkoutId,
      sourceMemberWorkoutId: input.sourceMemberWorkoutId,
      loggedAt: new Date(),
    } satisfies NewWorkoutLog)
    .returning()

  if (!log) throw new Error('Failed to save workout log')

  for (const exercise of input.exercises) {
    const [logExercise] = await db
      .insert(workoutLogExercises)
      .values({
        workoutLogId: log.id,
        exerciseId: exercise.exerciseId ?? undefined,
        exerciseName: exercise.exerciseName,
        orderIndex: exercise.orderIndex,
        notes: exercise.notes ?? undefined,
      } satisfies NewWorkoutLogExercise)
      .returning()

    if (!logExercise) continue

    if (exercise.sets.length > 0) {
      await db.insert(workoutLogSets).values(
        exercise.sets.map(s => ({
          workoutLogExerciseId: logExercise.id,
          setNumber: s.setNumber,
          reps: s.reps ?? undefined,
          weightKg: s.weightKg ? String(s.weightKg) : undefined,
          durationSeconds: s.durationSeconds ?? undefined,
          distanceMeters: s.distanceMeters ? String(s.distanceMeters) : undefined,
          rpe: s.rpe ?? undefined,
          isWarmup: s.isWarmup ?? false,
          notes: s.notes ?? undefined,
        }) satisfies NewWorkoutLogSet)
      )
    }
  }

  return log
}

export async function getWorkoutLogHistory(memberId: string) {
  return db
    .select({
      id: workoutLogs.id,
      workoutType: workoutLogs.workoutType,
      durationMinutes: workoutLogs.durationMinutes,
      notes: workoutLogs.notes,
      sourceWorkoutId: workoutLogs.sourceWorkoutId,
      sourceMemberWorkoutId: workoutLogs.sourceMemberWorkoutId,
      loggedAt: workoutLogs.loggedAt,
    })
    .from(workoutLogs)
    .where(
      and(
        eq(workoutLogs.memberId, memberId),
        eq(workoutLogs.tenantId, APP_CONFIG.tenantId),
        isNull(workoutLogs.deletedAt),
      )
    )
    .orderBy(desc(workoutLogs.loggedAt))
    .limit(100)
}

export async function getWorkoutLogDetail(memberId: string, logId: string) {
  const [log] = await db
    .select()
    .from(workoutLogs)
    .where(
      and(
        eq(workoutLogs.id, logId),
        eq(workoutLogs.memberId, memberId),
        isNull(workoutLogs.deletedAt),
      )
    )
    .limit(1)

  if (!log) return null

  const exercises = await db
    .select()
    .from(workoutLogExercises)
    .where(eq(workoutLogExercises.workoutLogId, logId))
    .orderBy(workoutLogExercises.orderIndex)

  const exerciseIds = exercises.map(e => e.id)
  const allSets = exerciseIds.length > 0
    ? await db
        .select()
        .from(workoutLogSets)
        .where(inArray(workoutLogSets.workoutLogExerciseId, exerciseIds))
        .orderBy(workoutLogSets.setNumber)
    : []

  const setsByExercise = new Map<string, typeof allSets>()
  for (const set of allSets) {
    const bucket = setsByExercise.get(set.workoutLogExerciseId) ?? []
    bucket.push(set)
    setsByExercise.set(set.workoutLogExerciseId, bucket)
  }

  const exercisesWithSets = exercises.map(exercise => ({
    ...exercise,
    sets: setsByExercise.get(exercise.id) ?? [],
  }))

  return { ...log, exercises: exercisesWithSets }
}

// aggregates last 30 days of logs into a plain-text summary for the AI context snapshot
export async function getThirtyDayLogSummary(memberId: string): Promise<string | null> {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const logs = await db
    .select({
      id: workoutLogs.id,
      workoutType: workoutLogs.workoutType,
      durationMinutes: workoutLogs.durationMinutes,
      loggedAt: workoutLogs.loggedAt,
      sourceWorkoutId: workoutLogs.sourceWorkoutId,
      sourceMemberWorkoutId: workoutLogs.sourceMemberWorkoutId,
    })
    .from(workoutLogs)
    .where(
      and(
        eq(workoutLogs.memberId, memberId),
        eq(workoutLogs.tenantId, APP_CONFIG.tenantId),
        isNull(workoutLogs.deletedAt),
        gte(workoutLogs.loggedAt, since),
      )
    )
    .orderBy(desc(workoutLogs.loggedAt))

  if (logs.length === 0) return null

  const total = logs.length
  const seededFromGym = logs.filter(l => l.sourceWorkoutId).length
  const seededFromPersonal = logs.filter(l => l.sourceMemberWorkoutId).length

  const typeCounts: Record<string, number> = {}
  for (const log of logs) {
    const type = log.workoutType ?? 'Other'
    typeCounts[type] = (typeCounts[type] ?? 0) + 1
  }

  const typeBreakdown = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${type} (${count})`)
    .join(', ')

  const lines = [
    `Training in the last 30 days (self-reported): ${total} session${total !== 1 ? 's' : ''}.`,
    typeBreakdown ? `Workout types: ${typeBreakdown}.` : null,
    seededFromGym > 0 ? `${seededFromGym} session${seededFromGym !== 1 ? 's' : ''} used a gym-published workout as a starting point.` : null,
    seededFromPersonal > 0 ? `${seededFromPersonal} session${seededFromPersonal !== 1 ? 's' : ''} used a saved personal workout.` : null,
  ].filter(Boolean)

  return lines.join(' ')
}
