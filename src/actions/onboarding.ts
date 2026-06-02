'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { memberCodes, members, intakeSubmissions } from '@/db/schema'
import { APP_CONFIG } from '@/lib/config'
import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'

const verifyCodeSchema = z.object({
  code: z.string().min(1, 'please enter your member code'),
})

export async function verifyMemberCode(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'not authenticated' }

  const parsed = verifyCodeSchema.safeParse({ code: formData.get('code') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'invalid input' }
  }

  const code = parsed.data.code.trim().toUpperCase()

  // find a matching unused code for this tenant
  const [matchedCode] = await db
    .select()
    .from(memberCodes)
    .where(
      and(
        eq(memberCodes.tenantId, APP_CONFIG.tenantId),
        eq(memberCodes.code, code),
        isNull(memberCodes.usedBy)
      )
    )
    .limit(1)

  if (!matchedCode) return { error: 'invalid or already used member code' }

  // get the member row for this auth user
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.authUserId, user.id))
    .limit(1)

  if (!member) return { error: 'member record not found' }

  // mark the code as used and verify the member in one go
  await db
    .update(memberCodes)
    .set({ usedBy: member.id, usedAt: new Date() })
    .where(eq(memberCodes.id, matchedCode.id))

  await db
    .update(members)
    .set({ memberVerifiedAt: new Date() })
    .where(eq(members.id, member.id))

  return { success: true }
}

export async function submitIntake(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'not authenticated' }

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.authUserId, user.id))
    .limit(1)

  if (!member) return { error: 'member record not found' }

  const heightFt = Number(formData.get('height_ft'))
  const heightIn = Number(formData.get('height_in'))
  const weightLbs = Number(formData.get('weight'))

  // store metric for calculations, keep imperial display for the ui
  const heightCm = Math.round((heightFt * 12 + heightIn) * 2.54)
  const weightKg = Math.round(weightLbs * 0.453592 * 10) / 10

  const data = {
    age: formData.get('age'),
    gender: formData.get('gender'),
    height_cm: heightCm,
    weight_kg: weightKg,
    height_display: `${heightFt}'${heightIn}"`,
    weight_display: `${weightLbs} lbs`,
    goal_primary: formData.get('goal_primary'),
    activity_level: formData.get('activity_level'),
    experience: formData.get('experience'),
    location_pref: formData.get('location_pref'),
    injuries: formData.get('injuries'),
    medical_conditions: formData.get('medical_conditions'),
    dietary_restrictions: formData.get('dietary_restrictions'),
  }

  await db.insert(intakeSubmissions).values({
    tenantId: APP_CONFIG.tenantId,
    memberId: member.id,
    data,
    goalPrimary: data.goal_primary?.toString() ?? '',
    locationPref: data.location_pref?.toString() ?? '',
  })

  return { success: true }
}
