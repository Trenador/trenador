import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { members } from '@/db/schema'

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

export function assertActiveSubscription(member: { subscriptionStatus: string }) {
  if (member.subscriptionStatus !== 'active') redirect('/subscribe')
}
