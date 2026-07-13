export const meta = {
  name: 'garment-audit',
  description: 'Klemeg plagg-audit (Stadium A): 5-punkts kvalitetssjekk per plagg, leser kode read-only, returnerer strukturerte funn',
  phases: [
    { title: 'Audit', detail: 'én agent per plagg — struktur, utseende, seleksjon vs kilder, tekst↔logikk, alternativer' },
  ],
}

// ── Kildefiler (sannhets-kilde = appens egen lib/wool-layers, IKKE npm-pakka) ──
const BASE = 'C:\\Users\\SkotvoldSivertSende\\wool-app'
const FILES = {
  info: `${BASE}\\src\\data\\garment-info.ts`,
  illus: `${BASE}\\src\\data\\garment-illustrations.ts`,
  tables: `${BASE}\\src\\lib\\wool-layers\\tables.ts`,
  modifiers: `${BASE}\\src\\lib\\wool-layers\\modifiers.ts`,
  conflicts: `${BASE}\\src\\lib\\wool-layers\\conflicts.ts`,
  softBlocks: `${BASE}\\src\\lib\\wool-layers\\softBlocks.ts`,
  safety: `${BASE}\\src\\lib\\wool-layers\\safety.ts`,
  alternatives: `${BASE}\\src\\lib\\wool-layers\\alternatives.ts`,
  sources: `${BASE}\\src\\lib\\research\\sources.ts`,
  pngDir: `${BASE}\\public\\illustrations\\garments`,
}

