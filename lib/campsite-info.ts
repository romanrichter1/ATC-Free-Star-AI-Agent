// lib/campsite-info.ts

export const CAMPSITE_INFO = {
  name: 'Autocamp Free Star',
  address: 'Šakvická 3 (za kostelem), 693 01 Strachotín, okres Břeclav',
  phone: '+420 776 230 887',
  phoneFallback: '+420 775 779 778',
  email: 'autocamp@freestar.cz',
  website: 'https://www.freestar.cz',
  checkIn: '15:00',
  checkOut: '10:00',
  season: 'dubna do října',

  prices: {
    // Chatky a bungalovy (cena za celý objekt/noc)
    cottage: 'Chatka s terasou (max 6 lůžek) 1 350 Kč/noc; Bungalov A3/A4 (max 4 lůžka) 1 050 Kč/noc; Dvojbungalov B1/B2 (7 lůžek, s WC) 1 750 Kč/noc',
    mobilhome: 'Mobilheim 2 ložnice (4–5 lůžek) 2 350 Kč/noc; Mobilheim 3 ložnice (6–7 lůžek) 2 680 Kč/noc',
    // Stany a karavany (cena za stání/noc)
    tent: 'Velký stan (3+ os.) 250 Kč/noc; Malý stan (max 2 os.) 200 Kč/noc',
    shelter: 'Přístřešek malý (do 2×2 m) 150 Kč/noc; Přístřešek velký 300 Kč/noc',
    caravan: 'Karavanové stání 590 Kč/noc (akce ve všední dny); Karavan/obytné auto nad 6 m 690 Kč/noc',
    // Osoby
    adult: 'Osoba nad 12 let +150 Kč/noc',
    child: 'Dítě 3–12 let +130 Kč/noc; Dítě do 3 let ZDARMA',
    // Příplatky
    parking: 'Auto 150 Kč/noc; Motorka 120 Kč/noc',
    electricity: '150 Kč/noc (max 1 000 W, pouze drobné spotřebiče)',
    pet: 'Pes/kočka 150 Kč/noc',
    localFee: 'Místní poplatek 20 Kč/den (osoby nad 18 let)',
    singleNightSurcharge: 'Příplatek za pobyt na 1 noc: +50 Kč/osoba',
    bedding: 'Povlečení je vždy součástí ceny (chatky, bungalovy, mobilheimy)',
  },

  amenities: {
    wifi: true,
    wifiNote: 'WiFi zdarma v celém areálu',
    parking: 'Parkování u parcely — auto 150 Kč/noc, motorka 120 Kč/noc',
    shower: 'Sociální zařízení k dispozici v areálu',
    toilet: 'WC v areálu; bungalovy B1/B2 a mobilheimy mají vlastní WC',
    electricity: 'Elektřina 150 Kč/noc (max 1 000 W; el. vařiče, topidla a remosky zakázány)',
    pool: true,
    poolNote: 'Bazén s barem (bar otevřen večer v sezóně)',
    playground: true,
    kitchen: 'Kuchyňka k dispozici pro hosty (za malý poplatek)',
    catering: 'Bufet s celodenním občerstvením vč. snídaní; bar u bazénu',
    reception: 'Recepce v areálu od dubna (tel. +420 776 630 887)',
  },

  pets: 'Domácí zvířata vítána za příplatek 150 Kč/noc. Psi musí být na vodítku s náhubkem a mít platnou registrační známku. V areálu se psi nevenčí, koupání v bazénu je přísně zakázáno.',
  campfire: 'Rozdělávání ohně povoleno pouze na místech k tomu vyhrazených.',
  noise: 'Noční klid od 23:00 do 6:00. Opakované rušení = okamžitá výpověď bez náhrady.',
  payment: 'Stany/karavany: platba předem za celý pobyt. Chatky/bungalovy/mobilheimy: 50% záloha předem, 50% při příjezdu. Rekreační poplatek (20 Kč/os./den) se hradí zvlášť.',
  cancellation: 'Storno více než 20 dní před příjezdem: 30 % z ceny. Méně než 10 dní před příjezdem: 50 % z ceny.',
  earlyDeparture: 'Odjezd před 8:00 musí být předem ohlášen.',

  nearbyAttractions: [
    'Novomlýnské nádrže — koupání, windsurfing, cyklotrasy přímo u kempu',
    'Mikulov — historické město s hradem (cca 15 km)',
    'Strachotínská sklepní ulička — cca 100 vinných sklepů, 100 m od kempu',
    'Cyklistické stezky Jižní Moravy — napojení přímo z kempu',
    'Pálava — CHKO, turistika, vinice',
  ],
} as const

type Topic =
  | 'ceny' | 'wifi' | 'parkování' | 'zvířata' | 'táborák' | 'příjezd'
  | 'odchod' | 'platba' | 'storno' | 'okolí' | 'kontakt' | 'vybavení'
  | 'sezóna' | 'bazén' | 'stravování'

