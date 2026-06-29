'use server'

import { redirect } from 'next/navigation'
import { db } from '@/db'
import { members, coaches, workouts, coachMessages } from '@/db/schema'
import { eq, desc, and, isNull, inArray, asc, count, isNotNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedMember } from './_auth'
import { APP_CONFIG } from '@/lib/config'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const member = await getAuthenticatedMember()
  if (!member.isAdmin) redirect('/chat')
  return member
}

// ─── Members / Users ─────────────────────────────────────────────────────────

export async function toggleMemberVerified(formData: FormData) {
  await requireAdmin()
  const memberId = formData.get('memberId') as string
  const isCurrentlyVerified = formData.get('verified') === 'true'
  await db.update(members).set({ memberVerifiedAt: isCurrentlyVerified ? null : new Date() }).where(eq(members.id, memberId))
  revalidatePath('/admin')
}

export async function toggleMemberSuspended(formData: FormData) {
  await requireAdmin()
  const memberId = formData.get('memberId') as string
  const isCurrentlySuspended = formData.get('suspended') === 'true'
  await db.update(members).set({ suspendedAt: isCurrentlySuspended ? null : new Date() }).where(eq(members.id, memberId))
  revalidatePath('/admin')
}

export async function adminGetMembers() {
  await requireAdmin()
  const rows = await db
    .select({
      id: members.id,
      authUserId: members.authUserId,
      displayName: members.displayName,
      photoUrl: members.photoUrl,
      yearOfBirth: members.yearOfBirth,
      gender: members.gender,
      weightLbs: members.weightLbs,
      assignedCoachId: members.assignedCoachId,
      subscriptionStatus: members.subscriptionStatus,
      memberVerifiedAt: members.memberVerifiedAt,
      suspendedAt: members.suspendedAt,
      createdAt: members.createdAt,
    })
    .from(members)
    .where(eq(members.tenantId, APP_CONFIG.tenantId))
    .orderBy(desc(members.createdAt))
    .limit(500)

  const adminClient = createAdminClient()
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map(authUsers.map((u) => [u.id, u.email ?? '']))

  return rows.map((r) => ({
    ...r,
    email: emailMap.get(r.authUserId) ?? '',
    createdAt: r.createdAt.toISOString(),
    memberVerifiedAt: r.memberVerifiedAt?.toISOString() ?? null,
    suspendedAt: r.suspendedAt?.toISOString() ?? null,
  }))
}

export async function adminGetMemberBasic(memberId: string) {
  await requireAdmin()
  const rows = await db
    .select({ id: members.id, displayName: members.displayName, photoUrl: members.photoUrl, assignedCoachId: members.assignedCoachId })
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1)
  return rows[0] ?? null
}

export async function adminResendInvite(email: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  await adminClient.auth.admin.inviteUserByEmail(email)
}

export async function adminInviteUser(data: { email: string; displayName: string; coachId?: string }) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { data: authData, error } = await adminClient.auth.admin.inviteUserByEmail(data.email, {
    data: { display_name: data.displayName },
  })
  if (error) throw error
  const authUserId = authData.user.id

  await db.insert(members).values({
    tenantId: APP_CONFIG.tenantId,
    authUserId,
    displayName: data.displayName,
    subscriptionStatus: 'inactive',
    assignedCoachId: data.coachId ?? null,
  })
}

export async function adminAssignCoach(memberId: string, coachId: string | null) {
  await requireAdmin()
  await db.update(members).set({ assignedCoachId: coachId }).where(eq(members.id, memberId))
}

// ─── Inbox ───────────────────────────────────────────────────────────────────

export async function adminGetInbox() {
  await requireAdmin()

  const allMessages = await db
    .select()
    .from(coachMessages)
    .orderBy(desc(coachMessages.createdAt))
    .limit(1000)

  // group by memberId: latest message + unread member messages
  const byMember = new Map<string, { latestMsg: typeof allMessages[0]; unreadCount: number }>()
  for (const msg of allMessages) {
    if (!byMember.has(msg.memberId)) {
      byMember.set(msg.memberId, { latestMsg: msg, unreadCount: 0 })
    }
    if (msg.senderRole === 'member' && !msg.readAt) {
      byMember.get(msg.memberId)!.unreadCount++
    }
  }

  const memberIds = [...byMember.keys()]
  if (memberIds.length === 0) return []

  const memberRows = await db
    .select({ id: members.id, displayName: members.displayName, photoUrl: members.photoUrl, assignedCoachId: members.assignedCoachId })
    .from(members)
    .where(inArray(members.id, memberIds))

  const memberMap = new Map(memberRows.map((m) => [m.id, m]))

  return [...byMember.entries()]
    .map(([memberId, { latestMsg, unreadCount }]) => {
      const m = memberMap.get(memberId)
      return {
        memberId,
        displayName: m?.displayName ?? 'Unknown member',
        photoUrl: m?.photoUrl ?? null,
        assignedCoachId: m?.assignedCoachId ?? null,
        lastMessageText: latestMsg.content,
        lastMessageFrom: latestMsg.senderRole as 'member' | 'coach',
        lastMessageAt: latestMsg.createdAt.toISOString(),
        unreadCount,
      }
    })
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
}

