export interface Contact {
  id: string
  name: string
  phone: string
  optedIn: boolean
  tags: string[]
  /** null = never purchased */
  lastPurchaseDaysAgo: number | null
  /** null = no open cart */
  cartAbandonedHoursAgo: number | null
}

// Seeded PRNG so the generated contact book is identical on every load.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Common Ghanaian first names: English and local (Akan day names, Ga, Ewe, Northern).
const FIRST_NAMES = [
  'Kwame', 'Akosua', 'Kofi', 'Ama', 'Yaw', 'Abena', 'Kwabena', 'Efua', 'Kojo', 'Adwoa',
  'Kwaku', 'Afua', 'Nii', 'Naa', 'Selorm', 'Dzifa', 'Mawuli', 'Esi', 'Fuseini', 'Ayishetu',
  'Emmanuel', 'Priscilla', 'Samuel', 'Gifty', 'Daniel', 'Comfort', 'Isaac', 'Mercy', 'Richard', 'Linda',
]
const LAST_NAMES = [
  'Mensah', 'Boateng', 'Owusu', 'Asante', 'Appiah', 'Agyeman', 'Ofori', 'Darko', 'Frimpong', 'Nyarko',
  'Tetteh', 'Lamptey', 'Quaye', 'Amoah', 'Agbeko', 'Tsikata', 'Alhassan', 'Issah', 'Addo', 'Antwi',
  'Danquah', 'Osei', 'Adjei', 'Yeboah',
]
// Ghanaian mobile prefixes without the leading 0 (024, 054, 055, 025 · 020, 050 · 027).
const MOBILE_PREFIXES = ['24', '54', '55', '25', '20', '50', '27']

export function generateContacts(count: number, seed = 42): Contact[] {
  const random = mulberry32(seed)
  const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)]

  return Array.from({ length: count }, (_, index) => {
    const line = String(1000 + index).padStart(4, '0')
    const hasPurchased = random() < 0.8
    return {
      id: `ct_${index + 1}`,
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      phone: `+233${pick(MOBILE_PREFIXES)}${String(200 + Math.floor(random() * 800))}${line}`,
      optedIn: random() < 0.96,
      tags: random() < 0.07 ? ['vip'] : [],
      lastPurchaseDaysAgo: hasPurchased ? Math.floor(random() * 365) : null,
      cartAbandonedHoursAgo: random() < 0.04 ? Math.floor(random() * 120) : null,
    }
  })
}

export const CONTACTS = generateContacts(1300)
