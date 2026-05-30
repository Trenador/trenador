import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { members } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

const navItems = [
  { label: 'members', href: '/admin/members' },
  { label: 'messages', href: '/admin/messages' },
  { label: 'coaches', href: '/admin/coaches' },
  { label: 'workouts', href: '/admin/workouts' },
  { label: 'knowledge base', href: '/admin/knowledge-base' },
  { label: 'transactions', href: '/admin/transactions' },
  { label: 'analytics', href: '/admin/analytics' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.authUserId, user.id))
    .limit(1)

  if (!member?.isAdmin) redirect('/chat')

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r bg-muted/40 p-6 flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          admin
        </p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
