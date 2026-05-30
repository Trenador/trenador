import Link from 'next/link'
import { getCoachInbox } from '@/actions/messages'
import { cn } from '@/lib/utils'

function relativeTime(date: Date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default async function AdminMessagesPage() {
  const inbox = await getCoachInbox()

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Member Messages</h1>

      {inbox.length === 0 ? (
        <p className="text-sm text-muted-foreground">No messages yet.</p>
      ) : (
        <div className="divide-y border rounded-lg overflow-hidden">
          {inbox.map(({ memberId, displayName, latestMessage, unreadCount }) => (
            <Link
              key={memberId}
              href={`/admin/messages/${memberId}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-medium', unreadCount > 0 && 'font-semibold')}>
                    {displayName}
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {latestMessage.senderRole === 'coach' ? 'You: ' : ''}
                  {latestMessage.content}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {relativeTime(latestMessage.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
