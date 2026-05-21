# Kemp Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vytvořit AI chatbota pro web kempu, který odpovídá na FAQ, kontroluje dostupnost (Booking.com + Batia), přesměrovává na rezervaci a posílá potvrzení e-mailem.

**Architecture:** Next.js App Router s jedním `/api/chat` route handlerem, který používá Vercel AI SDK `streamText()` s Claude claude-sonnet-4-6. Agent má 4 tools: `getCampsiteInfo` (lokální FAQ), `checkAvailability` (iCal/Batia API), `getBookingUrl` (přímý odkaz) a `sendConfirmation` (Resend email). Plovoucí ChatWidget se vloží na stávající web.

**Tech Stack:** Next.js 15 (App Router), Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`), Claude claude-sonnet-4-6, Zod (validace tool parametrů), Resend (e-mail), Tailwind CSS, Vitest (unit testy)

---

## Mapování souborů

```
kemp-agent/
├── app/
│   ├── layout.tsx               # Root layout s Tailwind
│   ├── page.tsx                 # Demo stránka s ChatWidgetem
│   └── api/
│       └── chat/
│           └── route.ts         # POST handler: streamText + tools
├── components/
│   └── ChatWidget.tsx           # Plovoucí chat UI (useChat hook)
├── lib/
│   ├── campsite-info.ts         # FAQ knowledge base (editovatelný objekt)
│   ├── tools.ts                 # Definice AI tools (Zod schemas + handlery)
│   ├── availability.ts          # Booking.com iCal + Batia API klient
│   └── email.ts                 # Resend email klient
├── tests/
│   ├── campsite-info.test.ts    # Unit testy knowledge base
│   ├── tools.test.ts            # Unit testy tool handlerů
│   └── availability.test.ts    # Unit testy dostupnosti (s mock fetch)
├── .env.local                   # API klíče (NENÍ v gitu)
├── .env.example                 # Šablona env vars (JE v gitu)
└── vitest.config.ts             # Vitest konfigurace
```

---

## Task 1: Projekt setup

**Files:**
- Create: `kemp-agent/` (Next.js project root)
- Create: `kemp-agent/.env.local`
- Create: `kemp-agent/.env.example`
- Create: `kemp-agent/vitest.config.ts`

- [ ] **Step 1: Vytvoř Next.js projekt**

```bash
cd /Users/romanrichterjr
npx create-next-app@latest kemp-agent \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-git
cd kemp-agent
```

- [ ] **Step 2: Instaluj závislosti**

```bash
npm install ai @ai-sdk/anthropic @ai-sdk/react zod resend
npm install -D vitest @vitest/coverage-v8 vite-tsconfig-paths
```

- [ ] **Step 3: Vytvoř vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
  },
})
```

- [ ] **Step 4: Přidej test script do package.json**

Najdi sekci `"scripts"` v `package.json` a přidej:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Vytvoř .env.example**

```bash
cat > .env.example << 'EOF'
# Anthropic Claude API
ANTHROPIC_API_KEY=your_key_here

# Booking.com iCal feed URL (z Booking.com extranet → Nastavení → iCal)
BOOKING_ICAL_URL=https://ical.booking.com/v1/export?t=...

# Batia platform API
BATIA_API_URL=https://api.batia.cz
BATIA_API_KEY=your_key_here
BATIA_PROPERTY_ID=your_property_id

# Resend email
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=rezervace@vaskemp.cz
EOF
```

- [ ] **Step 6: Vytvoř .env.local ze šablony**

```bash
cp .env.example .env.local
# Vyplň skutečné hodnoty v .env.local
```

- [ ] **Step 7: Ověř setup**

```bash
npm run build
```

Očekávané: build proběhne bez chyb.

- [ ] **Step 8: Commit**

```bash
git init
echo ".env.local" >> .gitignore
git add .
git commit -m "feat: initial Next.js project setup with AI SDK"
```

---

## Task 2: Knowledge base (FAQ)

**Files:**
- Create: `lib/campsite-info.ts`
- Create: `tests/campsite-info.test.ts`

- [ ] **Step 1: Napiš failing test**

