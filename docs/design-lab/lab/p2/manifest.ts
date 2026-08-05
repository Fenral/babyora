/**
 * P2 «SPENNET» — eksperimentmanifest (spec v2 §3).
 *
 * P2 er en REN INSTRUMENTTEST (spec v2 §2): routeren er ikke-scorbar
 * ramme. Én aktiv «Holder dette?»-oppgave + én forskrivningsoppgave som
 * kontrast. Metodisk begrensning er loggført under.
 */

export type ManifestOppgave = {
  id: string;
  navn: string;
  beskrivelse: string;
  maal: string;
  scorbar: boolean;
};

export type ScoringsFasit = {
  /** Entydig korrekt handling i scenariet (scoringsfasit). */
  forventetKorrektHandling: string;
  /** Forventet instrumentavlesning med uendret kandidat (der relevant). */
  forventetPosisjon?: 'under-gulv' | 'i-spennet' | 'over-tak' | 'maskert';
  /** Feil som i dette scenariet regnes som farlig (nulltoleranse). */
  farligFeil?: string;
};

export type EksperimentManifest = {
  id: 'p2';
  navn: string;
  retning: string;
  hypotese: string;
  isolertVariabel: string;
  metodiskBegrensning: string;
  oppgaver: ManifestOppgave[];
  scoringsfasit: Record<string, ScoringsFasit>;
  farligeFeil: string[];
  stoppregel: string;
  loggedeEvents: string[];
  ikkeStottet: string[];
};

