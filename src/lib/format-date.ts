const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d)
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

/** "Nov 3, 2024" */
export function fmtLongDate(d: Date | string): string {
  return toDate(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** "Nov 3" */
export function fmtShortDate(d: Date | string): string {
  return toDate(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** "2:30 PM" */
export function fmtTime(d: Date | string): string {
  return toDate(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/** "today" / "yesterday" / "3d ago" / "Nov 3, 2024" */
export function relativeAge(d: Date | string): string {
  const diff = (Date.now() - toDate(d).getTime()) / 86_400_000
  if (diff < 1) return 'today'
  if (diff < 2) return 'yesterday'
  if (diff < 30) return `${Math.floor(diff)}d ago`
  return fmtLongDate(d)
}

/** "Today" / "This week" / "Earlier" — admin inbox grouping */
export function inboxBucket(d: Date | string): string {
  const diff = (Date.now() - toDate(d).getTime()) / 86_400_000
  if (diff < 1) return 'Today'
  if (diff < 7) return 'This week'
  return 'Earlier'
}

/** time if today, "yesterday", weekday abbrev if <7d, "Nov 3" — admin inbox list */
export function inboxRelative(d: Date | string): string {
  const date = toDate(d)
  const now = new Date()
  if (isSameDay(date, now)) return fmtTime(date)
  const diff = (now.getTime() - date.getTime()) / 86_400_000
  if (diff < 2) return 'yesterday'
  if (diff < 7) return DAYS[date.getDay()] ?? ''
  return fmtShortDate(date)
}

/** "Recent" / "Last 30 Days" / "Older" — chat thread grouping */
export function threadBucket(d: Date | string | null): string {
  if (!d) return 'Older'
  const diff = (Date.now() - toDate(d).getTime()) / 86_400_000
  if (diff < 7) return 'Recent'
  if (diff < 30) return 'Last 30 Days'
  return 'Older'
}

/** time if today, "Nov 3" — chat thread list */
export function threadRelative(d: Date | string | null): string {
  if (!d) return ''
  const date = toDate(d)
  const now = new Date()
  if (isSameDay(date, now)) return fmtTime(date)
  return fmtShortDate(date)
}

/** time if today, "Nov 3 · time" — direct message timestamps */
export function messageTimestamp(d: Date | string): string {
  const date = toDate(d)
  const now = new Date()
  const time = fmtTime(date)
  if (isSameDay(date, now)) return time
  return fmtShortDate(date) + ' · ' + time
}
