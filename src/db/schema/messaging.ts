import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { members } from './members'
import { coaches } from './coaches'

export const coachMessages = pgTable('coach_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  memberId: uuid('member_id').notNull().references(() => members.id),
  senderRole: text('sender_role').notNull(),
  senderCoachId: uuid('sender_coach_id').references(() => coaches.id),
  content: text('content').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type CoachMessage = typeof coachMessages.$inferSelect
export type NewCoachMessage = typeof coachMessages.$inferInsert
