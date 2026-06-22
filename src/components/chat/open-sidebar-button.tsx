'use client'

import { Menu } from 'lucide-react'

export function OpenSidebarButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('shell:open-sidebar'))}
      aria-label="Open sidebar"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground lg:hidden"
    >
      <Menu className="h-4 w-4" />
    </button>
  )
}
