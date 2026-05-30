import { notFound } from 'next/navigation'
import { getMessages } from '@/actions/chat'
import { MessageThread } from '@/components/chat/message-thread'

type Props = {
  params: Promise<{ threadId: string }>
  searchParams: Promise<{ message?: string }>
}

export default async function ThreadPage({ params, searchParams }: Props) {
  const { threadId } = await params
  const { message } = await searchParams

  const messages = await getMessages(threadId)
  if (messages === null) notFound()

  return (
    <MessageThread
      threadId={threadId}
      initialMessages={messages}
      initialMessage={message}
    />
  )
}
