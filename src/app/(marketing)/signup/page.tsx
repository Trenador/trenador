'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { OAuthButtons } from '@/components/shared/oauth-buttons'

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setConfirmationSent(true)
    setLoading(false)
  }

  if (confirmationSent) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="max-w-sm space-y-3 px-6 text-center">
          <h1 className="text-xl font-semibold">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to{' '}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
      </div>
    )
  }

  const formContent = (
    <>
      <OAuthButtons />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="label-mono normal-case tracking-wide text-[11px]">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="displayName" className="text-sm font-medium">Full name</label>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="John Smith"
            className="h-12 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="h-12 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-full bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Log in
        </Link>
      </p>
    </>
  )

  return (
    <div className="min-h-dvh bg-black text-white md:bg-card md:text-card-foreground">

      {/* ── MOBILE ── */}
      <div className="relative flex min-h-dvh flex-col overflow-hidden md:hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/login-hero.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/95" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-16 pb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/trenador-logo-white.svg" alt="Trenador" className="h-auto w-1/2 object-contain drop-shadow-2xl" />
          <p className="mt-4 max-w-xs text-sm text-white/70">Your fitness concierge on tap.</p>
        </div>

        <div className="relative z-10 rounded-t-[2.5rem] bg-card px-6 pb-10 pt-6 text-card-foreground shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.6)]">
          <div className="mx-auto w-full max-w-sm space-y-5">
            <h1 className="text-2xl font-bold tracking-tight">Get started</h1>
            {formContent}
          </div>
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:grid md:min-h-dvh md:grid-cols-2">
        {/* Left: hero */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/login-hero.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_25%]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-black/90" />
          <div className="relative z-10 flex h-full flex-col justify-between p-8 text-white lg:p-10">
            <div>
              <p className="text-sm font-medium text-white/80">Join today</p>
              <h2 className="mt-3 text-3xl font-bold leading-[1.1] tracking-tight">
                Your fitness<br />concierge on tap
              </h2>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">Powered by</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/trenador-logo-white.svg" alt="Trenador" className="h-8 w-auto object-contain drop-shadow-2xl" />
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex items-center justify-center p-8 md:p-10 lg:p-14">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">Get started</h1>
              <p className="text-sm text-muted-foreground">Create your Trenador account</p>
            </div>
            {formContent}
          </div>
        </div>
      </div>
    </div>
  )
}
