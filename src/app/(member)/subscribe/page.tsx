export default function SubscribePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Start your membership</h1>
          <p className="text-sm text-muted-foreground">
            Get unlimited access to Trenador AI, your personal fitness guide, and direct
            messaging with your assigned coach.
          </p>
        </div>

        <div className="rounded-xl border p-6 space-y-4 text-left">
          <div>
            <p className="text-3xl font-bold">
              $49<span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Cancel anytime</p>
          </div>

          <ul className="space-y-2 text-sm">
            {[
              'Unlimited AI coach conversations',
              'Personalized advice based on your profile',
              'Direct messaging with your human coach',
              'Responses within 24 hours',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <form action="/api/stripe/checkout" method="POST">
          <button
            type="submit"
            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Start membership
          </button>
        </form>

        <p className="text-xs text-muted-foreground">
          Secure payment via Stripe. You won&apos;t be charged until after your trial ends.
        </p>
      </div>
    </div>
  )
}
