import { Suspense } from 'react'
import { getCoachConversation } from '@/actions/messages'
import { CoachConversation } from '@/components/messages/coach-conversation'
import { requireActiveSubscription } from '@/lib/subscription'
import MessagesLoading from './loading'

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesLoading />}>
      <MessagesContent />
    </Suspense>
  )
}

async function MessagesContent() {
  await requireActiveSubscription()
  const messages = await getCoachConversation()

  return (
    <div className="flex min-w-0 flex-1 flex-col min-h-0 bg-background">
      <div className="flex h-[60px] shrink-0 items-center gap-2 border-b border-border/70 pl-4 pr-3 lg:pl-5">
        <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="label-mono">Coach</span>
      </div>
      <CoachConversation initialMessages={messages} />
    </div>
  )
}
