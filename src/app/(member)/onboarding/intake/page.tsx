'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitIntake } from '@/actions/onboarding'

export default function IntakePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await submitIntake(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/subscribe')
  }

  const fieldCls = 'w-full h-11 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground'
  const selectCls = 'w-full h-11 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring'
  const textareaCls = 'w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground'

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-6">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-1">
          <p className="label-mono normal-case tracking-wide">Step 2 of 2</p>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Tell us about yourself</h1>
          <p className="text-sm text-muted-foreground">
            This helps your AI coach give you truly personalized guidance.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="space-y-1.5">
            <label htmlFor="age" className="text-sm font-medium">Age</label>
            <input id="age" name="age" type="number" min="13" max="100" required className={fieldCls} placeholder="28" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Gender</label>
            <select name="gender" required className={selectCls}>
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non_binary">Non-binary</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Height</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <input name="height_ft" type="number" min="3" max="8" required className={fieldCls} placeholder="5" />
                <span className="text-sm text-muted-foreground shrink-0">ft</span>
              </div>
              <div className="flex items-center gap-2">
                <input name="height_in" type="number" min="0" max="11" required className={fieldCls} placeholder="10" />
                <span className="text-sm text-muted-foreground shrink-0">in</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="weight" className="text-sm font-medium">Weight (lbs)</label>
            <input id="weight" name="weight" type="number" min="80" max="500" required className={fieldCls} placeholder="175" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Primary goal</label>
            <select name="goal_primary" required className={selectCls}>
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

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Activity level</label>
            <select name="activity_level" required className={selectCls}>
              <option value="">Select…</option>
              <option value="sedentary">Sedentary (desk job, little exercise)</option>
              <option value="lightly_active">Lightly active (1–2 days/week)</option>
              <option value="moderately_active">Moderately active (3–4 days/week)</option>
              <option value="very_active">Very active (5–6 days/week)</option>
              <option value="athlete">Athlete (2×/day or intense daily training)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Training experience</label>
            <select name="experience" required className={selectCls}>
              <option value="">Select…</option>
              <option value="beginner">Beginner (less than 1 year)</option>
              <option value="intermediate">Intermediate (1–3 years)</option>
              <option value="advanced">Advanced (3+ years)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Preferred gym location</label>
            <select name="location_pref" required className={selectCls}>
              <option value="">Select…</option>
              <option value="miami">Miami</option>
              <option value="fort_lauderdale">Fort Lauderdale</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="injuries" className="text-sm font-medium">
              Injuries or physical limitations
              <span className="ml-1.5 text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea id="injuries" name="injuries" rows={3} className={textareaCls}
              placeholder="e.g. left knee pain, lower back issues…" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="medical_conditions" className="text-sm font-medium">
              Medical conditions or medications
              <span className="ml-1.5 text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea id="medical_conditions" name="medical_conditions" rows={3} className={textareaCls}
              placeholder="e.g. type 2 diabetes, blood pressure medication…" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="dietary_restrictions" className="text-sm font-medium">
              Dietary restrictions
              <span className="ml-1.5 text-muted-foreground font-normal">(optional)</span>
            </label>
            <input id="dietary_restrictions" name="dietary_restrictions" type="text" className={fieldCls}
              placeholder="e.g. vegetarian, gluten-free, halal…" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
