'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export type FilterSection = {
  label: string
  value: string
  defaultValue: string
  setValue: (v: string) => void
  options: { value: string; label: string }[]
}

export function activeFilterCount(sections: FilterSection[]): number {
  return sections.reduce((n, s) => (s.value !== s.defaultValue ? n + 1 : n), 0)
}

export function MobileFilterButton({ sections, onOpen, className }: { sections: FilterSection[]; onOpen: () => void; className?: string }) {
  const count = activeFilterCount(sections)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-foreground/[0.04] sm:hidden',
        className,
      )}
    >
      <SlidersHorizontal className="h-3.5 w-3.5" />
      Filter
      {count > 0 && (
        <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-medium text-background">
          {count}
        </span>
      )}
    </button>
  )
}

export function MobileFilterSheet({ open, onOpenChange, sections, resultCount, resultLabel = 'results' }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  sections: FilterSection[]
  resultCount: number
  resultLabel?: string
}) {
  const [openSection, setOpenSection] = useState<string | null>(sections[0]?.label ?? null)

  const clearAll = () => { for (const s of sections) s.setValue(s.defaultValue) }
  const activeLabel = (s: FilterSection) => s.options.find((o) => o.value === s.value)?.label ?? s.value

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[88vh] w-full flex-col rounded-t-2xl p-0">
        <SheetHeader className="flex-row items-center justify-between border-b border-border/60 px-5 py-4">
          <SheetTitle className="font-serif text-[22px] font-normal tracking-tight">Filter</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5">
          {sections.map((s) => {
            const isOpen = openSection === s.label
            const isActive = s.value !== s.defaultValue
            return (
              <div key={s.label} className="border-b border-border/60">
                <button
                  type="button"
                  onClick={() => setOpenSection(isOpen ? null : s.label)}
                  className="flex w-full items-center justify-between py-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{s.label}</span>
                    {isActive && (
                      <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[12px] text-foreground">{activeLabel(s)}</span>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="flex flex-wrap gap-2 pb-5">
                    {s.options.map((opt) => {
                      const selected = s.value === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => s.setValue(opt.value)}
                          className={cn(
                            'rounded-md border px-3 py-1.5 text-[13px] transition-colors',
                            selected ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-foreground hover:bg-foreground/[0.04]',
                          )}
                        >
                          {opt.label}
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
          <button type="button" onClick={clearAll} className="flex items-center gap-1.5 text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            <X className="h-3.5 w-3.5" /> Clear all
          </button>
          <button type="button" onClick={() => onOpenChange(false)} className="flex-1 rounded-full bg-foreground px-5 py-3 text-[14px] font-medium text-background transition-opacity hover:opacity-90">
            Show {resultLabel} ({resultCount})
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
