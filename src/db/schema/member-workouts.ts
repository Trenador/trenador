import { pgTable, uuid, text, smallint, numeric, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { members } from './members'
import { workouts, exerciseCatalog } from './workouts'

// member-owned editable copies of workouts — created by save/remix or authoring from scratch
export const memberWorkouts = pgTable('member_workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  memberId: uuid('member_id').notNull().references(() => members.id),
  // null when authored from scratch; set when cloned from org library
  sourceWorkoutId: uuid('source_workout_id').references(() => workouts.id),
  title: text('title').notNull(),
  category: text('category'),
  notes: text('notes'),
  // weeks/days scaffold mirroring the org library shape so a clone is a faithful copy
  structure: jsonb('structure').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  memberWorkoutsMemberIdx: index('member_workouts_member_idx').on(t.memberId, t.updatedAt),
}))

// exercises within a member-owned workout — the editable, ordered list
export const memberWorkoutExercises = pgTable('member_workout_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberWorkoutId: uuid('member_workout_id').notNull().references(() => memberWorkouts.id, { onDelete: 'cascade' }),
  // null when exercise is free-text (not from the catalog)
  exerciseId: uuid('exercise_id').references(() => exerciseCatalog.id),
  exerciseName: text('exercise_name').notNull(),
  dayIndex: smallint('day_index').notNull().default(0),
  orderIndex: smallint('order_index').notNull(),
  targetSets: smallint('target_sets'),
  targetReps: smallint('target_reps'),
  targetWeightKg: numeric('target_weight_kg', { precision: 6, scale: 2 }),
  // 1–10; validated at app layer
  targetRpe: smallint('target_rpe'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  mweWorkoutIdx: index('mwe_workout_idx').on(t.memberWorkoutId, t.dayIndex, t.orderIndex),
}))

export type MemberWorkout = typeof memberWorkouts.$inferSelect
export type NewMemberWorkout = typeof memberWorkouts.$inferInsert
export type MemberWorkoutExercise = typeof memberWorkoutExercises.$inferSelect
export type NewMemberWorkoutExercise = typeof memberWorkoutExercises.$inferInsert
