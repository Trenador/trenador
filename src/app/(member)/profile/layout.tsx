import { getThreads } from '@/actions/chat'
import { ChatShell } from '@/components/chat/chat-shell'
import { getAuthenticatedMember } from '@/actions/_auth'
import { signAvatarUrl } from '@/lib/avatar'

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const [threads, member] = await Promise.all([getThreads(), getAuthenticatedMember()])
  const avatarUrl = await signAvatarUrl(member.photoUrl ?? null)

  return (
    <ChatShell
      initialThreads={threads}
      member={{ displayName: member.displayName }}
      initialAvatarUrl={avatarUrl}
      scrollableMain
    >
      {children}
    </ChatShell>
  )
}
