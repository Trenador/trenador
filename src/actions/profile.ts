'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { members } from '@/db/schema'
import { getAuthenticatedMember } from './_auth'

export async function updateProfileAction(data: {
  displayName: string
  yearOfBirth: number | null
  gender: string | null
  weightLbs: number | null
  photoUrl: string | null
}) {
  const member = await getAuthenticatedMember()

  const name = data.displayName.trim()
  if (!name) throw new Error('Name is required')

  await db
    .update(members)
    .set({
      displayName: name,
      yearOfBirth: data.yearOfBirth ?? undefined,
      gender: data.gender ?? undefined,
      weightLbs: data.weightLbs !== null ? String(data.weightLbs) : undefined,
      photoUrl: data.photoUrl !== null ? data.photoUrl : undefined,
      updatedAt: new Date(),
    })
    .where(eq(members.id, member.id))

  revalidatePath('/', 'layout')
}
