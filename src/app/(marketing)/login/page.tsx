'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FloatingField } from '@/components/ui/floating-field'
import { OAuthButtons } from '@/components/shared/oauth-buttons'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [mobileView, setMobileView] = useState<'choose' | 'form'>('choose')

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

  async function handleForgotPassword() {
    if (!email) { setError('Enter your email address first'); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?type=recovery`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setMagicSent(true)
  }

  if (magicSent) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="max-w-sm space-y-3 px-6 text-center">
          <h1 className="text-xl font-semibold">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a link to{' '}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
      </div>
    )
  }

  // Desktop-only form content
  const desktopFormContent = (
    <>
      <form onSubmit={handleLogin} className="space-y-3">
        <FloatingField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <FloatingField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={handleForgotPassword}
            className="mt-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Forgot password?
          </button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 w-full rounded-md bg-primary text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Log in'}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <OAuthButtons />
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
            {mobileView === 'choose' ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setMobileView('form')}
                  className="h-12 w-full rounded-md bg-foreground text-base font-medium text-background transition-opacity hover:opacity-90"
                >
                  Log in
                </button>
                <Link
                  href="/signup"
                  className="flex h-12 w-full items-center justify-center rounded-md border border-border bg-background text-base font-normal text-foreground transition-colors hover:bg-muted"
                >
                  Sign up
                </Link>
                <p className="pt-1 text-center text-xs text-muted-foreground">
                  By continuing, you agree to our{' '}
                  <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
                  {' '}and{' '}
                  <Link href="/terms" className="underline hover:text-foreground">Terms of Use</Link>.
                </p>
              </div>
            ) : (
              <>
                {/* Back arrow + centered title */}
                <div className="relative flex h-10 items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setMobileView('choose')}
                    className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-base font-medium">Log in</span>
                </div>

                {/* Mobile login form — "Continue" button, no cross-link */}
                <form onSubmit={handleLogin} className="space-y-3">
                  <FloatingField
                    id="m-email"
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div>
                    <FloatingField
                      id="m-password"
                      label="Password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="mt-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Forgot password?
                    </button>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 h-12 w-full rounded-md bg-foreground text-base font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? 'Signing in…' : 'Continue'}
                  </button>
                </form>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <OAuthButtons label="Continue with Google" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── DESKTOP ── form-left / hero-right */}
      <div className="hidden md:grid md:min-h-dvh md:w-full md:grid-cols-2 md:bg-white">
        {/* Left: form */}
        <div className="relative flex items-center justify-center p-8 md:p-10 lg:p-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/trenador-logo-mark.svg"
            alt="Trenador"
            className="absolute left-8 top-6 h-8 w-auto md:top-8 lg:left-14"
          />
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">Fitness Reimagined.</h1>
              <p className="mt-2 text-sm text-muted-foreground">Access top workouts by elite coaches.</p>
            </div>
            {desktopFormContent}
          </div>
          <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-muted-foreground lg:bottom-8">
            © 2026 All rights reserved.
          </p>
        </div>

        {/* Right: hero (rounded panel) */}
        <div className="relative hidden p-6 md:block lg:p-8">
          <div className="relative h-full w-full overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/login-hero.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[center_25%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-end p-8 text-white lg:p-12">
              <h2 className="text-2xl font-bold leading-[1.1] tracking-tight lg:text-3xl xl:text-4xl">
                Your fitness concierge on tap.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80 lg:text-base">
                Get personalized training, nutrition, and recovery, built around you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
