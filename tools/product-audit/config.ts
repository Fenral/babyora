import type { AuditDimension, PageDefinition } from './types';

export const RUBRIC_VERSION = '1.0.0';
export const VIEWPORT = { width: 390, height: 844 } as const;

export const RUBRIC: ReadonlyArray<AuditDimension> = [
  { id: 'taskClarity', label: 'Oppgaveforståelse og hierarki', weight: 20, question: 'Forstår forelderen umiddelbart hva siden svarer på og hva som er viktigst?' },
  { id: 'navigationInteraction', label: 'Navigasjon og interaksjon', weight: 15, question: 'Er hovedoppgaven rask, forutsigbar og komfortabel med én hånd?' },
  { id: 'visualCraft', label: 'Visuell kvalitet og konsistens', weight: 15, question: 'Føles siden gjennomarbeidet, sammenhengende og tydelig Babyora?' },
  { id: 'colorTemperature', label: 'Farge og temperaturuttrykk', weight: 10, question: 'Har fargene tydelige roller, god kontrast og nyttig temperaturrespons?' },
  { id: 'copyTrust', label: 'Tekst, tillit og troverdighet', weight: 15, question: 'Er språket tydelig, rolig, sannferdig og internt konsistent?' },
  { id: 'productValue', label: 'Produktverdi og kjøpsbidrag', weight: 20, question: 'Beviser siden gratisverdi, retention eller en troverdig Plus-verdi?' },
  { id: 'accessibilityRobustness', label: 'Tilgjengelighet og robusthet', weight: 5, question: 'Håndteres touch, kontrast, dynamisk tekst, bevegelse og feiltilstander?' },
] as const;

const wait = { type: 'wait', milliseconds: 700 } as const;
/**
 * Seremonien etter «Finn dagens antrekk» tar 3,2 s (FULL_SCAN_DURATION_MS).
 * MÅLT 2026-08-05: to av tre falne ruter falt her — de ventet 700 ms og lette
 * så etter en knapp som ennå ikke fantes. Feilen så ut som en manglende
 * knapp; den var en for utålmodig klokke.
 */
const ventScan = { type: 'wait', milliseconds: 3900 } as const;
/**
 * Etter en `reload` starter appen på nytt UTEN fangstens egen 1200 ms
 * oppstartspause (den kjøres bare før handlingslisten). Vi gir den samme
 * pusterom her, slik at boot + rehydrering + første render er unnagjort før
 * expectedText-vakten begynner å telle.
 */
const ventOppstart = { type: 'wait', milliseconds: 1200 } as const;
const tab = (name: string) => ({ type: 'tab', name } as const);
const text = (pattern: string) => ({ type: 'text', pattern } as const);
const button = (pattern: string) => ({ type: 'button', pattern } as const);

/* ═══ HVER FANGST MÅ BEVISE AT DEN FANGET RIKTIG SKJERM ═══════════════════

   FUNN 2026-08-06: revisjonen meldte 11/11 fangster mens minst én av dem
   var feil skjerm. «Betalingsvegg» navigerte til Innstillinger, trykket på
   Pluss-kortet — og landet på abonnementsadministrasjon, fordi fiksturet
   har Pluss AKTIV. Det finnes ingen betalingsmur å vise for en som
   allerede betaler. Knappen fantes, klikket lyktes, skjermbildet ble tatt,
   og revisjonen rapporterte grønt på en skjerm den aldri nådde.

   clickFirst kunne ikke fange det: den melder når et mål ikke FINNES, ikke
   når et mål finnes og fører et annet sted.

   Mekanismen for å oppdage dette har ligget her hele tiden — capture.ts
   venter på expectedText før den skyter. Den var brukt på ÉN av elleve
   oppføringer. Nå er feltet påkrevd i CaptureState, så en ny skjerm ikke
   kan legges til uten å si hva som beviser at den er seg selv.

   Teksten skal være noe MÅLSKJERMEN har og de andre ikke har. Er den lik
   ordet man klikket på for å komme dit, beviser den lite — da kan en
   mislykket navigering matche på kilden i stedet for målet.
   ══════════════════════════════════════════════════════════════════════ */
