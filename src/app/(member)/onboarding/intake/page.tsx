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

    router.push('/home')
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-lg space-y-8 px-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">tell us about yourself</h1>
          <p className="text-sm text-muted-foreground">
            this helps your AI coaches give you personalized guidance
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="space-y-2">
            <label htmlFor="age" className="text-sm font-medium">age</label>
            <input
              id="age" name="age" type="number" min="13" max="100" required
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">gender</label>
            <select name="gender" required className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">select...</option>
              <option value="male">male</option>
              <option value="female">female</option>
              <option value="non_binary">non-binary</option>
              <option value="prefer_not_to_say">prefer not to say</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">height</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  name="height_ft" type="number" min="3" max="8" required
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="5"
                />
                <span className="text-sm text-muted-foreground">ft</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  name="height_in" type="number" min="0" max="11" required
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="10"
                />
                <span className="text-sm text-muted-foreground">in</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="weight" className="text-sm font-medium">weight (lbs)</label>
            <input
              id="weight" name="weight" type="number" min="80" max="500" required
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="175"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">primary goal</label>
            <select name="goal_primary" required className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">select...</option>
              <option value="lose_fat">lose fat</option>
              <option value="build_muscle">build muscle</option>
              <option value="improve_endurance">improve endurance</option>
              <option value="increase_strength">increase strength</option>
              <option value="improve_mobility">improve mobility</option>
              <option value="general_fitness">general fitness</option>
              <option value="sport_performance">sport performance</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">activity level</label>
            <select name="activity_level" required className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">select...</option>
              <option value="sedentary">sedentary (desk job, little exercise)</option>
              <option value="lightly_active">lightly active (1-2 days/week)</option>
              <option value="moderately_active">moderately active (3-4 days/week)</option>
              <option value="very_active">very active (5-6 days/week)</option>
              <option value="athlete">athlete (2x/day or intense daily training)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">training experience</label>
            <select name="experience" required className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">select...</option>
              <option value="beginner">beginner (less than 1 year)</option>
              <option value="intermediate">intermediate (1-3 years)</option>
              <option value="advanced">advanced (3+ years)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">preferred gym location</label>
            <select name="location_pref" required className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">select...</option>
              <option value="miami">miami</option>
              <option value="fort_lauderdale">fort lauderdale</option>
              <option value="both">both</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="injuries" className="text-sm font-medium">
              injuries or physical limitations
              <span className="ml-1 text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="injuries" name="injuries" rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. left knee pain, lower back issues..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="medical_conditions" className="text-sm font-medium">
              medical conditions or medications
              <span className="ml-1 text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="medical_conditions" name="medical_conditions" rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. type 2 diabetes, blood pressure medication..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="dietary_restrictions" className="text-sm font-medium">
              dietary restrictions
              <span className="ml-1 text-muted-foreground">(optional)</span>
            </label>
            <input
              id="dietary_restrictions" name="dietary_restrictions" type="text"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. vegetarian, gluten-free, halal..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'saving...' : 'continue to phchat'}
          </button>
        </form>
      </div>
    </div>
  )
}
