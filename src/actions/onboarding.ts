'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { members, coaches, intakeSubmissions } from '@/db/schema'
import { APP_CONFIG } from '@/lib/config'
import { eq, and, asc } from 'drizzle-orm'

export async function getCoachesForPicker() {
  return db
    .select({
      id: coaches.id,
      displayName: coaches.displayName,
      specialty: coaches.specialties,
      headline: coaches.headline,
      bio: coaches.bio,
      gym: coaches.gym,
      location: coaches.location,
      certifications: coaches.certifications,
      photoUrl: coaches.photoUrl,
    })
    .from(coaches)
    .where(and(eq(coaches.tenantId, APP_CONFIG.tenantId), eq(coaches.active, true)))
    .orderBy(asc(coaches.displayName))
}

export async function completeOnboarding(data: {
  firstName: string
  lastName: string
  yearOfBirth: number
  gender: string
  weightLbs: number
  coachId: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not authenticated' }

  const [member] = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.authUserId, user.id))
    .limit(1)

  if (!member) return { error: 'member record not found' }

  const displayName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim()

  await db.update(members).set({
    displayName,
    yearOfBirth: data.yearOfBirth,
    gender: data.gender,
    weightLbs: String(data.weightLbs),
    assignedCoachId: data.coachId,
    updatedAt: new Date(),
  }).where(eq(members.id, member.id))

  await db.insert(intakeSubmissions).values({
    tenantId: APP_CONFIG.tenantId,
    memberId: member.id,
    data: {
      weight_display: `${data.weightLbs} lbs`,
      year_of_birth: data.yearOfBirth,
      gender: data.gender,
    },
    goalPrimary: '',
    locationPref: '',
  })

  return { success: true }
}
