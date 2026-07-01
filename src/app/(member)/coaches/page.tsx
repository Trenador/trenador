import type { Metadata } from 'next'
import { db } from '@/db'

export const metadata: Metadata = { title: 'Coaches' }
import { coaches } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { APP_CONFIG } from '@/lib/config'
import { CoachesBrowser } from './coaches-browser'

async function getActiveCoaches() {
  'use cache'
  cacheTag('coaches')
  cacheLife('hours')

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
      active: coaches.active,
    })
    .from(coaches)
    .where(eq(coaches.tenantId, APP_CONFIG.tenantId))
    .orderBy(asc(coaches.displayName))
}

export default async function CoachesPage() {
  const rows = await getActiveCoaches()
  const available = rows.filter(c => c.active)
  return <CoachesBrowser coaches={available} />
}
