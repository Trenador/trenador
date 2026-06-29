'use client'

import { useRef, useState } from 'react'
import { ArrowUp, Square, Paperclip, Camera, X, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export type ComposerAttachment = { url: string; mediaType: string; name: string }

type PendingAttachment = {
  id: string
  file: File
  previewUrl: string
  uploadedUrl: string | null
  uploading: boolean
  error: boolean
}

type Props = {
  onSubmit: (content: string, attachments: ComposerAttachment[]) => void
  disabled?: boolean
  placeholder?: string
}

export function Composer({ onSubmit, disabled, placeholder = '' }: Props) {
  const [value, setValue] = useState('')
  const [multiline, setMultiline] = useState(false)
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const hasUploading = attachments.some((a) => a.uploading)
  const canSubmit = !disabled && !hasUploading && (value.trim().length > 0 || attachments.some((a) => a.uploadedUrl))

  function submit() {
    if (!canSubmit) return
    const ready = attachments.filter((a) => a.uploadedUrl).map((a) => ({ url: a.uploadedUrl!, mediaType: a.file.type, name: a.file.name }))
    setValue('')
    setMultiline(false)
    setAttachments([])
    attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl))
    if (textareaRef.current) {
      textareaRef.current.style.height = '20px'
      textareaRef.current.dataset.multiline = 'false'
    }
    onSubmit(value.trim(), ready)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    const el = e.target
    el.style.height = '0px'
    const next = Math.min(el.scrollHeight, 192)
    el.style.height = `${next}px`
    setMultiline(next > 32)
  }

  function handleFocus() {
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 150)
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const supabase = createClient()

    for (const file of Array.from(files)) {
      const id = crypto.randomUUID()
      const previewUrl = URL.createObjectURL(file)
      setAttachments((prev) => [...prev, { id, file, previewUrl, uploadedUrl: null, uploading: true, error: false }])

      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${id}.${ext}`

      const { error } = await supabase.storage.from('chat-attachments').upload(path, file, { contentType: file.type })
      if (error) {
        setAttachments((prev) => prev.map((a) => a.id === id ? { ...a, uploading: false, error: true } : a))
        continue
      }
      const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path)
      setAttachments((prev) => prev.map((a) => a.id === id ? { ...a, uploading: false, uploadedUrl: data.publicUrl } : a))
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const found = prev.find((a) => a.id === id)
      if (found) URL.revokeObjectURL(found.previewUrl)
      return prev.filter((a) => a.id !== id)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {attachments.map((a) => (
            <div key={a.id} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
              {a.file.type.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.previewUrl} alt={a.file.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              {a.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                </div>
              )}
              {a.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
                  <span className="text-[9px] text-destructive font-medium">Failed</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(a.id)}
                className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground/70 text-background hover:bg-foreground"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer bar */}
      <div
        className={cn(
          'flex items-center gap-1 border bg-muted/50 px-1 py-1 transition-all',
          multiline ? 'rounded-2xl flex-wrap items-end' : 'rounded-full',
          'focus-within:ring-2 focus-within:ring-ring/40',
        )}
      >
        {/* Paperclip — any image */}
        <button
          type="button"
          aria-label="Attach file"
          onClick={() => fileRef.current?.click()}
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {multiline && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-transparent px-3 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50 leading-5 min-h-0 overflow-hidden"
            style={{ maxHeight: '192px' }}
          />
        )}
        {!multiline && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent px-3 py-0 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50 leading-5 min-h-0 overflow-hidden"
            style={{ maxHeight: '192px', height: '20px' }}
          />
        )}

        {/* Camera — image capture */}
        {!multiline && (
          <button
            type="button"
            aria-label="Attach image"
            onClick={() => cameraRef.current?.click()}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <Camera className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={submit}
          disabled={!canSubmit}
          aria-label={disabled ? 'Stop' : 'Send message'}
          className={cn(
            'shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition-opacity',
            'bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-40',
            multiline && 'self-end mb-0.5 mr-0.5',
          )}
        >
          {disabled ? <Square className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
      />
    </div>
  )
}
