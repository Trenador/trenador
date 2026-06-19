'use client'

import { useMemo, useState } from 'react'
import { Search, X, ChevronDown, MessageCircle } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type Coach = {
  id: string
  displayName: string
  specialty: string[]
  headline: string | null
  bio: string | null
  gym: string | null
  location: string | null
  certifications: string[]
  photoUrl: string | null
  active: boolean
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
          'h-9 w-auto min-w-[120px] gap-1.5 rounded-full border-0 bg-foreground/[0.04] px-3 text-[13px] shadow-none hover:bg-foreground/[0.07] focus:ring-1 focus:ring-foreground/20 [&>svg]:opacity-60',
          active && 'bg-foreground text-background hover:bg-foreground/90 [&>svg]:opacity-80',
        )}
      >
        <span className={active ? '' : 'text-muted-foreground'}>{active ? `${label}:` : label}</span>
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

function CoachAvatar({ photoUrl, displayName, size }: { photoUrl: string | null; displayName: string; size: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground text-background"
      style={{ width: size, height: size }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={displayName} width={size} height={size} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="font-mono text-xs font-medium tracking-wider">{getInitials(displayName)}</span>
      )}
    </div>
  )
}

function CoachCard({ coach }: { coach: Coach }) {
  const [expanded, setExpanded] = useState(false)

  const specialtyLabel = coach.specialty.join(', ')

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-background/60 text-left transition-colors',
        expanded && 'border-foreground/30 bg-background',
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex w-full min-w-0 items-center gap-3 p-4 text-left"
      >
        <CoachAvatar photoUrl={coach.photoUrl} displayName={coach.displayName} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-[14px] font-medium">{coach.displayName}</div>
            {specialtyLabel && (
              <span className="label-mono shrink-0 normal-case tracking-[0.12em] text-muted-foreground">
                · {specialtyLabel}
              </span>
            )}
          </div>
          {coach.gym && (
            <div className="mt-0.5 font-serif text-[11px] italic tracking-[0.35em] text-muted-foreground">
              {coach.gym}
            </div>
          )}
          {coach.headline && (
            <p className="mt-2 text-[13px] leading-snug text-muted-foreground">{coach.headline}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-4 pb-4 pt-3">
          {coach.bio && (
            <>
              <div className="label-mono mb-1.5 normal-case tracking-[0.12em]">Bio</div>
              <p className="text-[13px] leading-snug text-muted-foreground">{coach.bio}</p>
            </>
          )}

          {coach.location && (
            <div className="mt-3">
              <div className="label-mono mb-1.5 normal-case tracking-[0.12em]">Geography</div>
              <span className="inline-block rounded-full border border-border/70 bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground">
                {coach.location}
              </span>
            </div>
          )}

          {coach.certifications.length > 0 && (
            <div className="mt-3">
              <div className="label-mono mb-1.5 normal-case tracking-[0.12em]">Certifications</div>
              <ul className="space-y-1 text-[12px] leading-snug text-muted-foreground">
                {coach.certifications.map(cert => (
                  <li key={cert} className="flex gap-1.5">
                    <span aria-hidden className="select-none">·</span>
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <a
              href="/messages"
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-foreground px-2.5 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Let&apos;s chat
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export function CoachesBrowser({ coaches }: { coaches: Coach[] }) {
  const [query, setQuery] = useState('')
  const [activeSpecialty, setActiveSpecialty] = useState<string | null>(null)
  const [activeLocation, setActiveLocation] = useState<string | null>(null)

  const specialties = useMemo(() => {
    const set = new Set<string>()
    coaches.forEach(c => c.specialty.forEach(s => { if (s) set.add(s) }))
    return Array.from(set).sort()
  }, [coaches])

  const locations = useMemo(() => {
    const set = new Set<string>()
    coaches.forEach(c => { if (c.location) set.add(c.location) })
    return Array.from(set).sort()
  }, [coaches])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return coaches.filter(c => {
      if (activeSpecialty && !c.specialty.includes(activeSpecialty)) return false
      if (activeLocation && c.location !== activeLocation) return false
      if (!q) return true
      return (
        c.displayName.toLowerCase().includes(q) ||
        c.specialty.some(s => s.toLowerCase().includes(q)) ||
        (c.bio ?? '').toLowerCase().includes(q) ||
        (c.location ?? '').toLowerCase().includes(q) ||
        (c.gym ?? '').toLowerCase().includes(q)
      )
    })
  }, [coaches, activeSpecialty, activeLocation, query])

  return (
    <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10 lg:px-10 lg:pt-14">
          <h1 className="font-serif text-[44px] leading-[1.05] tracking-tight">Coach</h1>

          <div className="mt-8 flex flex-col gap-4">
            {/* Search */}
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search coaches"
                className="h-9 w-full rounded-none border-0 border-b border-border bg-transparent pl-8 pr-7 text-[13px] outline-none placeholder:text-muted-foreground focus:border-b-foreground"
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter pills */}
            {(specialties.length > 0 || locations.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {specialties.length > 0 && (
                  <FilterSelect label="Expertise" options={specialties} active={activeSpecialty} onChange={setActiveSpecialty} />
                )}
                {locations.length > 0 && (
                  <FilterSelect label="Geography" options={locations} active={activeLocation} onChange={setActiveLocation} />
                )}
              </div>
            )}
          </div>

          <div className="mt-8 space-y-2">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No coaches match your filters.
              </div>
            ) : (
              filtered.map(coach => <CoachCard key={coach.id} coach={coach} />)
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
