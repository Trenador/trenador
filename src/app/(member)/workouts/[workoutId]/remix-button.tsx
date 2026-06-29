'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { remixWorkoutAction } from '@/actions/workouts'

export function RemixButton({
  workoutId,
  variant = 'default',
}: {
  workoutId: string
  variant?: 'default' | 'hero' | 'mobile' | 'mobile-full'
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleRemix() {
    startTransition(async () => {
      const workout = await remixWorkoutAction(workoutId)
      toast.success('Added to your plan')
      router.push(`/workouts/mine/${workout.id}`)
    })
  }

  if (variant === 'hero') {
    return (
      <button
        onClick={handleRemix}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black transition hover:bg-white/90 disabled:opacity-60"
      >
        <Plus className="h-3.5 w-3.5" />
        {isPending ? 'Adding…' : 'Remix'}
      </button>
    )
  }

  if (variant === 'mobile') {
    return (
      <button
        onClick={handleRemix}
        disabled={isPending}
        className="flex h-10 items-center gap-2 rounded-lg bg-foreground px-5 text-[14px] font-medium text-background transition active:scale-[0.98] disabled:opacity-60 sm:hidden"
      >
        <Plus className="h-4 w-4" />
        {isPending ? 'Adding…' : 'Remix'}
      </button>
    )
  }

  if (variant === 'mobile-full') {
    return (
      <button
        onClick={handleRemix}
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-[15px] font-medium text-background transition active:scale-[0.98] disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        {isPending ? 'Adding…' : 'Remix'}
      </button>
    )
  }

  return (
    <button
      onClick={handleRemix}
      disabled={isPending}
      className="h-10 rounded-full bg-accent px-6 text-[13px] font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {isPending ? 'Adding…' : 'Remix'}
    </button>
  )
}
