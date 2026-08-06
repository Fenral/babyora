/**
 * P3 AMBIENT BRIEFING — eksperimentmanifest (spec v2 §3-malen).
 *
 * Beslutningssløyfen (spec §3, P3): brief V1 lest → handling → V2
 * ankommer → brukeren oppdager endringen → utløp/maskering lest som
 * trygg degradering (ikke som feil) → fallback.
 *
 * Tekstdoktrine: hele manifestet er underlagt FORBUDTE_MONSTRE fra
 * felles/tekst og retningens egen regel om at kvittering heter «Åpnet».
 */

export type P3Manifest = {
  id: 'p3';
  navn: string;
  hypotese: string;
  isolertVariabel: string;
  beslutningssloyfe: string;
  oppgaver: string[];
  /** Entydig scoringsfasit per scenario-id (alle ti). */
  scoringsfasit: Record<string, string>;
  /** Nulltoleranse — én observasjon er nok til å utløse stoppregelen. */
  farligeFeil: string[];
  stoppregel: string;
  /** Events prototypen sender via props.logg?.(event, data). */
  loggedeEvents: string[];
  /** Hva prototypen uttrykkelig IKKE kan støtte (webbevis er sperret). */
  ikkeStottet: string[];
  /** Dokumenterte forenklinger/antagelser i lab-bygget. */
  antagelser: string[];
  rekkefolgeOgCarryover: string;
};

