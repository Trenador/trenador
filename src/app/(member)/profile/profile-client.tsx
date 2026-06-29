'use client'

import { useRef, useState, useTransition } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { signAvatarUrlClient } from '@/lib/avatar-client'
import { updateProfileAction, updateAvatarAction } from '@/actions/profile'

type Gender = 'female' | 'male' | 'non-binary'

export function ProfileClient({
  authUserId,
  email,
  displayName: initName,
  photoPath: initPath,
  avatarUrl: initAvatarUrl,
  yearOfBirth: initYear,
  gender: initGender,
  weightLbs: initWeight,
}: {
  memberId: string
  authUserId: string
  email: string
  displayName: string
  photoPath: string | null
  avatarUrl: string
  yearOfBirth: number | null
  gender: string | null
  weightLbs: number | null
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  const nameParts = initName.trim().split(/\s+/)
  const [firstName, setFirstName] = useState(nameParts[0] ?? '')
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' '))
  const [year, setYear] = useState(initYear !== null ? String(initYear) : '')
  const [gender, setGender] = useState<Gender | ''>(
    (initGender as Gender | null) ?? '',
  )
  const [weight, setWeight] = useState(initWeight !== null ? String(initWeight) : '')
  const [photoPath, setPhotoPath] = useState<string | null>(initPath)
  const [avatarUrl, setAvatarUrl] = useState(initAvatarUrl)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [, startTransition] = useTransition()

  const initial = (firstName.trim()[0] ?? '?').toUpperCase()

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    setUploading(true)
    try {
      const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
      const path = `${authUserId}/avatar-${Date.now()}.${ext}`
      const supabase = createClient()
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (upErr) throw upErr
      if (photoPath && photoPath !== path && !photoPath.startsWith('http')) {
        await supabase.storage.from('avatars').remove([photoPath])
      }
      await updateAvatarAction(path)
      setPhotoPath(path)
      setAvatarUrl(await signAvatarUrlClient(path))
      window.dispatchEvent(new CustomEvent('profile:refresh'))
      toast.success('Photo updated')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    if (!photoPath || photoPath.startsWith('http')) return
    setUploading(true)
    try {
      const supabase = createClient()
      await supabase.storage.from('avatars').remove([photoPath])
      await updateAvatarAction(null)
      setPhotoPath(null)
      setAvatarUrl('')
      window.dispatchEvent(new CustomEvent('profile:refresh'))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Remove failed')
    } finally {
      setUploading(false)
    }
  }

  const save = () => {
    const name = `${firstName.trim()} ${lastName.trim()}`.trim()
    if (!name) { toast.error('Name is required'); return }
    const y = year ? parseInt(year, 10) : null
    const currentYear = new Date().getFullYear()
    if (year && (isNaN(y!) || y! < 1900 || y! > currentYear)) { toast.error('Enter a valid year'); return }
    const w = weight ? parseFloat(weight) : null
    if (weight && (isNaN(w!) || w! <= 0 || w! > 2000)) { toast.error('Enter a valid weight'); return }
    setSaving(true)
    startTransition(async () => {
      try {
        await updateProfileAction({
          displayName: name,
          yearOfBirth: y,
          gender: gender || null,
          weightLbs: w,
          photoUrl: photoPath,
        })
        window.dispatchEvent(new CustomEvent('profile:refresh'))
        toast.success('Profile saved')
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      } finally {
        setSaving(false)
      }
    })
  }

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-10 lg:px-10 lg:pt-14">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Profile</h1>

        <div className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-foreground/10">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-foreground/70">
                  {initial}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] hover:bg-foreground/[0.04] disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5" />
                {uploading ? 'Uploading…' : photoPath ? 'Change photo' : 'Add photo'}
              </button>
              {photoPath && !photoPath.startsWith('http') && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  disabled={uploading}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className="h-9 w-full rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground outline-none"
            />
          </div>

          {/* First name */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium">First name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-foreground"
            />
          </div>

          {/* Last name */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium">Last name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-foreground"
            />
          </div>

          {/* Year of birth */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium">Year of birth</label>
            <input
              type="number"
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min={1900}
              max={new Date().getFullYear()}
              placeholder="—"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-foreground"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium">Gender</label>
            <div className="grid grid-cols-3 gap-2">
              {(['female', 'male', 'non-binary'] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(gender === g ? '' : g)}
                  className={`rounded-md border px-3 py-2 text-sm capitalize transition-colors ${
                    gender === g
                      ? 'border-foreground bg-foreground/5'
                      : 'border-input hover:bg-foreground/[0.03]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium">Weight (lbs)</label>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min={0}
              step="0.1"
              placeholder="—"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-foreground"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="h-10 rounded-lg bg-foreground px-6 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
