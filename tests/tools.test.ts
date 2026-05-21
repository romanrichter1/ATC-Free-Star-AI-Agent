import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock resend so module-level `new Resend()` doesn't throw without an API key
vi.mock('resend', () => {
  const Resend = function (this: any) {
    this.emails = {
      send: vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null }),
    }
  }
  return { Resend }
})

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
