'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { remixWorkoutAction } from '@/actions/workouts'

export function RemixButton({
  workoutId,
  variant = 'default',
}: {
  workoutId: string
  variant?: 'default' | 'hero' | 'mobile'
}) {
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

  if (variant === 'hero') {
    return (
      <button
        onClick={handleRemix}
        disabled={isPending || saved}
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black transition hover:bg-white/90 disabled:opacity-60"
      >
        <Plus className="h-3.5 w-3.5" />
        {saved ? 'Saved!' : isPending ? 'Saving…' : 'Remix'}
      </button>
    )
  }

  if (variant === 'mobile') {
    return (
      <button
        onClick={handleRemix}
        disabled={isPending || saved}
        className="flex h-10 items-center gap-2 rounded-lg bg-foreground px-5 text-[14px] font-medium text-background transition active:scale-[0.98] disabled:opacity-60 sm:hidden"
      >
        <Plus className="h-4 w-4" />
        {saved ? 'Saved!' : isPending ? 'Saving…' : 'Remix'}
      </button>
    )
  }

  return (
    <button
      onClick={handleRemix}
      disabled={isPending || saved}
      className="h-10 rounded-full bg-accent px-6 text-[13px] font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {saved ? 'Saved!' : isPending ? 'Saving…' : 'Remix'}
    </button>
  )
}
