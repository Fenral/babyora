import i18next from 'i18next';

import type { Layer, LayerCategory, Note, NoteCategory, RecommendInput } from './types.js';

const ORDER: LayerCategory[] = ['innerst', 'mellomlag', 'yttertoy', 'ekstra', 'utstyr'];

function cloneLayers(layers: Layer[]): Layer[] {
  return layers.map((l) => ({ category: l.category, items: [...l.items] }));
}

function ensureCategory(layers: Layer[], category: LayerCategory): Layer {
  let existing = layers.find((l) => l.category === category);
  if (existing) return existing;
  existing = { category, items: [] };
  layers.push(existing);
  layers.sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category));
  return existing;
}

function addItem(layers: Layer[], category: LayerCategory, item: string): void {
  const layer = ensureCategory(layers, category);
  if (!layer.items.includes(item)) layer.items.push(item);
}

function removeItem(layers: Layer[], category: LayerCategory, item: string): void {
  const layer = layers.find((l) => l.category === category);
  if (!layer) return;
  layer.items = layer.items.filter((i) => i !== item);
}

function pushNote(notes: Note[], category: NoteCategory, message: string): void {
  if (!notes.some((n) => n.message === message)) {
    notes.push({ category, message });
  }
}

/**
 * Lokalisert note-melding via i18next med norsk fallback. Hvis i18next ikke
 * er initialisert (tester, SSR-tidlig), faller vi tilbake til hardkodet
 * norsk for å bevare backwards-kompatibilitet.
 */
function tn(key: string, fallback: string): string {
  if (!i18next.isInitialized) return fallback;
  // returnObjects=false så vi alltid får streng tilbake (vi vil aldri ha objekt her)
  return String(i18next.t(key, { defaultValue: fallback }));
}

/**
 * Justeringer som legges på base-anbefalingen.
 *
 * Iter 26 (v0.3.0) — etter validering av regelsettet via second-opinion-runder:
 * - Hals temperaturavhengig (vind ≥5 m/s OG feels <5 °C)
 * - Skall-lag-tilnærming (vind ≥5 m/s + feels <10 °C → vindtett skall)
 * - <6 mnd har lavere vindterskel
 * - Luftfuktighet snevret til feels <10 °C
 * - <3 mnd spesifikke regler (maks 30 min ute, ikke ved vind ≥5)
 * - Sol/klarvær-modifier (vogn-tildekkings-advarsel uavhengig av temp)
 * - Sol/UV-noter for solkrem (delt etter alder)
 * - Bilstol-note ved vinterdress
 * - Etter-aktivitet-note for utelek
 * - Utesov-warning i frost
 * - Bæresele "innenfor jakka" (hopp yttertøy)
 * - Vindvotter ved ≥8 m/s + feels <0 °C
 * - Ullsokker eksplisitt ved feels ≤5 °C
 *
 * Iter 33 i18n-migrering (jun 2026):
 * - Alle note-strenger via i18next.t('notes.path.key', fallback) for å
 *   støtte 6 språk (no, en, sv, da, fi, de). Hardkodete norske fallbacks
 *   beholdes for backwards-compat hvis i18next ikke er initialisert.
 *
 * Returnerer både flat notes-array (backwards-compat) og structuredNotes
 * (kategori-merket for UI-gruppering).
 */
