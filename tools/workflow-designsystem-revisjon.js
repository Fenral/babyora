export const meta = {
  name: 'babyora-designsystem-revisjon',
  description: 'Reviderer hver skjerm mot designsystemet og estimerer hva som gjenstar til lansering',
  phases: [
    { title: 'Kontrakt', detail: 'les designsystemet en gang og destiller den bindende sjekklisten' },
    { title: 'Revisjon', detail: 'en revisor per skjerm, malt mot sjekklisten' },
    { title: 'Etterprov', detail: 'adversariell kontroll av hvert funn - kan det felles?' },
    { title: 'Syntese', detail: 'atomic liste + prosentestimat per skjerm' },
  ],
}

const ROT = 'c:/Users/siver/Downloads/trainer-marketplace-master1/babyora'

const KONTRAKT_SCHEMA = {
  type: 'object',
  required: ['regler', 'tokenNavn'],
  properties: {
    regler: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'regel', 'hvordanMales'],
        properties: {
          id: { type: 'string' },
          regel: { type: 'string' },
          hvordanMales: { type: 'string', description: 'konkret grep/mal som avgjor bestatt eller strykt' },
        },
      },
    },
    tokenNavn: { type: 'array', items: { type: 'string' } },
  },
}

const FUNN_SCHEMA = {
  type: 'object',
  required: ['skjerm', 'linjerKode', 'funn', 'ferdigProsent', 'begrunnelseProsent'],
  properties: {
    skjerm: { type: 'string' },
    linjerKode: { type: 'number' },
    ferdigProsent: { type: 'number', description: '0-100: hvor nær lanseringsklar mot designsystemet' },
    begrunnelseProsent: { type: 'string', description: 'hva som mangler, konkret - ikke en folelse' },
    funn: {
      type: 'array',
      items: {
        type: 'object',
        required: ['regelId', 'fil', 'linje', 'pastand', 'bevis', 'retting', 'alvor'],
        properties: {
          regelId: { type: 'string' },
          fil: { type: 'string' },
          linje: { type: 'number' },
          pastand: { type: 'string' },
          bevis: { type: 'string', description: 'sitert kode eller malt verdi - ikke inntrykk' },
          retting: { type: 'string' },
          alvor: { type: 'string', enum: ['blokkerer-lansering', 'bor-rettes', 'kosmetisk'] },
        },
      },
    },
  },
}

const DOM_SCHEMA = {
  type: 'object',
  required: ['holder', 'begrunnelse'],
  properties: {
    holder: { type: 'boolean' },
    begrunnelse: { type: 'string' },
    justertAlvor: { type: 'string', enum: ['blokkerer-lansering', 'bor-rettes', 'kosmetisk'] },
  },
}

// ── Fase 1: destiller kontrakten EN gang, sa alle revisorer maler mot det samme.
phase('Kontrakt')
const kontrakt = await agent(
  `Du leser Babyoras designsystem og destillerer den BINDENDE sjekklisten som hver skjerm skal males mot.

Repo: ${ROT}

Les i sin helhet:
- DESIGN.md
- PRODUCT.md (register, tone, anti-referanser)
- src/styles/design-tokens-v2.css (hele filen - tokens OG kommentarene, som inneholder portdommer)
- docs/design-notes/art-bible-2026-08-02.md
- docs/design-notes/laerdom-hjem-2026-08-03.md
- src/components/hjem/hjem-monter.css (referanse-implementasjonen - Hjem er skjermen som er kalibrert)
- src/styles/__tests__/ (testene som ALLEREDE handhever noe - de forteller hva som er lov)

Destiller reglene som faktisk er MALBARE pa en vilkarlig skjerm. Eksempler pa hva jeg mener:
- «box-shadow skal komme fra var(--dw-depth-*), aldri en egen stabel» - males med grep etter box-shadow uten var(--dw-depth-
- «ingen hardkodet hex utenfor dokumenterte unntak»
- «tekst pa petrol-panelet bruker panel-tekstrampen, aldri --dw-ink-*»
- «bevegelse bruker var(--dw-m-*) og var(--dw-ease), aldri hardkodede ms»
- «fokusring finnes og bruker riktig --dw-focus for underlaget»

For HVER regel: gi en id, regelen i en setning, og HVORDAN den males konkret (hvilket grep, hvilken terskel).
Ta bare med regler som er FASTSATT i dokumentene. Ikke finn pa regler du synes er fornuftige.
Ta ogsa med tokenNavn: listen over --dw-* tokens som finnes, sa revisorene kan skille ekte tokens fra oppfunne.`,
  { schema: KONTRAKT_SCHEMA, label: 'destiller-kontrakten', phase: 'Kontrakt' },
)

