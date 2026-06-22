import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { members } from './members'

export const threads = pgTable('threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  memberId: uuid('member_id').notNull().references(() => members.id),
  title: text('title'),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  pinnedAt: timestamp('pinned_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => threads.id),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  // retained for cost observability (arch doc §12)
  modelUsed: text('model_used'),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Thread = typeof threads.$inferSelect
export type NewThread = typeof threads.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
