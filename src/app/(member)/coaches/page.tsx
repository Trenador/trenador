import { db } from '@/db'
import { coaches } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { APP_CONFIG } from '@/lib/config'
import { CoachesBrowser } from './coaches-browser'

export default async function CoachesPage() {
  const rows = await db
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
      active: coaches.active,
    })
    .from(coaches)
    .where(eq(coaches.tenantId, APP_CONFIG.tenantId))
    .orderBy(asc(coaches.displayName))

  const available = rows.filter(c => c.active)

  return <CoachesBrowser coaches={available} />
}