export function applyModifiers(
  baseLayers: Layer[],
  input: RecommendInput,
): { layers: Layer[]; notes: string[]; structuredNotes: Note[] } {
  const layers = cloneLayers(baseLayers);
  const structuredNotes: Note[] = [];
  const { weather, child, activity } = input;
  const exposureMin = input.exposureMin ?? 60;

  const isSunSymbol = weather.symbolCode
    ? /^(clearsky|fair|partlycloudy)/.test(weather.symbolCode)
    : false;
  const isSpedbarn = child.ageMonths < 6;

  // Iter 32a — Søvn er innendørs, hopper over ute-spesifikke modifikatorer.
  if (activity === 'soevn') {
    // Universell kjenn-på-nakken (gjelder også sov)
    pushNote(
      structuredNotes,
      'sikkerhet',
      tn('notes.common.neckCheck', 'Kjenn på nakken med to fingre — varm og tørr betyr passe.'),
    );

    // Romtemperatur-veiledning
    if (weather.feelsLikeC > 23) {
      pushNote(
        structuredNotes,
        'overoppheting',
        tn(
          'notes.sleep.warmRoom',
          'Soverommet er varmt — luft litt eller velg tynnere sovepose.',
        ),
      );
    } else if (weather.feelsLikeC < 16) {
      pushNote(
        structuredNotes,
        'kulde',
        tn('notes.sleep.coolRoom', 'Soverommet er kjølig — sett gjerne opp varmen et hakk.'),
      );
    }

    // SIDS-sikkerhetsmelding (alltid for søvn)
    pushNote(
      structuredNotes,
      'sikkerhet',
      tn(
        'notes.sleep.safeSleep',
        'Sovepose er tryggest. Ingen løse tepper eller puter i sengen.',
      ),
    );

    // Spedbarn under 3 mnd — ekstra obs
    if (child.ageMonths <= 3) {
      pushNote(
        structuredNotes,
        'alder',
        tn(
          'notes.sleep.newbornBackSleep',
          'Den minste sover trygt på rygg. Stikk innom og sjekk nakken nå og da.',
        ),
      );
    }

    // Hopp ute-modifikatorer
    const notes = structuredNotes.map((n) => n.message);
    return { layers, notes, structuredNotes };
  }

  // 1. Nedbør — regntrekk/regntøy med oppgraderte terskler
  // B-2 (2026-06-12): regntrekk for vogn flyttet fra 'ekstra' til 'utstyr'
  // — det er eksternt utstyr på vognen, ikke et klesplagg på barnet.
  if (weather.precipMmH >= 0.5) {
    if (activity === 'vogn') {
      addItem(layers, 'utstyr', 'regntrekk på vognen');
    } else if (activity === 'utelek') {
      addItem(layers, 'yttertoy', 'regntøy / skall');
    } else if (activity === 'baeresele') {
      addItem(layers, 'ekstra', 'regnponcho over bæresele');
    }
    if (weather.precipMmH >= 2) {
      pushNote(
        structuredNotes,
        'nedbor',
        tn('notes.rain.heavy', 'Det høljer ned — kanskje en kortere tur eller helt overbygd vogn?'),
      );
    }
  } else if (weather.precipMmH >= 0.2) {
    pushNote(
      structuredNotes,
      'nedbor',
      tn('notes.rain.drizzle', 'Lett yr — kalesjen holder som regel. Kjenn etter om det blir vått.'),
    );
  }

  // B-2 utvidet (2026-06-12): vognpose og kjørepose i utstyr-kategori.
  // - Vognpose: vogn + kjølig (føles <5°). Isolert pose i selve vognen,
  //   komplementerer varmepose-i-ekstra (over barnet) — vognpose er
  //   isolasjonen UNDER barnet. Voksende viktighet ved kald-band+.
  // - Kjørepose: vogn + bilstol-kontekst. HB-9 fjerner vinterdress i
  //   bilstol (klemmer selen). Kjørepose er bilstol-vennlig alternativ
  //   som legges over (utenpå sele/barn).
  if (activity === 'vogn' && weather.feelsLikeC < 5) {
    addItem(layers, 'utstyr', 'vognpose');
  }
  if (activity === 'vogn' && input.context?.bilstol === true) {
    addItem(layers, 'utstyr', 'kjørepose');
  }

  // 2. Vind — skall-lag-tilnærming + temperaturavhengig hals
  const vindTerskelKortere = isSpedbarn ? 7 : 10;
  if (weather.windMs >= 5) {
    // Vindtett skall ved 5 m/s + kjølig/mild utelek (V0-runde 4 F28.24:
    // ved 14° utelek med vind ≥ 5 m/s er mellomlag uten ytterlag for
    // utsatt. Vindtett skall som betinget ytterlag — ikke full kjøredress.)
    if (weather.feelsLikeC < 16 && activity === 'utelek') {
      addItem(layers, 'yttertoy', 'vindtett skall');
    }
    // Hals temperaturavhengig
    if (weather.feelsLikeC < 5) {
      addItem(layers, 'ekstra', 'halsedisse');
    }
  }
  if (weather.windMs >= 8) {
    // Anbefal hals uavhengig av temp ved sterk vind
    addItem(layers, 'ekstra', 'halsedisse');
    // Vindvotter ved sterk vind + kulde
    if (weather.feelsLikeC < 0) {
      addItem(layers, 'ekstra', 'vindvotter (skall)');
    }
  }
  if (weather.windMs >= vindTerskelKortere) {
    pushNote(
      structuredNotes,
      'kulde',
      tn('notes.wind.strong', 'Det blåser friskt — beskytt ansiktet, og hold turen kort.'),
    );
  }

  // 3. Ullsokker eksplisitt ved kjølig+ (iter 26 — synliggjøring)
  if (weather.feelsLikeC <= 5) {
    addItem(layers, 'innerst', 'ullsokker');
  }

  // 4. Luftfuktighet — kun ved kjølig (snevret v0.3.0)
  if (weather.humidity !== undefined && weather.humidity >= 80 && weather.feelsLikeC < 10) {
    pushNote(
      structuredNotes,
      'kulde',
      tn(
        'notes.humidCold',
        'Fuktig kulde føles kaldere enn det termometeret sier — ett ekstra lag er smart.',
      ),
    );
  }

  // 5. Alder — <3 mnd spesifikt + universell kjenn-på-nakken
  pushNote(
    structuredNotes,
    'sikkerhet',
    tn('notes.common.neckCheck', 'Kjenn på nakken med to fingre — varm og tørr betyr passe.'),
  );
  if (child.ageMonths <= 3) {
    pushNote(
      structuredNotes,
      'alder',
      tn(
        'notes.newborn.thermoregulation',
        'Den minste regulerer varme dårlig — sjekk nakke og rygg ofte.',
      ),
    );
    if (weather.feelsLikeC < 0) {
      pushNote(
        structuredNotes,
        'alder',
        tn(
          'notes.newborn.coldShortTrip',
          'Hold turen kort i kulda — maks en halvtime. Smør fet krem på kinnene.',
        ),
      );
      if (weather.windMs >= 5) {
        pushNote(
          structuredNotes,
          'alder',
          tn(
            'notes.newborn.coldWindWait',
            'Vind og kulde er hardt for de minste — vurder å vente til vinden løyer.',
          ),
        );
      }
    }
    if (weather.feelsLikeC < 5) {
      addItem(layers, 'mellomlag', 'ekstra ull-lag');
    }
  }

  // 6. Vogn-overoppheting — flerlags-fix per validering
  if (activity === 'vogn') {
    // Universell tildekkings-advarsel (uansett temp) — SIDS-risiko
    pushNote(
      structuredNotes,
      'sikkerhet',
      tn('notes.stroller.noBlanket', 'Aldri teppe over kalesjen — det blir en varmefelle.'),
    );
    // Ved varmepose: ikke løst teppe oppå
    const harVarmepose = layers.some((l) =>
      l.items.some((i) => /varmepose/.test(i)),
    );
    if (harVarmepose) {
      pushNote(
        structuredNotes,
        'overoppheting',
        tn(
          'notes.stroller.warmPouchBlanket',
          'Bruk enten varmepose eller teppe, ikke begge — det blir fort for varmt.',
        ),
      );
    }
    if (weather.feelsLikeC >= 18) {
      pushNote(
        structuredNotes,
        'overoppheting',
        tn(
          'notes.stroller.mildShade',
          'Mild dag i vogn — søk skygge og kjenn på nakken nå og da.',
        ),
      );
    }
    if (weather.feelsLikeC >= 15 && isSunSymbol) {
      removeItem(layers, 'ekstra', 'varmepose lett');
      pushNote(
        structuredNotes,
        'overoppheting',
        tn('notes.stroller.sunTent', 'Sol og vogn = teltvarme. Et luftig solseil er bedre.'),
      );
      pushNote(
        structuredNotes,
        'sikkerhet',
        tn(
          'notes.stroller.sunHatWithShade',
          'Solhatt anbefales selv med solseil — sollyset kommer fra siden også. Du kan velge bort hvis barnet ligger helt i skygge.',
        ),
      );
    }
  }

  // 7. Bæresele — pustefukt + foreldrekropp varmer
  if (activity === 'baeresele') {
    if (weather.feelsLikeC < 0) {
      pushNote(
        structuredNotes,
        'sikkerhet',
        tn(
          'notes.carrier.noDownInside',
          'Du varmer barnet med kroppen din — unngå dun helt innerst, det blir klamt.',
        ),
      );
    }
    if (input.innerJakke && weather.feelsLikeC < 10) {
      const yttertoy = layers.find((l) => l.category === 'yttertoy');
      if (yttertoy) yttertoy.items = [];
      pushNote(
        structuredNotes,
        'overoppheting',
        tn(
          'notes.carrier.insideJacket',
          'Barnet er innenfor jakka — du holder varmen, hopp yttertøyet.',
        ),
      );
    }
  }

  // 8. Utelek — kulde-warnings
  if (activity === 'utelek') {
    if (weather.feelsLikeC < -10) {
      pushNote(
        structuredNotes,
        'kulde',
        tn(
          'notes.outdoorPlay.coldKindergarten',
          'Skikkelig kaldt — sjekk hva barnehagen anbefaler for ute-lek i dag.',
        ),
      );
    }
    if (weather.feelsLikeC < 5) {
      pushNote(
        structuredNotes,
        'kulde',
        tn(
          'notes.outdoorPlay.coldBreakLayer',
          'Når dere tar pause: legg på et ekstra lag. Barn kjøler seg fort.',
        ),
      );
    }
  }

  // 9. Frost-krem + frostrose-sjekk (bevart fra v0.2.0)
  if (weather.feelsLikeC <= -5) {
    pushNote(
      structuredNotes,
      'kulde',
      tn(
        'notes.cold.frostCream',
        'Smør litt fet krem på kinnene en halvtime før dere går ut.',
      ),
    );
  }
  if (weather.feelsLikeC <= -7 && weather.windMs >= 3) {
    pushNote(
      structuredNotes,
      'kulde',
      tn(
        'notes.cold.frostWindCheck',
        'Følg med på kinn og ører underveis — hvite flekker er tegn på at det fryser.',
      ),
    );
  }

  // 10. Sol/UV — delt etter alder
  if (isSunSymbol && weather.feelsLikeC >= 10) {
    if (child.ageMonths < 6) {
      pushNote(
        structuredNotes,
        'sol',
        tn(
          'notes.sun.youngShade',
          'Solen er fin, men hold den minste i skygge. Solkrem venter til etter 6 måneder.',
        ),
      );
    } else {
      pushNote(
        structuredNotes,
        'sol',
        tn(
          'notes.sun.olderHatSunscreen',
          'Solhatt og solkrem på det som vises. Sjekk UV — fjell og snø kan overraske.',
        ),
      );
    }
  }
  if (weather.uvIndex !== undefined && weather.uvIndex >= 6) {
    pushNote(
      structuredNotes,
      'sol',
      tn('notes.sun.uvHigh', 'Solen er sterk i dag — hold dere i skygge mellom 11 og 15.'),
    );
  }

  // 11. Bilstol-note (gjelder vinterdress)
  const harVinterdress = layers.some((l) =>
    l.items.some((i) => /vinterdress|vinterkjøredress|isolert dress/.test(i)),
  );
  if (harVinterdress) {
    pushNote(
      structuredNotes,
      'sikkerhet',
      tn(
        'notes.safety.carSeatThickSuit',
        'I bilstolen: ta av den tykke dressen, stram selen, legg dressen over som teppe.',
      ),
    );
  }

  // 12. Ekstrem varme — sikkerhet
  if (weather.feelsLikeC >= 28) {
    pushNote(
      structuredNotes,
      'overoppheting',
      tn(
        'notes.heat.extreme',
        'Veldig varmt i dag — aldri alene i bilen, masse å drikke, mye skygge.',
      ),
    );
    if (child.ageMonths < 6) {
      pushNote(
        structuredNotes,
        'overoppheting',
        tn(
          'notes.newborn.heatTolerance',
          'Spedbarn tåler varme dårlig — kort utetid og skygge er viktigst.',
        ),
      );
    }
  }

  // 13. Lang eksponering ved kulde
  if (exposureMin > 90 && weather.feelsLikeC < 5) {
    pushNote(
      structuredNotes,
      'kulde',
      tn('notes.cold.longTripBreak', 'Lang tur i kulda — planlegg en innendørs pause for å varme opp.'),
    );
  }

  // 14. Utesov i frost-bånd
  if (activity === 'vogn' && weather.feelsLikeC < -7 && exposureMin > 30) {
    pushNote(
      structuredNotes,
      'sikkerhet',
      tn(
        'notes.stroller.outdoorSleepFrost',
        'Utesov i frost: sjekk innom hvert halvtime. Varmepose dun alene er ikke alltid nok.',
      ),
    );
  }

  // 15. Peak overheating-warning ved 7-9 mnd i varmt vær.
  // Kilde: PMC-12386404 — metabolic heat production peaks ved 8-9 mnd.
  // Se src/lib/research/safety-flags.ts → 'peak-overheating-7-9mo'.
  if (child.ageMonths >= 7 && child.ageMonths <= 9 && weather.feelsLikeC >= 22) {
    pushNote(
      structuredNotes,
      'overoppheting',
      tn(
        'notes.peak.overheating79mo',
        'Barn på 7–9 mnd produserer mest kroppsvarme. Bruk færre lag enn vanlig, sjekk nakken ofte.',
      ),
    );
  }

  // 16. Newborn cold-limit ved frost (<3 mnd + <0°C).
  // Kilde: AAP healthychildren + Capital Area Pediatrics.
  // Se src/lib/research/safety-flags.ts → 'newborn-cold-limit'.
  if (child.ageMonths < 3 && weather.feelsLikeC < 0) {
    pushNote(
      structuredNotes,
      'alder',
      tn(
        'notes.newborn.coldLimit',
        'Spedbarn under 3 mnd: maks 30 min ute i kuldegrader. Sjekk nakke og rygg ofte.',
      ),
    );
  }

  // 17. Fottøy-alders-justering (Iter 34, jun 2026)
  // Babyer 0-8 mnd krabber/ligger og bruker ikke sko utendørs — føttene
  // varmes via vinterdress-fottak + ullsokker. 9-15 mnd: tøfler eller
  // myke babysko. 16+ mnd: faktiske sko/vintersko.
  // Engine-tabellen er aldersnøytral; modifieren overstyrer her.
  if (activity === 'utelek' || activity === 'baeresele') {
    if (child.ageMonths < 9) {
      // Spedbarn / krabbere: ingen sko utendørs
      for (const layer of layers) {
        layer.items = layer.items.filter((i) => !/^(vintersko|vintersko isolerte|sko|sandaler|tøffel-sko)$/i.test(i));
      }
      if (weather.feelsLikeC <= 10) {
        // F28.22 V0 P0 #3: «tykke ullsokker» erstatter generelle
        // «ullsokker» (lagt til ved feelsLikeC ≤ 5 i punkt 3 over).
        // Uten removeItem får cold-skjermen begge versjonene listet.
        removeItem(layers, 'innerst', 'ullsokker');
        addItem(layers, 'innerst', 'tykke ullsokker');
      }
      if (weather.feelsLikeC < 5) {
        pushNote(
          structuredNotes,
          'alder',
          tn(
            'notes.footwear.babyDressCovers',
            'Vinterdress med integrerte fottak holder føttene varme — sjekk nakken nå og da.',
          ),
        );
      }
    } else if (child.ageMonths < 16) {
      // 9-15 mnd: nedjusterte fotvarmer
      for (const layer of layers) {
        layer.items = layer.items.map((i) => {
          if (/^vintersko isolerte$/i.test(i)) return 'tykke ullsokker (vinterdress dekker)';
          if (/^vintersko$/i.test(i)) return 'tøffel-sko + tykke ullsokker';
          if (/^sandaler$/i.test(i)) return 'barfot eller tynne tøfler';
          if (i === 'sko') return 'tøffel-sko';
          return i;
        });
      }
    }
    // 16-24 mnd: ingen endring — bruker tabellens anbefalinger som-er
  }

  // Backwards-compat: flat notes-array
  const notes = structuredNotes.map((n) => n.message);

  return { layers, notes, structuredNotes };
}
