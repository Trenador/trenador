import { pgTable, uuid, text, smallint, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { coaches } from './coaches'

// per-tenant reference list used for autocomplete in the log composer and personal library builder
export const exerciseCatalog = pgTable('exercise_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  category: text('category'), // push/pull/legs/cardio/mobility/other
  muscleGroup: text('muscle_group'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  catalogTenantIdx: index('exercise_catalog_tenant_idx').on(t.tenantId, t.name),
}))

// admin-authored, published workouts — browse-only for members
export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  coachId: uuid('coach_id').references(() => coaches.id),
  title: text('title').notNull(),
  category: text('category'), // Push/Pull/Legs/Full body/Cardio/Mobility/Other
  level: text('level'), // beginner/intermediate/advanced
  muscleGroups: text('muscle_groups').array().notNull().default([]),
  durationMinutes: integer('duration_minutes'),
  summary: text('summary'),
  lengthLabel: text('length_label'),
  savesCount: integer('saves_count').notNull().default(0),
  coachNotes: text('coach_notes'),
  // weeks/days scaffold: { weeks: [{ label, days: [{ label, blocks: [{name,detail}] }] }] }
  structure: jsonb('structure').notNull().default({}),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  workoutsTenantIdx: index('workouts_tenant_idx').on(t.tenantId, t.publishedAt),
}))

// blocks within an org library workout (warmup/main/accessory/finisher)
// exercises stored as JSONB: [{name, exerciseId?, targetSets?, targetReps?, targetWeightKg?, notes?}]
// members never mutate these — save/remix deep-copies into member_workout_exercises
export const workoutBlocks = pgTable('workout_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutId: uuid('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  dayIndex: smallint('day_index').notNull().default(0),
  orderIndex: smallint('order_index').notNull(),
  exercises: jsonb('exercises').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  blocksWorkoutIdx: index('workout_blocks_workout_idx').on(t.workoutId, t.dayIndex, t.orderIndex),
}))

export type ExerciseCatalog = typeof exerciseCatalog.$inferSelect
export type NewExerciseCatalog = typeof exerciseCatalog.$inferInsert
export type Workout = typeof workouts.$inferSelect
export type NewWorkout = typeof workouts.$inferInsert
export type WorkoutBlock = typeof workoutBlocks.$inferSelect
export type NewWorkoutBlock = typeof workoutBlocks.$inferInsert
