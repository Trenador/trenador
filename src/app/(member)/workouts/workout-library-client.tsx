'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Bookmark, CalendarDays, Clock, Gauge, MoveHorizontal, Plus, Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'

type Workout = {
  id: string
  title: string
  category: string | null
  level: string | null
  muscleGroups: string[]
  durationMinutes: number | null
  summary: string | null
  lengthLabel: string | null
  savesCount: number
  coachName: string | null
  coachPhotoUrl: string | null
}

const CATEGORIES = ['Strength', 'Hypertrophy', 'Cardio', 'Mobility'] as const
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'] as const

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


function levelShort(level: string | null) {
  if (!level) return ''
  if (level === 'All Levels') return 'All'
  return level.slice(0, 3) + '.'
}

function formatDuration(min: number | null) {
  if (!min) return null
  if (min >= 60) return '1 hr'
  return `${min} min`
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const img = workout.category ? CATEGORY_IMAGE[workout.category] : undefined
  const banner = workout.category ? (CATEGORY_BANNER[workout.category] ?? 'bg-muted') : 'bg-muted'

  return (
    <Link
      href={`/workouts/${workout.id}`}
      className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/60 bg-background text-left transition-colors hover:border-foreground/30"
    >
      {/* Banner */}
      <div className={cn('relative h-[170px] items-start justify-between overflow-hidden p-4 flex', banner)}>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover brightness-110 transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-black/30" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        <span className="label-mono relative normal-case tracking-[0.18em] !text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
          {workout.category}
        </span>
        {workout.lengthLabel && (
          <span className="label-mono relative flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 normal-case tracking-[0.15em] !text-white backdrop-blur-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
            <CalendarDays className="h-3 w-3" /> {workout.lengthLabel}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-serif text-[20px] leading-tight italic">
          {workout.title}
        </h3>

        <div className="label-mono flex flex-nowrap items-center gap-3 whitespace-nowrap normal-case tracking-[0.12em] text-muted-foreground">
          {workout.durationMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {workout.durationMinutes} min
            </span>
          )}
          {workout.level && (
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" /> {levelShort(workout.level)}
            </span>
          )}
        </div>

        {workout.muscleGroups.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {workout.muscleGroups.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="rounded-full border border-border/70 bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Coach row */}
        {workout.coachName && (
          <div className="mt-auto flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {workout.coachPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={workout.coachPhotoUrl}
                  alt={workout.coachName}
                  className="h-6 w-6 rounded-full object-cover ring-1 ring-border/60"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[9px] font-semibold text-background">
                  {getInitials(workout.coachName)}
                </div>
              )}
              <span className="text-[12px] text-muted-foreground">{workout.coachName}</span>
            </div>
            {workout.savesCount > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                <Bookmark className="h-3 w-3" /> {workout.savesCount.toLocaleString()} {workout.savesCount === 1 ? 'remix' : 'remixes'}
              </span>
            )}
          </div>
        )}

        {/* Remix button */}
        <Link
          href={`/workouts/${workout.id}`}
          onClick={e => e.stopPropagation()}
          className="label-mono flex w-full items-center justify-center gap-1 rounded-full border border-border bg-background px-2.5 py-1.5 normal-case tracking-[0.15em] text-foreground transition-colors hover:bg-foreground/[0.04]"
        >
          <Plus className="h-3 w-3" />
          Remix
        </Link>
      </div>
    </Link>
  )
}

function WorkoutSection({ category, list }: { category: string; list: Workout[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const updateArrows = () => {
    const el = scrollerRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 2)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }

  useEffect(() => {
    updateArrows()
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows, { passive: true })
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      ro.disconnect()
    }
  }, [list.length])

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-serif text-[24px] italic leading-tight">{category}</h2>
        <span className="label-mono normal-case tracking-[0.15em] text-muted-foreground">{list.length}</span>
      </div>
      <div className="relative">
        <div
          ref={scrollerRef}
          className="sm:overflow-x-auto sm:scroll-smooth sm:snap-x sm:snap-mandatory sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden"
        >
          <div className="flex flex-col gap-4 pb-1 sm:flex-row sm:items-stretch sm:gap-5 sm:pr-12">
            {list.map(w => (
              <div key={w.id} data-card className="flex w-full shrink-0 sm:w-[210px] sm:snap-start md:w-[220px] lg:w-[300px]">
                <WorkoutCard workout={w} />
              </div>
            ))}
          </div>
        </div>
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background/70 to-transparent transition-opacity duration-200',
            canLeft ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background/70 to-transparent transition-opacity duration-200',
            canRight ? 'opacity-100' : 'opacity-0',
          )}
        />
      </div>
      {(canLeft || canRight) && (
        <div className="mt-3 flex justify-center text-muted-foreground">
          <MoveHorizontal className="h-4 w-4" />
        </div>
      )}
    </section>
  )
}

