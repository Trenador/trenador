import * as React from 'react'
import { cn } from '@/lib/utils'

export function FloatingField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  inputMode,
  min,
  max,
  step,
  onKeyDown,
  className,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  autoComplete?: string
  required?: boolean
  minLength?: number
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  min?: number | string
  max?: number | string
  step?: number | string
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  className?: string
}) {
  return (
    <div
      className={cn(
        'group relative rounded-md border border-border bg-muted/40 px-3 pb-1.5 pt-5 transition-colors focus-within:border-foreground focus-within:bg-background',
        className,
      )}
    >
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-medium text-muted-foreground"
      >
        {label}
        {required ? <span aria-hidden="true">*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-transparent"
      />
    </div>
  )
}
