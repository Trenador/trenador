import { pgTable, uuid, text, smallint, integer, numeric, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { members } from './members'
import { workouts, exerciseCatalog } from './workouts'
import { memberWorkouts } from './member-workouts'

// single source of truth for what a member actually performed
export const workoutLogs = pgTable('workout_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  memberId: uuid('member_id').notNull().references(() => members.id),
  workoutType: text('workout_type'), // Push/Pull/Legs/Full body/Cardio/Mobility/Other
  durationMinutes: integer('duration_minutes'),
  // 1–5 energy scales; validated at app layer
  energyPre: smallint('energy_pre'),
  energyPost: smallint('energy_post'),
  notes: text('notes'),
  // at most one source FK is set; both null = blank/repeat-last session
  sourceWorkoutId: uuid('source_workout_id').references(() => workouts.id),
  sourceMemberWorkoutId: uuid('source_member_workout_id').references(() => memberWorkouts.id),
  loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  workoutLogsMemberIdx: index('workout_logs_member_idx').on(t.memberId, t.loggedAt),
  workoutLogsSourceWorkoutIdx: index('workout_logs_source_workout_idx').on(t.sourceWorkoutId),
  workoutLogsSourceMemberWorkoutIdx: index('workout_logs_source_member_workout_idx').on(t.sourceMemberWorkoutId),
}))

// exercises performed in a logged session
export const workoutLogExercises = pgTable('workout_log_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutLogId: uuid('workout_log_id').notNull().references(() => workoutLogs.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').references(() => exerciseCatalog.id),
  exerciseName: text('exercise_name').notNull(),
  orderIndex: smallint('order_index').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  wleLogIdx: index('wle_log_idx').on(t.workoutLogId, t.orderIndex),
}))

// actual sets performed for each exercise in a log — real numbers, not targets
export const workoutLogSets = pgTable('workout_log_sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutLogExerciseId: uuid('workout_log_exercise_id').notNull().references(() => workoutLogExercises.id, { onDelete: 'cascade' }),
  setNumber: smallint('set_number').notNull(),
  reps: smallint('reps'),
  weightLbs: numeric('weight_lbs', { precision: 6, scale: 2 }),
  durationSeconds: integer('duration_seconds'),
  distanceMeters: numeric('distance_meters', { precision: 8, scale: 2 }),
  isWarmup: boolean('is_warmup').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  wlsExerciseIdx: index('wls_exercise_idx').on(t.workoutLogExerciseId, t.setNumber),
}))

export type WorkoutLog = typeof workoutLogs.$inferSelect
export type NewWorkoutLog = typeof workoutLogs.$inferInsert
export type WorkoutLogExercise = typeof workoutLogExercises.$inferSelect
export type NewWorkoutLogExercise = typeof workoutLogExercises.$inferInsert
export type WorkoutLogSet = typeof workoutLogSets.$inferSelect
export type NewWorkoutLogSet = typeof workoutLogSets.$inferInsert
