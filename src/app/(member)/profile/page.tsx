import { Suspense } from 'react'
import { getAuthenticatedMember } from '@/actions/_auth'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from './profile-client'
import ProfileLoading from './loading'

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent />
    </Suspense>
  )
}

async function ProfileContent() {
  const supabase = await createClient()
  const [member, { data: { user } }] = await Promise.all([
    getAuthenticatedMember(),
    supabase.auth.getUser(),
  ])

  let avatarUrl = ''
  if (member.photoUrl) {
    if (member.photoUrl.startsWith('http')) {
      avatarUrl = member.photoUrl
    } else {
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
      email={user?.email ?? ''}
      displayName={member.displayName}
      photoPath={member.photoUrl ?? null}
      avatarUrl={avatarUrl}
      yearOfBirth={member.yearOfBirth ?? null}
      gender={member.gender ?? null}
      weightLbs={member.weightLbs !== null ? Number(member.weightLbs) : null}
    />
  )
}
