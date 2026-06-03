import { getAuthenticatedMember } from '@/actions/_auth'
import { ChatWelcomeClient } from './welcome-client'

export default async function ChatWelcomePage() {
  const member = await getAuthenticatedMember()
  return <ChatWelcomeClient displayName={member.displayName} />
}
