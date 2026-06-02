import 'server-only'
import { redirect } from 'next/navigation'
import { getAuthenticatedMember } from '@/actions/_auth'

export async function requireActiveSubscription() {
  const member = await getAuthenticatedMember()
  if (member.subscriptionStatus !== 'active') redirect('/subscribe')
}