export const manifest: P3Manifest = {
  id: 'p3',
  navn: 'P3 — Ambient Briefing (tidslinjen)',

  hypotese:
    'Et versjonert, utløpende delta-utsagn levert på en distribuert flate ' +
    'er en tilstrekkelig og trygg daglig beslutningsenhet uten app-åpning — ' +
    'og den maskerte utløpt-tilstanden leses som trygg degradering, ikke som feil.',

  isolertVariabel:
    'Leveringsformen: samme nøytrale fakta presentert som selv-degraderende, ' +
    'versjonert brief på en simulert widget-flate, drevet av virtuell klokke ' +
    '(mot P1/P2 sine app-flater). Motor, scenarier og sikkerhetssemantikk er identiske.',

  beslutningssloyfe:
    'V1 lest → handling oppgitt → V2 ankommer (erstatter V1) → endringen ' +
    'oppdaget → forsinket V1 forkastes synlig → utløp → maskert tilstand lest ' +
    'som «må beregnes på nytt» → konservativ fallback fulgt → app-fallback ' +
    'viser full liste med samme versjonsstempel → kvittering «Åpnet».',

  oppgaver: [
    'Les gjeldende brief på widgeten og oppgi neste handling uten å åpne appen.',
    'Oppdag at V2 har erstattet V1 og oppgi hva som er endret (versjonsoppdagelse).',
    'Forklar hva den maskerte utløpt-tilstanden betyr og hva du gjør nå.',
    'Åpne app-fallbacken, finn full plaggliste og bekreft at versjonsstempelet er det samme som på widgeten.',
    'Kvitter mottak med «Åpnet»-knappen.',
  ],

  scoringsfasit: {
    'normal-dag':
      'Oppgir handlingen fra gjeldende brief (V2 etter oppdatering) og gyldig-til 12:00. ' +
      'Etter utløp: kun fallback-regelen (kle etter årstid, kjenn på nakken) — aldri innhold fra maskert brief.',
    grensevaer:
      'Oppgir tett ytterlag mot sludd fra gjeldende brief og gjengir nakkekontrollen. ' +
      'Etter utløp: kun fallback-regelen.',
    'sovende-vognbarn':
      'Oppgir soveposebasert antrekk fra briefen og kontrollpunktet (kjenn på nakken). ' +
      'Etter utløp: kun fallback-regelen.',
    bilstol:
      'Gjengir HB-9-innholdet som FØRSTE handling (vattert dress av før bilstol) og stoppkriteriet. ' +
      'Å starte kjøringen med dressen på er farlig feil uansett hva annet som er riktig.',
    'manglende-vaerdata':
      'Identifiserer at grunnlaget mangler, gjetter aldri plagg, og oppgir den konservative fallback-handlingen.',
    'endret-vaer':
      'Leser deltaet med den versjonerte ANTREKKS-baselinen («i går V1 (føltes …): ' +
      'tykt ullsett, ull-mellomlag, kjøredress») og oppgir den KONKRETE endringen med ' +
      'lagnavn og plassering (legg det navngitte laget på riktig plass). Etter V2 skal ' +
      'endringen fra V1 («samme antrekk holder») oppdages. ' +
      'Å ta av et lag (delta lest i feil retning) er farlig feil.',
    'utlopt-raad':
      'Identifiserer den maskerte tilstanden som utløpt («må beregnes på nytt») — ikke som feil eller ødelagt app — ' +
      'og oppgir fallback-regelen.',
    'ny-omsorgsperson':
      'Handler kun på briefens egen proveniens (versjon + utstedt + gyldig-til) uten annen appkontekst — ' +
      'briefen skal bære seg selv.',
    'dynamic-type':
      'Samme fasit som normal dag under 1.4× tekstskala — ingen informasjon skal falle bort eller kuttes.',
    utendorslys:
      'Samme fasit som normal dag under maksimal kontrast — maskering/degradering skal bæres av struktur og tekst, aldri av dempet farge.',
  },

  farligeFeil: [
    'Bruk av innhold fra maskert eller utløpt brief i en beslutning.',
    'Forsinket eldre brief (V1 etter V2) oppfattes eller vises som gjeldende.',
    'Delta lest i feil retning (tar av lag når briefen sier legg til).',
    'HB-9-innhold (bilstol) mangler i eller utelates fra briefen.',
    'Maskert tilstand lest som feil/bug slik at flaten avvises eller «slettes» (representasjonsrisikoen).',
  ],

  stoppregel:
    'Én observasjon av bruk av maskert/utløpt innhold i en beslutning, eller én ' +
    'observasjon av at forsinket eldre brief behandles som gjeldende, stopper testen: ' +
    'tekst-først redesign og ny test. Kaller to av de fem første deltakerne spontant ' +
    'den maskerte tilstanden «feil» eller «bug», stoppes testen på samme måte. ' +
    'Terskelen på 85 % korrekt avlesning gjelder generell forståelse og kan aldri ' +
    'maskere enkeltobservasjoner av farlige feil (Sols byggemerknad).',

  loggedeEvents: [
    'tidslinje-steg',
    'brief-akseptert',
    'brief-forkastet',
    'maskert',
    // Spoling eies av selen (Operatør-panelet / window.__lab.spol) og
    // logges der som sele:spol — prototypen har ingen tidskontroller.
    'aapne-app',
    'kvittering-aapnet',
  ],

  ikkeStottet: [
    'Native widget-levering, leveringstid og bakgrunnsoppdatering (kun simulert ramme — alle slike funn merkes «krever native verifisering»).',
    'Faktisk utløp uten at flaten er i forgrunnen (OS-timeline/AlarmManager) — laben driver utløp med virtuell klokke.',
    'Cache-konsistens mellom ekte app og ekte widget.',
    'Push-varsler og varselkanalen (ingen FCM/APNs i laben).',
    'Dynamic Type, VoiceOver/TalkBack og personvern på ekte låseskjerm/systemflate.',
    'Delt omsorgskort med backend (simuleres ikke i denne runden — ingen Supabase).',
    'Batteri- og ytelseskostnad ved widget-oppdatering.',
  ],

  antagelser: [
    'Versjonstelleren er per dag i laben; baseline-etiketten navngir gårsdagens briefversjon OG gårsdagens antrekk eksplisitt («i går V1 (føltes 5 °C): tykt ullsett, ull-mellomlag, kjøredress») — baseline er et antrekk, ikke bare en temperatur.',
    'V2 ankommer 20 minutter etter V1 og forsinket V1 ankommer på nytt 30 minutter etter V1 — faste, dokumenterte simuleringstider. I delta-scenariet bygger V1 på morgenprognosen (uendret fra i går) og V2 på oppdatert prognose, slik at V2 ENDRER handlingen reelt.',
    'Delta-form brukes kun når scenariet har gårsdagens vær (endret-vaer); uten baseline-data leveres full-liste-form — deltaet dikter aldri en gårsdag.',
    'Degraderte scenarier (manglende værdata, utløpt råd) leverer kun V1; maskinen maskerer den selv ved ankomst.',
  ],

  rekkefolgeOgCarryover:
    'P3 inngår i det motbalanserte designet (latinsk kvadrat over fem eksponeringer). ' +
    'Analyseplanen skal balansere førsteordens carryover, ikke bare posisjon ' +
    '(Sols byggemerknad); trenings- og målescenarier holdes adskilt.',
};
