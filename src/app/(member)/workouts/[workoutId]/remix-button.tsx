'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { remixWorkoutAction } from '@/actions/workouts'

export function RemixButton({ workoutId }: { workoutId: string }) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleRemix() {
    startTransition(async () => {
      const workout = await remixWorkoutAction(workoutId)
      setSaved(true)
      setTimeout(() => router.push(`/workouts/mine/${workout.id}`), 600)
    })
  }

  return (
    <button
      onClick={handleRemix}
      disabled={isPending || saved}
      className="h-10 rounded-full bg-[oklch(0.58_0.17_40)] px-6 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {saved ? 'Saved!' : isPending ? 'Saving…' : 'Remix'}
    </button>
  )
}
