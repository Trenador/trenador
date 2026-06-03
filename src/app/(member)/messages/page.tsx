import { getCoachConversation } from '@/actions/messages'
import { CoachConversation } from '@/components/messages/coach-conversation'
import { requireActiveSubscription } from '@/lib/subscription'

export default async function MessagesPage() {
  await requireActiveSubscription()
  const messages = await getCoachConversation()

  return (
    <div className="flex flex-col h-screen">
      {/* header */}
      <div className="border-b pl-14 pr-4 md:px-6 py-4 shrink-0">
        <h1 className="font-semibold text-sm">Coach Inbox</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your coaching team replies within 24 hours
        </p>
      </div>

      <CoachConversation initialMessages={messages} />
    </div>
  )
}