// ── Plagg-universet (60 info-id-er + kanonisk db-streng + kategori) ──
const GARMENTS = [
  // Innerst
  { id: 'kortermet-body', db: 'kortermet body', kat: 'innerst' },
  { id: 'kortermet-ullbody', db: 'kortermet ullbody', kat: 'innerst' },
  { id: 'langermet-body', db: 'langermet body', kat: 'innerst' },
  { id: 'langermet-ullbody', db: 'langermet ullbody', kat: 'innerst' },
  { id: 'langermet-ullbody-tynn', db: 'langermet ullbody tynn', kat: 'innerst' },
  { id: 'ullsett-tynt', db: 'ullsett tynt', kat: 'innerst' },
  { id: 'ullsett-tykt', db: 'ullsett tykt', kat: 'innerst' },
  { id: 'to-ullsett', db: 'to ullsett oppå hverandre', kat: 'innerst' },
  { id: 't-skjorte', db: 't-skjorte', kat: 'innerst' },
  { id: 'shorts', db: 'shorts', kat: 'innerst' },
  { id: 'lett-bukse', db: 'lett bukse', kat: 'innerst' },
  { id: 'bleie', db: 'bleie', kat: 'innerst' },
  { id: 'ullsokker', db: 'ullsokker', kat: 'innerst' },
  // Mellomlag
  { id: 'tynn-bukse', db: 'tynn bukse', kat: 'mellomlag' },
  { id: 'tynn-ull-mellomlag', db: 'tynn ull-mellomlag', kat: 'mellomlag' },
  { id: 'ull-mellomlag', db: 'ull-mellomlag', kat: 'mellomlag' },
  { id: 'ull-mellomlag-tykt', db: 'ull-mellomlag tykt', kat: 'mellomlag' },
  { id: 'ull-jakke', db: 'ull-jakke', kat: 'mellomlag' },
  { id: 'ull-bukse', db: 'ull-bukse', kat: 'mellomlag' },
  { id: 'tynn-pyjamas', db: 'tynn pyjamas', kat: 'mellomlag' },
  { id: 'pyjamas', db: 'pyjamas', kat: 'mellomlag' },
  { id: 'ull-pyjamas', db: 'ull-pyjamas', kat: 'mellomlag' },
  // Yttertøy
  { id: 'lett-kjoredress', db: 'lett kjøredress', kat: 'yttertoy' },
  { id: 'kjoredress', db: 'kjøredress', kat: 'yttertoy' },
  { id: 'vinterkjoredress', db: 'vinterkjøredress', kat: 'yttertoy' },
  { id: 'vinterkjoredress-isolert', db: 'vinterkjøredress isolert', kat: 'yttertoy' },
  { id: 'vinterdress', db: 'vinterdress', kat: 'yttertoy' },
  { id: 'vinterdress-isolert', db: 'vinterdress isolert', kat: 'yttertoy' },
  { id: 'regntoy-skall', db: 'regntøy / skall', kat: 'yttertoy' },
  { id: 'vindtett-skall', db: 'vindtett skall', kat: 'yttertoy' },
  // Ekstra · hodeplagg
  { id: 'solhatt', db: 'solhatt', kat: 'ekstra-hode' },
  { id: 'lue-tynn', db: 'lue tynn', kat: 'ekstra-hode' },
  { id: 'lue', db: 'lue', kat: 'ekstra-hode' },
  { id: 'lue-m-ull', db: 'lue m/ ull', kat: 'ekstra-hode' },
  { id: 'balaklava', db: 'balaklava', kat: 'ekstra-hode' },
  // Ekstra · hender
  { id: 'votter-tynne', db: 'votter tynne', kat: 'ekstra-hender' },
  { id: 'votter', db: 'votter', kat: 'ekstra-hender' },
  { id: 'votter-tykke', db: 'votter tykke', kat: 'ekstra-hender' },
  { id: 'votter-dun', db: 'votter dun', kat: 'ekstra-hender' },
  { id: 'vindvotter-skall', db: 'vindvotter (skall)', kat: 'ekstra-hender' },
  // Ekstra · hals
  { id: 'hals', db: 'hals', kat: 'ekstra-hals' },
  // Ekstra · føtter
  { id: 'sko', db: 'sko', kat: 'ekstra-fotter' },
  { id: 'toffel-sko', db: 'tøffel-sko', kat: 'ekstra-fotter' },
  { id: 'sandaler', db: 'sandaler', kat: 'ekstra-fotter' },
  { id: 'vintersko', db: 'vintersko', kat: 'ekstra-fotter' },
  { id: 'vintersko-isolerte', db: 'vintersko isolerte', kat: 'ekstra-fotter' },
  // Ekstra · vogn-tilbehør
  { id: 'tynt-teppe', db: 'tynt teppe', kat: 'ekstra-vogn' },
  { id: 'dunteppe', db: 'dunteppe', kat: 'ekstra-vogn' },
  { id: 'varmepose-lett', db: 'varmepose lett', kat: 'ekstra-vogn' },
  { id: 'varmepose', db: 'varmepose', kat: 'ekstra-vogn' },
  { id: 'varmepose-dun', db: 'varmepose dun', kat: 'ekstra-vogn' },
  { id: 'sauekinn-i-vogn', db: 'saueskinn i vogn', kat: 'ekstra-vogn' },
  { id: 'regntrekk', db: 'regntrekk', kat: 'ekstra-vogn' },
  { id: 'regnponcho-over-baeresele', db: 'regnponcho over bæresele', kat: 'ekstra-vogn' },
  // Ekstra · søvn
  { id: 'sovepose-0-5-tog', db: 'sovepose 0.5 TOG', kat: 'ekstra-sovn' },
  { id: 'sovepose-1-0-tog', db: 'sovepose 1.0 TOG', kat: 'ekstra-sovn' },
  { id: 'sovepose-2-5-tog', db: 'sovepose 2.5 TOG', kat: 'ekstra-sovn' },
  { id: 'sovepose-3-0-3-5-tog', db: 'sovepose 3.0–3.5 TOG', kat: 'ekstra-sovn' },
  { id: 'sovepose-3-5-tog', db: 'sovepose 3.5 TOG', kat: 'ekstra-sovn' },
  // Ekstra · hud
  { id: 'ansiktskrem', db: 'ansiktskrem', kat: 'ekstra-hud' },
]

// ── Schema for ett plagg-funn ──
const scoreObj = (extra = {}) => ({
  type: 'object',
  additionalProperties: true,
  required: ['score', 'kommentar'],
  properties: { score: { type: 'number' }, kommentar: { type: 'string' }, ...extra },
})

const FINDING = {
  type: 'object',
  additionalProperties: true,
  required: ['id', 'struktur', 'utseende', 'seleksjon', 'tekstLogikk', 'alternativer', 'total', 'verdikt', 'funn'],
  properties: {
    id: { type: 'string' },
    dbString: { type: 'string' },
    kategori: { type: 'string' },
    struktur: scoreObj(),
    utseende: scoreObj({ pngExists: { type: 'boolean' } }),
    seleksjon: scoreObj({ trace: { type: 'string' }, kilder: { type: 'array', items: { type: 'string' } } }),
    tekstLogikk: scoreObj(),
    alternativer: scoreObj(),
    total: { type: 'number' },
    verdikt: { type: 'string' },
    funn: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['severity', 'mal', 'beskrivelse', 'forslag'],
        properties: {
          severity: { type: 'string', enum: ['kritisk', 'hoy', 'medium', 'lav'] },
          mal: { type: 'number' },
          beskrivelse: { type: 'string' },
          forslag: { type: 'string' },
          kilde: { type: 'string' },
        },
      },
    },
  },
}

