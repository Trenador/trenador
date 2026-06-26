'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn, getInitials } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Check, ImageIcon, Pencil, Plus, Trash2, X } from 'lucide-react'
import { MobileFilterButton, MobileFilterSheet, type FilterSection } from './admin-filter-sheet'
import { adminGetCoaches, adminCreateCoach, adminUpdateCoach, adminDeleteCoach, adminUploadCoachPhoto } from '@/actions/admin'

type Coach = {
  id: string
  displayName: string
  slug: string
  photoUrl: string | null
  bio: string | null
  headline: string | null
  location: string | null
  gender: string | null
  gym: string | null
  specialties: string[]
  certifications: string[]
  systemPrompt: string | null
  isAuthor: boolean
  active: boolean
  memberCount: number
  signInEmail: string
  createdAt: string
}

type DraftCoach = {
  firstName: string
  lastName: string
  slug: string
  bio: string
  headline: string
  city: string
  gender: string
  gym: string
  specialties: string[]
  certifications: string[]
  systemPrompt: string
  isAuthor: boolean
  active: boolean
  signInEmail: string
  photoUrl: string
}

const SPECIALTIES = ['Strength', 'Hypertrophy', 'Conditioning', 'Mobility', 'Nutrition', 'Recovery', 'Powerlifting', 'Olympic Lifting', 'Endurance']

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || `coach-${Date.now()}`
}

function splitName(displayName: string) {
  const parts = displayName.trim().split(' ')
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
}

function emptyDraft(): DraftCoach {
  return { firstName: '', lastName: '', slug: '', bio: '', headline: '', city: '', gender: '', gym: 'Powerhouse SoFlo', specialties: [], certifications: [], systemPrompt: '', isAuthor: false, active: true, signInEmail: '', photoUrl: '' }
}

