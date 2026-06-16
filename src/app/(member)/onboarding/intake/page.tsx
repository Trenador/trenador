'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { submitIntake, getCoachesForPicker, assignCoach } from '@/actions/onboarding'

type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'

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

const TOTAL_STEPS = 3
const CURRENT_STEP = 2

function initials(name: string) {
  return name.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function CoachPickerCard({
  coach,
  selected,
  onSelect,
}: {
  coach: CoachOption
  selected: boolean
  onSelect: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const toggle = () => {
    onSelect()
    setExpanded(prev => !prev)
  }

  const subtitle = [coach.specialty[0], coach.location].filter(Boolean).join(' · ')

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
      className={cn(
        'cursor-pointer rounded-xl border transition-colors',
        selected
          ? 'border-foreground/30 bg-foreground/[0.03]'
          : 'border-input hover:border-foreground/20 hover:bg-foreground/[0.02]',
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
          {coach.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coach.photoUrl} alt={coach.displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-muted-foreground">
              {initials(coach.displayName)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{coach.displayName}</div>
          {subtitle && (
            <div className="truncate text-[12px] text-muted-foreground">{subtitle}</div>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </div>

      {expanded && (
        <div className="border-t border-border/60 px-4 pb-4 pt-3">
          {coach.headline && (
            <p className="mb-3 text-[13px] font-medium leading-snug text-foreground">
              {coach.headline}
            </p>
          )}
          {coach.bio && (
            <p className="text-[13px] leading-relaxed text-muted-foreground">{coach.bio}</p>
          )}
          {coach.gym && (
            <p className="mt-2 text-[12px] text-muted-foreground">{coach.gym}</p>
          )}
          {coach.certifications.length > 0 && (
            <ul className="mt-3 space-y-1">
              {coach.certifications.map(cert => (
                <li key={cert} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                  {cert}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function IntakePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)

  // Form state
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [weight, setWeight] = useState('')
  const [goal, setGoal] = useState('')
  const [activityLevel, setActivityLevel] = useState('')
  const [experience, setExperience] = useState('')
  const [locationPref, setLocationPref] = useState('')
  const [injuries, setInjuries] = useState('')
  const [medicalConditions, setMedicalConditions] = useState('')
  const [dietaryRestrictions, setDietaryRestrictions] = useState('')

  // Coach picker state
  const [coachOptions, setCoachOptions] = useState<CoachOption[]>([])
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null)

  useEffect(() => {
    getCoachesForPicker().then(setCoachOptions).catch(() => {})
  }, [])

  async function handleFinish() {
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.set('age', age)
    formData.set('gender', gender)
    formData.set('height_ft', heightFt)
    formData.set('height_in', heightIn)
    formData.set('weight', weight)
    formData.set('goal_primary', goal)
    formData.set('activity_level', activityLevel)
    formData.set('experience', experience)
    formData.set('location_pref', locationPref)
    formData.set('injuries', injuries)
    formData.set('medical_conditions', medicalConditions)
    formData.set('dietary_restrictions', dietaryRestrictions)
    const result = await submitIntake(formData)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    if (selectedCoachId) {
      await assignCoach(selectedCoachId)
    }
    router.push('/subscribe')
  }

  const inp = 'h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground'
  const sel = 'h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring'
  const tex = 'w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground'

  const genderOptions: { value: Gender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non_binary', label: 'Non-binary' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ]

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Black header */}
      <header className="flex items-center justify-center bg-black py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/trenador-logo-white.svg" alt="Trenador" className="h-7 w-auto" />
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-8">
          {/* Step indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {CURRENT_STEP} of {TOTAL_STEPS}</span>
            <div className="flex gap-1">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-8 rounded-full transition-colors ${i < CURRENT_STEP ? 'bg-foreground' : 'bg-foreground/15'}`}
                />
              ))}
            </div>
          </div>

          {/* Step 0 — Body stats */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Tell us about yourself</h1>
                <p className="text-sm text-muted-foreground">Helps your coach personalize your training.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Age</label>
                  <input type="number" min="13" max="100" value={age} onChange={e => setAge(e.target.value)} className={inp} placeholder="28" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Height</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <input type="number" min="3" max="8" value={heightFt} onChange={e => setHeightFt(e.target.value)} className={inp} placeholder="5" />
                      <span className="shrink-0 text-sm text-muted-foreground">ft</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="11" value={heightIn} onChange={e => setHeightIn(e.target.value)} className={inp} placeholder="10" />
                      <span className="shrink-0 text-sm text-muted-foreground">in</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Weight (lbs)</label>
                  <input type="number" min="80" max="500" value={weight} onChange={e => setWeight(e.target.value)} className={inp} placeholder="175" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { if (!age || !heightFt || !weight) return; setStep(1) }}
                  className="h-10 rounded-md bg-foreground px-6 text-sm font-medium text-background hover:opacity-90 transition-opacity"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 1 — Gender */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">What&apos;s your gender?</h1>
                <p className="text-sm text-muted-foreground">Used to personalize recommendations.</p>
              </div>
              <div className="grid gap-2">
                {genderOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGender(opt.value)}
                    className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition-colors ${gender === opt.value ? 'border-foreground bg-foreground/5' : 'border-input hover:bg-foreground/[0.03]'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { if (!gender) return; setStep(2) }}
                  className="h-10 rounded-md bg-foreground px-6 text-sm font-medium text-background hover:opacity-90 transition-opacity"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Training background */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Your training background</h1>
                <p className="text-sm text-muted-foreground">We&apos;ll tailor the program to your level.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Primary goal</label>
                  <select value={goal} onChange={e => setGoal(e.target.value)} className={sel}>
                    <option value="">Select…</option>
                    <option value="lose_fat">Lose fat</option>
                    <option value="build_muscle">Build muscle</option>
                    <option value="improve_endurance">Improve endurance</option>
                    <option value="increase_strength">Increase strength</option>
                    <option value="improve_mobility">Improve mobility</option>
                    <option value="general_fitness">General fitness</option>
                    <option value="sport_performance">Sport performance</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Activity level</label>
                  <select value={activityLevel} onChange={e => setActivityLevel(e.target.value)} className={sel}>
                    <option value="">Select…</option>
                    <option value="sedentary">Sedentary (desk job, little exercise)</option>
                    <option value="lightly_active">Lightly active (1–2 days/week)</option>
                    <option value="moderately_active">Moderately active (3–4 days/week)</option>
                    <option value="very_active">Very active (5–6 days/week)</option>
                    <option value="athlete">Athlete (2×/day or intense daily)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Training experience</label>
                  <select value={experience} onChange={e => setExperience(e.target.value)} className={sel}>
                    <option value="">Select…</option>
                    <option value="beginner">Beginner (less than 1 year)</option>
                    <option value="intermediate">Intermediate (1–3 years)</option>
                    <option value="advanced">Advanced (3+ years)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preferred gym location</label>
                  <select value={locationPref} onChange={e => setLocationPref(e.target.value)} className={sel}>
                    <option value="">Select…</option>
                    <option value="miami">Miami</option>
                    <option value="fort_lauderdale">Fort Lauderdale</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { if (!goal || !activityLevel || !experience || !locationPref) return; setStep(3) }}
                  className="h-10 rounded-md bg-foreground px-6 text-sm font-medium text-background hover:opacity-90 transition-opacity"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Health notes */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Any health notes?</h1>
                <p className="text-sm text-muted-foreground">All optional — skip any that don&apos;t apply.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Injuries or limitations
                    <span className="ml-1.5 font-normal text-muted-foreground">optional</span>
                  </label>
                  <textarea rows={3} value={injuries} onChange={e => setInjuries(e.target.value)} className={tex} placeholder="e.g. left knee pain, lower back issues…" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Medical conditions or medications
                    <span className="ml-1.5 font-normal text-muted-foreground">optional</span>
                  </label>
                  <textarea rows={3} value={medicalConditions} onChange={e => setMedicalConditions(e.target.value)} className={tex} placeholder="e.g. type 2 diabetes, blood pressure medication…" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Dietary restrictions
                    <span className="ml-1.5 font-normal text-muted-foreground">optional</span>
                  </label>
                  <input type="text" value={dietaryRestrictions} onChange={e => setDietaryRestrictions(e.target.value)} className={inp} placeholder="e.g. vegetarian, gluten-free, halal…" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="h-10 rounded-md bg-foreground px-6 text-sm font-medium text-background hover:opacity-90 transition-opacity"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Confirm */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">You&apos;re almost there!</h1>
                <p className="text-sm text-muted-foreground">Review your details before picking a coach.</p>
              </div>
              <div className="space-y-2 rounded-md border border-border p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span>{age}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span className="capitalize">{gender.replace('_', ' ')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Height</span><span>{heightFt}′{heightIn}″</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Weight</span><span>{weight} lbs</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Goal</span><span className="capitalize">{goal.replace(/_/g, ' ')}</span></div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="h-10 rounded-md bg-foreground px-6 text-sm font-medium text-background hover:opacity-90 transition-opacity"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 5 — Pick your coach */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Pick your coach</h1>
                <p className="text-sm text-muted-foreground">Your coach is your primary advisor throughout your training.</p>
              </div>
              {coachOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading coaches…</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {coachOptions.map(coach => (
                    <CoachPickerCard
                      key={coach.id}
                      coach={coach}
                      selected={selectedCoachId === coach.id}
                      onSelect={() => setSelectedCoachId(coach.id)}
                    />
                  ))}
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading}
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading || !selectedCoachId}
                  className="h-10 rounded-md bg-foreground px-6 text-sm font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Saving…' : 'Finish'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
