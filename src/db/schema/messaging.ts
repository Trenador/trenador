import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { members } from './members'

export const coachMessages = pgTable('coach_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  memberId: uuid('member_id').notNull().references(() => members.id),
  // 'member' = sent by the member, 'coach' = sent by admin/coach
  senderRole: text('sender_role').notNull(),
  content: text('content').notNull(),
  // set when the other party views the message
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type CoachMessage = typeof coachMessages.$inferSelect
export type NewCoachMessage = typeof coachMessages.$inferInsert
