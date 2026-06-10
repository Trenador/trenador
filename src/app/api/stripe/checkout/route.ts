import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { members } from '@/db/schema'
import { getStripe } from '@/lib/stripe/client'

function getPriceId(plan: string | null): string {
  if (plan === 'annual') {
    return process.env.STRIPE_ANNUAL_PRICE_ID ?? process.env.STRIPE_PRICE_ID!
  }
  return process.env.STRIPE_MONTHLY_PRICE_ID ?? process.env.STRIPE_PRICE_ID!
}

export async function POST(request: Request) {
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

  const formData = await request.formData()
  const plan = formData.get('plan') as string | null

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: getPriceId(plan), quantity: 1 }],
    ...(user.email ? { customer_email: user.email } : {}),
    client_reference_id: member.id,
    subscription_data: { trial_period_days: 14 },
    success_url: `${appUrl}/chat?subscribed=1`,
    cancel_url: `${appUrl}/subscribe`,
  })

  if (!session.url) {
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }

  redirect(session.url)
}
