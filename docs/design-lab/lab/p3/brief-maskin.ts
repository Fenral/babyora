/**
 * P3/P4 — brief-tilstandsmaskinen med cachekontrakten
 * (spec v2 §4 pkt. 3, Sols P1-krav om issuedAt/validFrom/expiresAt/
 * supersedes/baselineVersjon/scenarioFingerprint + regler for offline,
 * forsinkelse, rekkefølgefeil og klokkeavvik).
 *
 * Invarianter (bevises i brief-maskin.test.ts):
 *  I1  Nyere versjon vinner alltid; en ELDRE brief som ankommer ETTER en
 *      nyere (forsinket V1 etter V2) forkastes.
 *  I2  Maskering er ENVEIS: en utløpt/revokert/supersedet brief kan aldri
 *      re-autoriseres — heller ikke om den virtuelle klokken stilles
 *      tilbake (klokkeavvik-regelen).
 *  I3  Offline beholdes gjeldende brief med stale-flagg når expiresAt
 *      passeres; ved online-overgang maskeres den hvis fortsatt utløpt.
 *  I4  Revokering maskerer umiddelbart.
 *  I5  Stale er MONOTONT (Sols avvik d): en brief som én gang er observert
 *      stale/utløpt/maskert/revokert blir aldri autoritativ (aktiv) igjen
 *      uten en NYERE gyldig versjon — klokketilbakerulling reaktiverer
 *      aldri. Offline forblir den synlig som stale-fallback; online
 *      maskeres den permanent.
 *
 * Maskinen er en ren funksjon: motta(tilstand, hendelse, klokke) →
 * ny tilstand. Ingen IO, ingen Date.now() — all tid kommer fra den
 * virtuelle klokken.
 */

export type Brief = {
  briefId: string;
  versjon: number;
  issuedAtISO: string;
  validFromISO: string;
  expiresAtISO: string;
  /** briefId denne briefen erstatter — den maskeres ved aksept. */
  supersedes?: string;
  /** Hvilken baselineversjon briefen er et delta mot (P4-syntese). */
  baselineVersjon?: number;
  /** Hash av scenariokonteksten briefen ble beregnet for. */
  scenarioFingerprint: string;
  /** Nøytralt innhold (retningene transformerer selv). */
  innhold: string;
};

export type BriefHendelse =
  | { type: 'brief'; brief: Brief }
  | { type: 'revokering'; briefId: string }
  | { type: 'offline' }
  | { type: 'online' }
  /** Ren tidshendelse: klokken har beveget seg (også bakover). */
  | { type: 'klokke' };

export type VirtuellKlokke = {
  naaISO: string;
};

export type BriefStatus =
  /** Ingen brief mottatt ennå. */
  | 'ingen'
  /** Gjeldende brief er innenfor [validFrom, expiresAt) — autoritativ. */
  | 'aktiv'
  /** Mottatt, men validFrom er ikke nådd ennå. */
  | 'ventende'
  /** Utløpt mens offline: beholdes synlig, men flagget som foreldet. */
  | 'stale'
  /** Maskert (utløpt online / revokert / supersedet) — ENVEIS. */
  | 'maskert';

export type Forkastet = {
  briefId: string;
  versjon: number;
  grunn: 'eldre-versjon' | 'duplikat-versjon' | 'maskert-enveis';
};

export type BriefTilstand = {
  gjeldende: Brief | null;
  status: BriefStatus;
  offline: boolean;
  /** briefIds som er maskert for alltid (enveis — krymper aldri). */
  maskerte: readonly string[];
  /**
   * briefIds som noen gang er observert stale (I5 — krymper aldri).
   * En slik brief kan aldri bli 'aktiv' igjen, uansett klokke.
   */
  staleObserverte: readonly string[];
  /** Høyeste versjon noensinne akseptert — eldre kan aldri vinne. */
  hoyesteVersjon: number;
  /** Logg over forkastede briefs (for tester og selens hendelseslogg). */
  forkastede: readonly Forkastet[];
};

export const START_TILSTAND: BriefTilstand = {
  gjeldende: null,
  status: 'ingen',
  offline: false,
  maskerte: [],
  staleObserverte: [],
  hoyesteVersjon: 0,
  forkastede: [],
};

function tid(iso: string): number {
  return Date.parse(iso);
}

function erUtlopt(brief: Brief, klokke: VirtuellKlokke): boolean {
  return tid(klokke.naaISO) >= tid(brief.expiresAtISO);
}

function erForTidlig(brief: Brief, klokke: VirtuellKlokke): boolean {
  return tid(klokke.naaISO) < tid(brief.validFromISO);
}

function maskerteMed(
  maskerte: readonly string[],
  ...ids: (string | undefined)[]
): readonly string[] {
  const ny = new Set(maskerte);
  for (const id of ids) if (id !== undefined) ny.add(id);
  return [...ny];
}

