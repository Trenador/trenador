import 'server-only'
import { createClient } from '@/lib/supabase/server'

export async function signAvatarUrl(photoUrl: string | null): Promise<string> {
  if (!photoUrl) return ''
  if (photoUrl.startsWith('http')) return photoUrl
  const supabase = await createClient()
  const { data } = await supabase.storage
    .from('avatars')
    .createSignedUrl(photoUrl, 60 * 60 * 24 * 7)
  return data?.signedUrl ?? ''
}
