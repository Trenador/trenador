'use server'

import { redirect } from 'next/navigation'
import { eq, desc, asc, and, isNull } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { members, threads, messages as chatMessages } from '@/db/schema'
import type { Message } from '@/db/schema'
import { APP_CONFIG } from '@/lib/config'

async function getAuthenticatedMember() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.authUserId, user.id))
    .limit(1)

  if (!member) redirect('/login')
  return member
}

export async function createThread(): Promise<{ id: string }> {
  const member = await getAuthenticatedMember()

  const [thread] = await db
    .insert(threads)
    .values({
      tenantId: APP_CONFIG.tenantId,
      memberId: member.id,
    })
    .returning({ id: threads.id })

  if (!thread) throw new Error('Failed to create thread')
  return thread
}

export async function getThreads() {
  const member = await getAuthenticatedMember()

  return db
    .select({
      id: threads.id,
      title: threads.title,
      lastMessageAt: threads.lastMessageAt,
      createdAt: threads.createdAt,
    })
    .from(threads)
    .where(
      and(
        eq(threads.memberId, member.id),
        isNull(threads.deletedAt),
      ),
    )
    .orderBy(desc(threads.lastMessageAt), desc(threads.createdAt))
    .limit(50)
}

export async function deleteThread(threadId: string) {
  const member = await getAuthenticatedMember()

  await db
    .update(threads)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(threads.id, threadId),
        eq(threads.memberId, member.id),
      ),
    )
}

export async function getMessages(threadId: string): Promise<Message[] | null> {
  const member = await getAuthenticatedMember()

  // verify the thread belongs to this member
  const [thread] = await db
    .select({ id: threads.id })
    .from(threads)
    .where(and(eq(threads.id, threadId), eq(threads.memberId, member.id)))
    .limit(1)

  if (!thread) return null

  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.threadId, threadId))
    .orderBy(asc(chatMessages.createdAt))
}
