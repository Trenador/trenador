'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SquarePen, MoreVertical, Pin, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteCoachConversationAction } from '@/actions/messages'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export function AdvisorHeaderActions() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteCoachConversationAction()
      toast.success('Chat deleted')
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/chat"
        aria-label="New chat"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
      >
        <SquarePen className="h-4 w-4" />
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Chat options"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem disabled>
            <Pin className="h-4 w-4" /> Pin chat
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} disabled={isPending}>
            <Trash2 className="h-4 w-4" /> Delete chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
