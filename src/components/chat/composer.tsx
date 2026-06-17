'use client'

import { useRef, useState } from 'react'
import { ArrowRight, Paperclip, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  onSubmit: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export function Composer({ onSubmit, disabled, placeholder = '' }: Props) {
  const [value, setValue] = useState('')
  const [multiline, setMultiline] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    setValue('')
    setMultiline(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = '20px'
      textareaRef.current.dataset.multiline = 'false'
    }
    onSubmit(trimmed)
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

  return (
    <div
      className={cn(
        'flex items-center gap-1 border bg-muted/50 px-1 py-1 transition-all',
        multiline ? 'rounded-2xl flex-wrap items-end' : 'rounded-full',
        'focus-within:ring-2 focus-within:ring-ring/40',
      )}
    >
      {/* Left icon — attachment */}
      <button
        type="button"
        aria-label="Attach file"
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
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent px-3 py-0 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50 leading-5 min-h-0 overflow-hidden"
          style={{ maxHeight: '192px', height: '20px' }}
        />
      )}
      {/* Camera icon */}
      {!multiline && (
        <button
          type="button"
          aria-label="Attach image"
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <Camera className="h-4 w-4" />
        </button>
      )}

      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className={cn(
          'shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition-opacity',
          'bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-40',
          multiline && 'self-end mb-0.5 mr-0.5',
        )}
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}
