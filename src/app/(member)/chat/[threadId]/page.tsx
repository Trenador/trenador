import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getMessages } from '@/actions/chat'
import { MessageThread } from '@/components/chat/message-thread'
import ChatLoading from '../loading'

type Props = {
  params: Promise<{ threadId: string }>
  searchParams: Promise<{ message?: string }>
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
  const { message } = await searchParams
  const result = await getMessages(threadId)
  if (result === null) notFound()
  return (
    <MessageThread
      threadId={threadId}
      initialMessages={result.messages}
      initialMessage={message}
      initialPinnedAt={result.pinnedAt}
    />
  )
}