```typescript
// tests/campsite-info.test.ts
import { describe, it, expect } from 'vitest'
import { getCampsiteInfo, CAMPSITE_INFO } from '@/lib/campsite-info'

describe('getCampsiteInfo', () => {
  it('returns info for known topic', () => {
    const result = getCampsiteInfo('ceny')
    expect(result).toContain('Kč')
    expect(result.length).toBeGreaterThan(10)
  })

  it('returns info for wifi topic', () => {
    const result = getCampsiteInfo('wifi')
    expect(result.toLowerCase()).toMatch(/wifi|wi-fi|internet/)
  })

  it('returns fallback for unknown topic', () => {
    const result = getCampsiteInfo('neznamy_topic_xyz')
    expect(result).toContain('kontaktujte')
  })

  it('CAMPSITE_INFO has required fields', () => {
    expect(CAMPSITE_INFO.name).toBeTruthy()
    expect(CAMPSITE_INFO.phone).toBeTruthy()
    expect(CAMPSITE_INFO.email).toBeTruthy()
  })
})
```

- [ ] **Step 2: Spusť test, ověř že selže**

```bash
npm test -- tests/campsite-info.test.ts
```

Očekávané: FAIL — `Cannot find module '@/lib/campsite-info'`

- [ ] **Step 3: Implementuj campsite-info.ts**

```typescript
// lib/campsite-info.ts

export const CAMPSITE_INFO = {
  name: 'Kemp [NÁZEV]',               // ← VYPLŇ
  address: '[ADRESA]',                 // ← VYPLŇ
  phone: '+420 XXX XXX XXX',           // ← VYPLŇ
  email: 'info@vaskemp.cz',            // ← VYPLŇ
  website: 'https://vaskemp.cz',       // ← VYPLŇ
  checkIn: '14:00',
  checkOut: '12:00',
  season: 'dubna do října',

  prices: {
    tent: '250 Kč/noc (osoba)',        // ← VYPLŇ
    caravan: '450 Kč/noc',             // ← VYPLŇ
    cottage: '1200 Kč/noc',            // ← VYPLŇ
    child: 'děti do 6 let zdarma',
  },

  amenities: {
    wifi: true,
    wifiNote: 'WiFi zdarma v celém areálu',
    parking: 'Parkování přímo u parcely, zdarma',
    shower: 'Sprchy s teplou vodou 6:00–22:00',
    toilet: 'WC v hlavní budově a mobilní toalety',
    electricity: 'Elektřina na vyžádání +50 Kč/noc',
    pool: false,                       // ← UPRAV
    playground: true,                  // ← UPRAV
    reception: 'Po–Ne 8:00–20:00',
  },

  pets: 'Domácí zvířata vítána, prosíme o vodítko v areálu. Poplatek 50 Kč/noc.',
  campfire: 'Táborák povoleny pouze na vyhrazených místech.',
  noise: 'Noční klid od 22:00 do 7:00.',
  payment: 'Hotovost i platební karty. Záloha 30% při rezervaci.',
  cancellation: 'Zrušení zdarma do 7 dní před příjezdem.',

  nearbyAttractions: [
    '[PŘÍRODA/MĚSTO v okolí]',         // ← VYPLŇ
  ],
} as const

type Topic =
  | 'ceny' | 'wifi' | 'parkování' | 'zvířata' | 'táborák' | 'příjezd'
  | 'odchod' | 'platba' | 'storno' | 'okolí' | 'kontakt' | 'vybavení'
  | 'sezóna'

const TOPIC_MAP: Record<Topic, () => string> = {
  ceny: () =>
    `Ceny: stan ${CAMPSITE_INFO.prices.tent}, karavan ${CAMPSITE_INFO.prices.caravan}, chata ${CAMPSITE_INFO.prices.cottage}. ${CAMPSITE_INFO.prices.child}.`,
  wifi: () =>
    CAMPSITE_INFO.amenities.wifiNote,
  parkování: () =>
    CAMPSITE_INFO.amenities.parking,
  zvířata: () =>
    CAMPSITE_INFO.pets,
  táborák: () =>
    CAMPSITE_INFO.campfire,
  příjezd: () =>
    `Check-in od ${CAMPSITE_INFO.checkIn}. Recepce: ${CAMPSITE_INFO.amenities.reception}.`,
  odchod: () =>
    `Check-out do ${CAMPSITE_INFO.checkOut}.`,
  platba: () =>
    CAMPSITE_INFO.payment,
  storno: () =>
    CAMPSITE_INFO.cancellation,
  okolí: () =>
    `V okolí: ${CAMPSITE_INFO.nearbyAttractions.join(', ')}.`,
  kontakt: () =>
    `Telefon: ${CAMPSITE_INFO.phone}, e-mail: ${CAMPSITE_INFO.email}`,
  vybavení: () =>
    `Sprchy: ${CAMPSITE_INFO.amenities.shower}. ${CAMPSITE_INFO.amenities.toilet}. Elektřina: ${CAMPSITE_INFO.amenities.electricity}. Recepce: ${CAMPSITE_INFO.amenities.reception}.`,
  sezóna: () =>
    `Kemp je otevřen od ${CAMPSITE_INFO.season}.`,
}

export function getCampsiteInfo(topic: string): string {
  const normalised = topic.toLowerCase().trim() as Topic
  const handler = TOPIC_MAP[normalised]
  if (handler) return handler()
  return `Pro tuto informaci nás prosím kontaktujte: ${CAMPSITE_INFO.phone} nebo ${CAMPSITE_INFO.email}`
}
```

