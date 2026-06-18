import 'server-only'
import { eq, and, isNull } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { memberWorkouts, memberWorkoutExercises, workouts, workoutBlocks } from '@/db/schema'
import { APP_CONFIG } from '@/lib/config'
import type { NewMemberWorkout, NewMemberWorkoutExercise } from '@/db/schema'

export async function getMemberWorkouts(memberId: string) {
  return db
    .select({
      id: memberWorkouts.id,
      title: memberWorkouts.title,
      category: memberWorkouts.category,
      sourceWorkoutId: memberWorkouts.sourceWorkoutId,
      structure: memberWorkouts.structure,
      updatedAt: memberWorkouts.updatedAt,
      createdAt: memberWorkouts.createdAt,
      // prefer member_workouts columns; fall back to source workout for old remixed copies
      level: sql<string | null>`COALESCE(${memberWorkouts.level}, ${workouts.level})`,
      muscleGroups: sql<string[]>`COALESCE(NULLIF(${memberWorkouts.tags}, '{}'), ${workouts.muscleGroups}, '{}')`,
      durationMinutes: sql<number | null>`COALESCE(${memberWorkouts.durationMinutes}, ${workouts.durationMinutes})`,
    })
    .from(memberWorkouts)
    .leftJoin(workouts, eq(memberWorkouts.sourceWorkoutId, workouts.id))
    .where(
      and(
        eq(memberWorkouts.memberId, memberId),
        eq(memberWorkouts.tenantId, APP_CONFIG.tenantId),
        isNull(memberWorkouts.deletedAt),
      )
    )
    .orderBy(memberWorkouts.updatedAt)
}

export async function getMemberWorkout(memberId: string, workoutId: string) {
  const [workout] = await db
    .select()
    .from(memberWorkouts)
    .where(
      and(
        eq(memberWorkouts.id, workoutId),
        eq(memberWorkouts.memberId, memberId),
        eq(memberWorkouts.tenantId, APP_CONFIG.tenantId),
        isNull(memberWorkouts.deletedAt),
      )
    )
    .limit(1)

  if (!workout) return null

  const exercises = await db
    .select()
    .from(memberWorkoutExercises)
    .where(eq(memberWorkoutExercises.memberWorkoutId, workoutId))
    .orderBy(memberWorkoutExercises.dayIndex, memberWorkoutExercises.orderIndex)

  return { ...workout, exercises }
}

// clones an org library workout into the member's personal library
export async function remixWorkout(memberId: string, sourceWorkoutId: string) {
  const source = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, sourceWorkoutId),
        eq(workouts.tenantId, APP_CONFIG.tenantId),
        isNull(workouts.deletedAt),
      )
    )
    .limit(1)

  if (!source[0]) throw new Error('Workout not found')

  const blocks = await db
    .select()
    .from(workoutBlocks)
    .where(eq(workoutBlocks.workoutId, sourceWorkoutId))
    .orderBy(workoutBlocks.dayIndex, workoutBlocks.orderIndex)

  const [newWorkout] = await db
    .insert(memberWorkouts)
    .values({
      tenantId: APP_CONFIG.tenantId,
      memberId,
      sourceWorkoutId,
      title: source[0].title,
      category: source[0].category ?? undefined,
      level: source[0].level ?? undefined,
      durationMinutes: source[0].durationMinutes ?? undefined,
      tags: (source[0].muscleGroups as string[] | null) ?? [],
      summary: source[0].summary ?? undefined,
      structure: source[0].structure as Record<string, unknown>,
    } satisfies NewMemberWorkout)
    .returning()

  if (!newWorkout) throw new Error('Failed to create workout')

  // deep-copy blocks into member_workout_exercises rows
  const exerciseRows: NewMemberWorkoutExercise[] = blocks.flatMap(block => {
    const exercises = Array.isArray(block.exercises) ? block.exercises as Array<{
      name: string
      exerciseId?: string
      targetSets?: number
      targetReps?: number
      targetWeightKg?: number
      notes?: string
    }> : []
    return exercises.map((ex, idx) => ({
      memberWorkoutId: newWorkout.id,
      exerciseId: ex.exerciseId ?? undefined,
      exerciseName: ex.name,
      dayIndex: block.dayIndex,
      orderIndex: idx,
      targetSets: ex.targetSets ?? undefined,
      targetReps: ex.targetReps ?? undefined,
      targetWeightKg: ex.targetWeightKg ? String(ex.targetWeightKg) : undefined,
      notes: ex.notes ?? undefined,
    }))
  })

  if (exerciseRows.length > 0) {
    await db.insert(memberWorkoutExercises).values(exerciseRows)
  }

  return newWorkout
}

export async function createMemberWorkout(
  memberId: string,
  data: {
    title: string
    category?: string
    level?: string
    durationMinutes?: number
    numWeeks?: number
    tags?: string[]
    summary?: string
    bannerUrl?: string
  },
) {
  const [workout] = await db
    .insert(memberWorkouts)
    .values({
      tenantId: APP_CONFIG.tenantId,
      memberId,
      title: data.title,
      category: data.category ?? undefined,
      level: data.level ?? undefined,
      durationMinutes: data.durationMinutes ?? undefined,
      numWeeks: data.numWeeks ?? undefined,
      tags: data.tags ?? [],
      summary: data.summary ?? undefined,
      bannerUrl: data.bannerUrl ?? undefined,
      structure: {},
    } satisfies NewMemberWorkout)
    .returning()

  if (!workout) throw new Error('Failed to create workout')
  return workout
}

export async function updateMemberWorkoutStructure(
  memberId: string,
  workoutId: string,
  structure: Record<string, unknown>
) {
  const [updated] = await db
    .update(memberWorkouts)
    .set({ structure, updatedAt: new Date() })
    .where(
      and(
        eq(memberWorkouts.id, workoutId),
        eq(memberWorkouts.memberId, memberId),
        isNull(memberWorkouts.deletedAt),
      )
    )
    .returning()
  return updated ?? null
}

export async function updateMemberWorkout(
  memberId: string,
  workoutId: string,
  data: { title?: string; category?: string; level?: string; durationMinutes?: number; numWeeks?: number; tags?: string[]; summary?: string; bannerUrl?: string; notes?: string }
) {
  const [updated] = await db
    .update(memberWorkouts)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(memberWorkouts.id, workoutId),
        eq(memberWorkouts.memberId, memberId),
        isNull(memberWorkouts.deletedAt),
      )
    )
    .returning()

  return updated ?? null
}

export async function deleteMemberWorkout(memberId: string, workoutId: string) {
  await db
    .update(memberWorkouts)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(memberWorkouts.id, workoutId),
        eq(memberWorkouts.memberId, memberId),
        isNull(memberWorkouts.deletedAt),
      )
    )
}

export async function upsertMemberWorkoutExercises(
  workoutId: string,
  exercises: NewMemberWorkoutExercise[]
) {
  await db
    .delete(memberWorkoutExercises)
    .where(eq(memberWorkoutExercises.memberWorkoutId, workoutId))

  if (exercises.length > 0) {
    await db.insert(memberWorkoutExercises).values(exercises)
  }
}
