'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { members } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('not authenticated')

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.authUserId, user.id))
    .limit(1)

  if (!member?.isAdmin) throw new Error('not authorized')
  return member
}

export async function toggleMemberVerified(formData: FormData) {
  await requireAdmin()

  const memberId = formData.get('memberId') as string
  const isCurrentlyVerified = formData.get('verified') === 'true'

  await db
    .update(members)
    .set({ memberVerifiedAt: isCurrentlyVerified ? null : new Date() })
    .where(eq(members.id, memberId))

  revalidatePath('/admin/members')
}

export async function toggleMemberSuspended(formData: FormData) {
  await requireAdmin()

  const memberId = formData.get('memberId') as string
  const isCurrentlySuspended = formData.get('suspended') === 'true'

  await db
    .update(members)
    .set({ suspendedAt: isCurrentlySuspended ? null : new Date() })
    .where(eq(members.id, memberId))

  revalidatePath('/admin/members')
}