- [ ] **Step 4: Spusť test, ověř průchod**

```bash
npm test -- tests/campsite-info.test.ts
```

Očekávané: 4 passed

- [ ] **Step 5: Commit**

```bash
git add lib/campsite-info.ts tests/campsite-info.test.ts
git commit -m "feat: add campsite FAQ knowledge base"
```

---

## Task 3: Availability klient

**Files:**
- Create: `lib/availability.ts`
- Create: `tests/availability.test.ts`

- [ ] **Step 1: Napiš failing test**

```typescript
// tests/availability.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkAvailabilityIcal, parseIcalBusyDates } from '@/lib/availability'

describe('parseIcalBusyDates', () => {
  it('extracts busy date ranges from iCal string', () => {
    const ical = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260710
DTEND;VALUE=DATE:20260715
SUMMARY:Rezervace
END:VEVENT
END:VCALENDAR`
    const busy = parseIcalBusyDates(ical)
    expect(busy).toHaveLength(1)
    expect(busy[0].start).toBe('2026-07-10')
    expect(busy[0].end).toBe('2026-07-14') // DTEND je exkluzivní → -1 den
  })

  it('returns empty array for empty calendar', () => {
    const ical = 'BEGIN:VCALENDAR\nEND:VCALENDAR'
    expect(parseIcalBusyDates(ical)).toHaveLength(0)
  })
})

