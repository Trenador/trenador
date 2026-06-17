import { createClient } from '@/lib/supabase/client'

export async function signAvatarUrlClient(path: string | null): Promise<string> {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const supabase = createClient()
  const { data } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60 * 24 * 7)
  return data?.signedUrl ?? ''
}
