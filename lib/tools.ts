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
    inputSchema: z.object({
      topic: z.enum([
        'ceny', 'wifi', 'parkování', 'zvířata', 'táborák',
        'příjezd', 'odchod', 'platba', 'storno', 'okolí',
        'kontakt', 'vybavení', 'sezóna', 'bazén', 'stravování',
      ]).describe('Téma dotazu'),
    }),
    outputSchema: z.string(),
    execute: async ({ topic }) => {
      return getCampsiteInfo(topic)
    },
  }),

  checkAvailability: tool({
    description: 'Zkontroluje dostupnost kempu v zadaném termínu. Vždy zavolej před nabídnutím rezervace.',
    inputSchema: z.object({
      dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Datum příjezdu (YYYY-MM-DD)'),
      dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Datum odjezdu (YYYY-MM-DD)'),
      persons: z.number().int().min(1).max(50).describe('Počet osob'),
    }),
    outputSchema: z.string(),
    execute: async ({ dateFrom, dateTo, persons }) => {
      const icalUrl = process.env.BOOKING_ICAL_URL

      const [bookingResult, batiaResult] = await Promise.all([
        icalUrl
          ? checkAvailabilityIcal(icalUrl, dateFrom, dateTo)
          : Promise.resolve({ available: true as const }),
        checkAvailabilityBatia(dateFrom, dateTo, persons),
      ])

      if (bookingResult.available === null && batiaResult.available === null) {
        return `Omlouváme se, nelze ověřit dostupnost online. Zavolejte nás prosím na ${CAMPSITE_INFO.phone}.`
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
    inputSchema: z.object({
      dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      persons: z.number().int().min(1),
      platform: z.enum(['batia', 'booking']).describe('Preferovaná platforma'),
    }),
    outputSchema: z.string(),
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
    inputSchema: z.object({
      guestName: z.string().min(1).describe('Jméno hosta'),
      guestEmail: z.string().email().describe('E-mail hosta'),
      dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      persons: z.number().int().min(1),
      accommodationType: z.string().describe('Stan, karavan, chata...'),
      totalPrice: z.number().optional(),
    }),
    outputSchema: z.string(),
    execute: async (params) => {
      const result = await sendConfirmationEmail(params)
      if (result.success) {
        return `Potvrzovací e-mail byl odeslán na adresu ${params.guestEmail}.`
      }
      return `Nepodařilo se odeslat e-mail. Kontaktujte nás přímo na ${CAMPSITE_INFO.email}.`
    },
  }),
}