describe('checkAvailabilityIcal', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns available=true when no overlap', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('BEGIN:VCALENDAR\nEND:VCALENDAR'),
    }))
    const result = await checkAvailabilityIcal(
      'https://example.com/ical',
      '2026-07-10',
      '2026-07-13'
    )
    expect(result.available).toBe(true)
  })

  it('returns available=false when dates overlap', async () => {
    const ical = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260710
DTEND;VALUE=DATE:20260715
END:VEVENT
END:VCALENDAR`
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(ical),
    }))
    const result = await checkAvailabilityIcal(
      'https://example.com/ical',
      '2026-07-12',
      '2026-07-14'
    )
    expect(result.available).toBe(false)
  })

  it('returns error when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await checkAvailabilityIcal(
      'https://example.com/ical',
      '2026-07-10',
      '2026-07-13'
    )
    expect(result.available).toBe(null)
    expect(result.error).toBeTruthy()
  })
})
```

- [ ] **Step 2: Spusť test, ověř že selže**

```bash
npm test -- tests/availability.test.ts
```

Očekávané: FAIL — `Cannot find module '@/lib/availability'`

- [ ] **Step 3: Implementuj availability.ts**

```typescript
// lib/availability.ts

export interface BusyRange {
  start: string  // 'YYYY-MM-DD'
  end: string    // 'YYYY-MM-DD' (inclusive)
}

export interface AvailabilityResult {
  available: boolean | null
  error?: string
}

export function parseIcalBusyDates(ical: string): BusyRange[] {
  const ranges: BusyRange[] = []
  const events = ical.split('BEGIN:VEVENT').slice(1)

  for (const event of events) {
    const startMatch = event.match(/DTSTART(?:;VALUE=DATE)?:(\d{8})/)
    const endMatch = event.match(/DTEND(?:;VALUE=DATE)?:(\d{8})/)
    if (!startMatch || !endMatch) continue

    const toIso = (s: string) =>
      `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`

    const start = toIso(startMatch[1])
    // DTEND v iCal je exkluzivní — poslední noc je DTEND - 1 den
    const endDate = new Date(toIso(endMatch[1]))
    endDate.setDate(endDate.getDate() - 1)
    const end = endDate.toISOString().slice(0, 10)

    ranges.push({ start, end })
  }

  return ranges
}

function datesOverlap(
  busyStart: string,
  busyEnd: string,
  queryStart: string,
  queryEnd: string
): boolean {
  return busyStart <= queryEnd && busyEnd >= queryStart
}

export async function checkAvailabilityIcal(
  icalUrl: string,
  dateFrom: string,
  dateTo: string
): Promise<AvailabilityResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    const response = await fetch(icalUrl, { signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) {
      return { available: null, error: `iCal fetch failed: ${response.status}` }
    }

    const ical = await response.text()
    const busy = parseIcalBusyDates(ical)

    // Konec pobytu = dateTo (host odjíždí), takže poslední noc = dateTo - 1 den
    const lastNight = new Date(dateTo)
    lastNight.setDate(lastNight.getDate() - 1)
    const lastNightStr = lastNight.toISOString().slice(0, 10)

    const hasOverlap = busy.some(({ start, end }) =>
      datesOverlap(start, end, dateFrom, lastNightStr)
    )

    return { available: !hasOverlap }
  } catch (err) {
    return {
      available: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

// Batia API klient — implementace závisí na konkrétním API
// Prozatím vrací mock; vyplň dle dokumentace od Batia
export async function checkAvailabilityBatia(
  dateFrom: string,
  dateTo: string,
  persons: number
): Promise<AvailabilityResult & { price?: number; currency?: string }> {
  const apiUrl = process.env.BATIA_API_URL
  const apiKey = process.env.BATIA_API_KEY
  const propertyId = process.env.BATIA_PROPERTY_ID

  if (!apiUrl || !apiKey || !propertyId) {
    // Fallback: pokud není Batia nakonfigurováno, vrať mock dostupnost
    return { available: true, price: 0, currency: 'CZK' }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    // TODO: nahraď URL a parametry dle skutečné Batia API dokumentace
    const url = new URL(`${apiUrl}/availability`)
    url.searchParams.set('property_id', propertyId)
    url.searchParams.set('date_from', dateFrom)
    url.searchParams.set('date_to', dateTo)
    url.searchParams.set('persons', String(persons))

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return { available: null, error: `Batia API error: ${response.status}` }
    }

    const data = await response.json()
    // TODO: uprav mapování dle skutečné odpovědi Batia API
    return {
      available: data.available ?? true,
      price: data.total_price,
      currency: data.currency ?? 'CZK',
    }
  } catch (err) {
    return {
      available: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export function getBatiaBookingUrl(
  dateFrom: string,
  dateTo: string,
  persons: number
): string {
  const propertyId = process.env.BATIA_PROPERTY_ID ?? ''
  // TODO: uprav URL dle skutečné Batia rezervační stránky
  const base = `https://rezervace.batia.cz/${propertyId}`
  const params = new URLSearchParams({
    arrival: dateFrom,
    departure: dateTo,
    adults: String(persons),
  })
  return `${base}?${params.toString()}`
}
```

- [ ] **Step 4: Spusť test, ověř průchod**

```bash
npm test -- tests/availability.test.ts
```

Očekávané: 5 passed

- [ ] **Step 5: Commit**

```bash
git add lib/availability.ts tests/availability.test.ts
git commit -m "feat: add iCal availability checker and Batia API client"
```

---

## Task 4: Email klient

**Files:**
- Create: `lib/email.ts`

Pozn.: Resend není testovatelný bez skutečného API klíče — funkci testujeme manuálně po deploymentu.

- [ ] **Step 1: Implementuj email.ts**

```typescript
// lib/email.ts
import { Resend } from 'resend'
import { CAMPSITE_INFO } from './campsite-info'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface ReservationDetails {
  guestName: string
  guestEmail: string
  dateFrom: string
  dateTo: string
  persons: number
  accommodationType: string
  totalPrice?: number
  bookingReference?: string
}

export async function sendConfirmationEmail(
  details: ReservationDetails
): Promise<{ success: boolean; error?: string }> {
  const nights = Math.round(
    (new Date(details.dateTo).getTime() - new Date(details.dateFrom).getTime()) /
    (1000 * 60 * 60 * 24)
  )

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? `rezervace@${CAMPSITE_INFO.website.replace('https://', '')}`,
    to: details.guestEmail,
    subject: `Potvrzení rezervace — ${CAMPSITE_INFO.name}`,
    html: `
<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><title>Potvrzení rezervace</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h1 style="color: #2d6a4f;">✓ Vaše rezervace je potvrzena</h1>
  <p>Dobrý den, <strong>${details.guestName}</strong>,</p>
  <p>děkujeme za vaši rezervaci v <strong>${CAMPSITE_INFO.name}</strong>.</p>

  <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
    <tr style="background: #f0f4f0;">
      <td style="padding: 10px; border: 1px solid #ddd;"><strong>Příjezd</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">${details.dateFrom} od ${CAMPSITE_INFO.checkIn}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd;"><strong>Odjezd</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">${details.dateTo} do ${CAMPSITE_INFO.checkOut}</td>
    </tr>
    <tr style="background: #f0f4f0;">
      <td style="padding: 10px; border: 1px solid #ddd;"><strong>Počet nocí</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">${nights}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd;"><strong>Počet osob</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">${details.persons}</td>
    </tr>
    <tr style="background: #f0f4f0;">
      <td style="padding: 10px; border: 1px solid #ddd;"><strong>Ubytování</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">${details.accommodationType}</td>
    </tr>
    ${details.totalPrice ? `
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd;"><strong>Celková cena</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">${details.totalPrice} Kč</td>
    </tr>` : ''}
    ${details.bookingReference ? `
    <tr style="background: #f0f4f0;">
      <td style="padding: 10px; border: 1px solid #ddd;"><strong>Číslo rezervace</strong></td>
      <td style="padding: 10px; border: 1px solid #ddd;">${details.bookingReference}</td>
    </tr>` : ''}
  </table>

  <h3>Důležité informace</h3>
  <ul>
    <li>Check-in: ${CAMPSITE_INFO.checkIn} — ${CAMPSITE_INFO.amenities.reception}</li>
    <li>Check-out: ${CAMPSITE_INFO.checkOut}</li>
    <li>${CAMPSITE_INFO.payment}</li>
    <li>${CAMPSITE_INFO.cancellation}</li>
  </ul>

  <p>Těšíme se na vaši návštěvu!</p>
  <p><strong>${CAMPSITE_INFO.name}</strong><br>
  ${CAMPSITE_INFO.address}<br>
  Tel: ${CAMPSITE_INFO.phone}<br>
  E-mail: ${CAMPSITE_INFO.email}</p>
</body>
</html>`,
  })

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/email.ts
git commit -m "feat: add Resend email confirmation client"
```

---

## Task 5: AI Tools definice

**Files:**
- Create: `lib/tools.ts`
- Create: `tests/tools.test.ts`

- [ ] **Step 1: Napiš failing test**

```typescript
// tests/tools.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { campsiteTools } from '@/lib/tools'

