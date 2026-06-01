import 'server-only'
import { eq, and, isNull, isNotNull } from 'drizzle-orm'
import { db } from '@/db'
import { workouts, workoutBlocks, exerciseCatalog } from '@/db/schema'
import { APP_CONFIG } from '@/lib/config'

export async function getPublishedWorkouts(filters?: {
  category?: string
  level?: string
  muscleGroup?: string
}) {
  const conditions = [
    eq(workouts.tenantId, APP_CONFIG.tenantId),
    isNotNull(workouts.publishedAt),
    isNull(workouts.deletedAt),
  ]

  if (filters?.category) {
    conditions.push(eq(workouts.category, filters.category))
  }
  if (filters?.level) {
    conditions.push(eq(workouts.level, filters.level))
  }

  return db
    .select({
      id: workouts.id,
      title: workouts.title,
      category: workouts.category,
      level: workouts.level,
      muscleGroups: workouts.muscleGroups,
      durationMinutes: workouts.durationMinutes,
      coachNotes: workouts.coachNotes,
      publishedAt: workouts.publishedAt,
    })
    .from(workouts)
    .where(and(...conditions))
    .orderBy(workouts.publishedAt)
}

export async function getPublishedWorkout(workoutId: string) {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.tenantId, APP_CONFIG.tenantId),
        isNotNull(workouts.publishedAt),
        isNull(workouts.deletedAt),
      )
    )
    .limit(1)

  if (!workout) return null

  const blocks = await db
    .select()
    .from(workoutBlocks)
    .where(eq(workoutBlocks.workoutId, workoutId))
    .orderBy(workoutBlocks.dayIndex, workoutBlocks.orderIndex)

  return { ...workout, blocks }
}

export async function getExerciseCatalog(search?: string) {
  const rows = await db
    .select({
      id: exerciseCatalog.id,
      name: exerciseCatalog.name,
      category: exerciseCatalog.category,
      muscleGroup: exerciseCatalog.muscleGroup,
    })
    .from(exerciseCatalog)
    .where(eq(exerciseCatalog.tenantId, APP_CONFIG.tenantId))
    .orderBy(exerciseCatalog.name)

  if (!search) return rows
  const q = search.toLowerCase()
  return rows.filter(r => r.name.toLowerCase().includes(q))
}
