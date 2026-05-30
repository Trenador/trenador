import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { members } from '@/db/schema'
import { getStripe } from '@/lib/stripe/client'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const stripe = getStripe()
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Awaited<ReturnType<typeof stripe.webhooks.constructEventAsync>>
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const memberId = session.client_reference_id
        const customerId = session.customer as string

        if (!memberId) break

        await db
          .update(members)
          .set({
            stripeCustomerId: customerId,
            subscriptionStatus: 'active',
            updatedAt: new Date(),
          })
          .where(eq(members.id, memberId))
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer as string
        const status = subscription.status

        await db
          .update(members)
          .set({ subscriptionStatus: status, updatedAt: new Date() })
          .where(eq(members.stripeCustomerId, customerId))
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        await db
          .update(members)
          .set({ subscriptionStatus: 'canceled', updatedAt: new Date() })
          .where(eq(members.stripeCustomerId, customerId))
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err)
    return Response.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return Response.json({ received: true })
}
