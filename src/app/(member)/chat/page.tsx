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

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

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
    <div className="flex flex-col h-full items-center justify-center gap-10 px-4">
      {/* greeting */}
      <div className="text-center space-y-2">
        <h1 className="font-serif text-5xl leading-tight tracking-wide">
          {getGreeting()}
        </h1>
        <p className="label-mono">How may I be of service?</p>
      </div>

      {/* starter prompts */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xl">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSubmit(prompt)}
            disabled={isPending}
            className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* composer */}
      <div className="w-full max-w-2xl">
        <Composer onSubmit={handleSubmit} disabled={isPending} />
      </div>
    </div>
  )
}