const ALL = '__all__'

function FilterSelect({
  label,
  options,
  active,
  onChange,
}: {
  label: string
  options: string[]
  active: string | null
  onChange: (val: string | null) => void
}) {
  return (
    <Select value={active ?? ALL} onValueChange={v => onChange(v === ALL ? null : v)}>
      <SelectTrigger
        className={cn(
          'h-8 w-auto gap-1 rounded-full border-0 bg-foreground/[0.04] px-3 text-[12px] shadow-none focus:ring-0 [&>svg]:mt-1.5 [&>svg]:opacity-60',
          'text-muted-foreground hover:bg-foreground/[0.07]',
          active && 'bg-foreground text-background hover:bg-foreground/90 [&>svg]:opacity-80',
        )}
      >
        <span>{active ? `${label}:` : label}</span>
        {active && <SelectValue />}
      </SelectTrigger>
      <SelectContent className="rounded-xl border-border/60 bg-popover/95 p-1 shadow-lg backdrop-blur-xl" sideOffset={6}>
        <SelectItem value={ALL} className="rounded-lg text-[13px]">All</SelectItem>
        {options.map(o => (
          <SelectItem key={o} value={o} className="rounded-lg text-[13px]">{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function MobileFilterSheet({
  open,
  onOpenChange,
  functionOptions,
  levelOptions,
  muscleOptions,
  durationOptions,
  activeFunction,
  activeLevel,
  activeMuscle,
  activeDuration,
  setActiveFunction,
  setActiveLevel,
  setActiveMuscle,
  setActiveDuration,
  clearAll,
  resultCount,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  functionOptions: string[]
  levelOptions: string[]
  muscleOptions: string[]
  durationOptions: string[]
  activeFunction: string[]
  activeLevel: string[]
  activeMuscle: string[]
  activeDuration: string[]
  setActiveFunction: React.Dispatch<React.SetStateAction<string[]>>
  setActiveLevel: React.Dispatch<React.SetStateAction<string[]>>
  setActiveMuscle: React.Dispatch<React.SetStateAction<string[]>>
  setActiveDuration: React.Dispatch<React.SetStateAction<string[]>>
  clearAll: () => void
  resultCount: number
}) {
  const [openSection, setOpenSection] = useState<string | null>('Function')
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
  }
  const sections = [
    { label: 'Function', active: activeFunction, options: functionOptions, setter: setActiveFunction },
    { label: 'Level', active: activeLevel, options: levelOptions, setter: setActiveLevel },
    { label: 'Muscle', active: activeMuscle, options: muscleOptions, setter: setActiveMuscle },
    { label: 'Duration', active: activeDuration, options: durationOptions, setter: setActiveDuration },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[88vh] w-full flex-col rounded-t-2xl p-0">
        <SheetHeader className="flex-row items-center justify-between border-b border-border/60 px-5 py-4">
          <SheetTitle className="font-serif text-[22px] font-normal tracking-tight">Filter</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5">
          {sections.map(s => {
            const isOpen = openSection === s.label
            return (
              <div key={s.label} className="border-b border-border/60">
                <button
                  type="button"
                  onClick={() => setOpenSection(isOpen ? null : s.label)}
                  className="flex w-full items-center justify-between py-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="label-mono normal-case tracking-[0.18em]">{s.label.toUpperCase()}</span>
                    {s.active.length > 0 && (
                      <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[12px] text-foreground">
                        {s.active.length === 1 ? s.active[0] : `${s.active.length} selected`}
                      </span>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="flex flex-wrap gap-2 pb-5">
                    {s.options.map(opt => {
                      const selected = s.active.includes(opt)
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggle(s.setter, opt)}
                          className={cn(
                            'rounded-md border px-3 py-1.5 text-[13px] transition-colors',
                            selected
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border bg-background text-foreground hover:bg-foreground/[0.04]',
                          )}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-background px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1.5 text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-full bg-foreground px-5 py-3 text-[14px] font-medium text-background transition-opacity hover:opacity-90"
          >
            Show results ({resultCount})
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function WorkoutLibraryClient({ workouts }: { workouts: Workout[] }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeLevel, setActiveLevel] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeDuration, setActiveDuration] = useState<string | null>(null)
  const [mobileCategories, setMobileCategories] = useState<string[]>([])
  const [mobileLevels, setMobileLevels] = useState<string[]>([])
  const [mobileTags, setMobileTags] = useState<string[]>([])
  const [mobileDurations, setMobileDurations] = useState<string[]>([])
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const tags = useMemo(() => {
    const set = new Set<string>()
    workouts.forEach(w => w.muscleGroups.forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [workouts])

  const durationLabels = useMemo(() => {
    const set = new Set<string>()
    workouts.forEach(w => { const l = formatDuration(w.durationMinutes); if (l) set.add(l) })
    return Array.from(set)
  }, [workouts])

  const clearAllFilters = () => {
    setActiveCategory(null); setActiveLevel(null); setActiveTag(null); setActiveDuration(null)
    setMobileCategories([]); setMobileLevels([]); setMobileTags([]); setMobileDurations([])
  }

  const filtered = useMemo(() => workouts.filter(w => {
    if (activeCategory && w.category !== activeCategory) return false
    if (activeLevel && w.level !== activeLevel) return false
    if (activeTag && !w.muscleGroups.includes(activeTag)) return false
    if (activeDuration && formatDuration(w.durationMinutes) !== activeDuration) return false
    if (mobileCategories.length && !mobileCategories.includes(w.category ?? '')) return false
    if (mobileLevels.length && !mobileLevels.includes(w.level ?? '')) return false
    if (mobileTags.length && !mobileTags.some(t => w.muscleGroups.includes(t))) return false
    if (mobileDurations.length && !mobileDurations.includes(formatDuration(w.durationMinutes) ?? '')) return false
    const q = query.toLowerCase()
    if (q && !w.title.toLowerCase().includes(q) && !(w.summary ?? '').toLowerCase().includes(q) && !w.muscleGroups.some(t => t.toLowerCase().includes(q))) return false
    return true
  }), [workouts, activeCategory, activeLevel, activeTag, activeDuration, mobileCategories, mobileLevels, mobileTags, mobileDurations, query])

  const activeFilterCount =
    (activeCategory ? 1 : 0) + (activeLevel ? 1 : 0) + (activeTag ? 1 : 0) + (activeDuration ? 1 : 0) +
    mobileCategories.length + mobileLevels.length + mobileTags.length + mobileDurations.length

  const isFiltered = !!(activeCategory || activeLevel || activeTag || activeDuration || query.trim() ||
    mobileCategories.length || mobileLevels.length || mobileTags.length || mobileDurations.length)

  const grouped = useMemo(() => {
    const map = new Map<string, Workout[]>()
    CATEGORIES.forEach(c => map.set(c, []))
    filtered.forEach(w => { if (w.category) map.get(w.category)?.push(w) })
    return Array.from(map.entries()).filter(([, list]) => list.length > 0)
  }, [filtered])

  return (
    <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10 lg:px-10 lg:pt-14">

          <div className="flex items-start justify-between gap-4">
            <h1 className="font-serif text-[44px] leading-[1.05] tracking-tight">
              Workout library
            </h1>
          </div>

          <div className="sticky top-0 z-20 mt-8 flex flex-col gap-4 bg-background pb-3 pt-2 lg:static lg:pb-0 lg:pt-0">
            {/* Search */}
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search workout"
                className="h-9 w-full rounded-none border-0 border-b border-border bg-transparent pl-8 pr-7 text-[13px] outline-none placeholder:text-muted-foreground focus:border-b-foreground"
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Desktop filter pills */}
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              <FilterSelect label="Function" options={[...CATEGORIES]} active={activeCategory} onChange={setActiveCategory} />
              <FilterSelect label="Level" options={[...LEVELS]} active={activeLevel} onChange={setActiveLevel} />
              <FilterSelect label="Muscle" options={tags} active={activeTag} onChange={setActiveTag} />
              <FilterSelect label="Duration" options={durationLabels} active={activeDuration} onChange={setActiveDuration} />
            </div>

            {/* Mobile filter button */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="flex items-center justify-center gap-2 self-start rounded-full border border-border bg-background px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-foreground/[0.04] sm:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-medium text-background">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="mt-8">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No workouts match your filters.
              </div>
            ) : isFiltered ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(w => (
                  <WorkoutCard key={w.id} workout={w} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-10">
                {grouped.map(([category, list]) => (
                  <WorkoutSection key={category} category={category} list={list} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileFilterSheet
        open={mobileFilterOpen}
        onOpenChange={setMobileFilterOpen}
        functionOptions={[...CATEGORIES]}
        levelOptions={[...LEVELS]}
        muscleOptions={tags}
        durationOptions={durationLabels}
        activeFunction={mobileCategories}
        activeLevel={mobileLevels}
        activeMuscle={mobileTags}
        activeDuration={mobileDurations}
        setActiveFunction={setMobileCategories}
        setActiveLevel={setMobileLevels}
        setActiveMuscle={setMobileTags}
        setActiveDuration={setMobileDurations}
        clearAll={clearAllFilters}
        resultCount={filtered.length}
      />
    </main>
  )
}
