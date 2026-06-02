'use server'

import { redirect } from 'next/navigation'
import { eq, desc, and, isNull, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { members, coachMessages } from '@/db/schema'
import { APP_CONFIG } from '@/lib/config'
import { getAuthenticatedMember } from './_auth'

async function requireAdmin() {
  const member = await getAuthenticatedMember()
  if (!member.isAdmin) redirect('/chat')
  return member
}

// --- member actions ---

export async function sendCoachMessage(content: string) {
  const member = await getAuthenticatedMember()

  await db.insert(coachMessages).values({
    tenantId: APP_CONFIG.tenantId,
    memberId: member.id,
    senderRole: 'member',
    content,
  })
}

export async function getCoachConversation() {
  const member = await getAuthenticatedMember()

  return db
    .select()
    .from(coachMessages)
    .where(eq(coachMessages.memberId, member.id))
    .orderBy(coachMessages.createdAt)
}

// marks unread coach messages (sender_role = 'coach') as read for this member
export async function markCoachMessagesRead() {
  const member = await getAuthenticatedMember()

  await db
    .update(coachMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(coachMessages.memberId, member.id),
        eq(coachMessages.senderRole, 'coach'),
        isNull(coachMessages.readAt),
      ),
    )
}

// --- admin actions ---

export async function getCoachInbox() {
  await requireAdmin()

  // get the latest message per member, plus unread count
  const allMessages = await db
    .select()
    .from(coachMessages)
    .orderBy(desc(coachMessages.createdAt))

  // group by memberId — latest message + unread member messages per thread
  const byMember = new Map<
    string,
    { latestMessage: typeof allMessages[0]; unreadCount: number }
  >()

  for (const msg of allMessages) {
    if (!byMember.has(msg.memberId)) {
      byMember.set(msg.memberId, { latestMessage: msg, unreadCount: 0 })
    }
    // count unread member messages (admin hasn't read them yet)
    if (msg.senderRole === 'member' && !msg.readAt) {
      byMember.get(msg.memberId)!.unreadCount++
    }
  }

  // fetch display names for each member in the inbox
  const memberIds = [...byMember.keys()]
  if (memberIds.length === 0) return []

  const memberRows = await db
    .select({ id: members.id, displayName: members.displayName })
    .from(members)
    .where(inArray(members.id, memberIds))

  const memberMap = new Map(memberRows.map((m) => [m.id, m.displayName]))

  return [...byMember.entries()]
    .map(([memberId, { latestMessage, unreadCount }]) => ({
      memberId,
      displayName: memberMap.get(memberId) ?? 'Unknown member',
      latestMessage,
      unreadCount,
    }))
    .sort((a, b) =>
      b.latestMessage.createdAt.getTime() - a.latestMessage.createdAt.getTime(),
    )
}

export async function getAdminConversation(memberId: string) {
  await requireAdmin()

  return db
    .select()
    .from(coachMessages)
    .where(eq(coachMessages.memberId, memberId))
    .orderBy(coachMessages.createdAt)
}

export async function sendCoachReply(memberId: string, content: string) {
  await requireAdmin()

  await db.insert(coachMessages).values({
    tenantId: APP_CONFIG.tenantId,
    memberId,
    senderRole: 'coach',
    content,
  })

  // mark all unread member messages in this thread as read (admin just saw them)
  await db
    .update(coachMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(coachMessages.memberId, memberId),
        eq(coachMessages.senderRole, 'member'),
        isNull(coachMessages.readAt),
      ),
    )
}

export async function markMemberMessagesRead(memberId: string) {
  await requireAdmin()

  await db
    .update(coachMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(coachMessages.memberId, memberId),
        eq(coachMessages.senderRole, 'member'),
        isNull(coachMessages.readAt),
      ),
    )
}
