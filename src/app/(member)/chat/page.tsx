'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createThread } from '@/actions/chat'
import { Composer } from '@/components/chat/composer'

const STARTER_PROMPTS = [
  'How should I structure my training week?',
  'What should I eat around my workouts?',
  "I'm a beginner — where do I start?",
  'How do I recover faster between sessions?',
]

export default function ChatWelcomePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(content: string) {
    startTransition(async () => {
      const { id } = await createThread()
      router.push(`/chat/${id}?message=${encodeURIComponent(content)}`)
    })
  }

  return (
    <div className="flex flex-col h-full items-center justify-center gap-8 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Trenador AI</h1>
        <p className="text-sm text-muted-foreground">Your personal fitness guide</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-xl">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSubmit(prompt)}
            disabled={isPending}
            className="rounded-full border px-4 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="w-full max-w-2xl">
        <Composer onSubmit={handleSubmit} disabled={isPending} />
      </div>
    </div>
  )
}