/**
 * Maskér gjeldende brief permanent. Enveis: id-en legges i maskerte og
 * kan aldri bli autoritativ igjen (I2).
 */
function maskerGjeldende(tilstand: BriefTilstand): BriefTilstand {
  return {
    ...tilstand,
    status: 'maskert',
    maskerte: maskerteMed(tilstand.maskerte, tilstand.gjeldende?.briefId),
  };
}

function mottaBrief(
  tilstand: BriefTilstand,
  brief: Brief,
  klokke: VirtuellKlokke,
): BriefTilstand {
  // I2: en maskert briefId kan aldri re-autoriseres — uansett klokke.
  if (tilstand.maskerte.includes(brief.briefId)) {
    return {
      ...tilstand,
      forkastede: [
        ...tilstand.forkastede,
        { briefId: brief.briefId, versjon: brief.versjon, grunn: 'maskert-enveis' },
      ],
    };
  }

  // I1: eldre (eller lik) versjon etter nyere forkastes — forsinket V1
  // etter V2 blir aldri autoritativ.
  if (brief.versjon <= tilstand.hoyesteVersjon) {
    return {
      ...tilstand,
      forkastede: [
        ...tilstand.forkastede,
        {
          briefId: brief.briefId,
          versjon: brief.versjon,
          grunn:
            brief.versjon === tilstand.hoyesteVersjon
              ? 'duplikat-versjon'
              : 'eldre-versjon',
        },
      ],
    };
  }

  // Akseptert: nyere versjon vinner alltid. Supersedet brief maskeres.
  const maskerte = maskerteMed(tilstand.maskerte, brief.supersedes);
  const basis: BriefTilstand = {
    ...tilstand,
    gjeldende: brief,
    hoyesteVersjon: brief.versjon,
    maskerte,
  };

  // Ankommer allerede utløpt → maskeres umiddelbart (og enveis).
  if (erUtlopt(brief, klokke)) {
    return {
      ...basis,
      status: 'maskert',
      maskerte: maskerteMed(maskerte, brief.briefId),
    };
  }
  if (erForTidlig(brief, klokke)) {
    return { ...basis, status: 'ventende' };
  }
  return { ...basis, status: 'aktiv' };
}

/** Re-evaluer status for gjeldende brief mot klokken (tid/online-skift). */
function reevaluer(tilstand: BriefTilstand, klokke: VirtuellKlokke): BriefTilstand {
  const brief = tilstand.gjeldende;
  if (brief === null) return tilstand;

  // I2: maskert er terminal — klokke tilbake i tid endrer ingenting.
  if (tilstand.status === 'maskert') return tilstand;

  if (erUtlopt(brief, klokke)) {
    // I3: offline beholder briefen med stale-flagg; online maskerer.
    // Stale-observasjonen registreres permanent (I5 — monotont).
    if (tilstand.offline) {
      return {
        ...tilstand,
        status: 'stale',
        staleObserverte: maskerteMed(tilstand.staleObserverte, brief.briefId),
      };
    }
    return maskerGjeldende(tilstand);
  }

  // Ikke utløpt — men klokken kan ha gått TILBAKE. I5 (Sols avvik d):
  // en brief som én gang er observert stale blir aldri autoritativ igjen
  // uten en nyere gyldig versjon. Offline forblir den synlig som stale-
  // fallback; online maskeres den permanent (enveis).
  if (tilstand.staleObserverte.includes(brief.briefId)) {
    if (tilstand.offline) return { ...tilstand, status: 'stale' };
    return maskerGjeldende(tilstand);
  }

  if (erForTidlig(brief, klokke)) return { ...tilstand, status: 'ventende' };
  return { ...tilstand, status: 'aktiv' };
}

/**
 * Hovedinngang: én hendelse inn, ny tilstand ut. Ren og deterministisk.
 *
 * ALLE hendelser bærer et klokkeobservasjonspunkt: også en forkastet
 * brief-ankomst re-evaluerer gjeldende brief mot klokken (tiden er
 * observert — et utløp kan ikke overses fordi hendelsen var irrelevant).
 */
export function motta(
  tilstand: BriefTilstand,
  hendelse: BriefHendelse,
  klokke: VirtuellKlokke,
): BriefTilstand {
  switch (hendelse.type) {
    case 'brief':
      return reevaluer(mottaBrief(tilstand, hendelse.brief, klokke), klokke);

    case 'revokering': {
      // I4: umiddelbar, enveis maskering av id-en.
      const maskerte = maskerteMed(tilstand.maskerte, hendelse.briefId);
      if (tilstand.gjeldende?.briefId === hendelse.briefId) {
        return { ...tilstand, maskerte, status: 'maskert' };
      }
      return reevaluer({ ...tilstand, maskerte }, klokke);
    }

    case 'offline':
      return reevaluer({ ...tilstand, offline: true }, klokke);

    case 'online':
      return reevaluer({ ...tilstand, offline: false }, klokke);

    case 'klokke':
      return reevaluer(tilstand, klokke);
  }
}
