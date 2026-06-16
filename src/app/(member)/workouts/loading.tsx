function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <div className="h-36 animate-pulse bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

export default function WorkoutsLoading() {
  return (
    <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 pb-16 pt-10 lg:px-10 lg:pt-14">
          <div className="mb-8 space-y-2">
            <div className="h-10 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    </main>
  )
}
