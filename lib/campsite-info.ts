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
