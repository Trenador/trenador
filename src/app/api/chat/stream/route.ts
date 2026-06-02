import { after } from 'next/server'
import { z } from 'zod'
import { Redis } from '@upstash/redis'
import { eq, and, desc } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { members, intakeSubmissions, threads, messages as chatMessages } from '@/db/schema'
import { anthropic } from '@/lib/ai/client'
import { buildSystemPrompt, buildMessages } from '@/lib/ai/prompt'
import { generateThreadTitle } from '@/lib/ai/titler'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const BodySchema = z.object({
  threadId: z.string().uuid(),
  content: z.string().min(1).max(4000),
})

const DAILY_MESSAGE_LIMIT = 30
const HISTORY_LIMIT = 20
const MODEL = 'claude-sonnet-4-6'

export async function POST(request: Request) {
  // 1. parse body
  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await request.json())
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { threadId, content } = body

  // 2. auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // 3. member row
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.authUserId, user.id))
    .limit(1)
  if (!member) return Response.json({ error: 'Member not found' }, { status: 404 })

  // 4. rate limit — 30 messages per member per UTC day across all threads
  const today = new Date().toISOString().slice(0, 10)
  const rateKey = `chat:rate:${member.id}:${today}`
  const msgCount = await redis.incr(rateKey)
  if (msgCount === 1) await redis.expire(rateKey, 86400)
  if (msgCount > DAILY_MESSAGE_LIMIT) {
    return Response.json({ error: 'Daily message limit reached' }, { status: 429 })
  }

  // 5. thread (verify ownership, skip soft-deleted)
  const [thread] = await db
    .select()
    .from(threads)
    .where(
      and(
        eq(threads.id, threadId),
        eq(threads.memberId, member.id),
      ),
    )
    .limit(1)
  if (!thread || thread.deletedAt) {
    return Response.json({ error: 'Thread not found' }, { status: 404 })
  }

  // 6+7. latest intake + recent history — independent, fetch in parallel
  const [intakeRows, historyDesc] = await Promise.all([
    db.select().from(intakeSubmissions)
      .where(eq(intakeSubmissions.memberId, member.id))
      .orderBy(desc(intakeSubmissions.createdAt))
      .limit(1),
    db.select().from(chatMessages)
      .where(eq(chatMessages.threadId, threadId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(HISTORY_LIMIT),
  ])
  const latestIntake = intakeRows[0]
  const history = historyDesc.toReversed()

  // schedule auto-title after the 2nd user message (thread has no title yet)
  const priorUserMessages = history.filter((m) => m.role === 'user')
  if (!thread.title && priorUserMessages.length === 1) {
    const firstUserContent = priorUserMessages[0]!.content
    after(() => generateThreadTitle(threadId, firstUserContent, content))
  }

  // 8. save user message
  const [savedUserMsg] = await db
    .insert(chatMessages)
    .values({ threadId, role: 'user', content })
    .returning()

  if (!savedUserMsg) {
    return Response.json({ error: 'Failed to save message' }, { status: 500 })
  }

  // 9. build prompt
  const systemPrompt = buildSystemPrompt(latestIntake?.data ?? null)
  const anthropicMessages = buildMessages(history, content)

  // 10. stream
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
      }

      try {
        const claudeStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
          messages: anthropicMessages,
        })

        for await (const event of claudeStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            send({ type: 'delta', text: event.delta.text })
          }
        }

        const finalMsg = await claudeStream.finalMessage()
        const fullText = finalMsg.content
          .filter((b) => b.type === 'text')
          .map((b) => (b as { type: 'text'; text: string }).text)
          .join('')

        // save assistant message with token counts for cost observability
        const [savedAssistantMsg] = await db
          .insert(chatMessages)
          .values({
            threadId,
            role: 'assistant',
            content: fullText,
            modelUsed: MODEL,
            tokensInput: finalMsg.usage.input_tokens,
            tokensOutput: finalMsg.usage.output_tokens,
          })
          .returning()

        // update thread's last_message_at
        await db
          .update(threads)
          .set({ lastMessageAt: new Date(), updatedAt: new Date() })
          .where(eq(threads.id, threadId))

        send({ type: 'done', messageId: savedAssistantMsg?.id })
        controller.close()
      } catch (err) {
        console.error('Claude stream error:', err)
        send({ type: 'error', message: 'AI response failed' })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
