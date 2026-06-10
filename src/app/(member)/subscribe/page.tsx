'use client'

import { useState } from 'react'

const FEATURES = [
  'Unlimited AI coach conversations',
  'Personalized advice based on your intake profile',
  'Direct messaging with your assigned human coach',
  'Coach replies within 24 hours',
]

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$4.99',
    per: '/month',
    sub: 'Cancel anytime',
    badge: null,
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '$49',
    per: '/year',
    sub: 'That\'s just $4.08/month',
    badge: 'Save 18%',
  },
] as const

type PlanId = 'monthly' | 'annual'

export default function SubscribePage() {
  const [plan, setPlan] = useState<PlanId>('annual')
  const selected = PLANS.find((p) => p.id === plan)!

  return (
    <div className="min-h-screen md:grid md:grid-cols-2">
      {/* Left — hero panel */}
      <div className="hidden md:flex flex-col justify-between bg-foreground text-primary-foreground p-10">
        <div>
          <p className="text-sm font-medium text-white/70">Membership</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white">
            Your coach,<br />always on call
          </h2>
        </div>
        <div className="flex-1 my-8 rounded-2xl bg-white/5 border border-white/10" />
        <p className="text-xs font-medium uppercase tracking-wider text-white/50">
          Trenador — Powered by AI
        </p>
      </div>

      {/* Right — pricing */}
      <div className="flex items-center justify-center min-h-screen md:min-h-0 px-4 md:px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Start your membership</h1>
            <p className="text-sm text-muted-foreground">
              Unlimited access to AI coaching and your human coach.
            </p>
          </div>

          {/* Plan toggle */}
          <div className="grid grid-cols-2 gap-2">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.id)}
                className={`relative rounded-xl border px-4 py-3 text-left transition-colors ${
                  plan === p.id
                    ? 'border-foreground bg-foreground/[0.04]'
                    : 'border-border hover:bg-foreground/[0.02]'
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    {p.badge}
                  </span>
                )}
                <div className="text-[13px] font-medium">{p.label}</div>
                <div className="mt-0.5 text-xl font-bold">
                  {p.price}
                  <span className="text-sm font-normal text-muted-foreground">{p.per}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border bg-secondary/40 p-6 space-y-5">
            <div>
              <p className="text-4xl font-bold tracking-tight">
                {selected.price}
                <span className="text-base font-normal text-muted-foreground ml-1">{selected.per}</span>
              </p>
              <p className="label-mono mt-1 normal-case tracking-wide">{selected.sub}</p>
            </div>

            <ul className="space-y-2.5">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm">
                  <span className="size-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold shrink-0">
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <form action="/api/stripe/checkout" method="POST" className="space-y-4">
            <input type="hidden" name="plan" value={plan} />
            <button
              type="submit"
              className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start membership
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Secure payment via Stripe · 14-day free trial
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
