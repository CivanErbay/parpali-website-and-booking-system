/**
 * Seed script — bootstraps Parpali with the content needed out of the box:
 * the five Globals (Navigation, Footer, OpeningHours, BookingSettings,
 * ContactInfo), a small starter Speisekarte, and one example Testimonial.
 * Idempotent: re-running updates docs in place. Bootstrap-only — don't run
 * after editorial work has happened in admin or you'll overwrite it.
 *
 * Run with:   pnpm seed
 */
import { getPayload, type Payload } from 'payload'
import config from '../src/payload.config'

const NAVIGATION_DATA = {
  brandText: 'Parpali',
  brandHref: '/',
  links: [
    { label: 'Speisekarte', href: '/menu' },
    { label: 'Über uns', href: '/ueber-uns' },
    { label: 'Kontakt', href: '/kontakt' },
  ],
  ctaText: 'Tisch reservieren',
  ctaHref: '/reservierung',
}

const FOOTER_DATA = {
  brandText: 'Parpali',
  mode: 'dark' as const,
  columns: [
    {
      heading: 'Restaurant',
      links: [
        { label: 'Speisekarte', href: '/menu' },
        { label: 'Reservierung', href: '/reservierung' },
      ],
    },
    {
      heading: 'Über',
      links: [
        { label: 'Unsere Geschichte', href: '/ueber-uns' },
        { label: 'Kontakt', href: '/kontakt' },
      ],
    },
    {
      heading: 'Rechtliches',
      links: [
        { label: 'Impressum', href: '/impressum' },
        { label: 'Datenschutz', href: '/datenschutz' },
      ],
    },
  ],
  bottomLeft: '© Parpali · Alle Rechte vorbehalten',
  bottomRight: 'Made with care in Berlin',
}

/**
 * Opening hours from the client meeting (2026-05): durchgehender Service ab
 * 11:30, letzte Reservierung 21:00 unter der Woche / 22:00 am Wochenende.
 * `lastSeating` drives the bookable grid; `close` is the door-closing time and
 * only needs to sit after `lastSeating` (the table is held 2.5h past seating).
 * TODO(owner): confirm whether there is a Ruhetag (rest day) — seeded open daily.
 */
const WEEKDAY_LAST_SEATING: Record<string, string> = {
  '1': '21:00', // Mo
  '2': '21:00', // Di
  '3': '21:00', // Mi
  '4': '21:00', // Do
  '5': '22:00', // Fr
  '6': '22:00', // Sa
  '0': '21:00', // So
}
const OPENING_HOURS_DATA = {
  regular: Object.entries(WEEKDAY_LAST_SEATING).map(([weekday, lastSeating]) => ({
    weekday,
    isClosed: false,
    segments: [
      {
        label: 'Durchgehend',
        open: '11:30',
        close: lastSeating === '22:00' ? '23:59' : '23:30',
        lastSeating,
      },
    ],
  })),
  holidays: [],
}

const BOOKING_SETTINGS_DATA = {
  slotMinutes: 30,
  maxSeatsPerSlot: 200,
  tableHoldMinutes: 150,
  maxPartyOnline: 8,
  minLeadTimeHours: 2,
  advanceWindowDays: 60,
  maxCombineTables: 3,
  blackoutDates: [],
  confirmationCopy: {
    thanks: 'Vielen Dank für deine Reservierung. Wir freuen uns auf deinen Besuch.',
    house: 'Bitte sag uns kurz Bescheid, falls du dich verspätest oder nicht kommen kannst.',
  },
}

/**
 * Default floor plan from the client meeting (2026-05): ~30 numbered tables,
 * mostly 2-tops (combinable) plus some 4-tops. `combine` lists physically
 * adjacent tables by label (resolved to relationship ids in a second pass).
 *
 * Sensible default adjacency so combining works out of the box — the owner
 * fine-tunes which tables actually push together in /manage → Tische:
 *  - the 22 two-tops form one combinable row (each adjacent to its neighbours),
 *    so up to `maxCombineTables` (3) push together → parties up to 6;
 *  - the 8 four-tops form a second combinable row → parties up to 8 (two 4-tops).
 */
type SeedTable = {
  label: string
  capacity: number
  zone: 'main' | 'terrace' | 'bar' | 'private'
  combinable: boolean
  sortOrder: number
  combine: string[]
}

const TWO_TOP_COUNT = 22
const FOUR_TOP_COUNT = 8

const SEED_TABLES: SeedTable[] = (() => {
  const out: SeedTable[] = []
  const neighbours = (n: number, lo: number, hi: number): string[] => {
    const c: string[] = []
    if (n > lo) c.push(`T${n - 1}`)
    if (n < hi) c.push(`T${n + 1}`)
    return c
  }
  for (let n = 1; n <= TWO_TOP_COUNT; n++) {
    out.push({ label: `T${n}`, capacity: 2, zone: 'main', combinable: true, sortOrder: n, combine: neighbours(n, 1, TWO_TOP_COUNT) })
  }
  const fourLo = TWO_TOP_COUNT + 1
  const fourHi = TWO_TOP_COUNT + FOUR_TOP_COUNT
  for (let n = fourLo; n <= fourHi; n++) {
    out.push({ label: `T${n}`, capacity: 4, zone: 'main', combinable: true, sortOrder: n, combine: neighbours(n, fourLo, fourHi) })
  }
  return out
})()