describe('campsiteTools', () => {
  it('has all required tools defined', () => {
    expect(campsiteTools).toHaveProperty('getCampsiteInfo')
    expect(campsiteTools).toHaveProperty('checkAvailability')
    expect(campsiteTools).toHaveProperty('getBookingUrl')
    expect(campsiteTools).toHaveProperty('sendConfirmation')
  })

  it('getCampsiteInfo returns string for known topic', async () => {
    const result = await campsiteTools.getCampsiteInfo.execute({ topic: 'ceny' }, {} as any)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(5)
  })

  it('getBookingUrl returns URL-like string', async () => {
    const result = await campsiteTools.getBookingUrl.execute({
      dateFrom: '2026-07-10',
      dateTo: '2026-07-13',
      persons: 2,
      platform: 'batia',
    }, {} as any)
    expect(typeof result).toBe('string')
    expect(result).toMatch(/^https?:\/\//)
  })
})
```

- [ ] **Step 2: Spusť test, ověř že selže**

```bash
npm test -- tests/tools.test.ts
```

Očekávané: FAIL — `Cannot find module '@/lib/tools'`

- [ ] **Step 3: Implementuj tools.ts**

```typescript
// lib/tools.ts
import { tool } from 'ai'
import { z } from 'zod'
import { getCampsiteInfo, CAMPSITE_INFO } from './campsite-info'
import {
  checkAvailabilityIcal,
  checkAvailabilityBatia,
  getBatiaBookingUrl,
} from './availability'
import { sendConfirmationEmail } from './email'

export const campsiteTools = {
  getCampsiteInfo: tool({
    description: 'Vrátí informace o kempu — ceny, vybavení, pravidla, kontakty, check-in/out časy atd.',
    parameters: z.object({
      topic: z.enum([
        'ceny', 'wifi', 'parkování', 'zvířata', 'táborák',
        'příjezd', 'odchod', 'platba', 'storno', 'okolí',
        'kontakt', 'vybavení', 'sezóna',
      ]).describe('Téma dotazu'),
    }),
    execute: async ({ topic }) => {
      return getCampsiteInfo(topic)
    },
  }),

  checkAvailability: tool({
    description: 'Zkontroluje dostupnost kempu v zadaném termínu. Vždy zavolej před nabídnutím rezervace.',
    parameters: z.object({
      dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Datum příjezdu (YYYY-MM-DD)'),
      dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Datum odjezdu (YYYY-MM-DD)'),
      persons: z.number().int().min(1).max(50).describe('Počet osob'),
    }),
    execute: async ({ dateFrom, dateTo, persons }) => {
      const icalUrl = process.env.BOOKING_ICAL_URL

      const [bookingResult, batiaResult] = await Promise.all([
        icalUrl
          ? checkAvailabilityIcal(icalUrl, dateFrom, dateTo)
          : Promise.resolve({ available: true }),
        checkAvailabilityBatia(dateFrom, dateTo, persons),
      ])

      if (bookingResult.available === null && batiaResult.available === null) {
        return `Omlouváme se, nelze ověřit dostupnost online. Zavolejte nám prosím na ${CAMPSITE_INFO.phone}.`
      }

      const isAvailable =
        (bookingResult.available !== false) && (batiaResult.available !== false)

      if (!isAvailable) {
        return `Termín ${dateFrom} – ${dateTo} pro ${persons} osob je bohužel obsazen. Zkuste jiný termín nebo nás kontaktujte na ${CAMPSITE_INFO.phone}.`
      }

      const priceInfo = batiaResult.price
        ? ` Celková cena: ${batiaResult.price} ${batiaResult.currency ?? 'Kč'}.`
        : ''

      return `Termín ${dateFrom} – ${dateTo} pro ${persons} osob je volný!${priceInfo} Přejete si pokračovat v rezervaci?`
    },
  }),

  getBookingUrl: tool({
    description: 'Vrátí přímý odkaz na rezervaci. Použij po potvrzení dostupnosti a zájmu hosta.',
    parameters: z.object({
      dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      persons: z.number().int().min(1),
      platform: z.enum(['batia', 'booking']).describe('Preferovaná platforma'),
    }),
    execute: async ({ dateFrom, dateTo, persons, platform }) => {
      if (platform === 'booking') {
        const propertyId = process.env.BATIA_PROPERTY_ID ?? ''
        return `https://www.booking.com/hotel/cz/${propertyId}.cs.html?checkin=${dateFrom}&checkout=${dateTo}&group_adults=${persons}`
      }
      return getBatiaBookingUrl(dateFrom, dateTo, persons)
    },
  }),

  sendConfirmation: tool({
    description: 'Odešle potvrzovací e-mail hostovi. Použij pouze pokud host sdílí e-mailovou adresu.',
    parameters: z.object({
      guestName: z.string().min(1).describe('Jméno hosta'),
      guestEmail: z.string().email().describe('E-mail hosta'),
      dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      persons: z.number().int().min(1),
      accommodationType: z.string().describe('Stan, karavan, chata...'),
      totalPrice: z.number().optional(),
    }),
    execute: async (params) => {
      const result = await sendConfirmationEmail(params)
      if (result.success) {
        return `Potvrzovací e-mail byl odeslán na adresu ${params.guestEmail}.`
      }
      return `Nepodařilo se odeslat e-mail. Kontaktujte nás přímo na ${CAMPSITE_INFO.email}.`
    },
  }),
}
```

- [ ] **Step 4: Spusť test, ověř průchod**

```bash
npm test -- tests/tools.test.ts
```

Očekávané: 4 passed

- [ ] **Step 5: Commit**

```bash
git add lib/tools.ts tests/tools.test.ts
git commit -m "feat: define AI tools with Zod validation"
```

---

## Task 6: Chat API Route

**Files:**
- Create: `app/api/chat/route.ts`

- [ ] **Step 1: Implementuj route.ts**

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { campsiteTools } from '@/lib/tools'
import { CAMPSITE_INFO } from '@/lib/campsite-info'
import { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `Jsi přátelský a nápomocný asistent kempu ${CAMPSITE_INFO.name}.
Pomáháš hostům s informacemi, kontrolou dostupnosti a rezervacemi.
Komunikuješ česky (nebo v jazyce, ve kterém host píše).
Vždy buď konkrétní a stručný — maximálně 3-4 věty v odpovědi.
Pokud neznáš odpověď, vždy nabídni kontakt: ${CAMPSITE_INFO.phone} nebo ${CAMPSITE_INFO.email}.
NIKDY nevymýšlej ceny, dostupnost ani informace — vždy použij dostupné nástroje.
Před nabídnutím rezervace VŽDY nejprve zkontroluj dostupnost pomocí nástroje checkAvailability.`

// Jednoduchý in-memory rate limiter (produkce: použij @vercel/kv)
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

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  if (isRateLimited(ip)) {
    return new Response('Too many requests', { status: 429 })
  }

  const { messages } = await req.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: SYSTEM_PROMPT,
    messages,
    tools: campsiteTools,
    maxSteps: 5,  // max tool calls v jedné odpovědi
    temperature: 0.3,
  })

  return result.toDataStreamResponse()
}
```

- [ ] **Step 2: Ověř že route se builduje**

```bash
npm run build
```

Očekávané: build proběhne bez chyb (varování o missing env vars je OK).

- [ ] **Step 3: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat: add chat API route with streamText and tools"
```

---

## Task 7: Chat Widget komponenta

**Files:**
- Create: `components/ChatWidget.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implementuj ChatWidget.tsx**

```tsx
// components/ChatWidget.tsx
'use client'

import { useChat } from '@ai-sdk/react'
import { useState, useRef, useEffect } from 'react'

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
  })

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  return (
    <>
      {/* Plovoucí tlačítko */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-700 hover:bg-green-800 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all"
        aria-label={isOpen ? 'Zavřít chat' : 'Otevřít chat asistenta'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat okno */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          style={{ height: '480px' }}>
          {/* Hlavička */}
          <div className="bg-green-700 text-white px-4 py-3 flex items-center gap-2">
            <span className="text-lg">🏕️</span>
            <div>
              <div className="font-semibold text-sm">Asistent kempu</div>
              <div className="text-xs text-green-200">Online — odpovím za okamžik</div>
            </div>
          </div>

          {/* Zprávy */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-8">
                <div className="text-3xl mb-2">👋</div>
                <p>Ahoj! Jak vám mohu pomoci?</p>
                <p className="mt-1 text-xs">Zeptejte se na dostupnost, ceny nebo vybavení.</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-green-700 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 text-gray-400 text-sm shadow-sm">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center text-red-500 text-xs py-2">
                Chyba připojení. Zkuste to znovu.
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Napište dotaz..."
                disabled={isLoading}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded-full w-9 h-9 flex items-center justify-center text-sm transition-colors flex-shrink-0"
              >
                →
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Uprav app/page.tsx**

Nahraď celý obsah souboru `app/page.tsx`:

```tsx
// app/page.tsx
import { ChatWidget } from '@/components/ChatWidget'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
      <div className="text-center px-4">
        <div className="text-6xl mb-4">🏕️</div>
        <h1 className="text-3xl font-bold text-green-900 mb-2">Kemp Demo</h1>
        <p className="text-gray-600">Chat asistent je dostupný vpravo dole.</p>
      </div>
      <ChatWidget />
    </main>
  )
}
```

- [ ] **Step 3: Spusť lokálně a otestuj manuálně**

```bash
npm run dev
```

Otevři http://localhost:3000 a otestuj:
- Klikni na chat tlačítko — widget se otevře
- Napiš "Jaké máte ceny?" — agent odpoví z knowledge base
- Napiš "Máte volno od 10.7. do 13.7. pro 2 osoby?" — agent zavolá checkAvailability tool

- [ ] **Step 4: Commit**

```bash
git add components/ChatWidget.tsx app/page.tsx
git commit -m "feat: add floating ChatWidget with useChat hook"
```

---

## Task 8: Deploy na Vercel

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Vytvoř vercel.json**

```json
{
  "functions": {
    "app/api/chat/route.ts": {
      "maxDuration": 60
    }
  }
}
```

- [ ] **Step 2: Instaluj Vercel CLI (pokud chybí)**

```bash
npm install -g vercel
```

- [ ] **Step 3: Přidej environment variables přes Vercel dashboard nebo CLI**

```bash
vercel env add ANTHROPIC_API_KEY
# Zadej hodnotu z .env.local
vercel env add BOOKING_ICAL_URL
vercel env add BATIA_API_URL
vercel env add BATIA_API_KEY
vercel env add BATIA_PROPERTY_ID
vercel env add RESEND_API_KEY
vercel env add EMAIL_FROM
```

- [ ] **Step 4: Deploy na preview**

```bash
vercel deploy
```

Ověř: otevři preview URL, otestuj chat widget.

- [ ] **Step 5: Deploy do produkce**

```bash
vercel --prod
```

- [ ] **Step 6: Vložení widgetu na stávající web**

Do stávajícího webu vlož těsně před `</body>`:

```html
<!-- Volba A: iframe (jednoduchá, izolovaná) -->
<iframe
  src="https://TVUJ-PROJEKT.vercel.app"
  style="position:fixed; bottom:0; right:0; width:420px; height:540px; border:none; z-index:9999; pointer-events:none;"
  title="Kemp chat asistent"
