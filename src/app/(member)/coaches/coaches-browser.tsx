'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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

function initials(name: string) {
  return name.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function CoachCard({ coach }: { coach: Coach }) {
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState(false)

  const toggle = () => {
    setSelected(true)
    setExpanded(prev => !prev)
  }

  const subtitle = [coach.specialty[0], coach.location].filter(Boolean).join(' · ')

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
      className={cn(
        'cursor-pointer rounded-xl border transition-colors',
        selected
          ? 'border-foreground/30 bg-foreground/[0.03]'
          : 'border-border/60 bg-background hover:border-foreground/20 hover:bg-foreground/[0.02]',
      )}
    >
      {/* Collapsed row */}
      <div className="flex items-center gap-3 p-4">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
          {coach.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coach.photoUrl} alt={coach.displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-muted-foreground">
              {initials(coach.displayName)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{coach.displayName}</div>
          {subtitle && (
            <div className="truncate text-[12px] text-muted-foreground">{subtitle}</div>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border/60 px-4 pb-4 pt-3">
          {coach.headline && (
            <p className="mb-3 text-[13px] font-medium leading-snug text-foreground">
              {coach.headline}
            </p>
          )}
          {coach.bio && (
            <p className="text-[13px] leading-relaxed text-muted-foreground">{coach.bio}</p>
          )}
          {coach.gym && (
            <p className="mt-2 text-[12px] text-muted-foreground">{coach.gym}</p>
          )}
          {coach.certifications.length > 0 && (
            <ul className="mt-3 space-y-1">
              {coach.certifications.map(cert => (
                <li key={cert} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                  {cert}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function CoachesBrowser({ coaches }: { coaches: Coach[] }) {
  return (
    <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 pb-16 pt-10 lg:px-10 lg:pt-14">
          <div className="mb-2">
            <h1 className="font-serif text-[44px] leading-[1.05] tracking-tight">
              Coaches
            </h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Your coach is your primary advisor.
            </p>
          </div>

          {coaches.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No coaches available right now.
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-3">
              {coaches.map(coach => (
                <CoachCard key={coach.id} coach={coach} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