const CONTACT_INFO_DATA = {
  restaurantName: 'Parpali',
  street: 'Marktpl. 5',
  zip: '53773',
  city: 'Hennef (Sieg)',
  phone: '+49 30 1234567',
  email: 'reservierung@parpali.de',
  whatsapp: '',
  ownerName: '',
  vatId: '',
  maps: { directionsUrl: '', embedUrl: '' },
  social: [
    { platform: 'instagram', url: 'https://instagram.com/parpali' },
  ],
}

/**
 * Items from the old placeholder seed that should be removed before the real
 * Parpali menu lands. Names must match exactly.
 */
const OBSOLETE_ITEM_NAMES = [
  'Burrata pugliese',
  'Vitello tonnato',
  'Tagliatelle al ragù',
  'Risotto ai funghi',
  'Pizza Margherita D.O.P.',
  'Pizza Diavola',
  'Tiramisù della casa',
  'Chianti Classico DOCG',
  'Vermentino di Sardegna',
  'Negroni',
]

/**
 * Real Parpali Speisekarte — sourced from the printed menu (screenshots
 * shared by the client on 2026-05-15). Item numbers from the printed menu
 * are used as `order` within each category to preserve the printed sequence.
 */
const SEED_MENU = [
  // ── SUPPEN ──────────────────────────────────────────────────────────
  { name: 'Tomatensuppe', description: '', price: 5.9, category: 'suppen', isVegetarian: true, order: 1 },
  { name: 'Hühnersuppe', description: '', price: 6.9, category: 'suppen', order: 2 },
  { name: 'Linsensuppe', description: 'Püriert.', price: 5.5, category: 'suppen', isVegetarian: true, order: 3 },

  // ── ANTIPASTI ───────────────────────────────────────────────────────
  // "Zu allen Vorspeisen wird Brot gereicht."
  { name: 'Aioli & Oliven', description: '', price: 5.5, category: 'antipasti', isVegetarian: true, order: 10 },
  { name: 'Überbackene Champignons', description: '', price: 5.5, category: 'antipasti', isVegetarian: true, order: 11 },
  { name: 'Tomate Mozzarella', description: '', price: 6.5, category: 'antipasti', isVegetarian: true, order: 12 },
  { name: 'Auberginen-Dip', description: '', price: 4.5, category: 'antipasti', isVegetarian: true, order: 13 },
  { name: 'Gemüse-Dip', description: '', price: 5.5, category: 'antipasti', isVegetarian: true, order: 14 },
  { name: 'Überbackener Schafskäse', description: '', price: 7.5, category: 'antipasti', isVegetarian: true, order: 15 },
  { name: 'Calamari-Ringe mit Sauce', description: '', price: 8.5, category: 'antipasti', order: 16 },
  { name: 'Gemischter Antipasta-Teller', description: 'Zu allen Vorspeisen wird Brot gereicht.', price: 22.5, category: 'antipasti', isSignature: true, order: 17 },

  // ── SALATE ──────────────────────────────────────────────────────────
  // "Alle Salate wahlweise mit Joghurt- oder Balsamico-Dressing."
  { name: 'Ziegenkäse auf Salat', description: 'Gemischter Salat mit Paprika, Tomate, Gurke, Rucola, Ziegenkäse und Walnusskerne.', price: 12.9, category: 'salate', isVegetarian: true, order: 20 },
  { name: 'Hähnchenbrust-Salat', description: 'Gemischter Salat mit Paprika, Tomate, Gurke, Rucola und Hähnchenbrust.', price: 12.9, category: 'salate', order: 21 },
  { name: 'Rinderfilet-Salat', description: 'Gemischter Salat mit Paprika, Tomate, Gurke, Rucola und Rinderfilet.', price: 14.9, category: 'salate', order: 22 },
  { name: 'Salat Tonno', description: 'Gemischter Salat mit Paprika, Tomate, Gurke, Rucola, Thunfisch, Zwiebel und Oliven.', price: 11.9, category: 'salate', order: 23 },
  { name: 'Gambas-Salat', description: 'Gemischter Salat mit Paprika, Tomate, Gurke, Rucola, Gambas und Parmesan.', price: 14.9, category: 'salate', order: 24 },
  { name: 'Brokkoli-Salat mit Ziegenkäse', description: 'Gemischter Salat mit Paprika, Tomate, Gurke, Rucola, Brokkoli, Zwiebeln, Oliven und Ziegenkäse.', price: 12.5, category: 'salate', isVegetarian: true, order: 25 },
  { name: 'Parpali-Salat', description: 'Gemischter Salat mit Schafskäse, Parmesan, Walnüssen, Avocado, Mais, Zwiebeln und Oliven. Wahlweise mit Joghurt- oder Balsamico-Dressing.', price: 17.9, category: 'salate', isVegetarian: true, isSignature: true, order: 26 },

  // ── PASTA ───────────────────────────────────────────────────────────
  // Pasta-Sorten: Spaghetti, Tortiglioni, Grüne Bandnudeln. Tortiglioni mit Käse überbacken: +2,50 € · extra Parmesan: +1,50 €.
  { name: 'Pasta Hähnchenbrust, Zwiebeln und Brokkoli', description: 'Wahlweise mit Sahne- oder Tomatensoße. Sorten: Spaghetti, Tortiglioni oder Grüne Bandnudeln.', price: 11.9, category: 'pasta', order: 30 },
  { name: 'Pasta Rinderfilet, Zwiebeln und Champignons', description: 'Wahlweise mit Sahne- oder Tomatensoße.', price: 13.9, category: 'pasta', order: 31 },
  { name: 'Pasta Brokkoli, Zwiebeln, Champignons und Paprika', description: 'Wahlweise mit Sahne- oder Tomatensoße.', price: 11.9, category: 'pasta', isVegetarian: true, order: 32 },
  { name: 'Pasta Aubergine, Zucchini, Mozzarella und Knoblauch', description: 'Mit Tomatensoße.', price: 13.9, category: 'pasta', isVegetarian: true, order: 33 },
  { name: 'Pasta Bolognese', description: '', price: 8.9, category: 'pasta', isSignature: true, order: 34 },
  { name: 'Pasta Lachs, Zwiebeln, Knoblauch und Tomate', description: 'Mit Sahnesoße.', price: 13.9, category: 'pasta', order: 35 },
  { name: 'Aglio e olio', description: 'Mit Walnüssen, scharfe Paprika, Knoblauch und Olivenöl.', price: 10.9, category: 'pasta', isVegetarian: true, isSpicy: true, order: 36 },
  { name: 'Tortelloni alla Ricotta e Spinaci', description: 'Mit Mozzarella und Tomatensoße. Mit Käse überbacken: +2,50 € · extra Parmesan: +1,50 €.', price: 12.9, category: 'pasta', isVegetarian: true, isSignature: true, order: 37 },

  // ── SCHNITZEL (250g* Rohgewicht) ────────────────────────────────────
  { name: 'Champignonschnitzel', description: 'Mit Bratkartoffeln und Beilagensalat. 250 g* Rohgewicht.', price: 14.9, category: 'schnitzel', order: 45 },
  { name: 'Schnitzel „Wiener Art"', description: 'Mit Pommes frites und Beilagensalat. 250 g* Rohgewicht.', price: 13.9, category: 'schnitzel', isSignature: true, order: 46 },
  { name: 'Überbackenes Schnitzel', description: 'Mit Zwiebeln, Gouda-Käse, Schmand, Pommes frites und Beilagensalat.', price: 16.5, category: 'schnitzel', order: 47 },
  { name: 'Holzfällerschnitzel', description: 'Mit Bratkartoffeln, Spiegelei und Beilagensalat.', price: 16.9, category: 'schnitzel', order: 48 },
  { name: 'Knuspriges Hähnchenschnitzel', description: 'Mit Pommes frites und Beilagensalat.', price: 13.9, category: 'schnitzel', order: 49 },

  // ── OFENKARTOFFELN ──────────────────────────────────────────────────
  // "Alle Ofenkartoffeln mit Crema und Beilagensalat."
  { name: 'Ofenkartoffel Crema', description: 'Mit Crema und Beilagensalat.', price: 9.5, category: 'ofenkartoffeln', isVegetarian: true, order: 50 },
  { name: 'Ofenkartoffel mit Hähnchenbrust', description: 'Mit Crema und Beilagensalat.', price: 12.9, category: 'ofenkartoffeln', order: 51 },
  { name: 'Ofenkartoffel mit Gambas', description: 'Mit Crema und Beilagensalat.', price: 15.9, category: 'ofenkartoffeln', order: 52 },
  { name: 'Ofenkartoffel mit Rinderfilet', description: 'Mit Crema und Beilagensalat.', price: 15.9, category: 'ofenkartoffeln', order: 53 },

  // ── BURGER (200g*) ──────────────────────────────────────────────────
  // "Alle Burger mit Cheddarkäse, Zwiebeln, hausgemachter Sauce und Pommes frites oder Süßkartoffel-Pommes."
  { name: 'Parpali Burger', description: 'Mit Cheddarkäse, Zwiebeln, hausgemachter Sauce und Pommes frites oder Süßkartoffel-Pommes. 200 g* Rohgewicht.', price: 12.5, category: 'burger', isSignature: true, order: 55 },
  { name: 'Parpali Burger Gorgonzola und Jalapeño', description: 'Mit Cheddarkäse, Zwiebeln, hausgemachter Sauce und Pommes frites oder Süßkartoffel-Pommes.', price: 13.9, category: 'burger', isSpicy: true, order: 56 },
  { name: 'Hähnchenburger', description: 'Mit Cheddarkäse, Zwiebeln, hausgemachter Sauce und Pommes frites oder Süßkartoffel-Pommes.', price: 12.5, category: 'burger', order: 57 },
  { name: 'Vegetarischer Burger', description: 'Mit Cheddarkäse, Zwiebeln, hausgemachter Sauce und Pommes frites oder Süßkartoffel-Pommes.', price: 12.5, category: 'burger', isVegetarian: true, order: 58 },

  // ── FISCHGERICHTE ───────────────────────────────────────────────────
  { name: 'Dorade', description: 'Gegrillt mit Beilagensalat, Bratkartoffeln oder Pommes frites.', price: 20.9, category: 'fisch', order: 60 },
  { name: 'Lachsfilet', description: 'In der Pfanne gebraten, mit Beilagensalat, Bratkartoffeln oder Pommes frites.', price: 19.5, category: 'fisch', order: 61 },
  { name: 'Calamari', description: 'In der Pfanne gebraten, mit Beilagensalat, Bratkartoffeln oder Pommes frites.', price: 17.9, category: 'fisch', order: 62 },
  { name: 'Garnelen-Pfanne', description: 'In der Pfanne gebraten, mit Beilagensalat.', price: 17.9, category: 'fisch', order: 63 },
  { name: 'Wolfsbarschfilet', description: 'In der Pfanne gebraten, mit Beilagensalat, Bratkartoffeln oder Pommes frites.', price: 21.9, category: 'fisch', isSignature: true, order: 64 },

  // ── RUMPSTEAK (300g* Rohgewicht, ca. 260 g gebraten) ────────────────
  // "Alle Rumpsteaks mit Beilagensalat und Bratkartoffeln oder Pommes frites. Garstufen: Medium / Medium-well / Well-done."
  { name: 'Rumpsteak mit Kräuterbutter', description: 'Vom argentinischen Black Angus. 300 g* Rohgewicht (ca. 260 g gebraten). Mit Beilagensalat und Bratkartoffeln oder Pommes frites. Garstufen: Medium / Medium-well / Well-done.', price: 22.0, category: 'rumpsteak', isSignature: true, order: 70 },
  { name: 'Rumpsteak mit gebratenen roten Zwiebeln', description: 'Vom argentinischen Black Angus. 300 g* Rohgewicht. Mit Beilagensalat und Bratkartoffeln oder Pommes frites.', price: 24.9, category: 'rumpsteak', order: 71 },
  { name: 'Rumpsteak mit Gorgonzola-Sahnesoße', description: 'Vom argentinischen Black Angus. 300 g* Rohgewicht. Mit Beilagensalat und Bratkartoffeln oder Pommes frites.', price: 24.9, category: 'rumpsteak', order: 72 },
  { name: 'Rumpsteak mit Grüner-Pfeffer-Soße', description: 'Vom argentinischen Black Angus. 300 g* Rohgewicht. Mit Beilagensalat und Bratkartoffeln oder Pommes frites.', price: 24.9, category: 'rumpsteak', order: 73 },
  { name: 'Rumpsteak mit Fungi-Sahnesoße', description: 'Vom argentinischen Black Angus. 300 g* Rohgewicht. Mit Beilagensalat und Bratkartoffeln oder Pommes frites.', price: 24.9, category: 'rumpsteak', order: 74 },

  // ── GRILLGERICHTE (300g* Rohgewicht) ────────────────────────────────
  // "Alle Grillgerichte mit Beilagensalat, Bratkartoffeln oder Pommes frites und Kräuterbutter oder Fungi-Soße."
  { name: 'Lammfilet', description: 'Aus Neuseeland. 300 g* Rohgewicht. Mit Beilagensalat, Bratkartoffeln oder Pommes frites und Kräuterbutter oder Fungi-Soße.', price: 26.9, category: 'grill', isSignature: true, order: 80 },
  { name: 'Rinderfilet', description: 'Aus Argentinien. 300 g* Rohgewicht. Mit Beilagensalat, Bratkartoffeln oder Pommes frites und Kräuterbutter oder Fungi-Soße.', price: 26.9, category: 'grill', order: 81 },
  { name: 'Schweine-Nacken', description: '300 g* Rohgewicht. Mit Beilagensalat, Bratkartoffeln oder Pommes frites und Kräuterbutter oder Fungi-Soße.', price: 19.9, category: 'grill', order: 82 },
  { name: 'Hähnchenbrust-Filet', description: '300 g* Rohgewicht. Mit Beilagensalat, Bratkartoffeln oder Pommes frites und Kräuterbutter oder Fungi-Soße.', price: 17.5, category: 'grill', order: 83 },
  { name: 'Schweinefilet', description: '300 g* Rohgewicht. Mit Beilagensalat, Bratkartoffeln oder Pommes frites und Kräuterbutter oder Fungi-Soße.', price: 20.9, category: 'grill', order: 84 },
  { name: 'Kalbsrücken', description: '300 g* Rohgewicht. Mit Beilagensalat, Bratkartoffeln oder Pommes frites und Kräuterbutter oder Fungi-Soße.', price: 26.9, category: 'grill', order: 85 },
  { name: 'Duroc-Kotelett', description: '300 g* Rohgewicht. Mit Beilagensalat, Bratkartoffeln oder Pommes frites und Kräuterbutter oder Fungi-Soße.', price: 21.9, category: 'grill', order: 86 },
  { name: 'Grillplatte für 1 Person', description: 'Ca. 500 g* Rohgewicht. Mit Beilagensalat, Bratkartoffeln oder Pommes frites und Kräuterbutter oder Fungi-Soße.', price: 47.0, category: 'grill', isSignature: true, order: 87 },

  // ── DOLCI / DESSERT ─────────────────────────────────────────────────
  { name: 'Tiramisu-Becher', description: '', price: 5.5, category: 'dolci', isVegetarian: true, order: 90 },
  { name: 'Brownies mit Eis', description: '', price: 5.5, category: 'dolci', isVegetarian: true, order: 91 },
  { name: 'Affogato al Caffè', description: 'Vanilleeis mit Espresso übergossen.', price: 4.5, category: 'dolci', isVegetarian: true, order: 92 },
  { name: 'Tassendessert', description: 'Diverse Sorten — gemäß tagesaktuellen Ansagen.', price: 5.5, category: 'dolci', isVegetarian: true, order: 93 },

  // ── SOFT DRINKS (Alkoholfreie Getränke) ─────────────────────────────
  { name: 'Cola / Cola Zero / Fanta', description: '0,33 l', price: 2.9, category: 'soft-drinks', order: 10 },
  { name: 'Sprite / Mezzo Mix', description: '0,33 l', price: 2.9, category: 'soft-drinks', order: 20 },
  { name: 'Fassbrause Orange / Zitrone', description: '0,33 l', price: 2.9, category: 'soft-drinks', order: 30 },
  { name: 'Elephant Bay Eistee', description: '0,33 l · Lemon, Granatapfel, Raspberry oder Pfirsich.', price: 3.3, category: 'soft-drinks', order: 40 },
  { name: 'Apfelschorle', description: '0,33 l', price: 3.3, category: 'soft-drinks', order: 50 },
  { name: 'Rhabarberschorle', description: '0,33 l', price: 3.3, category: 'soft-drinks', order: 60 },
  { name: 'Bitterlemon / Ginger Ale', description: '0,2 l', price: 2.7, category: 'soft-drinks', order: 70 },
  { name: 'Orangensaft', description: '0,2 l', price: 2.5, category: 'soft-drinks', order: 80 },
  { name: 'Wasser (Still / Sprudel) 0,25 l', description: '0,25 l', price: 2.4, category: 'soft-drinks', order: 90 },
  { name: 'Wasser (Still / Sprudel) 0,75 l', description: '0,75 l', price: 6.5, category: 'soft-drinks', order: 100 },

  // ── BIER ────────────────────────────────────────────────────────────
  { name: 'Gaffel Kölsch 0,2 l', description: 'Vom Fass · 0,2 l', price: 1.9, category: 'bier', order: 10 },
  { name: 'Gaffel Kölsch 0,3 l', description: 'Vom Fass · 0,3 l', price: 2.5, category: 'bier', order: 20 },
  { name: 'Bitburger 0,3 l', description: 'Vom Fass · 0,3 l', price: 2.6, category: 'bier', order: 30 },
  { name: 'Gaffel Kölsch 0,0 %', description: 'Flasche · 0,33 l · alkoholfrei.', price: 2.6, category: 'bier', order: 40 },
  { name: 'Pils 0,0 %', description: 'Flasche · 0,33 l · alkoholfrei.', price: 2.7, category: 'bier', order: 50 },
  { name: 'Erdinger Weißbier', description: 'Flasche · 0,5 l', price: 4.5, category: 'bier', order: 60 },
  { name: 'Erdinger Weißbier 0,0 %', description: 'Flasche · 0,5 l · alkoholfrei.', price: 4.5, category: 'bier', order: 70 },
  { name: 'Malzbier', description: 'Flasche · 0,33 l', price: 2.7, category: 'bier', order: 80 },

  // ── WEISSWEIN ───────────────────────────────────────────────────────
  // Glas-Preis als price. Flaschen-Preis in description.
  { name: 'Rickes Scheurebe feinherb', description: 'Glas 0,2 l · Flasche 0,75 l 22,00 €.', price: 5.9, category: 'wein-weiss', allergens: ['sulfites'], order: 10 },
  { name: 'Pinot Grigio Trentino DOC', description: 'Glas 0,2 l · Flasche 0,75 l 20,00 €.', price: 5.5, category: 'wein-weiss', allergens: ['sulfites'], order: 20 },
  { name: 'Chardonnay Trentino DOC', description: 'Glas 0,2 l · Flasche 0,75 l 20,00 €.', price: 5.5, category: 'wein-weiss', allergens: ['sulfites'], order: 30 },
  { name: 'Regaleali Bianco, Sicilia IGT', description: 'Glas 0,2 l · Flasche 0,75 l 22,00 €.', price: 5.9, category: 'wein-weiss', allergens: ['sulfites'], order: 40 },
  { name: 'Lugana „Selecione Ore" DOC', description: 'Glas 0,2 l · Flasche 0,75 l 23,50 €.', price: 6.5, category: 'wein-weiss', allergens: ['sulfites'], isSignature: true, order: 50 },

  // ── ROTWEIN ─────────────────────────────────────────────────────────
  { name: 'Rickes Dornfelder Feinherb', description: 'Glas 0,2 l · Flasche 0,75 l 20,00 €.', price: 5.5, category: 'wein-rot', allergens: ['sulfites'], order: 10 },
  { name: 'Merlot Trentino DOC', description: 'Glas 0,2 l · Flasche 0,75 l 20,00 €.', price: 5.5, category: 'wein-rot', allergens: ['sulfites'], order: 20 },
  { name: 'Primitivo di Manduria DOP', description: 'Glas 0,2 l · Flasche 0,75 l 22,00 €.', price: 5.9, category: 'wein-rot', allergens: ['sulfites'], isSignature: true, order: 30 },
  { name: 'Aulo Rosso di Toscana IGT', description: 'Glas 0,2 l · Flasche 0,75 l 23,50 €.', price: 6.5, category: 'wein-rot', allergens: ['sulfites'], order: 40 },

  // ── ROSÉWEIN ────────────────────────────────────────────────────────
  { name: 'Tariquet Rosé de Pressée, IGP Côtes de Gascogne', description: 'Glas 0,2 l · Flasche 0,75 l 18,00 €.', price: 4.9, category: 'wein-rose', allergens: ['sulfites'], order: 10 },
  { name: 'Riviera del Garda Chiaretto Classico DOP – Valtenesi', description: 'Glas 0,2 l · Flasche 0,75 l 22,00 €.', price: 5.9, category: 'wein-rose', allergens: ['sulfites'], order: 20 },

  // ── PROSECCO ────────────────────────────────────────────────────────
  { name: 'Mionetto Prosecco Prestige Extra dry', description: 'Glas 0,1 l · Flasche 0,75 l 24,00 €.', price: 3.5, category: 'prosecco', allergens: ['sulfites'], order: 10 },

  // ── HEISSE GETRÄNKE ─────────────────────────────────────────────────
  { name: 'Espresso', description: '', price: 1.9, category: 'heisse-getraenke', order: 10 },
  { name: 'Doppelter Espresso', description: '', price: 3.6, category: 'heisse-getraenke', order: 20 },
  { name: 'Espresso Macchiato', description: '', price: 2.1, category: 'heisse-getraenke', order: 30 },
  { name: 'Kaffee Crema', description: '', price: 2.2, category: 'heisse-getraenke', order: 40 },
  { name: 'Americano', description: '', price: 2.2, category: 'heisse-getraenke', order: 50 },
  { name: 'Cappuccino', description: '', price: 3.0, category: 'heisse-getraenke', order: 60 },
  { name: 'Milchkaffee', description: '', price: 3.5, category: 'heisse-getraenke', order: 70 },
  { name: 'Latte Macchiato', description: '', price: 3.5, category: 'heisse-getraenke', order: 80 },
  { name: 'Chococino', description: '', price: 3.5, category: 'heisse-getraenke', order: 90 },
  { name: 'Dunkle Schokolade', description: '', price: 3.0, category: 'heisse-getraenke', order: 100 },
  { name: 'Tee (Beutel)', description: 'Verschiedene Sorten.', price: 2.2, category: 'heisse-getraenke', order: 110 },
  { name: 'Hausgemachter Tee', description: '', price: 3.0, category: 'heisse-getraenke', order: 120 },

  // ── SPIRITUOSEN ─────────────────────────────────────────────────────
  { name: 'Molinari Sambuca', description: '2 cl', price: 3.0, category: 'spirituosen', order: 10 },
  { name: 'Ramazzotti', description: '2 cl', price: 3.0, category: 'spirituosen', order: 20 },
  { name: 'Averna', description: '2 cl', price: 3.0, category: 'spirituosen', order: 30 },
  { name: 'Ouzo', description: '2 cl', price: 3.0, category: 'spirituosen', order: 40 },
  { name: 'Tekirdağ Raki Gold 2 cl', description: '2 cl', price: 3.0, category: 'spirituosen', order: 50 },
  { name: 'Tekirdağ Raki Gold 35 cl', description: '35 cl', price: 45.0, category: 'spirituosen', order: 60 },
  { name: 'Tekirdağ Raki Gold 70 cl', description: '70 cl', price: 75.0, category: 'spirituosen', order: 70 },
  { name: 'Chivas Regal 18 years', description: '4 cl', price: 9.5, category: 'spirituosen', order: 80 },
  { name: 'Chivas Regal 12 years', description: '4 cl', price: 6.5, category: 'spirituosen', order: 90 },
  { name: "Jack Daniel's Old No. 7", description: '4 cl', price: 5.5, category: 'spirituosen', order: 100 },
  { name: 'Grappa', description: '2 cl', price: 3.0, category: 'spirituosen', order: 110 },
  { name: 'Birkenhoff-Schnäpse', description: '2 cl · Alte Quetsch, Alte Marille, Alte Williams-Birne, Alte Kirsche, Alte Himbeere oder Haselnuss.', price: 4.5, category: 'spirituosen', order: 120 },

  // ── COCKTAILS & APÉRITIFS ──────────────────────────────────────────
  { name: 'Aperol Spritz', description: '0,2 l', price: 6.5, category: 'cocktails', isSignature: true, order: 10 },
  { name: 'Prosecco (offen)', description: '0,1 l', price: 4.5, category: 'cocktails', order: 20 },
  { name: 'Weinschorle', description: '0,2 l', price: 4.9, category: 'cocktails', order: 30 },
]

