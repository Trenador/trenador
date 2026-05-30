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
      <aside className="w-56 shrink-0 border-r bg-sidebar flex flex-col">
        <div className="h-[60px] flex items-center px-5 border-b">
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">Trenador</span>
          <span className="ml-2 label-mono normal-case tracking-wide text-[10px]">admin</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-px">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center rounded-md px-3 py-2 text-[13px] text-sidebar-foreground hover:bg-foreground/[0.04] transition-colors capitalize"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
