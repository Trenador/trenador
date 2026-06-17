import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { members } from '@/db/schema'

const TRIAL_DAYS = 7

// React.cache() deduplicates calls within a single server request —
// layouts and actions that both call this only hit the DB once per render.
export const getAuthenticatedMember = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.authUserId, user.id))
    .limit(1)

  if (!member) redirect('/login')
  return member
})

// Admins always have access. Active subscribers always have access.
// Everyone else gets a 14-day trial window from their signup date.
export function isMemberActive(member: {
  isAdmin: boolean
  subscriptionStatus: string
  createdAt: Date
}): boolean {
  if (member.isAdmin) return true
  if (member.subscriptionStatus === 'active') return true
  const trialEnds = new Date(member.createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
  return trialEnds > new Date()
}

export function assertActiveSubscription(member: {
  isAdmin: boolean
  subscriptionStatus: string
  createdAt: Date
}) {
  if (!isMemberActive(member)) redirect('/subscribe')
}
