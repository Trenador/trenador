import { NextResponse, type NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { db } from '@/db'
import { coaches, workouts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { APP_CONFIG } from '@/lib/config'

const SYNC_URL_BASE = 'https://trenadorstaging.lovable.app/api/public'

async function verifySignature(req: NextRequest, body: string): Promise<boolean> {
  const secret = process.env.TRENADOR_SYNC_SECRET
  if (!secret) return false

  // Replay protection: Lovable sends Unix seconds; reject if > 5 min old
  const timestamp = req.headers.get('x-webhook-timestamp')
  if (timestamp) {
    const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp))
    if (ageSeconds > 300) return false
  }

  const sig = req.headers.get('x-webhook-signature')
  if (!sig) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const sigBytes = Buffer.from(sig.replace('sha256=', ''), 'hex')
  // Sign over timestamp + body so the signature covers the replay-protection value
  const payload = timestamp ? `${timestamp}.${body}` : body
  const bodyBytes = new TextEncoder().encode(payload)
  return crypto.subtle.verify('HMAC', key, sigBytes, bodyBytes)
}

async function syncCoaches() {
  const res = await fetch(`${SYNC_URL_BASE}/coaches`)
  if (!res.ok) throw new Error(`Failed to fetch coaches: ${res.status}`)
  const { coaches: rows } = await res.json() as { coaches: Array<{
    id: string; name: string; specialty: string; bio: string; headline: string;
    gym: string; geography: string; certifications: string[];
    available: boolean; avatarUrl: string; isAuthor: boolean;
  }> }

  const slugMap: Record<string, string> = {
    'tarra-martinez': 'tarra-martinez',
    'milan-wagner': 'milan-wagner',
    'alex': 'robert-rudder',
    'yefei-jin': 'warren-kelly',
  }

  for (const c of rows) {
    const slug = slugMap[c.id] ?? c.id
    await db.update(coaches).set({
      displayName: c.name,
      specialties: c.specialty ? [c.specialty] : [],
      bio: c.bio || null,
      headline: c.headline || null,
      gym: c.gym || null,
      location: c.geography || null,
      photoUrl: c.avatarUrl || null,
      active: c.available,
      isAuthor: c.isAuthor,
      updatedAt: new Date(),
    }).where(eq(coaches.slug, slug))
  }
}

async function syncWorkouts() {
  const res = await fetch(`${SYNC_URL_BASE}/workouts`)
  if (!res.ok) throw new Error(`Failed to fetch workouts: ${res.status}`)
  const { workouts: rows } = await res.json() as { workouts: Array<{
    id: string; slug: string; title: string; category: string; level: string;
    durationMinutes: number; summary: string; tags: string[]; coachName: string;
    saves: number; lengthLabel: string; bannerUrl: string | null; weeks: unknown[]; coachNotes: string;
  }> }

  // Coach name → slug map (inverse lookup)
  const coachNameToSlug: Record<string, string> = {
    'Tarra Martinez': 'tarra-martinez',
    'Milan Wagner': 'milan-wagner',
    'Robert Rudder': 'robert-rudder',
    'Warren Kelly': 'warren-kelly',
  }

  const [coachRows] = await Promise.all([
    db.select({ id: coaches.id, slug: coaches.slug }).from(coaches)
      .where(eq(coaches.tenantId, APP_CONFIG.tenantId)),
  ])
  const coachBySlug = Object.fromEntries(coachRows.map(c => [c.slug, c.id]))

  for (const w of rows) {
    const coachSlug = coachNameToSlug[w.coachName] ?? null
    const coachId = coachSlug ? coachBySlug[coachSlug] ?? null : null
    const structure = { weeks: w.weeks }

    // Upsert by title — if we have it update, otherwise insert
    const existing = await db.select({ id: workouts.id }).from(workouts)
      .where(eq(workouts.tenantId, APP_CONFIG.tenantId))
      // match by title since phchat slugs differ from our UUIDs
      .then(rows => rows.find(r => r.id)) // we'll match by title below

    // Try to find by title
    const allWorkouts = await db.select({ id: workouts.id, title: workouts.title })
      .from(workouts).where(eq(workouts.tenantId, APP_CONFIG.tenantId))
    const match = allWorkouts.find(r => r.title === w.title)

    if (match) {
      await db.update(workouts).set({
        title: w.title,
        category: w.category,
        level: w.level,
        durationMinutes: w.durationMinutes,
        summary: w.summary,
        muscleGroups: w.tags,
        coachNotes: w.coachNotes,
        bannerUrl: w.bannerUrl ?? null,
        savesCount: w.saves ?? 0,
        lengthLabel: w.lengthLabel ?? null,
        coachId: coachId ?? undefined,
        structure,
        publishedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(workouts.id, match.id))
    } else {
      await db.insert(workouts).values({
        tenantId: APP_CONFIG.tenantId,
        title: w.title,
        category: w.category,
        level: w.level,
        durationMinutes: w.durationMinutes,
        summary: w.summary,
        muscleGroups: w.tags,
        coachNotes: w.coachNotes,
        bannerUrl: w.bannerUrl ?? null,
        savesCount: w.saves ?? 0,
        lengthLabel: w.lengthLabel ?? null,
        coachId: coachId ?? undefined,
        structure,
        publishedAt: new Date(),
      })
    }
  }
}

// Like syncWorkouts but also soft-deletes anything no longer in phchat's published list
async function syncWorkoutsWithDelete() {
  await syncWorkouts()

  const res = await fetch(`${SYNC_URL_BASE}/workouts`)
  if (!res.ok) return
  const { workouts: phchatRows } = await res.json() as { workouts: Array<{ title: string }> }
  const liveTitles = new Set(phchatRows.map(w => w.title))

  const ourRows = await db
    .select({ id: workouts.id, title: workouts.title })
    .from(workouts)
    .where(eq(workouts.tenantId, APP_CONFIG.tenantId))

  for (const row of ourRows) {
    if (!liveTitles.has(row.title)) {
      await db.update(workouts)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(workouts.id, row.id))
    }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  const valid = await verifySignature(req, body)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: { type: 'coach' | 'workout'; id: string; deleted?: boolean }
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    if (payload.type === 'coach') {
      if (payload.deleted) {
        // Tombstone: mark coach inactive rather than hard-delete (preserves FK refs)
        await db.update(coaches)
          .set({ active: false, updatedAt: new Date() })
          .where(eq(coaches.slug, payload.id))
      } else {
        await syncCoaches()
      }
    } else if (payload.type === 'workout') {
      if (payload.deleted) {
        // Re-sync the full published list — anything removed from phchat
        // will be absent from /api/public/workouts and we soft-delete the diff
        await syncWorkoutsWithDelete()
      } else {
        await syncWorkouts()
      }
    } else {
      return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }
    if (payload.type === 'coach') revalidateTag('coaches', 'max')
    if (payload.type === 'workout') revalidateTag('workouts', 'max')
    return NextResponse.json({ ok: true, synced: payload.type, deleted: payload.deleted ?? false })
  } catch (err) {
    console.error('[sync]', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
