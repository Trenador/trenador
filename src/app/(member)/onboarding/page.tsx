'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCoachesForPicker, completeOnboarding } from '@/actions/onboarding'
import { getInitials, cn } from '@/lib/utils'

type Gender = 'female' | 'male' | 'non-binary'

type CoachOption = {
  id: string
  displayName: string
  specialty: string[]
  headline: string | null
  bio: string | null
  gym: string | null
  location: string | null
  certifications: string[]
  photoUrl: string | null
}

const TOTAL_STEPS = 5

const inp = 'h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring'
const btn = 'h-10 rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50'

function CoachCard({
  coach,
  selected,
  expanded,
  onSelect,
}: {
  coach: CoachOption
  selected: boolean
  expanded: boolean
  onSelect: () => void
}) {
  const subtitle = [coach.specialty?.[0], coach.location].filter(Boolean).join(' · ')

  return (
    <div
      className={cn(
        'rounded-md border transition-colors',
        selected ? 'border-foreground bg-foreground/5' : 'border-input',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-foreground/[0.03]"
      >
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
          {coach.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coach.photoUrl} alt={coach.displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-muted-foreground">
              {getInitials(coach.displayName)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{coach.displayName}</div>
          {subtitle && (
            <div className="truncate text-[12px] text-muted-foreground">{subtitle}</div>
          )}
        </div>
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-input/60 px-4 py-3 text-xs text-muted-foreground">
          {coach.headline && (
            <p className="text-[13px] font-medium leading-snug text-foreground">{coach.headline}</p>
          )}
          {coach.bio && <p className="leading-relaxed">{coach.bio}</p>}
          {coach.gym && (
            <div>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-foreground/70">Gym</div>
              <div>{coach.gym}</div>
            </div>
          )}
          {coach.certifications?.length > 0 && (
            <div>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-foreground/70">Certifications</div>
              <ul className="list-disc space-y-0.5 pl-4">
                {coach.certifications.map(cert => <li key={cert}>{cert}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [year, setYear] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [weight, setWeight] = useState('')
  const [coachId, setCoachId] = useState('')
  const [expandedCoachId, setExpandedCoachId] = useState('')
  const [coaches, setCoaches] = useState<CoachOption[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCoachesForPicker().then(setCoaches).catch(() => {})
  }, [])

  const next = () => setStep(s => s + 1)

  const submitName = () => {
    if (!firstName.trim()) { setError('Enter your first name'); return }
    if (!lastName.trim()) { setError('Enter your last name'); return }
    setError(null)
    next()
  }

  const submitYear = () => {
    const n = parseInt(year, 10)
    const current = new Date().getFullYear()
    if (!year || isNaN(n) || n < 1900 || n > current) { setError('Enter a valid year'); return }
    setError(null)
    next()
  }

  const submitGender = () => {
    if (!gender) { setError('Select your gender'); return }
    setError(null)
    next()
  }

  const submitWeight = () => {
    const w = parseFloat(weight)
    if (!weight || isNaN(w) || w <= 0 || w > 2000) { setError('Enter a valid weight'); return }
    setError(null)
    next()
  }

  const finish = async () => {
    if (!coachId) { setError('Pick a coach to continue'); return }
    setError(null)
    setSaving(true)
    const result = await completeOnboarding({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      yearOfBirth: parseInt(year, 10),
      gender,
      weightLbs: parseFloat(weight),
      coachId,
    })
    setSaving(false)
    if (result.error) { setError(result.error); return }
    router.push('/chat')
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-center bg-black py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/trenador-logo-white.svg" alt="Trenador" className="h-7 w-auto" />
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-8">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {step + 1} of {TOTAL_STEPS}</span>
            <div className="flex gap-1">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-8 rounded-full transition-colors ${i <= step ? 'bg-foreground' : 'bg-foreground/15'}`}
                />
              ))}
            </div>
          </div>

          {/* Step 0 — Name */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">What&apos;s your name?</h1>
                <p className="text-sm text-muted-foreground">So we can address you properly.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">First name</label>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitName()}
                    className={inp}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitName()}
                    className={inp}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end pt-2">
                <button type="button" onClick={submitName} className={btn}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 1 — Year of birth */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">What year were you born?</h1>
                <p className="text-sm text-muted-foreground">Helps us tailor your training.</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="year" className="text-sm font-medium">Year of birth</label>
                <input
                  id="year"
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={new Date().getFullYear()}
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitYear()}
                  className={inp}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end pt-2">
                <button type="button" onClick={submitYear} className={btn}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 2 — Gender */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">What&apos;s your gender?</h1>
                <p className="text-sm text-muted-foreground">Used to personalize recommendations.</p>
              </div>
              <div className="grid gap-2">
                {(['female', 'male', 'non-binary'] as Gender[]).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => { setGender(g); setError(null) }}
                    className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm capitalize transition-colors ${gender === g ? 'border-foreground bg-foreground/5' : 'border-input hover:bg-foreground/[0.03]'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end pt-2">
                <button type="button" onClick={submitGender} className={btn}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 3 — Weight */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">What&apos;s your weight?</h1>
                <p className="text-sm text-muted-foreground">You can update this anytime in your profile.</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="weight" className="text-sm font-medium">Weight (lbs)</label>
                <input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.1"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitWeight()}
                  className={inp}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end pt-2">
                <button type="button" onClick={submitWeight} className={btn}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 4 — Pick coach */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Pick your coach</h1>
                <p className="text-sm text-muted-foreground">Your coach is your primary advisor.</p>
              </div>
              <div className="grid gap-2">
                {coaches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Loading coaches…</p>
                ) : (
                  coaches.map(coach => (
                    <CoachCard
                      key={coach.id}
                      coach={coach}
                      selected={coachId === coach.id}
                      expanded={expandedCoachId === coach.id}
                      onSelect={() => {
                        setCoachId(coach.id)
                        setExpandedCoachId(prev => prev === coach.id ? '' : coach.id)
                        setError(null)
                      }}
                    />
                  ))
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={finish}
                  disabled={saving || !coachId}
                  className={btn}
                >
                  {saving ? 'Saving…' : 'Finish'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
