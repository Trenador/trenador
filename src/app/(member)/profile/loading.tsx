export default function ProfileLoading() {
  return (
    <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-lg px-6 pb-16 pt-10 lg:pt-14">
          <div className="mb-8 space-y-2">
            <div className="h-10 w-32 animate-pulse rounded bg-muted" />
          </div>
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-28 animate-pulse rounded bg-muted" />
          </div>
          {/* Fields */}
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
