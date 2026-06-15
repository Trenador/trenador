import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { members } from '@/db/schema'
import { eq } from 'drizzle-orm'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [member] = await db.select({ isAdmin: members.isAdmin }).from(members).where(eq(members.authUserId, user.id)).limit(1)
  if (!member?.isAdmin) redirect('/chat')

  return <>{children}</>
}
