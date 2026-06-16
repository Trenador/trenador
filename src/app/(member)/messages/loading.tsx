export default function MessagesLoading() {
  return (
    <div className="flex min-w-0 flex-1 flex-col min-h-0 bg-background">
      <div className="flex h-[60px] shrink-0 items-center gap-2 border-b border-border/70 pl-4 pr-3 lg:pl-5">
        <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="label-mono">Coach</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {[{ w: 'w-2/3', self: false }, { w: 'w-1/2', self: true }, { w: 'w-3/4', self: false }, { w: 'w-1/3', self: true }].map((item, i) => (
          <div key={i} className={`flex ${item.self ? 'justify-end' : 'justify-start'}`}>
            <div className={`${item.w} h-10 animate-pulse rounded-2xl bg-muted`} />
          </div>
        ))}
      </div>
      <div className="border-t border-border/70 p-4">
        <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  )
}
