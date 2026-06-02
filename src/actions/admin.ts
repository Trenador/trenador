'use server'

import { redirect } from 'next/navigation'
import { db } from '@/db'
import { members } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedMember } from './_auth'

async function requireAdmin() {
  const member = await getAuthenticatedMember()
  if (!member.isAdmin) redirect('/chat')
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
