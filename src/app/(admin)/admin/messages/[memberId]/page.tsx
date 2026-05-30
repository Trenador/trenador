import { notFound } from 'next/navigation'
import { getAdminConversation } from '@/actions/messages'
import { AdminConversationView } from '@/components/messages/admin-conversation-view'
import { db } from '@/db'
import { members } from '@/db/schema'
import { eq } from 'drizzle-orm'

type Props = {
  params: Promise<{ memberId: string }>
}

export default async function AdminConversationPage({ params }: Props) {
  const { memberId } = await params

  const [member] = await db
    .select({ id: members.id, displayName: members.displayName })
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1)

  if (!member) notFound()

  const messages = await getAdminConversation(memberId)

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b px-6 py-4 shrink-0">
        <h1 className="font-semibold text-sm">{member.displayName}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Replying as Coach</p>
      </div>

      <AdminConversationView memberId={memberId} initialMessages={messages} />
    </div>
  )
}
