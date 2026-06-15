import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const coaches = pgTable('coaches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  // nullable, coaches may exist in the system before they have app logins
  authUserId: uuid('auth_user_id'),
  displayName: text('display_name').notNull(),
  slug: text('slug').notNull().unique(),
  photoUrl: text('photo_url'),
  bio: text('bio'),
  location: text('location'),
  gender: text('gender'),
  specialties: text('specialties').array().notNull().default([]),
  headline: text('headline'),
  certifications: text('certifications').array().notNull().default([]),
  gym: text('gym'),
  systemPrompt: text('system_prompt'),
  introVideoUrl: text('intro_video_url'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Coach = typeof coaches.$inferSelect
export type NewCoach = typeof coaches.$inferInsert
