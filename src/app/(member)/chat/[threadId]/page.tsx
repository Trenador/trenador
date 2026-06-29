import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { coaches } from '@/db/schema'
import { getMessages } from '@/actions/chat'
import { getAuthenticatedMember } from '@/actions/_auth'
import { MessageThread } from '@/components/chat/message-thread'
import type { ComposerAttachment } from '@/components/chat/composer'
import ChatLoading from '../loading'

type Props = {
  params: Promise<{ threadId: string }>
  searchParams: Promise<{ message?: string; attachments?: string }>
}

export default function ThreadPage(props: Props) {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ThreadContent {...props} />
    </Suspense>
  )
}

async function ThreadContent({ params, searchParams }: Props) {
  const { threadId } = await params
  const { message, attachments: attachmentsParam } = await searchParams

  const [result, member] = await Promise.all([getMessages(threadId), getAuthenticatedMember()])
  if (result === null) notFound()

  let coachName: string | undefined
  if (member.assignedCoachId) {
    const [coach] = await db
      .select({ displayName: coaches.displayName })
      .from(coaches)
      .where(eq(coaches.id, member.assignedCoachId))
      .limit(1)
    coachName = coach?.displayName
  }

  let initialAttachments: ComposerAttachment[] | undefined
  if (attachmentsParam) {
    try { initialAttachments = JSON.parse(attachmentsParam) } catch { /* ignore */ }
  }

  return (
    <MessageThread
      threadId={threadId}
      initialMessages={result.messages}
      initialMessage={message}
      {...(initialAttachments ? { initialAttachments } : {})}
      initialPinnedAt={result.pinnedAt}
      {...(coachName ? { coachName } : {})}
    />
  )
}
