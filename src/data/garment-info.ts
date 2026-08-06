/**
 * Tekst-info per plagg for GarmentDetailScreen.
 *
 * Hver oppføring har:
 *   what  — kort beskrivelse av plagget
 *   when  — når brukes det (vær, aktivitet, alder)
 *
 * "Hvorfor i dette antrekket?" beregnes dynamisk i GarmentDetailScreen
 * basert på aktiv anbefaling (weather, activity, score).
 */

import type { GarmentId } from './garment-illustrations';

export type GarmentInfo = {
  what: string;
  when: string;
};

const INFO: Record<GarmentId, GarmentInfo> = {
  // Innerst
  'kortermet-body': {
    what: 'Lett bomullsbody med kort arm og knepping mellom beina. Klassisk under-plagg som ligger mot huden.',
    when: 'Brukes ved varme dager eller som tynt grunnlag under andre plagg innendørs.',
  },
  'kortermet-ullbody': {
    what: 'Body i myk merinoull med kort arm. Ull mot huden temperatur-regulerer både ved varme og kjølige forhold.',
    when: 'Lett ull-base i varme måneder, eller som innerst lag på milde høstdager.',
  },
  'langermet-body': {
    what: 'Bomullsbody med lang arm og knepping mellom beina. Holder torsoen dekket uten å bygge mye varme.',
    when: 'God som innerlag innendørs eller på milde dager.',
  },
  'langermet-ullbody': {
    what: 'Body i myk merinoull med lang arm. Den mest brukte base-en i Norge for barn 0–2 år.',
    when: 'Inner lag i bæresele på milde dager (ca 10–15 °C) og som nattplagg i kalde soverom. På varme dager: velg heller kortermet eller tynn ullbody.',
  },
  'langermet-ullbody-tynn': {
    what: 'Tynn ull-body med lang arm. Mindre varmeisolasjon enn vanlig ullbody.',
    when: 'Milde dager der full ullbody ville blitt for varmt.',
  },
  'ullsett-tynt': {
    what: 'To-delt sett — overdel og leggings — i tynn merinoull. Mer fleksibel enn body når barnet beveger seg mye.',
    when: 'Ute fra ca 0–16 °C avhengig av aktivitet — alene i mildt vær, eller som lag under yttertøy i kjølig og kald bæresele.',
  },
  'ullsett-tykt': {
    what: 'To-delt sett i tykkere merinoull med mer varme. Gir solid base mot kjølige dager.',
    when: 'Vinter og senhøst — som varmt innerlag under mellomlag og yttertøy.',
  },
  'to-ullsett': {
    what: 'To ullsett oppå hverandre — dobbel base-lag for ekstrem kulde.',
    when: 'Streng frost og lavere — når enkel ull ikke holder.',
  },
  't-skjorte': {
    what: 'Vanlig kortermet t-skjorte i bomull. Tynt og luftig.',
    when: 'Varme sommerdager med utelek.',
  },
  'shorts': {
    what: 'Bomullsshorts med strikk i livet. Lett og bevegelses-vennlig.',
    when: 'Sommervarme dager med utelek eller turer.',
  },
  'lett-bukse': {
    what: 'Lett, behagelig bukse i bomull eller jersey.',
    when: 'Varme sommerdager ute, ca 16–21 °C — som lett underdel når det ikke er behov for ull.',
  },
  'bleie': {
    what: 'Bleie alene — vanligvis kun i ekstrem varme der annet tøy blir for varmt.',
    when: 'Innendørs i tropiske forhold (>26 °C) eller helt korte sov-stunder.',
  },
  'ullsokker': {
    what: 'Ullsokker som holder føttene varme. Ull regulerer fuktighet bedre enn bomull.',
    when: 'Alltid synlig anbefalt fra ca 5 °C og lavere.',
  },

  // Mellomlag
  'tynn-bukse': {
    what: 'Tynn jersey- eller fleecebukse som lar barnet bevege seg fritt.',
    when: 'Som mellomlag i milde til varme forhold (ca 10–21 °C) i vogn eller bæresele — vanligvis uten yttertøy.',
  },
  'tynn-ull-mellomlag': {
    what: 'Tynt ull-mellomlag — gir litt ekstra varme uten å bygge volum.',
    when: 'Kjølige dager der ren base ikke er nok.',
  },
  'ull-mellomlag': {
    what: 'Standard ull-mellomlag — den klassiske ull-genseren mellom base og yttertøy.',
    when: 'Hele vinterhalvåret som essensielt isolasjons-lag.',
  },
  'ull-mellomlag-tykt': {
    what: 'Tykkere ull-mellomlag for ekstra varme.',
    when: 'Streng kulde eller lang eksponering utendørs.',
  },
  'ull-jakke': {
    what: 'Ull-jakke med glidelås — gjør det enkelt å regulere temperaturen.',
    when: 'Som ekstra isolasjons-mellomlag under skall i kjølig til streng frost — sjelden alene.',
  },
  'ull-bukse': {
    what: 'Strikket ullbukse med strikk i livet. Varmer beina godt.',
    when: 'Vinterhalvåret som mellomlag under yttertøy.',
  },
  'tynn-pyjamas': {
    what: 'Tynn to-delt nattøy i bomull. Lett å komme i og ut av.',
    when: 'Varme rom (>22 °C) i kombinasjon med sovepose lett.',
  },
  'pyjamas': {
    what: 'Standard pyjamas i bomull.',
    when: 'Romtemperatur 18–21 °C med sovepose ca 1.0 TOG.',
  },
  'ull-pyjamas': {
    what: 'Ull-pyjamas for kjølige soverom. Holder varmen jevnt gjennom natten.',
    when: 'Kjølige rom (<18 °C) eller frost-grader om natta.',
  },

  // Yttertøy
  'lett-kjoredress': {
    what: 'Lett kjøredress — én-deler med tynt skall. Vind- og litt regntett.',
    when: 'Milde dager i vogn fra ca 5–12 °C.',
  },
  'kjoredress': {
    what: 'Standard kjøredress med moderat fôring og hette.',
    when: 'Kjølige dager i vogn, ca 5–9 °C — eller i bæresele ned mot frost.',
  },
  'vinterkjoredress': {
    what: 'Vinterkjøredress med god fôring og hette.',
    when: 'Kalde til frost-dager i vogn, ca −7 til +4 °C.',
  },
  'vinterkjoredress-isolert': {
    what: 'Maksimalt fôret vinterkjøredress — for streng frost.',
    when: 'Under −10 °C eller lang tid utendørs i vogn.',
  },
  'vinterdress': {
    what: 'To-delt eller én-delt vinterdress for utelek — robust og bevegelig.',
    when: 'Lek ute i ca −5 til 5 °C.',
  },
  'vinterdress-isolert': {
    what: 'Isolert vinterdress for utelek i streng kulde.',
    when: 'Lek ute i streng frost, fra ca −7 °C og kaldere.',
  },
  'regntoy-skall': {
    what: 'Regntøy med tette sømmer — to-delt eller én-delt.',
    when: 'Når det regner — uavhengig av temperatur.',
  },
  'vindtett-skall': {
    what: 'Vindtett skall-jakke som blokkerer vind effektivt.',
    when: 'Vind over 5 m/s med kjølig vær (under 10 °C).',
  },

  // Ekstra · hodeplagg
  'solhatt': {
    what: 'Solhatt med brem som beskytter ansikt, nakke og ører.',
    when: 'Solrike dager fra ca 10 °C og oppover.',
  },
  'lue-tynn': {
    what: 'Tynn strikket lue.',
    when: 'Milde til varme dager, ca 10–21 °C — særlig i vogn og bæresele.',
  },
  'lue': {
    what: 'Standard strikket lue som dekker ørene.',
    when: 'Fra ca 5 °C og nedover.',
  },
  'lue-m-ull': {
    what: 'Tykk ull-lue med øre-klaffer.',
    when: 'Frost og lavere temperaturer.',
  },
  'balaklava': {
    what: 'Balaklava (finlandshette) dekker hele hode, hals og deler av ansiktet.',
    when: 'Streng frost og kald vind.',
  },

  // Ekstra · hender
  'votter-tynne': {
    what: 'Tynne strikkede votter.',
    when: 'Kjølige dager fra ca 5 °C og nedover.',
  },
  'votter': {
    what: 'Standard ullvotter med ribbet strikk.',
    when: 'Fra 0 °C og nedover.',
  },
  'votter-tykke': {
    what: 'Tykke ullvotter med ekstra isolasjon.',
    when: 'Frost-dager med kjenn-på-fingrene.',
  },
  'votter-dun': {
    what: 'Dun-fylte votter for maksimal varme.',
    when: 'Streng frost og under −15 °C.',
  },
  'vindvotter-skall': {
    what: 'Vindtette skall-votter — kan brukes over tynne votter.',
    when: 'Sterk vind (≥8 m/s) med kulde (under 0 °C).',
  },

  // Ekstra · hals
  'hals': {
    what: 'Halsvarmer / buff som dekker nakke og munn ved behov.',
    when: 'Vind og kulde — eller når jakkekanten alene ikke er nok.',
  },

  // Ekstra · føtter
  'sko': {
    what: 'Vanlige hverdags-sko med borrelås.',
    when: 'Innendørs eller på tørre, milde dager ute.',
  },
  'toffel-sko': {
    what: 'Myke tøffel-sko i filtet ull eller mykt skinn.',
    when: 'Inn i bæresele, eller varme dager når føttene ikke trenger isolering.',
  },
  'sandaler': {
    what: 'Sommer-sandaler med myke remmer.',
    when: 'Varme sommerdager.',
  },
  'vintersko': {
    what: 'Vintersko med matt gummi-såle.',
    when: 'Kjølige dager med utelek på vått eller frossent underlag, ca 0–5 °C. For minusgrader: bruk isolerte vintersko.',
  },
  'vintersko-isolerte': {
    what: 'Tykt isolerte vintersko for streng kulde.',
    when: 'Frost og kaldere ved utelek, fra ca −7 °C — eller lang tid utendørs i snø.',
  },
  /* Teksten forklarer HVORFOR det står to sokkerader i lista. Det er hele
     grunnen til at plagget fikk egen id: uten forklaringen leser rad 8 som
     et andre par sokker, og forelderen må gjette om appen mener det. */
  'vintersokker': {
    what: 'Tykke ullsokker som tar fottøyets plass. Vinterdressen har fottak som dekker foten, så barnet trenger ikke sko utenpå.',
    when: 'Fra ca 9 måneder når vinterdressen dekker foten. Kommer i stedet for isolerte vintersko — de tynne ullsokkene innerst blir stående.',
  },

  // Ekstra · vogn-tilbehør
  'tynt-teppe': {
    what: 'Tynt bomulls- eller muslin-teppe. Tilfører litt komfort uten å bygge varme.',
    when: 'Varme dager i vogn — som lett tildekking.',
  },
  'dunteppe': {
    what: 'Tykt dunteppe for ekstra varme i vogn. Bruk aldri OVER kalesjen.',
    when: 'Kjølige til kalde dager i vogn — som tillegg, ikke alene.',
  },
  'varmepose-lett': {
    what: 'Lett varmepose / fotmuff til vogn — tynt skall med fôr.',
    when: 'Milde dager der barn ligger i vogn.',
  },
  'varmepose': {
    what: 'Standard varmepose med fôr og glidelås. Holder barnet jevnt varmt.',
    when: 'Kjølige til kalde dager i vogn.',
  },
  'varmepose-dun': {
    what: 'Dun-fylt varmepose for ekstrem kulde.',
    when: 'Streng frost. Pass på å ikke kombinere med løse tepper.',
  },
  'sauekinn-i-vogn': {
    what: 'Saueskinn (lammeskinn) som ligger UNDER barnet i vognen og varmer fra ryggsiden. Aldri som teppe over.',
    when: 'Vinterhalvåret — som underlag, ikke isolasjon over. Spedbarn <4 mnd: vær obs på at mykt underlag kan øke kvelnings-risiko hvis barnet ruller.',
  },
  'regntrekk': {
    what: 'Gjennomsiktig regntrekk over kalesjen. Hold luftigheten i tankene — aldri tett over.',
    when: 'Når det regner mer enn yr i vogn.',
  },
  'regnponcho-over-baeresele': {
    what: 'Regnponcho som dekker både den voksne og barnet i bæresele.',
    when: 'Når det regner og du bærer barnet i sele eller bæremeis.',
  },

  // Ekstra · søvn
  'sovepose-0-5-tog': {
    what: 'Veldig tynn sovepose (0.5 TOG) — minimal varme.',
    when: 'Varme rom (>24 °C).',
  },
  'sovepose-1-0-tog': {
    what: 'Lett sovepose (1.0 TOG) for milde rom.',
    when: 'Romtemperatur 18–21 °C.',
  },
  'sovepose-1-5-tog': {
    what: 'Sovepose 1.5 TOG — mellomting mellom lett og medium. Sjeldnere i bruk; 1.0 og 2.5 TOG dekker de fleste behov.',
    when: 'Romtemperatur ca 17–20 °C, når 1.0 blir for tynn og 2.5 for varm.',
  },
  'sovepose-2-0-tog': {
    what: 'Sovepose 2.0 TOG — litt under medium. Sjeldnere; 1.0 og 2.5 TOG dekker de fleste behov.',
    when: 'Romtemperatur ca 16–19 °C, som et mellomtrinn opp mot 2.5 TOG.',
  },
  'sovepose-2-5-tog': {
    what: 'Medium sovepose (2.5 TOG). Den vanligste hjemmemonn-varmen.',
    when: 'Romtemperatur 16–18 °C.',
  },
  'sovepose-3-0-3-5-tog': {
    what: 'Tykk sovepose (3.0–3.5 TOG) for kjølige soverom.',
    when: 'Romtemperatur under 16 °C.',
  },
  'sovepose-3-5-tog': {
    what: 'Tykkeste sovepose (3.5 TOG) — for kalde rom.',
    when: 'Romtemperatur under 14 °C.',
  },

  // Ekstra · hud
  'ansiktskrem': {
    what: 'Fet ansiktskrem som beskytter huden mot frost og vind.',
    when: 'Bruk en halvtime før utetur i frost. Reduserer risiko for frostskader.',
  },
};

