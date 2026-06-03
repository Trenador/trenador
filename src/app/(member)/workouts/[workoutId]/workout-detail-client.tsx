'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Gauge, ChevronDown, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
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

type Tab = 'workout' | 'notes' | 'bio'

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

function coachInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map(p => p[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function BlockItem({ name, detail, index }: { name: string; detail: string; index: number }) {
  const cleanName = name.replace(/^[A-Z]\d?\.\s+/, '')
  return (
    <div className="flex gap-3 py-3">
      <span className="label-mono mt-0.5 w-5 shrink-0 text-right text-[10px] text-muted-foreground normal-case">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium leading-snug">{cleanName}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{detail}</p>
      </div>
    </div>
  )
}

function WorkoutTab({ workout }: { workout: WorkoutData }) {
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([0]))
  const [openDays, setOpenDays] = useState<Set<string>>(new Set(['0-0']))

  const toggleWeek = (wi: number) => {
    setOpenWeeks(prev => {
      const next = new Set(prev)
      next.has(wi) ? next.delete(wi) : next.add(wi)
      return next
    })
  }

  const toggleDay = (wi: number, di: number) => {
    const key = `${wi}-${di}`
    setOpenDays(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  if (workout.summary) {
    // render summary then structure
  }

  if (workout.structure.weeks?.length) {
    const weeks = workout.structure.weeks
    return (
      <div className="space-y-2">
        {workout.summary && (
          <p className="mb-5 text-[14px] leading-relaxed text-muted-foreground">{workout.summary}</p>
        )}
        {weeks.map((week, wi) => (
          <div key={wi} className="overflow-hidden rounded-xl border border-border/70">
            <button
              type="button"
              onClick={() => toggleWeek(wi)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-foreground/[0.03]"
            >
              <span className="text-[13px] font-medium">{week.label}</span>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', openWeeks.has(wi) && 'rotate-180')} />
            </button>
            {openWeeks.has(wi) && (
              <div className="border-t border-border/50 px-2 pb-2 pt-1 space-y-1">
                {week.days.map((day, di) => (
                  <div key={di} className="rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleDay(wi, di)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-foreground/[0.03]"
                    >
                      <span className="text-[12px] text-muted-foreground">{day.label}</span>
                      <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground/60 transition-transform', openDays.has(`${wi}-${di}`) && 'rotate-180')} />
                    </button>
                    {openDays.has(`${wi}-${di}`) && (
                      <div className="divide-y divide-border/40 border-t border-border/40 px-2">
                        {day.blocks.map((block, bi) => (
                          <BlockItem key={bi} name={block.name} detail={block.detail} index={bi} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Legacy blocks (flat list)
  if (workout.legacyBlocks.length) {
    return (
      <div className="space-y-5">
        {workout.summary && (
          <p className="text-[14px] leading-relaxed text-muted-foreground">{workout.summary}</p>
        )}
        {workout.legacyBlocks.map(block => {
          const exercises = Array.isArray(block.exercises)
            ? (block.exercises as Array<{ name: string; targetSets?: number; targetReps?: number; notes?: string }>)
            : []
          return (
            <div key={block.id}>
              <div className="label-mono mb-2 text-[10px] normal-case tracking-widest text-muted-foreground">
                {block.name}
              </div>
              <div className="divide-y divide-border/40 rounded-xl border border-border/70">
                {exercises.map((ex, i) => (
                  <BlockItem
                    key={i}
                    name={ex.name}
                    detail={[
                      ex.targetSets && ex.targetReps ? `${ex.targetSets}×${ex.targetReps}` : null,
                      ex.notes ?? null,
                    ].filter(Boolean).join(' · ')}
                    index={i}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return <p className="text-sm text-muted-foreground">No workout content yet.</p>
}

export function WorkoutDetailClient({ workout }: { workout: WorkoutData }) {
  const [tab, setTab] = useState<Tab>('workout')

  const img = workout.category ? CATEGORY_IMAGE[workout.category] : undefined
  const banner = workout.category ? (CATEGORY_BANNER[workout.category] ?? 'bg-muted') : 'bg-muted'
  const tabs: { id: Tab; label: string }[] = [
    { id: 'workout', label: 'Workout' },
    { id: 'notes', label: 'Notes' },
    ...(workout.coachName ? [{ id: 'bio' as Tab, label: 'Bio' }] : []),
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Hero */}
      <div className={cn('relative w-full overflow-hidden', banner, 'h-[44vh] md:h-[220px] md:mx-4 md:mt-4 md:rounded-2xl md:w-[calc(100%-2rem)]')}>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover brightness-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60" />

        {/* Back button desktop */}
        <Link
          href="/workouts"
          className="absolute left-4 top-4 hidden items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-[12px] text-white backdrop-blur-sm transition-colors hover:bg-black/50 md:flex"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Library
        </Link>

        {/* Category label */}
        {workout.category && (
          <div className="absolute left-4 top-4 md:hidden">
            <span className="label-mono text-[10px] normal-case tracking-widest text-white/80">
              {workout.category}
            </span>
          </div>
        )}

        {/* Title + meta */}
        <div className="absolute inset-x-4 bottom-4">
          <h1 className="font-serif text-[28px] italic leading-tight tracking-[0.02em] text-white drop-shadow-md md:text-[36px]">
            {workout.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {workout.durationMinutes && (
              <span className="flex items-center gap-1 text-[12px] text-white/80">
                <Clock className="h-3.5 w-3.5" /> {workout.durationMinutes} min
              </span>
            )}
            {workout.level && (
              <span className="flex items-center gap-1 text-[12px] text-white/80">
                <Gauge className="h-3.5 w-3.5" /> {workout.level}
              </span>
            )}
            {workout.muscleGroups.map(tag => (
              <span key={tag} className="rounded-full border border-white/30 px-2 py-0.5 text-[10px] text-white/80">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Back button mobile */}
      <div className="px-4 pt-3 md:hidden">
        <Link href="/workouts" className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to library
        </Link>
      </div>

      {/* Remix button */}
      <div className="px-4 pt-4 md:px-6">
        <div className="flex items-center gap-3">
          <RemixButton workoutId={workout.id} />
          {workout.savesCount > 0 && (
            <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
              <Bookmark className="h-3.5 w-3.5" /> {workout.savesCount}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 mt-4 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="flex gap-0 px-4 md:px-6">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'border-b-2 px-4 py-3 text-[13px] font-medium transition-colors',
                tab === t.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-6 pb-16 md:px-6">
        {tab === 'workout' && <WorkoutTab workout={workout} />}

        {tab === 'notes' && (
          workout.coachNotes
            ? <p className="text-[14px] leading-relaxed text-muted-foreground">{workout.coachNotes}</p>
            : <p className="text-[14px] text-muted-foreground">No coach notes for this workout.</p>
        )}

        {tab === 'bio' && workout.coachName && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              {workout.coachPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={workout.coachPhotoUrl}
                  alt={workout.coachName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-[18px] font-semibold text-background">
                  {coachInitials(workout.coachName)}
                </div>
              )}
              <div>
                <p className="font-medium">{workout.coachName}</p>
                {workout.coachSpecialties?.[0] && (
                  <p className="label-mono text-[10px] normal-case tracking-wide text-muted-foreground mt-0.5">
                    {workout.coachSpecialties[0]}
                  </p>
                )}
              </div>
            </div>
            {workout.coachBio && (
              <p className="text-[14px] leading-relaxed text-muted-foreground">{workout.coachBio}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