const regeltekst = kontrakt.regler.map((r) => `[${r.id}] ${r.regel}\n     males slik: ${r.hvordanMales}`).join('\n')
log(`Kontrakten: ${kontrakt.regler.length} malbare regler, ${kontrakt.tokenNavn.length} tokens`)

// ── Fase 2+3: en revisor per skjerm, og hvert funn etterprovd sa snart skjermen er ferdig.
// Pipeline, ikke barriere: skjerm B etterproves mens skjerm C fortsatt revideres.
const SKJERMER = [
  { fil: 'src/screens/PaakledningScreen.tsx', navn: 'Paakledning (resultatet - produktets kjerne)' },
  { fil: 'src/screens/UkeScreen.tsx', navn: 'Planlegg/Uke', css: 'src/screens/UkeScreen.css' },
  { fil: 'src/screens/FinnAntrekkScreen.tsx', navn: 'Finn antrekk / Juster' },
  { fil: 'src/screens/FamilieScreen.tsx', navn: 'Familie' },
  { fil: 'src/screens/OnboardingScreen.tsx', navn: 'Onboarding (forsteinntrykket)' },
  { fil: 'src/screens/PlaggbibliotekScreen.tsx', navn: 'Plaggbibliotek' },
  { fil: 'src/screens/MinGarderobeScreen.tsx', navn: 'Min garderobe' },
  { fil: 'src/screens/InnstillingerScreen.tsx', navn: 'Innstillinger' },
  { fil: 'src/screens/VarmEllerKaldScreen.tsx', navn: 'Varm eller kald (guide)' },
  { fil: 'src/screens/TogGuideScreen.tsx', navn: 'Tog-guide' },
  { fil: 'src/screens/VinterprogramScreen.tsx', navn: 'Vinterprogram' },
]

const resultater = await pipeline(
  SKJERMER,
  (s) => agent(
    `Du reviderer EN skjerm i Babyora mot designsystemets bindende sjekkliste.

Repo: ${ROT}
Skjerm: ${s.navn}
Hovedfil: ${s.fil}${s.css ? `\nCSS: ${s.css}` : ''}

DEN BINDENDE SJEKKLISTEN (destillert fra DESIGN.md, art bible og token-filen):
${regeltekst}

Kjente --dw-tokens: ${kontrakt.tokenNavn.join(', ')}

REFERANSE: src/components/hjem/hjem-monter.css og src/components/hjem/WeatherScene.tsx er
skjermen som ER kalibrert mot systemet. Bruk den som fasit pa hvordan en regel oppfylles.
Ikke kopier Hjems layout - bare dens forhold til systemet.

ARBEIDSMATE:
1. Les skjermens fil(er) og all CSS den drar inn.
2. Ga gjennom sjekklisten regel for regel med faktiske grep. Ikke gjett.
3. For HVERT funn: siter den konkrete linjen som bevis. Et funn uten sitert kode teller ikke.
4. Ikke rapporter noe Hjem-referansen selv gjor - da er det systemets valg, ikke skjermens feil.
5. Ikke rapporter noe som ligger i src/lib/wool-layers, clothing-engine-v2, met-no, planning,
   recommendation eller outfit (unntatt visningskomponenter) - motoren er utenfor mandatet.

ferdigProsent: 0-100, hvor nær skjermen er lanseringsklar MOT DESIGNSYSTEMET (ikke funksjonelt).
Regn den ut fra antall regler bestatt vektet med alvor, og forklar regnestykket i
begrunnelseProsent. Et tall uten regnestykke er verdilost.

Vaer villig til a si at en skjerm er i god stand. Ikke let etter feil som ikke finnes.`,
    { schema: FUNN_SCHEMA, label: `revider:${s.navn.split(' ')[0]}`, phase: 'Revisjon' },
  ),
  (rev, s) => {
    if (!rev || !rev.funn?.length) return rev
    // Etterprov bare det som pastar a blokkere lansering - resten er billig a rette uansett.
    const tunge = rev.funn.filter((f) => f.alvor === 'blokkerer-lansering').slice(0, 6)
    if (!tunge.length) return rev
    return parallel(tunge.map((f) => () =>
      agent(
        `Du skal FORSOKE A FELLE en pastand om Babyoras kodebase. Standardsvaret er «holder ikke».

Repo: ${ROT}
Skjerm: ${s.navn}

PASTAND: ${f.pastand}
FIL: ${f.fil} linje ${f.linje}
PASTATT BEVIS: ${f.bevis}
REGEL DEN SKAL BRYTE: [${f.regelId}]
PASTATT ALVOR: blokkerer-lansering

Apne filen og les den faktiske linjen. Sjekk sarskilt:
- Star koden fortsatt slik pastanden sier, eller er den sitert feil eller ut av kontekst?
- Finnes det en dokumentert unntaksregel i DESIGN.md, art bible eller en kommentar i filen
  som gjor dette LOVLIG? (f.eks. tema-konstante flater, vitrine-behandling, instrument-tekst)
- Handterer koden det allerede et annet sted (en media query lenger nede, et token som
  flipper, en variant-selektor)?
- Er «blokkerer-lansering» riktig alvor, eller er dette kosmetisk?

holder=true KUN hvis du selv verifiserte linjen og ikke fant noe unntak. Er du i tvil: false.
Sett justertAlvor hvis funnet er ekte men mindre alvorlig enn pastatt.`,
        { schema: DOM_SCHEMA, label: `etterprov:${f.regelId}`, phase: 'Etterprov' },
      ).then((d) => ({ ...f, dom: d })),
    )).then((domte) => ({
      ...rev,
      funn: [
        ...rev.funn.filter((f) => f.alvor !== 'blokkerer-lansering'),
        ...domte.filter(Boolean).filter((f) => f.dom?.holder)
          .map((f) => ({ ...f, alvor: f.dom.justertAlvor ?? f.alvor })),
      ],
      feltAvEtterprov: domte.filter(Boolean).filter((f) => !f.dom?.holder).length,
    }))
  },
)

