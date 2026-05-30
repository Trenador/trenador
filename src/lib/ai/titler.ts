import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { threads } from '@/db/schema'
import { anthropic } from './client'

const MODEL = 'claude-haiku-4-5-20251001'

// Called after the 2nd user message in a thread.
// Generates a short title from the first two exchanges and saves it to the thread row.
export async function generateThreadTitle(
  threadId: string,
  firstUserMessage: string,
  secondUserMessage: string,
): Promise<void> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 24,
      system:
        'You generate short chat thread titles. Given two messages from a fitness chat, respond with ONLY a title — 4 to 7 words, no punctuation, no quotes, no explanation.',
      messages: [
        {
          role: 'user',
          content: `Message 1: ${firstUserMessage}\nMessage 2: ${secondUserMessage}`,
        },
      ],
    })

    const title = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()

    if (!title) return

    await db
      .update(threads)
      .set({ title, updatedAt: new Date() })
      .where(eq(threads.id, threadId))
  } catch (err) {
    // titling is best-effort — never let it surface to the user
    console.error('Thread title generation failed:', err)
  }
}
