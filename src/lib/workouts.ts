import 'server-only'
import { eq, and, isNull, isNotNull } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { db } from '@/db'
import { workouts, workoutBlocks, exerciseCatalog, coaches } from '@/db/schema'
import { APP_CONFIG } from '@/lib/config'

export type WorkoutStructureBlock = { name: string; detail: string; deleted?: boolean }
export type WorkoutStructureDay = { label: string; blocks: WorkoutStructureBlock[] }
export type WorkoutStructureWeek = { label: string; days: WorkoutStructureDay[] }
export type WorkoutStructure = { weeks?: WorkoutStructureWeek[] }

export async function getPublishedWorkouts(filters?: {
  category?: string
  level?: string
}) {
  'use cache'
  cacheTag('workouts')
  cacheLife('hours')

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
      summary: workouts.summary,
      lengthLabel: workouts.lengthLabel,
      savesCount: workouts.savesCount,
      coachId: workouts.coachId,
      coachName: coaches.displayName,
      coachPhotoUrl: coaches.photoUrl,
    })
    .from(workouts)
    .leftJoin(coaches, eq(workouts.coachId, coaches.id))
    .where(and(...conditions))
    .orderBy(workouts.publishedAt)
}

export async function getPublishedWorkout(workoutId: string) {
  'use cache'
  cacheTag('workouts')
  cacheLife('hours')

  const [row] = await db
    .select({
      id: workouts.id,
      title: workouts.title,
      category: workouts.category,
      level: workouts.level,
      muscleGroups: workouts.muscleGroups,
      durationMinutes: workouts.durationMinutes,
      summary: workouts.summary,
      lengthLabel: workouts.lengthLabel,
      savesCount: workouts.savesCount,
      coachNotes: workouts.coachNotes,
      structure: workouts.structure,
      coachId: workouts.coachId,
      coachName: coaches.displayName,
      coachPhotoUrl: coaches.photoUrl,
      coachBio: coaches.bio,
      coachSpecialties: coaches.specialties,
    })
    .from(workouts)
    .leftJoin(coaches, eq(workouts.coachId, coaches.id))
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.tenantId, APP_CONFIG.tenantId),
        isNotNull(workouts.publishedAt),
        isNull(workouts.deletedAt),
      )
    )
    .limit(1)

  if (!row) return null

  const structure = (row.structure ?? {}) as WorkoutStructure

  const legacyBlocks = structure.weeks?.length
    ? []
    : await db
        .select()
        .from(workoutBlocks)
        .where(eq(workoutBlocks.workoutId, workoutId))
        .orderBy(workoutBlocks.dayIndex, workoutBlocks.orderIndex)

  return { ...row, structure, legacyBlocks }
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