function promptFor(g) {
  return `Du er kvalitets-auditør for Klemeg, en norsk påkledningsapp for barn 0–3 år.
Du auditerer ÉTT plagg: «${g.db}» (illustrasjons-id \`${g.id}\`, kategori ${g.kat}).

READ-ONLY. Du skal ALDRI redigere noen fil. Kun lese og rapportere.

Les disse filene (bruk Read; Grep for å finne plaggets oppføringer raskt):
- garment-info (what/when + whyForGarment-gren): ${FILES.info}
- illustrasjons-MAP (db-streng → id): ${FILES.illus}
- baseTable + bandForTemp (seleksjon): ${FILES.tables}
- modifiers (vind/regn/alder/sol/fottøy-justering osv.): ${FILES.modifiers}
- conflicts / softBlocks / safety (sikkerhets-lag): ${FILES.conflicts} ; ${FILES.softBlocks} ; ${FILES.safety}
- alternativer: ${FILES.alternatives}
- kilder (11 stk): ${FILES.sources}
Sjekk om PNG finnes: ${FILES.pngDir}\\${g.id}.png (bruk Bash «dir» eller Glob).

Vurder plagget mot 5 mål og gi score + konkret kommentar på HVERT:

1. STRUKTUR (0–20): Har plagget en \`what\` + \`when\` i garment-info.ts? Er den komplett og i samme
   mønster/tone/lengde som søsken-plagg i samme kategori? Finnes en dedikert \`whyForGarment\`-gren
   (ikke fallback)? Hvis plagget mangler info-oppføring → severity hoy.

2. UTSEENDE (0–20): Finnes PNG-fila? Er \`db\`-strengen mappet til riktig id i illustrasjons-MAP?
   Du kan IKKE se bildet — sett pngExists, og kommenter kun navn/mapping-plausibilitet.
   (Selve den visuelle dommen gjøres av Fable 5 + Claude senere.)

3. SELEKSJON vs KILDER (0–25): Spor PRESIST hvor i baseTable plagget velges (hvilke
   aktivitet × temp-bånd) PLUSS modifier-tilsetninger som kan introdusere/fjerne det.
   Skriv tracen i \`seleksjon.trace\`. Vurder så om forholdene er pediatrisk forsvarlige mot de 11
   kildene i sources.ts. Hvis et seleksjons-valg reiser et helse-spørsmål kildene IKKE dekker:
   gjør inntil 2 web-søk (WebSearch) etter pediatrisk/helsefaglig dekning og legg URL-er i
   \`seleksjon.kilder\`. Flagg farlige kontekster (overoppheting/SIDS/kvelning/frost) som kritisk.

4. TEKST ↔ LOGIKK (0–25): Stemmer \`when\`-teksten OG \`whyForGarment\`-grenen med de FAKTISKE
   forholdene fra trace i mål 3? Pek på konkret drift (f.eks. «\`when\` sier 5–12 °C, men baseTable
   velger plagget i kald-båndet 0–4 °C»). Drift som villeder påkledning = severity hoy.

5. ALTERNATIVER (0–10): Finnes et reelt alternativ (ull↔fleece, dun↔syntet, tykkelse-trinn) som
   BURDE tilbys i alternatives.ts men ikke gjør det? Eller er eksisterende alternativ riktig?

VIKTIG: Rør ALDRI tall/terskler. Medisinske avvik = funn med \`forslag\` + \`kilde\`, aldri endring.

Returner ETT objekt som matcher schema. \`total\` = sum av de 5 score-ene (maks 100).
\`funn\` = liste over konkrete problemer (tom liste hvis alt er bra). Sett \`id\`=\`${g.id}\`,
\`dbString\`=\`${g.db}\`, \`kategori\`=\`${g.kat}\`.`
}

phase('Audit')
log(`Auditerer ${GARMENTS.length} plagg (5 mål hver, read-only)…`)

const results = await parallel(
  GARMENTS.map((g) => () => agent(promptFor(g), { label: `audit:${g.id}`, phase: 'Audit', schema: FINDING })),
)

const ok = results.filter(Boolean)
log(`Ferdig: ${ok.length}/${GARMENTS.length} plagg auditert.`)
return { count: ok.length, expected: GARMENTS.length, findings: ok }
