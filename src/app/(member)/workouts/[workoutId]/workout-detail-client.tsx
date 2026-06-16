'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Gauge, ChevronDown } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { RemixButton } from './remix-button'
import type { WorkoutStructure } from '@/lib/workouts'

type WorkoutData = {
  id: string
  title: string
  category: string | null
  level: string | null
  muscleGroups: string[]
  durationMinutes: number | null
  summary: string | null
  lengthLabel: string | null
  savesCount: number
  coachNotes: string | null
  structure: WorkoutStructure
  legacyBlocks: Array<{
    id: string
    name: string
    dayIndex: number
    orderIndex: number
    exercises: unknown
  }>
  coachName: string | null
  coachPhotoUrl: string | null
  coachBio: string | null
  coachSpecialties: string[] | null
}

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


function BlockItem({ name, detail, index }: { name: string; detail: string; index: number }) {
  const cleanName = name.replace(/^[A-Z]\d?\.\s+/, '')
  return (
    <div className="flex gap-3 py-3">
      <span className="label-mono mt-0.5 w-6 shrink-0 normal-case tracking-[0.12em] text-muted-foreground">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium leading-snug sm:text-[14px]">{cleanName}</p>
        {detail && <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground sm:mt-1.5">{detail}</p>}
      </div>
    </div>
  )
}

function WorkoutContent({ workout }: { workout: WorkoutData }) {
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([0]))
  const [openDays, setOpenDays] = useState<Set<string>>(new Set())

  const toggleWeek = (wi: number) => {
    setOpenWeeks(prev => {
      const next = new Set(prev)
      next.has(wi) ? next.delete(wi) : next.add(wi)
      return next
    })
  }

  const toggleDay = (key: string) => {
    setOpenDays(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  if (workout.structure.weeks?.length) {
    const weeks = workout.structure.weeks
    return (
      <div className="border-t border-border/60">
        {weeks.map((week, wi) => (
          <div key={wi} className="border-b border-border/60">
            <button
              type="button"
              onClick={() => toggleWeek(wi)}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-foreground/[0.02] lg:px-8"
            >
              <span className="label-mono normal-case tracking-[0.12em] text-muted-foreground">{week.label}</span>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', openWeeks.has(wi) && 'rotate-180')} />
            </button>
            {openWeeks.has(wi) && week.days.map((day, di) => {
              const key = `${wi}-${di}`
              return (
                <div key={di} className="border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => toggleDay(key)}
                    className="flex w-full items-center justify-between px-6 py-3 pl-10 text-left transition-colors hover:bg-foreground/[0.02] lg:pl-12 lg:pr-8"
                  >
                    <span className="text-[15px] font-medium sm:text-[14px]">{`Day ${di + 1}`}</span>
                    <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground/60 transition-transform', openDays.has(key) && 'rotate-180')} />
                  </button>
                  {openDays.has(key) && (
                    <div className="divide-y divide-border/40 border-t border-border/40 px-6 lg:px-8">
                      {day.blocks.map((block, bi) => (
                        <BlockItem key={bi} name={block.name} detail={block.detail} index={bi} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  // Legacy flat blocks
  if (workout.legacyBlocks.length) {
    return (
      <div className="divide-y divide-border/40 border-t border-border/60 px-6 lg:px-8">
        {workout.legacyBlocks.map((block, bi) => {
          const exercises = Array.isArray(block.exercises) ? block.exercises as Array<{
            name: string; targetSets?: number; targetReps?: number; notes?: string
          }> : []
          return exercises.map((ex, ei) => (
            <BlockItem
              key={`${bi}-${ei}`}
              name={ex.name}
              detail={[
                ex.targetSets && ex.targetReps ? `${ex.targetSets}×${ex.targetReps}` : null,
                ex.notes ?? null,
              ].filter(Boolean).join(' · ')}
              index={ei}
            />
          ))
        })}
      </div>
    )
  }

  return <p className="px-6 py-8 text-sm text-muted-foreground lg:px-8">No workout content yet.</p>
}

export function WorkoutDetailClient({ workout }: { workout: WorkoutData }) {
  const img = workout.category ? CATEGORY_IMAGE[workout.category] : undefined
  const banner = workout.category ? (CATEGORY_BANNER[workout.category] ?? 'bg-muted') : 'bg-muted'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl">

        {/* Hero */}
        <div className={cn('relative flex min-h-[220px] items-end overflow-hidden p-6 h-[44vh] sm:h-[220px]', banner)}>
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover brightness-110" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-black/30" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />

          {/* Go back — desktop */}
          <Link
            href="/workouts"
            className="absolute left-4 top-4 hidden items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-[13px] font-medium text-white ring-1 ring-inset ring-white/30 backdrop-blur-sm transition hover:bg-white/25 sm:inline-flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Go back
          </Link>

          {/* Remix — top-right in hero */}
          <div className="absolute right-4 top-4">
            <RemixButton workoutId={workout.id} variant="hero" />
          </div>

          {/* Category + title at bottom */}
          <div className="relative min-w-0 flex-1">
            {workout.category && (
              <span className="label-mono normal-case tracking-[0.18em] !text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
                {workout.category}
              </span>
            )}
            <h1 className="mt-2 font-serif text-[32px] italic leading-[1.05] !text-white sm:text-[40px] [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
              {workout.title}
            </h1>
          </div>
        </div>

        {/* Mobile go back */}
        <div className="flex items-center justify-between px-4 pt-3 sm:hidden">
          <Link href="/workouts" className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Go back
          </Link>
          <RemixButton workoutId={workout.id} variant="mobile" />
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-6 pt-5 lg:px-8">
          {workout.durationMinutes && (
            <span className="label-mono flex items-center gap-1.5 normal-case tracking-[0.12em] text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {workout.durationMinutes >= 60 ? '1 hr' : `${workout.durationMinutes} min`}
            </span>
          )}
          {workout.level && (
            <span className="label-mono flex items-center gap-1.5 normal-case tracking-[0.12em] text-muted-foreground">
              <Gauge className="h-3.5 w-3.5" /> {workout.level}
            </span>
          )}
          {workout.muscleGroups.map(tag => (
            <span key={tag} className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[12px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        {/* Summary */}
        {workout.summary && (
          <p className="px-6 pt-5 text-[15px] leading-relaxed text-foreground/80 lg:px-8">
            {workout.summary}
          </p>
        )}

        {/* Workout content (weeks/days/blocks) */}
        <div className="mt-6 pb-8">
          <WorkoutContent workout={workout} />
        </div>

        {/* Coach notes */}
        {workout.coachNotes && (
          <div className="border-t border-border/60 px-6 py-6 lg:px-8">
            <h2 className="label-mono mb-3 normal-case tracking-[0.18em] text-foreground">Coach notes</h2>
            <p className="text-[14px] leading-relaxed text-muted-foreground">{workout.coachNotes}</p>
          </div>
        )}

        {/* Coach bio */}
        {workout.coachName && (
          <div className="border-t border-border/60 px-6 py-6 lg:px-8">
            <div className="flex items-center gap-4">
              {workout.coachPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={workout.coachPhotoUrl} alt={workout.coachName} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-[18px] font-semibold text-background">
                  {getInitials(workout.coachName)}
                </div>
              )}
              <div>
                <p className="font-medium">{workout.coachName}</p>
                {workout.coachSpecialties?.[0] && (
                  <p className="label-mono mt-0.5 normal-case tracking-wide text-muted-foreground">{workout.coachSpecialties[0]}</p>
                )}
              </div>
            </div>
            {workout.coachBio && (
              <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">{workout.coachBio}</p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
