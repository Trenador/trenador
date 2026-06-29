import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getMessages } from '@/actions/chat'
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
  const result = await getMessages(threadId)
  if (result === null) notFound()

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
    />
  )
}
