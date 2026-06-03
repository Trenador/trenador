'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyMemberCode } from '@/actions/onboarding'

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
    <div className="flex min-h-screen items-center justify-center px-4 md:px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1">
          <p className="label-mono normal-case tracking-wide">Powerhouse Gym</p>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Verify membership</h1>
          <p className="text-sm text-muted-foreground">
            Enter the member code from your gym welcome email or front desk.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="code" className="text-sm font-medium">
              Member code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              autoComplete="off"
              className="w-full h-11 rounded-xl border bg-background px-3 text-sm uppercase tracking-widest outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground placeholder:normal-case placeholder:tracking-normal"
              placeholder="PHC-XXXX-XXXX"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Verify membership'}
          </button>
        </form>
      </div>
    </div>
  )
}
