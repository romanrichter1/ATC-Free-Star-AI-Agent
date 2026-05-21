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
