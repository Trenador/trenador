import 'server-only'
import { redirect } from 'next/navigation'
import { getAuthenticatedMember, isMemberActive } from '@/actions/_auth'

export async function requireActiveSubscription() {
  const member = await getAuthenticatedMember()
  if (!isMemberActive(member)) redirect('/subscribe')
}
