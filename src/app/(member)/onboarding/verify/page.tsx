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
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">verify your membership</h1>
          <p className="text-sm text-muted-foreground">
            enter the member code from your gym welcome email or front desk
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              member code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              autoComplete="off"
              className="w-full rounded-md border px-3 py-2 text-sm uppercase tracking-widest outline-none focus:ring-2 focus:ring-ring"
              placeholder="PHC-XXXX-XXXX"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'verifying...' : 'verify membership'}
          </button>
        </form>
      </div>
    </div>
  )
}
