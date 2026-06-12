'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyMemberCode } from '@/actions/onboarding'

const TOTAL_STEPS = 3 // verify → intake → subscribe

export default function VerifyMemberPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await verifyMemberCode(formData)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.push('/onboarding/intake')
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Black header with logo */}
      <header className="flex items-center justify-center bg-black py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/trenador-logo-white.svg" alt="Trenador" className="h-7 w-auto" />
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-8">
          {/* Step indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Step 1 of {TOTAL_STEPS}</span>
            <div className="flex gap-1">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-8 rounded-full transition-colors ${i === 0 ? 'bg-foreground' : 'bg-foreground/15'}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Verify your membership</h1>
            <p className="text-sm text-muted-foreground">
              Enter the member code from your gym welcome email or front desk.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">Member code</label>
              <input
                id="code"
                name="code"
                type="text"
                required
                autoComplete="off"
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm uppercase tracking-widest outline-none focus:ring-2 focus:ring-ring placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground"
                placeholder="PHC-XXXX-XXXX"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="h-10 rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