export async function adminGetConversation(memberId: string) {
  await requireAdmin()
  const msgs = await db
    .select()
    .from(coachMessages)
    .where(eq(coachMessages.memberId, memberId))
    .orderBy(asc(coachMessages.createdAt))
  return msgs.map((m) => ({ ...m, createdAt: m.createdAt.toISOString(), readAt: m.readAt?.toISOString() ?? null, senderCoachId: m.senderCoachId ?? null }))
}

export async function adminSendReply(memberId: string, content: string, coachId?: string) {
  await requireAdmin()
  await db.insert(coachMessages).values({
    tenantId: APP_CONFIG.tenantId,
    memberId,
    senderRole: 'coach',
    senderCoachId: coachId ?? null,
    content,
  })
  await db.update(coachMessages).set({ readAt: new Date() }).where(
    and(eq(coachMessages.memberId, memberId), eq(coachMessages.senderRole, 'member'), isNull(coachMessages.readAt)),
  )
}

export async function adminMarkThreadRead(memberId: string) {
  await requireAdmin()
  await db.update(coachMessages).set({ readAt: new Date() }).where(
    and(eq(coachMessages.memberId, memberId), eq(coachMessages.senderRole, 'member'), isNull(coachMessages.readAt)),
  )
}

export async function adminDeleteMessage(messageId: string) {
  await requireAdmin()
  await db.delete(coachMessages).where(eq(coachMessages.id, messageId))
}

export async function adminEditMessage(messageId: string, content: string) {
  await requireAdmin()
  await db.update(coachMessages).set({ content }).where(eq(coachMessages.id, messageId))
}

// ─── Coaches ─────────────────────────────────────────────────────────────────

export async function adminUploadCoachPhoto(formData: FormData): Promise<string> {
  await requireAdmin()
  const file = formData.get('file') as File
  if (!file || !file.size) throw new Error('No file provided')
  const bytes = await file.arrayBuffer()
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const fileName = `coach-${Date.now()}.${ext}`
  const adminClient = createAdminClient()
  const { error } = await adminClient.storage.from('coach-photos').upload(fileName, Buffer.from(bytes), { contentType: file.type, upsert: true })
  if (error) throw error
  const { data } = adminClient.storage.from('coach-photos').getPublicUrl(fileName)
  return data.publicUrl
}

export async function adminLinkCoachSignIn(coachId: string, email: string) {
  await requireAdmin()
  if (!email.trim()) {
    await db.update(coaches).set({ authUserId: null, updatedAt: new Date() }).where(eq(coaches.id, coachId))
    return
  }
  const adminClient = createAdminClient()
  const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  const existing = users.find((u) => u.email === email.trim())
  let authUserId: string
  if (existing) {
    authUserId = existing.id
  } else {
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email.trim())
    if (error) throw error
    authUserId = data.user.id
  }
  await db.update(coaches).set({ authUserId, updatedAt: new Date() }).where(eq(coaches.id, coachId))
}

export async function adminGetCoaches() {
  await requireAdmin()
  const rows = await db
    .select()
    .from(coaches)
    .where(eq(coaches.tenantId, APP_CONFIG.tenantId))
    .orderBy(asc(coaches.displayName))

  // Count members assigned to each coach
  const memberCounts = await db
    .select({ coachId: members.assignedCoachId, total: count() })
    .from(members)
    .where(isNotNull(members.assignedCoachId))
    .groupBy(members.assignedCoachId)

  const countMap = new Map(memberCounts.map((r) => [r.coachId, r.total]))

  const adminClient = createAdminClient()
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  const emailByAuthId = new Map(authUsers.map((u) => [u.id, u.email ?? '']))

  return rows.map((r) => ({
    ...r,
    memberCount: countMap.get(r.id) ?? 0,
    signInEmail: r.authUserId ? (emailByAuthId.get(r.authUserId) ?? '') : '',
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))
}

export async function adminCreateCoach(data: {
  displayName: string
  slug: string
  bio?: string
  headline?: string
  location?: string
  gender?: string
  gym?: string
  specialties: string[]
  certifications: string[]
  systemPrompt?: string
  photoUrl?: string
  active: boolean
  isAuthor?: boolean
  signInEmail?: string
}) {
  await requireAdmin()
  const { signInEmail, ...rest } = data
  const rows = await db.insert(coaches).values({ tenantId: APP_CONFIG.tenantId, ...rest }).returning()
  const row = rows[0]!
  if (signInEmail) await adminLinkCoachSignIn(row.id, signInEmail)
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }
}