const SEED_TESTIMONIAL = {
  quote: 'Eine der ehrlichsten italienischen Küchen Berlins. Pasta wie in Bologna, Service mit Wärme.',
  author: 'Berliner Genießerinnen',
  source: 'press',
  rating: 5,
  featured: true,
}

const PAGE_MENU_DATA = {
  title: 'Speisekarte',
  slug: 'menu',
  layout: [{ blockType: 'page-hero', eyebrow: 'La Carta', titleItalic: 'Speisekarte', title: '', lead: 'Saisonal, regional, handgemacht — italienische Küche mit internationalen Akzenten.' }],
}

const PAGE_UEBER_UNS_DATA = {
  title: 'Über uns',
  slug: 'ueber-uns',
  layout: [
    { blockType: 'page-hero', eyebrow: 'Unsere Geschichte', titleItalic: 'Italienisch', title: 'mit Berliner Wärme.', lead: '' },
    {
      blockType: 'story-text',
      paragraphs: [
        { text: 'Parpali entstand aus einer einfachen Idee — italienische Küche, wie sie zu Hause gekocht wird: ohne Schnörkel, ohne Effekthascherei, mit großer Liebe zu Produkt und Handwerk. Hausgemachte Pasta, ein Holzofen, ein paar Flaschen Wein, die der Chef selbst ausgesucht hat.' },
        { text: 'Wir glauben an saisonale Karten, an ehrliche Preise und daran, dass ein gutes Glas Wein zu jedem Abend gehört. Bei uns kommen viele Speisen direkt aus dem Holzofen — der gibt jeder Pizza ihren typischen, leicht rauchigen Boden.' },
        { text: 'Wir kochen nicht, um etwas zu beweisen — sondern weil wir Lust haben, dass du zufrieden nach Hause gehst und morgen wiederkommst.' },
      ],
    },
    { blockType: 'pull-quote', quote: 'Eine Mahlzeit ist nie nur eine Mahlzeit — es ist ein Stück Zeit, geteilt.', variant: 'elev' },
    {
      blockType: 'team-section',
      eyebrow: 'Das Team',
      heading: 'Hinter den Tellern',
      members: [
        { name: 'Marco', role: 'Küchenchef' },
        { name: 'Giulia', role: 'Service & Wein' },
      ],
    },
    {
      blockType: 'cta-band',
      eyebrow: 'Komm vorbei',
      title: 'Wir freuen uns auf dich.',
      body: 'Manches lässt sich am Tisch besser erzählen als auf einer Webseite.',
      primary: { label: 'Tisch reservieren', href: '/reservierung' },
      secondary: { label: 'Speisekarte ansehen', href: '/menu' },
      variant: 'elev',
    },
  ],
}

