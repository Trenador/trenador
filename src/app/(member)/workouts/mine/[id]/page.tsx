import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getMyWorkoutAction } from '@/actions/workouts'
import { WorkoutBuilder } from './workout-builder'
import type { WorkoutStructure } from '@/lib/workouts'
import { cn } from '@/lib/utils'
import MyWorkoutsLoading from '../loading'

const CATEGORY_IMAGE: Record<string, string> = {
  Strength: '/assets/workout-strength.jpg',
  Hypertrophy: '/assets/workout-hypertrophy.jpg',
  Cardio: '/assets/workout-cardio.jpg',
  Mobility: '/assets/workout-mobility.jpg',
}

const CATEGORY_BANNER: Record<string, string> = {
  Strength: 'bg-[linear-gradient(135deg,#4a2a1c_0%,#2a1610_100%)]',
  Hypertrophy: 'bg-[linear-gradient(135deg,#4a1f2a_0%,#2a1018_100%)]',
  Cardio: 'bg-[linear-gradient(135deg,#1e3a2a_0%,#0f1f17_100%)]',
  Mobility: 'bg-[linear-gradient(135deg,#2e2a4a_0%,#171528_100%)]',
}

export default function MyWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<MyWorkoutsLoading />}>
      <MyWorkoutContent params={params} />
    </Suspense>
  )
}

async function MyWorkoutContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const workout = await getMyWorkoutAction(id)
  if (!workout) notFound()

  const cat = workout.category ?? ''
  const bannerClass = CATEGORY_BANNER[cat] ?? 'bg-foreground/80'
  const img = CATEGORY_IMAGE[cat]
  const structure = (workout.structure ?? {}) as WorkoutStructure
  const weeks = structure.weeks ?? []

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Hero */}
      <div className={cn('relative -mx-0 flex min-h-[220px] items-end overflow-hidden p-6', bannerClass)}>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover brightness-110"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-black/30" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />

        <Link
          href="/workouts/mine"
          className="absolute left-4 top-4 hidden items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-[13px] font-medium text-white ring-1 ring-inset ring-white/30 backdrop-blur-sm transition hover:bg-white/25 sm:inline-flex"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          My workouts
        </Link>

        <div className="relative min-w-0 flex-1">
          {cat && (
            <span className="label-mono normal-case tracking-[0.18em] !text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
              {cat}
            </span>
          )}
          <h1 className="mt-2 font-serif text-[32px] italic leading-[1.05] !text-white sm:text-[40px] [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
            {workout.title}
          </h1>
        </div>
      </div>

      {/* Mobile back */}
      <div className="px-4 pt-3 sm:hidden">
        <Link href="/workouts/mine" className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> My workouts
        </Link>
      </div>

      <div className="px-4 pb-16 pt-6 md:px-6 lg:px-8">
        {workout.sourceWorkoutId && (
          <p className="label-mono mb-6 normal-case tracking-[0.15em] text-muted-foreground">
            Remixed from library
          </p>
        )}

        {weeks.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-[13px] font-medium text-foreground/70">Workout structure</h2>
            <div className="space-y-3">
              {weeks.map((week, wi) => (
                <div key={wi} className="overflow-hidden rounded-xl border border-border/70">
                  <div className="px-4 py-2.5">
                    <p className="text-[13px] font-medium">{week.label}</p>
                  </div>
                  {week.days.map((day, di) => (
                    <div key={di} className="border-t border-border/40 px-4 py-3">
                      <p className="mb-2 text-[12px] text-muted-foreground">{day.label}</p>
                      <div className="space-y-2">
                        {day.blocks.map((block, bi) => (
                          <div key={bi} className="flex gap-3">
                            <span className="label-mono mt-0.5 w-5 shrink-0 text-right text-[10px] normal-case text-muted-foreground">
                              {bi + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium leading-snug">{block.name.replace(/^[A-Z]\d?\.\s+/, '')}</p>
                              <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{block.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-4 text-[13px] font-medium text-foreground/70">Your exercises</h2>
          <WorkoutBuilder workout={workout} />
        </div>
      </div>
    </div>
  )
}