const gyldige = resultater.filter(Boolean)
log(`${gyldige.length} av ${SKJERMER.length} skjermer revidert`)

// ── Fase 4: syntese til den atomic listen eieren ba om.
phase('Syntese')
const syntese = await agent(
  `Du skriver den endelige leveransen til Babyoras eier. Han spurte om en ATOMIC LISTE og et
PROSENTESTIMAT for hva som gjenstar for appen er lanseringsklar mot designsystemet.

Han har nettopp sagt at han opplever at det brukes for mye tid pa detaljer, sa leveransen
skal vaere kort, konkret og prioritert. Ingen omsvop.

REVISJONSDATA (JSON, ett objekt per skjerm, funn som pastar a blokkere er allerede
adversarielt etterprovd og de som ikke holdt er fjernet):
${JSON.stringify(gyldige, null, 1)}

SJEKKLISTEN de ble malt mot:
${regeltekst}

KJENT FRA FOR (ikke oppdag pa nytt, men ta med i regnestykket):
- Hjem er ferdig kalibrert og har 9 atferdsporter i CI. Regnes som referanse.
- Apen defekt pa Hjem: CTA ligger -48 px under fold pa iPhone SE 375x667.
- Apen defekt: --dw-depth-action gir i MORK modus en skygge som er 3,3x LYSERE enn
  lerretet - altsa en glod, ikke dybde. Gjelder CTA-en pa alle skjermer.
- Apen defekt: --dw-lys-vinkel/--dw-kant-key/--dw-kant-fill fra portdom 27 har null
  forbrukere; panelets kantlys er symmetrisk og sterkest pa MIDTEN, ikke der lyset treffer.
- Apen defekt: en dod knapp «Vis forrige antrekk» med tom onClick pa Hjems feilskjerm.
- Sydvesten (plagg-sydvest.png) mangler manuell maske.

SKRIV I MARKDOWN, pa norsk:

1. **Ett tall forst**: samlet prosent lanseringsklar mot designsystemet, med regnestykket
   pa en linje (vektet etter skjermenes vekt i produktet, ikke rett gjennomsnitt - Paakledning
   og Onboarding veier tyngre enn Vinterprogram).

2. **Tabell per skjerm**: skjerm | prosent | det ENE som mangler mest. Sortert stigende
   pa prosent, sa det verste star overst.

3. **Atomic liste**: hver oppgave pa en linje, formatert slik at den kan hukes av.
   Grupper i BLOKKERER LANSERING / BOR RETTES / KOSMETISK. Hver linje ma ha fil og
   linjenummer. Sla sammen identiske funn som gar igjen pa flere skjermer til EN linje
   som lister skjermene - det er de som er billigst a rette og de sier mest om systemet.

4. **Monstre**: 3-5 setninger om hva funnene sier om systemet som helhet. Hvilke feil
   gar igjen pa mange skjermer? Det er de som bor rettes i tokens/felles CSS i stedet for
   per skjerm, og det er svaret pa eierens sporsmal om det tar like lang tid per side.

5. **Rekkefolge**: de neste fem tingene, i den rekkefolgen de bor gjores, med en setnings
   begrunnelse hver. Ikke flere enn fem.

Vaer ærlig hvis noe star bedre enn ventet. Ikke oppblas listen for a virke grundig.`,
  { label: 'syntese', phase: 'Syntese' },
)

return { syntese, skjermer: gyldige.length, regler: kontrakt.regler.length }