const PAGE_KONTAKT_DATA = {
  title: 'Kontakt',
  slug: 'kontakt',
  layout: [{ blockType: 'page-hero', eyebrow: 'Kontakt', titleItalic: 'Sag', title: 'hallo.', lead: '' }],
}

const PAGE_RESERVIERUNG_DATA = {
  title: 'Reservierung',
  slug: 'reservierung',
  layout: [{ blockType: 'page-hero', eyebrow: 'Reservierung', titleItalic: 'Tisch', title: 'reservieren', lead: 'Wähle Datum, Personenzahl und einen freien Zeitslot. Du bekommst direkt im Anschluss eine Bestätigung per E-Mail.' }],
}

const PAGE_IMPRESSUM_DATA = {
  title: 'Impressum',
  slug: 'impressum',
  layout: [{ blockType: 'page-hero', eyebrow: 'Rechtliches', titleItalic: '', title: 'Impressum', lead: '' }],
}

const PAGE_DATENSCHUTZ_DATA = {
  title: 'Datenschutz',
  slug: 'datenschutz',
  layout: [{ blockType: 'page-hero', eyebrow: 'Rechtliches', titleItalic: '', title: 'Datenschutzerklärung', lead: '' }],
}

const HOME_PAGE_DATA = {
  title: 'Home',
  slug: 'home',
  layout: [
    {
      blockType: 'editorial-hero',
      eyebrow: 'Toskana · Berlin',
      brand: 'Parpali',
      tagline: 'Hausgemachte Pasta, Holzofen-Pizza, sorgfältig kuratierte Weinkarte — italienische Küche mit einem Hauch Mittelmeer.',
      imageUrl: '',
      imageAlt: 'Toskanischer Olivenhain mit Zypressen',
      primaryCta: { label: 'Tisch reservieren', href: '/reservierung' },
      secondaryCta: { label: 'Speisekarte', href: '/menu' },
    },
    {
      blockType: 'home-marquee',
      items: [
        { text: 'Parpali' },
        { text: 'Italiano' },
        { text: 'Stagionale' },
        { text: 'Artigianale' },
        { text: 'Toscana' },
      ],
      variant: 'fraunces',
    },
    {
      blockType: 'home-intro',
      quote: 'Buona cucina, buon vino, buoni amici',
      paragraphs: [
        { text: 'Aus der Küche kommt, was die Saison gibt. Wir kochen klassisch italienisch, ohne Schnörkel, mit Zutaten von kleinen Höfen, hausgemachter Pasta und einer Weinkarte, die mit unseren Gerichten gewachsen ist.' },
        { text: 'Komm vorbei — am besten zu zweit, gern auch zu sechst. Die Gespräche am Tisch gehören zur Karte dazu.' },
      ],
    },
    {
      blockType: 'home-signature',
      eyebrow: 'Signature',
      title: 'Was wir besonders gern kochen',
      lead: 'Drei Gerichte, an denen wir hängen — saisonal, ehrlich, aus dem Holzofen, von Hand gerollt.',
    },
    {
      blockType: 'pull-quote',
      quote: 'Saisonal, regional, handgemacht — und für dich gekocht.',
      variant: 'elev',
    },
    {
      blockType: 'faq-editorial',
      items: [
        { q: 'Sind Hunde im Restaurant erlaubt?', a: 'Gut erzogene Hunde sind bei uns herzlich willkommen — Wasserschüssel stellen wir auf Anfrage gern bereit. Bitte gib uns kurz Bescheid, damit wir dir einen passenden Tisch reservieren.' },
        { q: 'Ist das Restaurant barrierefrei?', a: 'Der Gastraum ist ebenerdig zugänglich, eine barrierefreie Toilette ist vorhanden. Wenn du besondere Anforderungen hast, ruf uns gern vorab an — wir richten es ein.' },
        { q: 'Habt ihr vegane oder vegetarische Gerichte?', a: 'Ja — die Karte enthält zahlreiche vegetarische Klassiker, mehrere vegane Pasta- und Antipasti-Optionen, und auf Wunsch passen wir Gerichte für dich an.' },
        { q: 'Gibt es Parkplätze in der Nähe?', a: 'In den umliegenden Straßen findest du gebührenpflichtige Parkplätze. Das nächste Parkhaus ist 4 Gehminuten entfernt. Mit ÖPNV erreichst du uns am bequemsten.' },
        { q: 'Kann ich auch ohne Reservierung kommen?', a: 'Walk-ins versuchen wir immer einzurichten — am Wochenende empfehlen wir aber eine Reservierung, um Wartezeiten zu vermeiden.' },
      ],
    },
    {
      blockType: 'cta-band',
      eyebrow: 'Reservieren',
      title: 'Heute Abend zu uns?',
      body: 'Wir empfehlen frühzeitig zu reservieren — am Wochenende sind wir meist gut besucht.',
      primary: { label: 'Tisch reservieren', href: '/reservierung' },
      secondary: { label: 'Anrufen', href: 'tel:+49301234567' },
      variant: 'inverse',
    },
  ],
}