export function infoFor(id: GarmentId): GarmentInfo | null {
  return INFO[id] ?? null;
}

/**
 * Per-plagg "Hvorfor i dette antrekket?"-tekst — kontekstuell forklaring
 * basert på plagg-type, aktivitet og vær.
 *
 * Returnerer en konkret begrunnelse som svarer på "hvorfor akkurat dette
 * plagget i dag", ikke en generisk antrekks-oppsummering.
 */
export type WhyContext = {
  childName: string;
  activity: 'vogn' | 'baeresele' | 'utelek' | 'soevn';
  tempC: number;
  feelsLikeC: number;
  windMs: number;
  precipMmH: number;
};

const ACTIVITY_NB = {
  vogn: 'vogn',
  baeresele: 'bæresele',
  utelek: 'utelek',
  soevn: 'søvn',
};

export function whyForGarment(id: GarmentId, ctx: WhyContext): string {
  const { childName, activity, feelsLikeC, windMs, precipMmH } = ctx;
  const feels = Math.round(feelsLikeC);
  const act = ACTIVITY_NB[activity] ?? 'i dag';
  const rains = precipMmH >= 0.2;
  const windy = windMs >= 5;
  const cold = feelsLikeC < 5;
  const frost = feelsLikeC < 0;

  // Søvn-spesifikke begrunnelser
  if (activity === 'soevn') {
    if (id.startsWith('sovepose-')) {
      return `Sovepose holder ${childName} jevnt varm gjennom natten uten løse tepper. TOG-nivået matcher romtemperaturen rundt ${feels} °C.`;
    }
    if (id.startsWith('langermet') || id.startsWith('kortermet')) {
      return `Som innerlag under soveposen gir denne huden et tynt ulldek som regulerer fukt og varme.`;
    }
    if (id === 'pyjamas' || id === 'tynn-pyjamas' || id === 'ull-pyjamas') {
      return `Pyjamas legger på et mellomlag når romtemperaturen rundt ${feels} °C krever litt ekstra varme i tillegg til soveposen.`;
    }
    if (id === 'ullsokker') {
      return `Føttene er det første som blir kalde — ullsokker holder kroppstemperaturen jevn gjennom natten.`;
    }
  }

  // Innerst-lag
  if (id === 'langermet-ullbody' || id === 'langermet-ullbody-tynn' || id === 'kortermet-ullbody') {
    return `Ull mot huden regulerer både fukt og varme. ${childName} svetter mindre i ${act} selv med flere lag på.`;
  }
  if (id === 'kortermet-body' || id === 'langermet-body') {
    return `Tynt bomullsbody som innerlag — holder huden tørr og forhindrer at andre lag klister seg.`;
  }
  if (id === 'ullsett-tynt' || id === 'ullsett-tykt' || id === 'to-ullsett') {
    return `To-delt ullsett gir ${childName} bevegelses-frihet i ${act} mens ull-mot-huden holder varmen jevn.`;
  }
  if (id === 't-skjorte' || id === 'shorts' || id === 'lett-bukse') {
    return `Lett bomulls-plagg — minimerer varme ved ${feels} °C så ${childName} ikke svetter under utelek.`;
  }
  if (id === 'bleie') {
    return `Ved ${feels} °C innendørs er bleie nok alene. Mer tøy gir varmestress.`;
  }
  if (id === 'ullsokker') {
    return `Føttene er det første som kjøles ned ved ${feels} °C. Ull holder varmen selv om sokken blir litt fuktig.`;
  }

  // Mellomlag
  if (id === 'tynn-bukse') {
    return `Tynn jersey-bukse som mellomlag — gir bevegelses-frihet uten å bygge unødig volum i ${act}.`;
  }
  if (id === 'tynn-ull-mellomlag') {
    return `Tynt ull-mellomlag tar av kjølighets-stikket ved ${feels} °C uten å overopphete.`;
  }
  if (id === 'ull-mellomlag') {
    return `Standard ull-mellomlag er hovedisolasjonen ${childName} trenger i dag. Lett å regulere temperatur ved å pakke ut.`;
  }
  if (id === 'ull-mellomlag-tykt') {
    return `Tykt ull-mellomlag legger på ekstra varme ved ${feels} °C eller lang eksponering ute.`;
  }
  if (id === 'ull-jakke') {
    return `Ull-jakke med glidelås gjør det enkelt å regulere temperatur underveis i ${act}.`;
  }
  if (id === 'ull-bukse') {
    return `Strikket ullbukse varmer beina ekstra ved ${feels} °C — bomullsbukse alene blir for kaldt.`;
  }
  if (id === 'tynn-pyjamas' || id === 'pyjamas' || id === 'ull-pyjamas') {
    return `Pyjamas mellom innerlag og sovepose gir ${childName} et mykt, varmt mellomlag for natten.`;
  }

  // Yttertøy
  if (id === 'lett-kjoredress') {
    return `Lett kjøredress blokker vind og lett regn uten å bygge for mye varme. Passer ved ${feels} °C i ${act}.`;
  }
  if (id === 'kjoredress') {
    return `Fôret kjøredress er yttertøyet som holder ${childName} varm i vogn ved ${feels} °C${windy ? ' og vind' : ''}.`;
  }
  if (id === 'vinterkjoredress') {
    return `Vinterkjøredress er ytterste lag — fôret, vindtett og holder snø ute ved ${feels} °C.`;
  }
  if (id === 'vinterkjoredress-isolert') {
    return `Maks-isolert vinterkjøredress — nødvendig ved streng kulde (${feels} °C) eller lang eksponering ute.`;
  }
  if (id === 'vinterdress') {
    return `Vinterdress er robust og bevegelses-vennlig for utelek ved ${feels} °C.`;
  }
  if (id === 'vinterdress-isolert') {
    return `Maks-isolert vinterdress for streng frost — beholder kroppsvarmen selv under aktiv lek.`;
  }
  if (id === 'regntoy-skall') {
    return `Regntøy med tette sømmer er nødvendig når det regner ${precipMmH.toFixed(1)} mm/t.`;
  }
  if (id === 'vindtett-skall') {
    return `Vindtett skall blokker ${windMs.toFixed(0)} m/s vind og forhindrer at varmen blåses bort.`;
  }

  // Ekstra · hodeplagg
  if (id === 'solhatt') {
    return `Brem-hatt beskytter ansikt og nakke. Soltimer er sterke selv ved ${feels} °C.`;
  }
  if (id === 'lue-tynn') {
    return `Tynn lue dekker ørene som kjøles raskt. Ved ${feels} °C er den nok.`;
  }
  if (id === 'lue') {
    return `Standard lue dekker ørene fullt og holder hodet varmt ved ${feels} °C.`;
  }
  if (id === 'lue-m-ull') {
    return `Tykk ull-lue med øre-klaffer — nødvendig når ${feels} °C krever maks hodevarme.`;
  }
  if (id === 'balaklava') {
    return `Balaklava dekker hode, ører og hals — beskytter mot streng frost ved ${feels} °C${windy ? ' og vind' : ''}.`;
  }

  // Ekstra · hender
  if (id === 'votter-tynne' || id === 'votter') {
    return `Hendene kjøles raskt — votter beholder kroppstemperaturen i fingrene ved ${feels} °C.`;
  }
  if (id === 'votter-tykke') {
    return `Tykke votter trengs ved ${feels} °C for å forhindre at fingrene blir hvite og kalde.`;
  }
  if (id === 'votter-dun') {
    return `Dunvotter — maks varme for hender i streng frost ved ${feels} °C.`;
  }
  if (id === 'vindvotter-skall') {
    return `Vindtette skall-votter blokker ${windMs.toFixed(0)} m/s vind som ellers ville kjølt fingrene ned.`;
  }

  // Ekstra · hals
  if (id === 'hals') {
    return `Halsvarmer dekker området der jakkekanten slipper kald luft inn. Spesielt viktig ved ${windy ? `${windMs.toFixed(0)} m/s vind` : 'kald luft'}.`;
  }

  // Ekstra · føtter
  if (id === 'sko') {
    return `Vanlige sko gir feste på tørt underlag ved ${feels} °C.`;
  }
  if (id === 'toffel-sko') {
    return `Myke tøffel-sko er behagelige inn i bæresele — ingen hard såle som plager føttene.`;
  }
  if (id === 'sandaler') {
    return `Sandaler luftes hudene under varm utelek ved ${feels} °C.`;
  }
  if (id === 'vintersko') {
    return `Vintersko med matt såle gir feste på vått eller frossent underlag ved ${feels} °C.`;
  }
  if (id === 'vintersko-isolerte') {
    return `Isolerte vintersko er nødvendig ved ${feels} °C — tynne sko gir frostskader på lengre tid.`;
  }

  // Ekstra · vogn-tilbehør
  if (id === 'tynt-teppe') {
    return `Tynt teppe gir litt komfort i vogn uten å bygge varme på en mild dag.`;
  }
  if (id === 'dunteppe') {
    return `Dunteppe legger på ekstra varme i vogn ved ${feels} °C. Bruk aldri OVER kalesjen.`;
  }
  if (id === 'varmepose-lett') {
    return `Lett varmepose i vogn passer milde dager der ${childName} ligger i ro.`;
  }
  if (id === 'varmepose') {
    return `Fôret varmepose holder ${childName} varm i vogn ved ${feels} °C. Lukk glidelåsen oppover etter behov.`;
  }
  if (id === 'varmepose-dun') {
    return `Dun-fylt varmepose er maks-isolasjon i vogn ved ${feels} °C. Ikke kombiner med løse tepper.`;
  }
  if (id === 'sauekinn-i-vogn') {
    return `Saueskinn UNDER barnet i vognen varmer fra ryggsiden. Aldri legg det over som teppe.`;
  }
  if (id === 'regntrekk') {
    return `Regntrekk holder vognen tørr ved ${precipMmH.toFixed(1)} mm/t. Luft kalesjen så det ikke blir for klamt.`;
  }
  if (id === 'regnponcho-over-baeresele') {
    return `Regnponcho dekker både deg og barnet i bæresele når det regner ${precipMmH.toFixed(1)} mm/t.`;
  }

  // Hud
  if (id === 'ansiktskrem') {
    return `Fet ansiktskrem en halvtime før utetur — beskytter kinnene mot ${frost ? 'frost' : 'vær'} og forhindrer frostskader.`;
  }

  // Fallback
  return `Anbefalt i dagens antrekk for ${childName} (${feels} °C, ${act}${rains ? ', nedbør' : ''}${windy ? ', vind' : ''}${cold ? ', kjølig' : ''}).`;
}

