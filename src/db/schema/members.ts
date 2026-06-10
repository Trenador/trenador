import { pgTable, uuid, text, integer, numeric, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  // references supabase auth.users, not a drizzle fk since auth lives in a separate schema
  authUserId: uuid('auth_user_id').notNull().unique(),
  displayName: text('display_name').notNull(),
  photoUrl: text('photo_url'),
  phone: text('phone'),
  // set when an admin verifies the member's gym membership
  memberVerifiedAt: timestamp('member_verified_at', { withTimezone: true }),
  suspendedAt: timestamp('suspended_at', { withTimezone: true }),
  isAdmin: boolean('is_admin').notNull().default(false),
  // stripe
  stripeCustomerId: text('stripe_customer_id').unique(),
  // 'inactive' | 'active' | 'canceled' | 'past_due'
  subscriptionStatus: text('subscription_status').notNull().default('inactive'),
  yearOfBirth: integer('year_of_birth'),
  gender: text('gender'),
  weightLbs: numeric('weight_lbs', { precision: 5, scale: 1 }),
  // reserved for future ABC Fitness integration
  externalMemberId: text('external_member_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// versioned, members can re-take the intake form and each submission gets its own row
export const intakeSubmissions = pgTable('intake_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  memberId: uuid('member_id').notNull().references(() => members.id),
  version: integer('version').notNull().default(1),
  // full intake form stored as jsonb for flexibility
  data: jsonb('data').notNull(),
  // indexed columns pulled out of jsonb for coach matching queries
  goalPrimary: text('goal_primary'),
  genderPref: text('gender_pref'),
  locationPref: text('location_pref'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const memberCodes = pgTable('member_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  code: text('code').notNull(),
  usedBy: uuid('used_by').references(() => members.id),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type MemberCode = typeof memberCodes.$inferSelect
export type NewMemberCode = typeof memberCodes.$inferInsert

// append-only, never deleted, legal record of acceptance
export const termsAcceptances = pgTable('terms_acceptances', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id),
  termsVersion: text('terms_version').notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
})

export type Member = typeof members.$inferSelect
export type NewMember = typeof members.$inferInsert
export type IntakeSubmission = typeof intakeSubmissions.$inferSelect
export type NewIntakeSubmission = typeof intakeSubmissions.$inferInsert
export type TermsAcceptance = typeof termsAcceptances.$inferSelect
export type NewTermsAcceptance = typeof termsAcceptances.$inferInsert