async function upsertGlobal<T extends Record<string, unknown>>(
  payload: Payload,
  slug: string,
  data: T,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await payload.updateGlobal({ slug: slug as any, data: data as any })
  console.log(`  ✓ Global ${slug}`)
}

async function upsertMenuItem(
  payload: Payload,
  item: typeof SEED_MENU[number],
): Promise<void> {
  const existing = await payload.find({
    collection: 'menu-items',
    where: { name: { equals: item.name } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'menu-items',
      id: existing.docs[0].id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: item as any,
    })
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.create({ collection: 'menu-items', data: item as any })
  }
}

async function upsertTestimonial(
  payload: Payload,
  t: typeof SEED_TESTIMONIAL,
): Promise<void> {
  const existing = await payload.find({
    collection: 'testimonials',
    where: { author: { equals: t.author } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'testimonials',
      id: existing.docs[0].id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: t as any,
    })
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.create({ collection: 'testimonials', data: t as any })
  }
}

async function upsertPage(
  payload: Payload,
  data: { title: string; slug: string; layout: unknown[] },
): Promise<void> {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: data.slug } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'pages',
      id: existing.docs[0].id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
    })
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.create({ collection: 'pages', data: data as any })
  }
  console.log(`  ✓ Page /${data.slug}`)
}