export function AdminCoaches({ onCoachesChange }: { onCoachesChange?: (coaches: Coach[]) => void }) {
  const [rows, setRows] = useState<Coach[]>([])
  const [query, setQuery] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Coach | null>(null)
  const [draft, setDraft] = useState<DraftCoach>(emptyDraft())
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const data = await adminGetCoaches()
    setRows(data as Coach[])
    onCoachesChange?.(data as Coach[])
  }, [onCoachesChange])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setDraft(emptyDraft()); setEditing(null); setCreating(true) }
  const openEdit = (c: Coach) => {
    const { firstName, lastName } = splitName(c.displayName)
    setDraft({
      firstName,
      lastName,
      slug: c.slug,
      bio: c.bio ?? '',
      headline: c.headline ?? '',
      city: c.location ?? '',
      gender: c.gender ?? '',
      gym: c.gym ?? '',
      specialties: c.specialties ?? [],
      certifications: c.certifications ?? [],
      systemPrompt: c.systemPrompt ?? '',
      isAuthor: c.isAuthor,
      active: c.active,
      signInEmail: c.signInEmail ?? '',
      photoUrl: c.photoUrl ?? '',
    })
    setEditing(c)
    setCreating(true)
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const url = await adminUploadCoachPhoto(fd)
      setDraft((d) => ({ ...d, photoUrl: url }))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const save = async () => {
    if (!draft.firstName.trim()) return
    setSaving(true)
    const displayName = `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim()
    const base = {
      displayName,
      slug: draft.slug || slugify(displayName),
      bio: draft.bio,
      headline: draft.headline,
      location: draft.city,
      gender: draft.gender,
      gym: draft.gym,
      specialties: draft.specialties,
      certifications: draft.certifications,
      systemPrompt: draft.systemPrompt,
      isAuthor: draft.isAuthor,
      active: draft.active,
      signInEmail: draft.signInEmail,
    }
    if (editing) {
      await adminUpdateCoach(editing.id, draft.photoUrl ? { ...base, photoUrl: draft.photoUrl } : base)
    } else {
      await adminCreateCoach(draft.photoUrl ? { ...base, photoUrl: draft.photoUrl } : base)
    }
    setSaving(false)
    setCreating(false)
    setEditing(null)
    await load()
  }

  const remove = async (c: Coach) => {
    if (!confirm(`Delete coach "${c.displayName}"?`)) return
    await adminDeleteCoach(c.id)
    await load()
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((c) => {
      if (availabilityFilter === 'available' && !c.active) return false
      if (availabilityFilter === 'unavailable' && c.active) return false
      if (!q) return true
      return c.displayName.toLowerCase().includes(q) || (c.specialties ?? []).some((s) => s.toLowerCase().includes(q))
    })
  }, [rows, query, availabilityFilter])

  const totalUsers = rows.reduce((s, c) => s + c.memberCount, 0)

  const filterSections: FilterSection[] = [
    { label: 'Availability', value: availabilityFilter, defaultValue: 'all', setValue: (v) => setAvailabilityFilter(v as 'all' | 'available' | 'unavailable'), options: [{ value: 'all', label: 'All' }, { value: 'available', label: 'Available' }, { value: 'unavailable', label: 'Not available' }] },
  ]

  const toggleSpecialty = (s: string) => {
    setDraft((d) => ({ ...d, specialties: d.specialties.includes(s) ? d.specialties.filter((x) => x !== s) : [...d.specialties, s] }))
  }

  const addCert = () => setDraft((d) => ({ ...d, certifications: [...d.certifications, ''] }))
  const updateCert = (i: number, val: string) => setDraft((d) => ({ ...d, certifications: d.certifications.map((c, j) => j === i ? val : c) }))
  const removeCert = (i: number) => setDraft((d) => ({ ...d, certifications: d.certifications.filter((_, j) => j !== i) }))

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[60px] shrink-0 items-center justify-between px-5 pt-4">
        <div>
          <div className="text-sm font-medium">Coaches</div>
          <div className="text-[11px] text-muted-foreground">
            {rows.length} coach{rows.length === 1 ? '' : 'es'}{rows.length > 0 ? ` · ${totalUsers} user${totalUsers === 1 ? '' : 's'}` : ''}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 px-5 pb-3 pt-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-[12px] outline-none placeholder:text-muted-foreground/70 focus:border-foreground/30 sm:w-72 sm:flex-none"
        />
        <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value as 'all' | 'available' | 'unavailable')} className="hidden h-8 rounded-md border border-border bg-background px-2 text-[12px] outline-none sm:block">
          <option value="all">All availability</option>
          <option value="available">Available</option>
          <option value="unavailable">Not available</option>
        </select>
        <MobileFilterButton sections={filterSections} onOpen={() => setMobileFilterOpen(true)} />
        <button onClick={openCreate} className="ml-auto hidden items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-[12px] font-medium text-background hover:opacity-90 sm:flex">
          <Plus className="h-3.5 w-3.5" /> New coach
        </button>
      </div>
      <div className="flex shrink-0 justify-end px-5 pb-3 sm:hidden">
        <button onClick={openCreate} className="flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-[12px] font-medium text-background hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> New coach
        </button>
      </div>
      <MobileFilterSheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen} sections={filterSections} resultCount={filtered.length} resultLabel="coaches" />

      <div className="flex-1 overflow-y-auto">
        {/* Mobile cards */}
        <div className="flex flex-col gap-3 px-5 py-3 md:hidden">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">No coaches found.</div>
          ) : filtered.map((c) => (
            <div key={`card-${c.id}`} className="rounded-lg border border-border/60 bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted flex items-center justify-center text-[11px] font-medium text-muted-foreground">
                  {c.photoUrl ? <img src={c.photoUrl} alt="" className="h-full w-full object-cover" /> : getInitials(c.displayName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.displayName}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{(c.specialties ?? []).join(', ') || '—'}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{c.gym}{c.location ? ` · ${c.location}` : ''}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {c.active ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Available</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />Not available</span>
                )}
                {c.isAuthor && (
                  <span className="inline-flex items-center rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-medium text-foreground">AUTHOR</span>
                )}
                <span className="text-[11px] text-muted-foreground">{c.memberCount} user{c.memberCount === 1 ? '' : 's'}</span>
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => openEdit(c)} className="rounded-md p-1.5 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(c)} className="rounded-md p-1.5 hover:bg-muted"><Trash2 className="h-4 w-4 text-destructive" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <table className="hidden w-full text-sm md:table">
          <thead className="sticky top-0 z-10 bg-background font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="px-5 py-2.5 text-left">Coach</th>
              <th className="px-5 py-2.5 text-left">Availability</th>
              <th className="px-5 py-2.5 text-left">Role</th>
              <th className="px-5 py-2.5 text-right">Users</th>
              <th className="px-5 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">No coaches found.</td></tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="border-b border-border/40 text-sm">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted flex items-center justify-center text-[11px] font-medium text-muted-foreground">
                      {c.photoUrl ? <img src={c.photoUrl} alt="" className="h-full w-full object-cover" /> : getInitials(c.displayName)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {c.displayName}
                        {c.specialties?.length > 0 && (
                          <span className="ml-1 font-normal text-muted-foreground">· {c.specialties.join(', ')}</span>
                        )}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">{c.gym}{c.location ? ` · ${c.location}` : ''}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  {c.active ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Available</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />Not available</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {c.isAuthor ? (
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">AUTHOR</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  <div className="font-medium text-foreground">{c.memberCount}</div>
                  <div className="text-[11px] text-muted-foreground">user{c.memberCount === 1 ? '' : 's'}</div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex shrink-0 items-center justify-end gap-1">
                    <button onClick={() => openEdit(c)} className="rounded-md p-1.5 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(c)} className="rounded-md p-1.5 hover:bg-muted"><Trash2 className="h-4 w-4 text-destructive" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit / Create sheet */}
      <Sheet open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-xl">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>{editing ? 'Edit coach' : 'New coach'}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">First name</label>
                <input value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Last name</label>
                <input value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            {/* Specialties */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Specialties</label>
              <div className="flex flex-wrap gap-1.5">
                {SPECIALTIES.map((s) => {
                  const active = draft.specialties.includes(s)
                  return (
                    <button key={s} type="button" onClick={() => toggleSpecialty(s)} className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition', active ? 'border-foreground bg-foreground text-background' : 'border-border/60 bg-background hover:bg-muted')}>
                      {active && <Check className="h-3 w-3" />}{s}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Also an author */}
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
              <div>
                <div className="text-sm font-medium">Also an author</div>
                <div className="text-[11px] text-muted-foreground">Available as a workout author in the admin workout editor.</div>
              </div>
              <button type="button" onClick={() => setDraft({ ...draft, isAuthor: !draft.isAuthor })} className={cn('relative h-5 w-9 rounded-full transition-colors', draft.isAuthor ? 'bg-foreground' : 'bg-border')}>
                <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform', draft.isAuthor ? 'left-4' : 'left-0.5')} />
              </button>
            </div>

            {/* Coach sign-in email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Coach sign-in email</label>
              <p className="text-[11px] text-muted-foreground">Auth account for this coach. Leave blank to keep existing link.</p>
              <input value={draft.signInEmail} onChange={(e) => setDraft({ ...draft, signInEmail: e.target.value })} placeholder="coach@example.com" type="email" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>

            {/* Available for new users */}
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
              <div>
                <div className="text-sm font-medium">Available for new users</div>
                <div className="text-[11px] text-muted-foreground">Appears during onboarding when enabled.</div>
              </div>
              <button type="button" onClick={() => setDraft({ ...draft, active: !draft.active })} className={cn('relative h-5 w-9 rounded-full transition-colors', draft.active ? 'bg-foreground' : 'bg-border')}>
                <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform', draft.active ? 'left-4' : 'left-0.5')} />
              </button>
            </div>

            {/* Gender + City */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Gender</label>
                <select value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                  <option value="">—</option>
                  <option value="Woman">Woman</option>
                  <option value="Man">Man</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">City</label>
                <input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="Miami" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            {/* Home gym */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Home Gym</label>
              <input value={draft.gym} onChange={(e) => setDraft({ ...draft, gym: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>

            {/* Headline */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Headline</label>
              <input value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Bio</label>
              <textarea rows={4} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>

            {/* Certifications */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Certifications</label>
              <div className="space-y-2">
                {draft.certifications.map((cert, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={cert} onChange={(e) => updateCert(i, e.target.value)} placeholder="e.g. NSCA CSCS" className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                    <button type="button" onClick={() => removeCert(i)} className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <button type="button" onClick={addCert} className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Add certification
                </button>
              </div>
            </div>

            {/* Greeting message */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Greeting message</label>
              <p className="text-[11px] text-muted-foreground">Shown as the first message in the member's Message Center when this coach is assigned to them.</p>
              <textarea rows={4} value={draft.systemPrompt} onChange={(e) => setDraft({ ...draft, systemPrompt: e.target.value })} placeholder={`Hi — ${draft.firstName || 'Coach'} here, your advisor. How can I help you today?`} className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>

            {/* Avatar */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Avatar</label>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted flex items-center justify-center text-muted-foreground">
                  {draft.photoUrl ? (
                    <img src={draft.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors">
                    {uploading ? 'Uploading…' : 'Upload image'}
                  </button>
                  <p className="mt-1 text-[11px] text-muted-foreground">PNG / JPG up to 5 MB.</p>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSelect} />
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/60 bg-background px-6 py-3">
            <button onClick={() => setCreating(false)} disabled={saving} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">Cancel</button>
            <button onClick={save} disabled={saving || !draft.firstName.trim()} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create coach'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