></iframe>

<!-- Nebo volba B: přesuň ChatWidget přímo do stávajícího Next.js webu -->
```

Pozn.: Pokud stávající web není Next.js, doporučena volba A (iframe). Pokud je Next.js, přesun komponenty přímo.

- [ ] **Step 7: Commit**

```bash
git add vercel.json
git commit -m "feat: add Vercel config and deployment setup"
```

---

## Ověření (definition of done)

- [ ] `npm test` — všechny testy prochází
- [ ] `npm run build` — build bez chyb
- [ ] Chat widget odpovídá na "Jaké máte ceny?" ze knowledge base (bez API volání)
- [ ] Chat widget kontroluje dostupnost a vrátí smysluplnou odpověď
- [ ] Chat widget vrátí odkaz na rezervaci po potvrzení zájmu
- [ ] Na zadaný e-mail přijde potvrzovací e-mail
- [ ] Widget funguje na mobilu (Chrome DevTools → mobile viewport)
- [ ] Deploy na Vercel běží, widget se načítá na produkční URL

---

## Otevřené body (před startem vyřešit)

1. **Batia API** — kontaktuj Batia support a zjisti:
   - Dokumentace jejich API (nebo export iCal)
   - API klíč a base URL
   - Jak vypadá URL pro přímou rezervaci s předvyplněnými parametry

2. **Booking.com iCal** — v Booking.com extranetu:
   - Nastavení → Připojení kanálů → iCal export
   - Zkopíruj URL a vlož do `BOOKING_ICAL_URL`

3. **Vyplň `lib/campsite-info.ts`** — jméno kempu, adresa, telefon, ceny

4. **Resend** — registruj se na resend.com, verifikuj doménu, získej API klíč