/**
 * Seed the floor plan in two passes: create/update every table first, then
 * resolve `combine` labels to relationship ids. Idempotent — keyed on `label`.
 */
async function seedTables(payload: Payload): Promise<void> {
  const idByLabel = new Map<string, string | number>()

  for (const t of SEED_TABLES) {
    const existing = await payload.find({
      collection: 'tables',
      where: { label: { equals: t.label } },
      limit: 1,
    })
    const data = {
      label: t.label,
      capacity: t.capacity,
      zone: t.zone,
      combinable: t.combinable,
      active: true,
      sortOrder: t.sortOrder,
    }
    if (existing.docs.length > 0) {
      const updated = await payload.update({ collection: 'tables', id: existing.docs[0].id, data })
      idByLabel.set(t.label, updated.id)
    } else {
      const created = await payload.create({ collection: 'tables', data })
      idByLabel.set(t.label, created.id)
    }
    console.log(`  ✓ ${t.label} (${t.capacity}P)`)
  }

  for (const t of SEED_TABLES) {
    if (t.combine.length === 0) continue
    const id = idByLabel.get(t.label)
    const combinesWith = t.combine.map((l) => idByLabel.get(l)).filter((v): v is string | number => v != null)
    if (id != null) {
      await payload.update({ collection: 'tables', id, data: { combinesWith } })
    }
  }
}

