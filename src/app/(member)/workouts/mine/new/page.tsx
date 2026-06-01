'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createMyWorkoutAction } from '@/actions/workouts'

const CATEGORIES = ['Push', 'Pull', 'Legs', 'Full body', 'Cardio', 'Mobility', 'Other']

export default function NewWorkoutPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Workout name is required'); return }

    startTransition(async () => {
      const workout = await createMyWorkoutAction(title.trim(), category || undefined)
      router.push(`/workouts/mine/${workout.id}`)
    })
  }

  return (
    <div className="px-6 py-8 max-w-md mx-auto">
      <div className="mb-6">
        <Link href="/workouts/mine" className="label-mono text-muted-foreground hover:text-foreground transition-colors normal-case tracking-wide text-xs">
          ← My Workouts
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-6">Create a workout</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="label-mono normal-case tracking-wide text-xs">Workout name</label>
          <input
            type="text"
            value={title}
            onChange={e => { setTitle(e.target.value); setError('') }}
            placeholder="e.g. My Push Day"
            className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="label-mono normal-case tracking-wide text-xs">Category (optional)</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select category</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 mt-2"
        >
          {isPending ? 'Creating…' : 'Create workout'}
        </button>
      </form>
    </div>
  )
}
