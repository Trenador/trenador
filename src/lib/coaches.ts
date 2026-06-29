import 'server-only'
import { eq, and, count, isNotNull } from 'drizzle-orm'
import { db } from '@/db'
import { coaches, members } from '@/db/schema'
import { APP_CONFIG } from '@/lib/config'

export type CoachProfile = {
  id: string
  displayName: string
  photoUrl: string | null
  headline: string | null
  bio: string | null
  specialties: string[]
  certifications: string[]
  gym: string | null
}

const COACH_SELECT = {
  id: coaches.id,
  displayName: coaches.displayName,
  photoUrl: coaches.photoUrl,
  headline: coaches.headline,
  bio: coaches.bio,
  specialties: coaches.specialties,
  certifications: coaches.certifications,
  gym: coaches.gym,
}

async function fetchCoach(coachId: string): Promise<CoachProfile | null> {
  const [row] = await db
    .select(COACH_SELECT)
    .from(coaches)
    .where(eq(coaches.id, coachId))
    .limit(1)
  return row ?? null
}

// Returns the member's assigned coach, assigning the least-loaded active
// coach if none has been set yet. Returns null only if no coaches exist.
export async function getOrAssignCoach(member: {
  id: string
  tenantId: string
  assignedCoachId: string | null
}): Promise<CoachProfile | null> {
  if (member.assignedCoachId) {
    return fetchCoach(member.assignedCoachId)
  }

  // Count current assignments per coach across all members in this tenant
  const loads = await db
    .select({ coachId: members.assignedCoachId, total: count() })
    .from(members)
    .where(
      and(
        eq(members.tenantId, APP_CONFIG.tenantId),
        isNotNull(members.assignedCoachId),
      ),
    )
    .groupBy(members.assignedCoachId)

  const activeCoaches = await db
    .select(COACH_SELECT)
    .from(coaches)
    .where(and(eq(coaches.tenantId, APP_CONFIG.tenantId), eq(coaches.active, true)))

  if (activeCoaches.length === 0) return null

  const loadMap = new Map(loads.map(r => [r.coachId, Number(r.total)]))
  const sorted = [...activeCoaches].sort(
    (a, b) => (loadMap.get(a.id) ?? 0) - (loadMap.get(b.id) ?? 0),
  )
  const leastLoaded = sorted[0]
  if (!leastLoaded) return null

  await db
    .update(members)
    .set({ assignedCoachId: leastLoaded.id, updatedAt: new Date() })
    .where(eq(members.id, member.id))

  return leastLoaded
}
