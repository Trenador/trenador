'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/chat')
  }

  async function handleMagicLink() {
    if (!email) { setError('Enter your email first'); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setMagicSent(true)
    setLoading(false)
  }

  if (magicSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3 max-w-sm px-6">
          <h1 className="text-xl font-semibold">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-2">
      {/* Left — hero panel (desktop only) */}
      <div className="hidden md:flex flex-col justify-between bg-foreground text-primary-foreground p-10">
        <div>
          <p className="text-sm font-medium text-white/70">Start today</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white">
            Your fitness<br />concierge on tap
          </h2>
        </div>
        {/* image placeholder — replace with real photo */}
        <div className="flex-1 my-8 rounded-2xl bg-white/5 border border-white/10" />
        <p className="text-xs font-medium uppercase tracking-wider text-white/50">
          Trenador — Powered by AI
        </p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center min-h-screen md:min-h-0 px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Log in to your Trenador account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Log in'}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="label-mono normal-case tracking-wide">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={handleMagicLink}
            disabled={loading}
            className="w-full h-11 rounded-full border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Send magic link
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
