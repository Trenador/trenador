'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock, Gauge, Bookmark, Search, X, SlidersHorizontal, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
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

function coachInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map(p => p[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function levelShort(level: string | null) {
  if (!level) return ''
  if (level === 'All Levels') return 'All'
  return level.slice(0, 3) + '.'
}

function FeaturedCard({ workout, onBrowseAll, totalInCategory }: {
  workout: Workout
  onBrowseAll: () => void
  totalInCategory: number
}) {
  const img = workout.category ? CATEGORY_IMAGE[workout.category] : undefined
  const banner = workout.category ? (CATEGORY_BANNER[workout.category] ?? 'bg-muted') : 'bg-muted'

  return (
    <div className="group overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:border-border hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <Link href={`/workouts/${workout.id}`} className="relative shrink-0 sm:w-[200px]">
          <div className={cn('relative h-[160px] overflow-hidden sm:h-full sm:min-h-[160px]', banner)}>
            {img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt=""
                className="absolute inset-0 h-full w-full object-cover brightness-110 transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 sm:bg-gradient-to-b sm:from-black/40 sm:via-transparent sm:to-transparent" />
            {workout.category && (
              <span className="absolute left-3 top-3 label-mono text-[10px] normal-case tracking-widest text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
                {workout.category}
              </span>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-2 p-5">
          <Link href={`/workouts/${workout.id}`} className="flex-1">
            <h3 className="font-serif text-[22px] italic leading-snug tracking-[0.02em]">
              {workout.title}
            </h3>
            {workout.summary && (
              <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground leading-relaxed">
                {workout.summary}
              </p>
            )}
            <div className="mt-3 flex items-center gap-3 text-[12px] text-muted-foreground">
              {workout.durationMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {workout.durationMinutes} min
                </span>
              )}
              {workout.level && (
                <span className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  {workout.level}
                </span>
              )}
              {workout.savesCount > 0 && (
                <span className="flex items-center gap-1">
                  <Bookmark className="h-3 w-3" />
                  {workout.savesCount}
                </span>
              )}
            </div>
            {workout.coachName && (
              <div className="mt-2 flex items-center gap-2">
                {workout.coachPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={workout.coachPhotoUrl} alt={workout.coachName} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[8px] font-semibold text-background">
                    {coachInitials(workout.coachName)}
                  </div>
                )}
                <span className="text-[12px] text-muted-foreground">{workout.coachName}</span>
              </div>
            )}
          </Link>

          <div className="mt-3 flex items-center gap-3">
            <Link
              href={`/workouts/${workout.id}`}
              className="rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
            >
              View workout
            </Link>
            {totalInCategory > 1 && (
              <button
                type="button"
                onClick={onBrowseAll}
                className="text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Browse all {workout.category} ({totalInCategory})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const img = workout.category ? CATEGORY_IMAGE[workout.category] : undefined
  const banner = workout.category ? (CATEGORY_BANNER[workout.category] ?? 'bg-muted') : 'bg-muted'

  return (
    <Link
      href={`/workouts/${workout.id}`}
      className="group flex w-[272px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:border-border hover:shadow-md sm:w-[240px] lg:w-[272px]"
    >
      {/* Banner */}
      <div className={cn('relative h-[170px] overflow-hidden', banner)}>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            className="absolute inset-0 h-full w-full object-cover brightness-110 transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between">
          {workout.category && (
            <span className="label-mono text-[10px] normal-case tracking-widest text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
              {workout.category}
            </span>
          )}
          {workout.lengthLabel && (
            <span className="rounded bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {workout.lengthLabel}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-serif text-[17px] italic leading-snug tracking-[0.02em]">
          {workout.title}
        </h3>

        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          {workout.durationMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {workout.durationMinutes} min
            </span>
          )}
          {workout.level && (
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              {levelShort(workout.level)}
            </span>
          )}
        </div>

        {workout.muscleGroups.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {workout.muscleGroups.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground"
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
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[9px] font-semibold text-background">
                  {coachInitials(workout.coachName)}
                </div>
              )}
              <span className="text-[12px] text-muted-foreground">{workout.coachName}</span>
            </div>
            {workout.savesCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Bookmark className="h-3 w-3" />
                {workout.savesCount}
              </span>
            )}
          </div>
        )}

        {/* Inline Remix */}
        <Link
          href={`/workouts/${workout.id}`}
          onClick={(e) => e.stopPropagation()}
          className="label-mono mt-2 flex w-full items-center justify-center gap-1 rounded-full border border-border bg-background px-2.5 py-1.5 normal-case tracking-[0.15em] text-foreground transition-colors hover:bg-foreground/[0.04]"
        >
          <Plus className="h-3 w-3" />
          Remix
        </Link>
      </div>
    </Link>
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
          'h-8 w-auto gap-1 rounded-full border-0 bg-foreground/[0.04] px-3 text-[12px] shadow-none focus:ring-0',
          'text-muted-foreground hover:bg-foreground/[0.07]',
          active && 'bg-foreground text-background hover:bg-foreground/90',
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

function formatDuration(min: number | null) {
  if (!min) return null
  if (min >= 60) return '1 hr'
  return `${min} min`
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
    setter((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value])
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
          {sections.map((s) => {
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
                      <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[12px]">
                        {s.active.length === 1 ? s.active[0] : `${s.active.length} selected`}
                      </span>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="flex flex-wrap gap-2 pb-5">
                    {s.options.map((opt) => {
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

  const grouped = CATEGORIES.reduce<Record<string, Workout[]>>((acc, cat) => {
    const items = filtered.filter(w => w.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Header + filters */}
      <div className="sticky top-0 z-10 bg-background pb-3 pt-10 md:pt-14 px-4 md:px-6 lg:px-10">
        <h1 className="font-serif text-[44px] leading-[1.05] tracking-tight">
          Workout library
        </h1>

        <div className="mt-6 flex flex-col gap-3">
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
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 md:px-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-muted-foreground">No workouts match those filters yet.</p>
          </div>
        ) : isFiltered ? (
          /* Filtered grid */
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(w => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
          </div>
        ) : (
          /* Default: one featured workout card per category */
          <div className="space-y-10">
            {CATEGORIES.filter(cat => grouped[cat]?.length).map(cat => {
              const items = grouped[cat]!
              const featured = [...items].sort((a, b) => b.savesCount - a.savesCount)[0]!
              return (
                <div key={cat}>
                  <div className="mb-4 flex items-baseline justify-between">
                    <h2 className="font-serif text-2xl italic tracking-[0.02em]">{cat}</h2>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className="text-[12px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        View all ({items.length})
                      </button>
                    )}
                  </div>
                  <WorkoutCard workout={featured} />
                </div>
              )
            })}
          </div>
        )}
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
    </div>
  )
}
