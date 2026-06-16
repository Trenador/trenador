export default function WorkoutDetailLoading() {
  return (
    <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 pb-16 pt-10 lg:px-10 lg:pt-14">
          {/* Title + meta */}
          <div className="space-y-3 mb-8">
            <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
            <div className="flex gap-3">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-14 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          </div>
          {/* Week blocks */}
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="mb-6 space-y-3">
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="rounded-xl border border-border/60 p-4 space-y-2">
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