export async function adminUpdateCoach(coachId: string, data: {
  displayName?: string
  slug?: string
  bio?: string
  headline?: string
  location?: string
  gender?: string
  gym?: string
  specialties?: string[]
  certifications?: string[]
  systemPrompt?: string
  photoUrl?: string
  active?: boolean
  isAuthor?: boolean
  signInEmail?: string
}) {
  await requireAdmin()
  const { signInEmail, ...rest } = data
  await db.update(coaches).set({ ...rest, updatedAt: new Date() }).where(eq(coaches.id, coachId))
  if (signInEmail !== undefined) await adminLinkCoachSignIn(coachId, signInEmail)
}

export async function adminDeleteCoach(coachId: string) {
  await requireAdmin()
  await db.delete(coaches).where(eq(coaches.id, coachId))
}

export async function adminUploadWorkoutBanner(formData: FormData): Promise<string> {
  await requireAdmin()
  const file = formData.get('file') as File
  if (!file || !file.size) throw new Error('No file provided')
  const bytes = await file.arrayBuffer()
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const fileName = `banner-${Date.now()}.${ext}`
  const adminClient = createAdminClient()
  const { error } = await adminClient.storage.from('workout-banners').upload(fileName, Buffer.from(bytes), { contentType: file.type, upsert: true })
  if (error) throw error
  const { data } = adminClient.storage.from('workout-banners').getPublicUrl(fileName)
  return data.publicUrl
}

// ─── Workouts ────────────────────────────────────────────────────────────────

export async function adminGetWorkouts() {
  await requireAdmin()
  const rows = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.tenantId, APP_CONFIG.tenantId), isNull(workouts.deletedAt)))
    .orderBy(desc(workouts.createdAt))
    .limit(500)
  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    publishedAt: r.publishedAt?.toISOString() ?? null,
    deletedAt: r.deletedAt?.toISOString() ?? null,
  }))
}

export async function adminPublishWorkout(workoutId: string) {
  await requireAdmin()
  await db.update(workouts).set({ publishedAt: new Date(), updatedAt: new Date() }).where(eq(workouts.id, workoutId))
}

export async function adminUnpublishWorkout(workoutId: string) {
  await requireAdmin()
  await db.update(workouts).set({ publishedAt: null, updatedAt: new Date() }).where(eq(workouts.id, workoutId))
}

export async function adminCreateWorkout(data: {
  title: string
  category?: string
  level?: string
  durationMinutes?: number
  summary?: string
  coachNotes?: string
  bannerUrl?: string
  coachId?: string
  structure: object
  muscleGroups?: string[]
  lengthLabel?: string
}) {
  await requireAdmin()
  const { structure: _s, ...rest } = data
  const rows2 = await db.insert(workouts).values({ tenantId: APP_CONFIG.tenantId, structure: data.structure ?? {}, ...rest }).returning()
  const row2 = rows2[0]!
  return { ...row2, createdAt: row2.createdAt.toISOString(), updatedAt: row2.updatedAt.toISOString(), publishedAt: null, deletedAt: null }
}

export async function adminUpdateWorkout(workoutId: string, data: {
  title?: string
  category?: string
  level?: string
  durationMinutes?: number
  summary?: string
  coachNotes?: string
  bannerUrl?: string
  coachId?: string
  structure?: object
  muscleGroups?: string[]
  lengthLabel?: string
}) {
  await requireAdmin()
  await db.update(workouts).set({ ...data, updatedAt: new Date() }).where(eq(workouts.id, workoutId))
}

export async function adminDeleteWorkout(workoutId: string) {
  await requireAdmin()
  await db.update(workouts).set({ deletedAt: new Date() }).where(eq(workouts.id, workoutId))
}
