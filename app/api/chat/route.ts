// app/api/chat/route.ts
import { streamText, stepCountIs } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { campsiteTools } from '@/lib/tools'
import { CAMPSITE_INFO, buildFullFaqContent } from '@/lib/campsite-info'
import { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `Jsi přátelský a nápomocný asistent kempu ${CAMPSITE_INFO.name}.
Pomáháš hostům s informacemi, kontrolou dostupnosti a rezervacemi.
Komunikuješ česky (nebo v jazyce, ve kterém host píše).
Vždy buď konkrétní a stručný — maximálně 3-4 věty v odpovědi.
Pokud neznáš odpověď, vždy nabídni kontakt: ${CAMPSITE_INFO.phone} nebo ${CAMPSITE_INFO.email}.
NIKDY nevymýšlej ceny, dostupnost ani informace — vždy vycházej z níže uvedených dat nebo použij dostupné nástroje.
Před nabídnutím rezervace VŽDY nejprve zkontroluj dostupnost pomocí nástroje checkAvailability.

${buildFullFaqContent()}`

const rateLimiter = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimiter.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }

  if (entry.count >= 20) return true
  entry.count++
  return false
}

// Tools without getCampsiteInfo — FAQ is now in the system prompt
const { getCampsiteInfo: _unused, ...streamingTools } = campsiteTools

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()

  if (isRateLimited(ip)) {
    return new Response('Too many requests', { status: 429 })
  }

  let messages: unknown[]
  try {
    const body = await req.json()
    if (!Array.isArray(body?.messages)) {
      return new Response('Invalid request body', { status: 400 })
    }
    messages = body.messages
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  // System prompt as first message with cache_control for Anthropic prompt caching.
  // The cached prefix must be >2048 tokens (Sonnet 4.6 minimum). Our FAQ-rich
  // system prompt comfortably exceeds this, so repeated requests reuse the cache.
  const allMessages = [
    {
      role: 'system' as const,
      content: SYSTEM_PROMPT,
      providerOptions: {
        anthropic: { cacheControl: { type: 'ephemeral' } },
      },
    },
    ...(messages as any[]),
  ]

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    messages: allMessages,
    tools: streamingTools,
    stopWhen: stepCountIs(5),
    temperature: 0.3,
  })

  return result.toTextStreamResponse()
}
