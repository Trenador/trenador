export default function ChatLoading() {
  return (
    <div className="flex min-w-0 flex-1 flex-col min-h-0 bg-background">
      {/* top bar matches the real chat header height */}
      <div className="flex h-[60px] shrink-0 items-center border-b border-border/70 px-4 lg:px-5">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
      {/* message skeleton */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {[{ w: 'w-2/3', self: false }, { w: 'w-1/2', self: true }, { w: 'w-3/4', self: false }, { w: 'w-2/5', self: true }, { w: 'w-3/5', self: false }].map((item, i) => (
          <div key={i} className={`flex ${item.self ? 'justify-end' : 'justify-start'}`}>
            <div className={`${item.w} h-10 animate-pulse rounded-2xl bg-muted`} />
          </div>
        ))}
      </div>
      {/* input skeleton */}
      <div className="border-t border-border/70 p-4">
        <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  )
}
