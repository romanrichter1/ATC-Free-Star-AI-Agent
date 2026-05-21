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
