'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { remixWorkoutAction } from '@/actions/workouts'

export function SaveWorkoutButton({ workoutId }: { workoutId: string }) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const workout = await remixWorkoutAction(workoutId)
      setSaved(true)
      setTimeout(() => router.push(`/workouts/mine/${workout.id}`), 600)
    })
  }

  return (
    <button
      onClick={handleSave}
      disabled={isPending || saved}
      className="flex-1 h-11 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
    >
      {saved ? 'Saved!' : isPending ? 'Saving…' : 'Save to My Workouts'}
    </button>
  )
}
