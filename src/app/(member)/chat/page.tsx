import { Suspense } from 'react'
import { getAuthenticatedMember } from '@/actions/_auth'
import { ChatWelcomeClient } from './welcome-client'
import ChatLoading from './loading'

export default function ChatWelcomePage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatWelcomeContent />
    </Suspense>
  )
}

async function ChatWelcomeContent() {
  const member = await getAuthenticatedMember()
  return <ChatWelcomeClient displayName={member.displayName} />
}
