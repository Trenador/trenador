import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { members } from '@/db/schema'
import { getStripe } from '@/lib/stripe/client'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.authUserId, user.id))
    .limit(1)

  if (!member) return Response.json({ error: 'Member not found' }, { status: 404 })

  if (member.subscriptionStatus === 'active') {
    redirect('/chat')
  }

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    ...(user.email ? { customer_email: user.email } : {}),
    client_reference_id: member.id,
    success_url: `${appUrl}/chat?subscribed=1`,
    cancel_url: `${appUrl}/subscribe`,
  })

  if (!session.url) {
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }

  redirect(session.url)
}