async function deleteObsoleteItems(payload: Payload): Promise<void> {
  for (const name of OBSOLETE_ITEM_NAMES) {
    const existing = await payload.find({
      collection: 'menu-items',
      where: { name: { equals: name } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      await payload.delete({ collection: 'menu-items', id: existing.docs[0].id })
      console.log(`  ✗ removed obsolete ${name}`)
    }
  }
}

async function main() {
  const payload = await getPayload({ config })

  console.log('· Globals')
  await upsertGlobal(payload, 'navigation', NAVIGATION_DATA)
  await upsertGlobal(payload, 'footer', FOOTER_DATA)
  await upsertGlobal(payload, 'opening-hours', OPENING_HOURS_DATA)
  await upsertGlobal(payload, 'booking-settings', BOOKING_SETTINGS_DATA)
  await upsertGlobal(payload, 'contact-info', CONTACT_INFO_DATA)

  console.log('· Tische')
  await seedTables(payload)

  console.log('· Cleanup obsolete placeholder items')
  await deleteObsoleteItems(payload)

  console.log('· Speisekarte')
  for (const item of SEED_MENU) {
    await upsertMenuItem(payload, item)
    console.log(`  ✓ ${item.name}`)
  }

  console.log('· Testimonials')
  await upsertTestimonial(payload, SEED_TESTIMONIAL)
  console.log(`  ✓ ${SEED_TESTIMONIAL.author}`)

  console.log('· Pages')
  await upsertPage(payload, HOME_PAGE_DATA)
  await upsertPage(payload, PAGE_MENU_DATA)
  await upsertPage(payload, PAGE_UEBER_UNS_DATA)
  await upsertPage(payload, PAGE_KONTAKT_DATA)
  await upsertPage(payload, PAGE_RESERVIERUNG_DATA)
  await upsertPage(payload, PAGE_IMPRESSUM_DATA)
  await upsertPage(payload, PAGE_DATENSCHUTZ_DATA)

  console.log('\nDone.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