export const manifest: EksperimentManifest = {
  id: 'p2',
  navn: 'SPENNET — Confidence Instrument',
  retning: 'appendix/fase7/retning-confidence.md (H2-ætten)',

  hypotese:
    'En forelder som ser det trygge spennet med hardt kaldgulv, mykere varmetak og ' +
    'kandidatens posisjon, treffer riktig neste handling minst like raskt som med en ' +
    'autoritativ plaggliste — og håndterer grensevær og underdekning RIKTIGERE, fordi ' +
    'dommen er posisjon + fastkoblet respons i stedet for et ja/nei-orakel.',

  isolertVariabel:
    'Beslutningsrepresentasjonen: spenn-med-posisjon (instrument) vs. punktliste ' +
    '(forskrivning). Motor, scenarier, sikkerhetsinnhold og klarspråk er identiske ' +
    'på tvers av retningene — kun representasjonen varierer.',

  metodiskBegrensning:
    'Hypotese-etiketten («Veiledende område — ikke fagvalidert») reduserer feillesningen ' +
    'vi måler: testen måler forståelse og interaksjon, ikke produksjonsrealistisk tillit ' +
    '(spec v2 §2). Web-bevis dekker ikke native haptikk (detent under gulvet) eller ' +
    'utendørs lesbarhet på ekte skjerm.',

  oppgaver: [
    {
      id: 'holder-dette',
      navn: '«Holder dette?» (instrument — aktiv måloppgave)',
      beskrivelse:
        'Kandidat-antrekket står forhåndsutfylt som chips fra motorens basePlagg. ' +
        'Deltakeren korrigerer avvik (fjerner/legger til plagg), leser kandidatens ' +
        'posisjon i det vertikale spennet og utfører den fastkoblede responsen.',
      maal: 'Rask korrigering: p75 ≤ 8 s fra oppgavestart til kandidat stemmer (spec v2 §3).',
      scorbar: true,
    },
    {
      id: 'forskrivning',
      navn: '«Hva skal hen ha på?» (forskrivning — kontrast, ikke-scorbar ramme)',
      beskrivelse:
        'Motorens basePlagg vist som ren liste — den autoritative punktlisten som ' +
        'instrumentet kontrasteres mot. Ingen posisjon, ingen spenn-dom.',
      maal: 'Kontrastflate for preferanse- og forståelsessammenligning.',
      scorbar: false,
    },
  ],

  scoringsfasit: {
    'normal-dag': {
      forventetPosisjon: 'i-spennet',
      forventetKorrektHandling:
        'Lese «i trygt spenn» → gå ut som planlagt, kjenne på nakken underveis.',
    },
    grensevaer: {
      forventetPosisjon: 'i-spennet',
      forventetKorrektHandling:
        'Lese posisjonen og nedbørs-/kuldehendelsene → tett ytterlag, og følge ' +
        'stoppkriteriet ved våte klær.',
      farligFeil: 'Å lese «i spennet» som «ingen forbehold» og overse nedbørshendelsen.',
    },
    'sovende-vognbarn': {
      forventetPosisjon: 'i-spennet',
      forventetKorrektHandling:
        'Forstå at instrumentet er INVERTERT: varmetaket er den harde grensen når ' +
        'barnet sover. Ved «over taket»: fjerne ett lag straks.',
      farligFeil:
        'Å lese den kalde siden som hard grense i søvnmodus (feil beskyttet ende).',
    },
    bilstol: {
      forventetPosisjon: 'i-spennet',
      forventetKorrektHandling:
        'Uansett posisjon i spennet: følge den harde bilstolhendelsen (HB-9) — fjerne ' +
        'vattert dress før bilstolen, deretter lese spennet.',
      farligFeil: 'Å bruke «i spennet» som godkjenning og hoppe over HB-9.',
    },
    'manglende-vaerdata': {
      forventetPosisjon: 'maskert',
      forventetKorrektHandling:
        'Lese maskeringen som trygg degradering: kle etter årstid, kjenne på nakken før ' +
        'dere går — ikke lete etter et skjult spenn.',
      farligFeil: 'Å behandle den maskerte figuren som et gyldig spenn.',
    },
    'endret-vaer': {
      forventetPosisjon: 'i-spennet',
      forventetKorrektHandling:
        'Dømme kandidaten mot DAGENS spenn (vind og kulde), ikke gårsdagens følelse — ' +
        'legge til laget responsen ber om hvis kandidaten står under gulvet.',
    },
    'utlopt-raad': {
      forventetPosisjon: 'maskert',
      forventetKorrektHandling:
        'Lese at spennet er utløpt og maskert → falle tilbake til årstid + nakkesjekk. ' +
        'Ikke gjenbruke det gamle spennet.',
      farligFeil: 'Å lese et utløpt spenn som fortsatt gyldig.',
    },
    'ny-omsorgsperson': {
      forventetPosisjon: 'i-spennet',
      forventetKorrektHandling:
        'Uten forhistorie: lese posisjon, «Usikrest: …» og gyldighet direkte fra flaten ' +
        'og utføre samme respons som primærbrukeren ville gjort.',
    },
    'dynamic-type': {
      forventetPosisjon: 'i-spennet',
      forventetKorrektHandling:
        'Samme beslutning som normal-dag i 1.4× tekst — setningsformen bærer hele ' +
        'dommen uten figuren.',
    },
    utendorslys: {
      forventetPosisjon: 'i-spennet',
      forventetKorrektHandling:
        'Samme avlesning i høykontrast: sonene bæres av skravur, form og tekst — ikke ' +
        'gråtoner. Vindhendelsen (halsedisse) følges.',
    },
  },

  farligeFeil: [
    '«Appen har målt barnet»-avlesning: deltakeren tror figuren måler barnets tilstand.',
    'Under-gulvet eller invertert-tilstand lest som «trygt» (feil beskyttet ende).',
    'Oversett stoppkriterium på hard hendelse (særlig HB-9 bilstol).',
    'Maskert eller utløpt spenn brukt som gyldig beslutningsgrunnlag.',
  ],

  stoppregel:
    'ÉN observasjon av en farlig feillesning (listen over) stopper testen og utløser ' +
    'redesign til tekst-først-representasjon før ny test — den kan ikke gjemmes i et ' +
    'gjennomsnitt på 85 % (Sols byggemerknad, sol-klarsignal-fase9.md). I tillegg: ' +
    'Spenn-avlesningsporten krever ≥85 % korrekt handlingsavlesning per ' +
    'sikkerhetsbærende tilstand (spec v2 §4 pkt. 4).',

  loggedeEvents: [
    'p2:oppgave-valgt {oppgave}',
    'p2:chip-endret {plagg, valgt}',
    'p2:posisjon-vist {posisjon, naerHardGrense, invertert}',
    'p2:maskert-vist {aarsak}',
    'p2:hendelse-vist {id, prioritet}',
  ],

  ikkeStottet: [
    'Produksjonsrealistisk tillit — hypotese-etiketten endrer det som måles.',
    'Tidsbudsjetter/minutt-tall — ingen validert tidsmodell (bindende forbud).',
    'Premisshåndtak utover kandidat-chips (alder/vind/varighet justeres ikke her).',
    'Deling/eksport av spennkortet (retning 3s terreng) og premium-lag.',
    'Native haptikk (hard detent under gulvet), widgets og låseskjerm.',
    'Kalibrering per barn (verifier-loopen) — spennet smalner ikke i prototypen.',
  ],
};
