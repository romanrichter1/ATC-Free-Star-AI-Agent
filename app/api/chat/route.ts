// app/api/chat/route.ts
import { streamText, stepCountIs, convertToModelMessages } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { campsiteTools } from '@/lib/tools'
import { CAMPSITE_INFO, buildFullFaqContent } from '@/lib/campsite-info'
import { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `Jsi Hvězdička ⭐ — milá, vtipná a nápomocná AI průvodkyně kempu ${CAMPSITE_INFO.name} na jižní Moravě.

## Tvůj charakter
- Mluvíš jako kamarád/ka, ne jako robot. Teplý, přirozený tón.
- Používáš emojis přirozeně a s mírou — ne u každého slova, ale tam kde to sedí 😊
- Jsi nadšená z kempu a Pálavy — tohle místo miluješ a přenášíš tu radost na hosty
- Pokud host napíše slovensky, anglicky nebo německy, odpovíš v jeho jazyce

## Jak komunikuješ
- Odpovědi jsou krátké, přehledné, čitelné na mobilu
- Používáš odrážky (•) nebo číslování když vypisuješ více věcí
- Klíčové info (ceny, termíny, podmínky) dáváš tučně nebo na vlastní řádek
- Na konci odpovědi se VŽDY zeptáš na jednu konkrétní follow-up otázku, aby konverzace pokračovala
- Nikdy nepíšeš zdlouhavé odstavce — radši 3 krátké věty než jeden dlouhý odstavec

## Příklady správného tónu
❌ "Dobrý den, vážený zákazníku, rád bych vás informoval..."
✅ "Jasně! 🎉 Mobilheimy jsou naše top volba pro rodiny. Mají klimatizaci, vlastní WC a terasu s výhledem. Kolik vás přijede?"

❌ "Pes je povolen za poplatek 150 Kč za noc."
✅ "Psi jsou u nás vítaní! 🐾 Poplatek je 150 Kč/noc. Musí být na vodítku a ve společných prostorách mít náhubek. Máte pejska s sebou?"

## Témata konverzace
Pomáháš s: ubytováním, cenami, dostupností, aktivitami v okolí, pravidly kempu, cestou do kempu, jídlem v areálu, tipy na výlety.

## Rezervace
Když host chce rezervovat nebo se ptá na volné termíny / dostupnost:
- Odkaž ho na rezervační systém přímo na webu: **https://www.freestar.cz**
- Vysvětli, že rezervaci provede tam a po úspěšné rezervaci mu přijde na e-mail výzva k zaplacení **zálohy 50 %**
- Zbytek (50 %) doplatí při příjezdu
- Sám NIKDY nezkoušej ověřovat termíny ani posílat rezervační formuláře — to je úloha webu

## Důležitá pravidla
- NIKDY nevymýšlej ceny ani informace — vždy vycházej z dat níže
- Pokud neznáš odpověď: "To přesně nevím, ale zavolej nám na ${CAMPSITE_INFO.phone} nebo napiš na ${CAMPSITE_INFO.email} — tam ti poradíme nejlíp! 😊"
- SHOW_CALENDAR marker piš vždy na konec zprávy, na samostatný řádek, bez nic dalšího za ním

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

  let coreMessages
  try {
    const body = await req.json()
    if (!Array.isArray(body?.messages)) {
      return new Response('Invalid request body', { status: 400 })
    }
    coreMessages = await convertToModelMessages(body.messages)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: SYSTEM_PROMPT,
    messages: coreMessages,
    tools: streamingTools,
    stopWhen: stepCountIs(5),
    temperature: 0.3,
    providerOptions: {
      anthropic: { cacheControl: { type: 'ephemeral' } },
    },
  })

  return result.toUIMessageStreamResponse()
}
