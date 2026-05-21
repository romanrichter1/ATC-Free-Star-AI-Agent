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