const TOPIC_MAP: Record<Topic, () => string> = {
  ceny: () =>
    `Chatky: ${CAMPSITE_INFO.prices.cottage}. Mobilheimy: ${CAMPSITE_INFO.prices.mobilhome}. Stany: ${CAMPSITE_INFO.prices.tent}. Karavany: ${CAMPSITE_INFO.prices.caravan}. K tomu se přičítá osoba (${CAMPSITE_INFO.prices.adult}, ${CAMPSITE_INFO.prices.child}) a parkování (${CAMPSITE_INFO.prices.parking}).`,
  wifi: () =>
    CAMPSITE_INFO.amenities.wifiNote,
  parkování: () =>
    CAMPSITE_INFO.amenities.parking,
  zvířata: () =>
    CAMPSITE_INFO.pets,
  táborák: () =>
    CAMPSITE_INFO.campfire,
  příjezd: () =>
    `Check-in od ${CAMPSITE_INFO.checkIn}. ${CAMPSITE_INFO.amenities.reception}.`,
  odchod: () =>
    `Check-out do ${CAMPSITE_INFO.checkOut}. ${CAMPSITE_INFO.earlyDeparture}`,
  platba: () =>
    CAMPSITE_INFO.payment,
  storno: () =>
    CAMPSITE_INFO.cancellation,
  okolí: () =>
    `V okolí kempu: ${CAMPSITE_INFO.nearbyAttractions.join('; ')}.`,
  kontakt: () =>
    `Telefon (rezervace): ${CAMPSITE_INFO.phone}, záložní: ${CAMPSITE_INFO.phoneFallback}. E-mail: ${CAMPSITE_INFO.email}. Web: ${CAMPSITE_INFO.website}.`,
  vybavení: () =>
    `WiFi zdarma. ${CAMPSITE_INFO.amenities.shower}. ${CAMPSITE_INFO.amenities.toilet}. ${CAMPSITE_INFO.amenities.electricity}. ${CAMPSITE_INFO.amenities.catering}.`,
  sezóna: () =>
    `Kemp je otevřen od ${CAMPSITE_INFO.season}. ${CAMPSITE_INFO.amenities.reception}.`,
  bazén: () =>
    `${CAMPSITE_INFO.amenities.poolNote} Psi mají koupání v bazénu zakázáno.`,
  stravování: () =>
    CAMPSITE_INFO.amenities.catering,
}

export function getCampsiteInfo(topic: string): string {
  const normalised = topic.toLowerCase().trim() as Topic
  const handler = TOPIC_MAP[normalised]
  if (handler) return handler()
  return `Pro tuto informaci nás prosím kontaktujte: ${CAMPSITE_INFO.phone} nebo ${CAMPSITE_INFO.email}`
}

export function buildFullFaqContent(): string {
  return `
## Informace o kempu

**Název:** ${CAMPSITE_INFO.name}
**Adresa:** ${CAMPSITE_INFO.address}
**Telefon (rezervace):** ${CAMPSITE_INFO.phone} | Záložní: ${CAMPSITE_INFO.phoneFallback}
**E-mail:** ${CAMPSITE_INFO.email}
**Web:** ${CAMPSITE_INFO.website}
**Sezóna:** Otevřeno od ${CAMPSITE_INFO.season}. Recepce ${CAMPSITE_INFO.amenities.reception}

## Ceník 2026

### Chatky a bungalovy (cena za objekt/noc, povlečení v ceně)
${CAMPSITE_INFO.prices.cottage}

### Mobilheimy (cena za objekt/noc)
${CAMPSITE_INFO.prices.mobilhome}

### Stany
${CAMPSITE_INFO.prices.tent}

### Přístřešky
${CAMPSITE_INFO.prices.shelter}

### Karavany
${CAMPSITE_INFO.prices.caravan}

### Osoby (příplatek k ceně stání/objektu)
- ${CAMPSITE_INFO.prices.adult}
- ${CAMPSITE_INFO.prices.child}

### Příplatky
- Parkování: ${CAMPSITE_INFO.prices.parking}
- Elektřina: ${CAMPSITE_INFO.prices.electricity}
- Domácí zvíře: ${CAMPSITE_INFO.prices.pet}
- Místní poplatek: ${CAMPSITE_INFO.prices.localFee}
- Pobyt na 1 noc: ${CAMPSITE_INFO.prices.singleNightSurcharge}
- ${CAMPSITE_INFO.prices.bedding}

## Vybavení

- **WiFi:** ${CAMPSITE_INFO.amenities.wifiNote}
- **Parkování:** ${CAMPSITE_INFO.amenities.parking}
- **Sprchy:** ${CAMPSITE_INFO.amenities.shower}
- **WC:** ${CAMPSITE_INFO.amenities.toilet}
- **Elektřina:** ${CAMPSITE_INFO.amenities.electricity}
- **Bazén:** ${CAMPSITE_INFO.amenities.poolNote}
- **Stravování:** ${CAMPSITE_INFO.amenities.catering}
- **Kuchyňka:** ${CAMPSITE_INFO.amenities.kitchen}

## Pravidla

- **Domácí zvířata:** ${CAMPSITE_INFO.pets}
- **Táborák:** ${CAMPSITE_INFO.campfire}
- **Noční klid:** ${CAMPSITE_INFO.noise}
- **Odjezd před 8:00:** ${CAMPSITE_INFO.earlyDeparture}

## Platba a storno

- **Platba:** ${CAMPSITE_INFO.payment}
- **Storno podmínky:** ${CAMPSITE_INFO.cancellation}

## Okolí a atrakce

${CAMPSITE_INFO.nearbyAttractions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

## Příjezd a odjezd

- **Check-in:** od ${CAMPSITE_INFO.checkIn}
- **Check-out:** do ${CAMPSITE_INFO.checkOut}
`.trim()
}
