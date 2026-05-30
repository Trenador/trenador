import 'server-only'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { members } from '@/db/schema'

export async function requireActiveSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [member] = await db
    .select({ subscriptionStatus: members.subscriptionStatus })
    .from(members)
    .where(eq(members.authUserId, user.id))
    .limit(1)

  if (!member || member.subscriptionStatus !== 'active') {
    redirect('/subscribe')
  }
}
