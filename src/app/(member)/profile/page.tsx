import { getAuthenticatedMember } from '@/actions/_auth'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from './profile-client'

export default async function ProfilePage() {
  const member = await getAuthenticatedMember()

  let avatarUrl = ''
  if (member.photoUrl) {
    if (member.photoUrl.startsWith('http')) {
      avatarUrl = member.photoUrl
    } else {
      const supabase = await createClient()
      const { data } = await supabase.storage
        .from('avatars')
        .createSignedUrl(member.photoUrl, 60 * 60 * 24 * 7)
      avatarUrl = data?.signedUrl ?? ''
    }
  }

  return (
    <ProfileClient
      memberId={member.id}
      authUserId={member.authUserId}
      displayName={member.displayName}
      photoPath={member.photoUrl ?? null}
      avatarUrl={avatarUrl}
      yearOfBirth={member.yearOfBirth ?? null}
      gender={member.gender ?? null}
      weightLbs={member.weightLbs !== null ? Number(member.weightLbs) : null}
    />
  )
}
