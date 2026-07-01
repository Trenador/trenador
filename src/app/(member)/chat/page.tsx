import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getAuthenticatedMember } from '@/actions/_auth'

export const metadata: Metadata = { title: 'Chat' }
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
