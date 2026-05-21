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
