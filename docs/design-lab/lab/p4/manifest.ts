/**
 * P4 «AMBIENT PROTOKOLL» — eksperimentmanifest (spec v2 §3-malen).
 *
 * Beslutningssløyfen (spec §3, P4): brief → komplett første handling
 * UTEN baseline-rekonstruksjon → åpning viser SAMME versjon i protokoll
 * → kontrollpunkt. Versjons-/kontekstbrudd = syntesen feilet.
 *
 * Retningen er REN KOMPOSISJON: alt protokoll-, brief- og
 * sikkerhetsinnhold kommer fra P1s kompilator og P3s briefbygger/maskin.
 * Manifestet måler derfor kun det P4 selv tilfører: overgangen.
 */

export type P4Manifest = {
  id: 'p4';
  navn: string;
  hypotese: string;
  isolertVariabel: string;
  beslutningssloyfe: string;
  komposisjon: string;
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

export const manifest: P4Manifest = {
  id: 'p4',
  navn: 'P4 — Ambient Protokoll (brief → protokoll, ren komposisjon)',

  hypotese:
    'Når den distribuerte briefen viser protokollens første komplette trygge ' +
    'steg som handling (med versjon og gyldighet), kan forelderen starte riktig ' +
    'UTEN å rekonstruere gårsdagens grunnlag — og åpningen til full protokoll ' +
    'med samme versjon oppleves som zoom i samme sannhet, ikke som ny flate.',

  isolertVariabel:
    'Koblingen brief→protokoll: samme fakta, samme versjon, atomisk pakket. ' +
    'Alt innhold (protokollsteg, brieftekst, sikkerhetssemantikk) er identisk ' +
    'med P1 og P3 — kun overgangen mellom flatene er ny. Motor, scenarier og ' +
    'semantikk-porten er de samme som i alle retninger.',

  beslutningssloyfe:
    'Brief lest på flaten → protokollens steg 1 utført som første handling ' +
    '(uten baseline-rekonstruksjon) → «åpne» viser hele protokollsekvensen med ' +
    'SAMME versjonsstempel → kontrollpunktet (nakkesjekken) bekreftes sist → ' +
    'utløp/maskering håndteres av brief-maskinen som i P3 (strukturell ' +
    'maskering + konservativ fallback). Feilstate: versjonsbrudd ved åpning ' +
    'viser feiltilstand i stedet for protokollen — skal være umulig via ' +
    'brief-maskinen (property-testet).',

  komposisjon:
    'Protokoll: p1/protokollkompilator (kompilerProtokoll, uttrykkFraProtokoll). ' +
    'Brief + tilstandsmaskin: p3/briefbygger (byggTidslinje, lesBriefInnhold, ' +
    'tilRetningsUttrykk) + p3/brief-maskin (motta). Ny kode: pakkMedProtokoll ' +
    '(atomisk versjonsstempel), forsteTryggeSteg, sjekkVersjonsbrudd, ' +
    'uttrykkFraAmbient (snitt av begge uttrykk) og overgangs-UI-et.',

  oppgaver: [
    'Les brief-flaten og utfør handlingen (protokollens steg 1) uten å åpne noe mer.',
    'Oppgi versjon og gyldighet fra brief-flatens stempellinje.',
    'Åpne protokollen og bekreft at versjonsstempelet er det samme som på briefen.',
    'Gå gjennom protokollsekvensen og bekreft kontrollpunktet (nakkesjekken) til slutt.',
    'Etter utløp (spolt klokke): forklar hva den maskerte tilstanden betyr og hva du gjør nå.',
  ],

  scoringsfasit: {
    'normal-dag':
      'Utfører protokollens steg 1 direkte fra briefen (uten å gjenåpne gårsdagens grunnlag); ' +
      'ved åpning bekreftes samme versjonsnummer; nakkesjekken bekreftes sist. ' +
      'Etter utløp: kun fallback-regelen (kle etter årstid, kjenn på nakken).',
    grensevaer:
      'Utfører steg 1 fra briefen og gjenkjenner i den åpnede protokollen at nakken ' +
      'skal kjennes underveis (kontrollsteget fra den myke hendelsen).',
    'sovende-vognbarn':
      'Utfører steg 1 (soveposebasert antrekk) og gjenfinner i protokollen at et sovende ' +
      'barn i frost ikke sier fra selv; kontrollpunktet bekreftes.',
    bilstol:
      'Steg 1 fra briefen utføres først; i den åpnede protokollen står HB-9-steget FØR ' +
      'ytterlaget og bekreftes der. Å starte kjøringen med vattert dress under selen er ' +
      'farlig feil uansett hva annet som er riktig.',
    'manglende-vaerdata':
      'Steg 1 er den konservative fallbacken («Kle etter årstid») — aldri gjettede plagg; ' +
      'brukeren identifiserer at grunnlaget mangler.',
    'endret-vaer':
      'Leser BÅDE deltaet (værleddet + den konkrete, navngitte lagendringen mot ' +
      'gårsdagens antrekksbaseline) OG første protokollhandling på brief-flaten; ' +
      'utfører steg 1 uten å rekonstruere gårsdagens grunnlag. Etter V2 skal ' +
      'deltakeren oppgi at handlingen ENDRET seg (samme antrekk holder → legg ' +
      'det navngitte laget på riktig plass).',
    'utlopt-raad':
      'Identifiserer den maskerte tilstanden som utløpt («må beregnes på nytt») — ikke som ' +
      'feil eller ødelagt app — og oppgir fallback-regelen. Aldri innhold fra maskert brief.',
    'ny-omsorgsperson':
      'Handler kun på flatens egen proveniens (versjon + utstedt + gyldig-til) — brief og ' +
      'protokoll bærer seg selv uten annen appkontekst.',
    'dynamic-type':
      'Samme fasit som normal dag under 1.4× tekstskala — ingen informasjon faller bort eller kuttes.',
    utendorslys:
      'Samme fasit som normal dag under maksimal kontrast — versjon, maskering og sikkerhet ' +
      'bæres av struktur og tekst, aldri av dempet farge.',
  },

  farligeFeil: [
    'Brief-flaten viser en annen handling enn protokollens steg 1 (syntese-avvik).',
    'Åpnet protokoll har en annen versjon enn briefen (versjonsbrudd) — skal være ' +
      'umulig via brief-maskinen; én observasjon betyr at syntesen har feilet.',
    'Bruk av innhold fra maskert eller utløpt brief/protokoll i en beslutning.',
    'HB-9-innholdet (bilstol) mangler i briefen eller i den åpnede protokollen.',
    'Kontrollpunktet (nakkesjekken) nås aldri i den åpnede protokollen.',
  ],

  stoppregel:
    'Én observasjon av en farlig feil stopper testen: redesign og ny test ' +
    '(nulltoleranse, jf. Sols klarsignal). Ett observert versjonsbrudd stopper ' +
    'i tillegg BYGGET umiddelbart — da er komposisjonskontrakten brutt og ' +
    'syntesen må rettes før noen ny deltaker eksponeres. Forståelsesterskelen ' +
    'på 85 % gjelder generell avlesning og kan aldri maskere enkeltobservasjoner ' +
    'av farlige feil (Sols byggemerknad).',

  loggedeEvents: [
    'tidslinje-steg',
    'brief-akseptert',
    'brief-forkastet',
    'maskert',
    'spol',
    'protokoll-aapnet',
    'protokoll-lukket',
    'versjonsbrudd',
    'kontrollpunkt-bekreftet',
  ],

  ikkeStottet: [
    'Native widget-levering, leveringstid og bakgrunnsoppdatering (kun simulert ramme — alle slike funn merkes «krever native verifisering»).',
    'Faktisk utløp uten at flaten er i forgrunnen (OS-timeline/AlarmManager) — laben driver utløp med virtuell klokke.',
    'Cache-konsistens mellom ekte app og ekte widget.',
    'Push-varsler og varselkanalen (ingen FCM/APNs i laben).',
    'Dynamic Type, VoiceOver/TalkBack og personvern på ekte låseskjerm/systemflate.',
    'Delt omsorgskort med backend (ingen Supabase i denne runden).',
    'Kan ikke bevise at steg 1 faktisk UTFØRES fysisk — web måler kvittering/teach-back, ikke handlingen.',
    'Egen P2-kontrast eller nullmodell — P4 måles i det motbalanserte designet, ikke alene.',
  ],

  antagelser: [
    'Protokollen kompileres én gang per PROGNOSEGRUNNLAG (fakta er deterministiske); hver brief pakker protokollen for samme fakta som briefen selv ble bygget fra, og versjonsstempelet følger briefen atomisk (pakkMedProtokoll er eneste konstruktør). I delta-scenariet har V1 (morgenprognosen, uendret fra i går) og V2 (oppdatert prognose) derfor hver sin protokoll.',
    'Tidslinjen (V1 → V2 etter 20 min → forsinket V1 etter 30 min) arves uendret fra P3 — P4 endrer ikke leveringssimuleringen, kun innpakningen.',
    '«Første komplette trygge steg» er per definisjon protokollens steg 1 slik P1s kompilator ordnet sekvensen (harde hendelser først, bilstol før ytterlag, fallback i degradert modus) — P4 gjør ingen egen prioritering.',
    'Semantikk-porten håndheves som SNITT av brief- og protokolluttrykket: begge flater må bære hele sikkerhetssemantikken for at porten skal bestå.',
  ],

  rekkefolgeOgCarryover:
    'P4 inngår i det motbalanserte designet (latinsk kvadrat over fem eksponeringer); ' +
    'analyseplanen skal balansere førsteordens carryover, ikke bare posisjon ' +
    '(Sols byggemerknad). P4 starter på brief→protokoll-overgangen — oppsett og ' +
    'onboarding eies av selen, og tidsscore ekskluderer oppsett (spec §1 pkt. 4).',
};