export const PAGE_CATALOG: ReadonlyArray<PageDefinition> = [
  {
    id: 'onboarding', label: 'Onboarding', appWeight: 10,
    role: 'Føre en ny forelder til første ekte antrekksverdi før betaling eller tillatelser.',
    states: [{ id: 'start', label: 'Første steg', required: true, actions: [{ type: 'clear-storage' }, { type: 'reload' }, wait], expectedText: 'Navn eller kallenavn' }],
  },
  {
    id: 'home', label: 'Hjem', appWeight: 15,
    role: 'Bevise løftet om en komplett anbefaling for i dag hjemme.',
    states: [{ id: 'default', label: 'Standard anbefaling', required: true, actions: [tab('Hjem'), wait], expectedText: 'Finn dagens antrekk' }],
  },
  {
    id: 'outfit', label: 'Påkledning', appWeight: 12,
    role: 'Gjøre Babyoras kjerneanbefaling presis, forståelig og tillitsvekkende.',
    /* RETTET 2026-08-05. Lette etter «Se dagens antrekk|Se påkledning|
       Påkledning» — ingen av dem finnes. Knappen på Hjem heter «Kle på,
       steg for steg», og fra fase 4 fører den til Kle på-stepperen, ikke
       til den gamle listeflaten. Det ER kjerneanbefalingens flate nå, så
       revisjonen skal måle den. */
    states: [{
      id: 'recommendation', label: 'Antrekket, steg for steg', required: true,
      actions: [tab('Hjem'), wait, button('Finn dagens antrekk'), ventScan, button('Kle på, steg for steg'), wait],
      expectedText: 'Hvorfor akkurat dette',
    }],
  },
  {
    id: 'find-outfit', label: 'Juster', appWeight: 6,
    role: 'Bevise at antrekket kan justeres manuelt fra dagens vær og aktivitet uten å forlate den fasit-baserte anbefalingen.',
    states: [{
      id: 'default', label: 'Juster-drillen (sliders prefylt fra Hjems resultat)', required: true,
      actions: [tab('Hjem'), wait, button('Finn dagens antrekk'), ventScan, button('Juster'), wait],
      expectedText: 'Juster',
    }],
  },
  {
    id: 'plan', label: 'Uke / Planlegg', appWeight: 10,
    role: 'Gjøre Plus-verdien fremover konkret uten å svekke dagens gratisverdi.',
    states: [{ id: 'default', label: 'Dags- og ukeplan', required: true, actions: [tab('Uke|Plan'), wait], expectedText: 'Snart' }],
  },
  // P1 (nav 4→3 skeleton, 2026-07-30): Guide-tab-roten er fjernet (se
  // src/types/nav.ts). Guide-huben selv (id 'guide') hadde ingen egen
  // destinasjon utenom seg selv, så den er fjernet uten erstatning.
  // find-outfit/clothing-library/wardrobe var KUN nåbare via Guide-huben og
  // hadde ingen synlig opener etter fjerningen — FinnAntrekkScreen og
  // PlaggbibliotekScreen ble wired som drills i App.tsx, men uten en CTA som
  // åpnet dem (se App.tsx sin Drill-union-kommentar). MinGarderobeScreen var
  // allerede utilgjengelig fra Guide-huben før denne endringen, og forblir
  // det (ikke en del av dette katalog-oppryddet — se PRODUCT.md).
  //
  // P5 (2026-07-31): FinnAntrekkScreen fikk sin CTA — WeatherStrip sin
  // "Juster"-knapp + vær-panelets sted-pille på Hjems resultat (App.tsx sin
  // onOpenAdjust) — så 'find-outfit' er gjeninnført over, med sin historiske
  // appWeight (6, hentet tilbake fra 'settings' under: 24 → 18).
  //
  // P6 (2026-07-31): PlaggbibliotekScreen fikk sin CTA — PlaggDetailSheet sin
  // "Se alternativer i biblioteket" (App.tsx sin onOpenPlaggbib), åpnet fra
  // Hjems Monter-resultat via garment-raden "Bytt" (PRODUCT.md: "Plaggbibliotek
  // is reached from garment rows"). 'clothing-library' gjeninnføres under med
  // appWeight 4 (hentet fra 'settings': 18 → 14). wardrobe (MinGarderobeScreen)
  // fikk ingen opener i denne pakken og forblir utenfor katalogen.
  {
    id: 'clothing-library', label: 'Plaggbibliotek', appWeight: 4,
    role: 'Vise plagg som informativ referanse når «Bytt» eller plagg-detaljen ikke dekker det brukeren leter etter.',
    states: [{
      id: 'default', label: 'Biblioteket via garment-radens Bytt → Se alternativer i biblioteket', required: true,
      /* RETTET 2026-08-05: ventet 700 ms på et resultat som tar 3,2 s, OG
         lette etter en knapp merket «Bytt». Raden het «Bytt» én gang, men
         ble døpt om (se MonterGarmentRow-hodet, P10.1) — den tilgjengelige
         etiketten er nå «<plagg>, <rolle>. Detaljer.». Vi treffer den på
         «Detaljer», som er den delen som ikke varierer med plagget. */
      actions: [tab('Hjem'), wait, button('Finn dagens antrekk'), ventScan, button('Detaljer'), wait, button('Se alternativer i biblioteket'), wait],
      expectedText: 'Plaggbibliotek',
    }],
  },
  {
    id: 'tog', label: 'TOG', appWeight: 5,
    role: 'Gi forsiktig og forståelig søvnveiledning uten å blande TOG inn i utendørspåkledning.',
    states: [{ id: 'default', label: 'TOG-veileder', required: true, actions: [tab('Familie'), button('Soveguiden'), wait], expectedText: 'Soving innendørs' }],
  },
  {
    id: 'warm-cold', label: 'Varm eller kald', appWeight: 5,
    role: 'Lære forelderen en enkel kontroll som øker trygghet og kan gi personlig tilpasning.',
    states: [{ id: 'default', label: 'Nakkesjekk', required: true, actions: [tab('Familie'), text('Varm eller kald'), wait], expectedText: 'Nakken' }],
  },
  {
    id: 'first-winter', label: 'Første vinter', appWeight: 5,
    role: 'Bygge tillit og sesongverdi uten å gjøre tekstinnhold til hele Plus-produktet.',
    states: [{ id: 'overview', label: 'Programoversikt', required: true, actions: [tab('Familie'), text('Første vinter'), wait], expectedText: 'Første vinter' }],
  },
  {
    id: 'settings', label: 'Innstillinger', appWeight: 14,
    role: 'Gjøre barn, sted, varsler, verktøy, personvern og abonnement forståelig og kontrollerbart.',
    states: [{ id: 'default', label: 'Innstillingsoversikt', required: true, actions: [tab('Familie|Innst'), wait], expectedText: 'Innstillinger' }],
  },
  {
    id: 'paywall', label: 'Betalingsvegg', appWeight: 14,
    role: 'Selge fremover, overalt og familie gjennom konkrete utfall, tydelig pris og lav opplevd risiko.',
    /* ═══ DEN ENESTE SKJERMEN AV ELLEVE SOM ALDRI BLE REVIDERT ════════════

       FUNN 2026-08-06: 10 av 11 fangster. Feilen lå ikke i navigasjonen.
       `?seed=demo` seeder som DEFAULT en mock-ABONNENT
       (src/state/subscription-store.ts:56-61 — resolveDemoEntitlementOverride
       returnerer true så snart `seed` finnes). En som allerede betaler har
       ingen betalingsmur å vise: trykket på Pluss-kortet gikk til
       plattformens abonnementsadministrasjon
       (src/screens/InnstillingerScreen.tsx:1561-1573), og «Best verdi»
       fantes ikke på skjermen fangsten sto igjen på.

       Produktet hadde veien inn hele tiden: `?seed=demo&entitlement=none`
       er et dokumentert test-håndtak (subscription-store.ts:38-61), allerede
       i bruk av e2e/purchase-flow.ts:191. Revisjonen trengte derfor ikke å
       skrive i produktets tilstand — den trengte å BE OM den tilstanden
       produktet selv tilbyr. Det er grunnen til `query` og ikke en ny
       action-type som planter localStorage: capture.ts er lese-only mot
       produktet (assertReadOnlyAction / assertReadOnlyQuery).

       VI FANGER MUREN, IKKE TILBUDS-DIALOGEN. En ikke-betalende forelder
       møter AppPaywallGate: ikke-avviselig, uten «Lukk»-knapp
       (src/components/AppPaywallGate.tsx:113-121). Den samme PaywallDialog
       åpnet fra Innstillinger bærer en lukke-affordanse hun aldri får se — og
       «lav opplevd risiko» er nettopp det rubrikken måler her. Å revidere
       tilbudsvarianten ville vært samme feilklasse som å revidere dev-bygget:
       ikke et svakere bevis, et bevis for en annen app.

       MUREN ER ARMERT AV TRE TING (AppPaywallGate.tsx:76-85):
         1. onboarding fullført — `seed=demo` gir barn,
         2. første anbefaling sett — settes av HjemScreen.tsx:490-493 når
            anbefalingen faktisk finnes, derfor scan-seremonien under,
         3. «les ferdig»-vinduet lukket — det står åpent HELE den økten som
            satte (2), og lukkes ved neste økt (subscription-store.ts:95-97
            leser localStorage FØR storen opprettes). En `reload` ER en ny
            økt: fersk modul-boot, samme lager, samme URL. Det er nøyaktig
            det e2e/purchase-flow.ts:202 gjør for å nå den samme muren.
       ═══════════════════════════════════════════════════════════════════ */
    states: [{
      id: 'default', label: 'Muren en ikke-betalende forelder faktisk møter',
      required: true,
      query: { entitlement: 'none' },
      actions: [
        tab('Hjem'), wait,
        button('Finn dagens antrekk'), ventScan,
        { type: 'reload' }, ventOppstart,
      ],
      expectedText: 'Best verdi',
    }],
  },
] as const;

export const PAGE_BY_ID = new Map(PAGE_CATALOG.map((page) => [page.id, page]));
