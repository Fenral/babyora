/**
 * Kontrakttest §4.3 — brief-tilstandsmaskinen.
 *
 * Del 1: rettede tester for hver cacheregel (forsinket V1 etter V2,
 * utløp, klokkeavvik, offline/stale, revokering, supersedes, ventende).
 *
 * Del 2: property-aktig test — 250 seedede tilfeller (mulberry32, IKKE
 * Math.random) med briefs i tilfeldig ankomstrekkefølge over en virtuell
 * klokke som også hopper BAKOVER. Invarianter asserteres etter hvert steg:
 *   I1  eldre versjon vinner aldri (gjeldende versjon synker aldri)
 *   I2  maskert er enveis — en maskert briefId blir aldri aktiv igjen,
 *       selv om klokken stilles tilbake
 *   I3  aktiv ⇒ innenfor [validFrom, expiresAt) ved gjeldende klokke
 *   I4  supersedes respekteres — en supersedet briefId blir aldri aktiv igjen
 */

import { describe, expect, it } from 'vitest';
import {
  motta,
  START_TILSTAND,
  type Brief,
  type BriefHendelse,
  type BriefTilstand,
  type VirtuellKlokke,
} from '../p3/brief-maskin';

const T0 = Date.parse('2026-01-15T08:00:00Z');
const MIN = 60_000;

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

function lagBrief(
  versjon: number,
  overstyr: Partial<Brief> = {},
): Brief {
  const issued = T0 + versjon * 10 * MIN;
  return {
    briefId: `B${versjon}`,
    versjon,
    issuedAtISO: iso(issued),
    validFromISO: iso(issued),
    expiresAtISO: iso(issued + 120 * MIN),
    scenarioFingerprint: 'scenario-normal-dag#fam1',
    innhold: `brief v${versjon}`,
    ...overstyr,
  };
}

function klokke(minutterEtterT0: number): VirtuellKlokke {
  return { naaISO: iso(T0 + minutterEtterT0 * MIN) };
}

describe('brief-maskinen — rettede cacheregler', () => {
  it('nyere versjon vinner alltid', () => {
    let t = motta(START_TILSTAND, { type: 'brief', brief: lagBrief(1) }, klokke(15));
    expect(t.status).toBe('aktiv');
    expect(t.gjeldende?.versjon).toBe(1);

    t = motta(t, { type: 'brief', brief: lagBrief(2) }, klokke(25));
    expect(t.status).toBe('aktiv');
    expect(t.gjeldende?.versjon).toBe(2);
  });

  it('forsinket V1 som ankommer ETTER V2 forkastes', () => {
    let t = motta(START_TILSTAND, { type: 'brief', brief: lagBrief(2) }, klokke(25));
    t = motta(t, { type: 'brief', brief: lagBrief(1) }, klokke(30));

    expect(t.gjeldende?.versjon).toBe(2);
    expect(t.forkastede).toContainEqual({
      briefId: 'B1',
      versjon: 1,
      grunn: 'eldre-versjon',
    });
  });

  it('duplikat av samme versjon forkastes', () => {
    let t = motta(START_TILSTAND, { type: 'brief', brief: lagBrief(1) }, klokke(15));
    t = motta(t, { type: 'brief', brief: lagBrief(1) }, klokke(20));
    expect(t.forkastede.at(-1)?.grunn).toBe('duplikat-versjon');
  });

  it('utløp online → maskert, og klokke tilbake re-autoriserer ALDRI (enveis)', () => {
    let t = motta(START_TILSTAND, { type: 'brief', brief: lagBrief(1) }, klokke(15));
    expect(t.status).toBe('aktiv');

    // Klokken passerer expiresAt (10 + 120 = 130 min etter T0).
    t = motta(t, { type: 'klokke' }, klokke(200));
    expect(t.status).toBe('maskert');
    expect(t.maskerte).toContain('B1');

    // Klokkeavvik: still klokken tilbake til før utløp — fortsatt maskert.
    t = motta(t, { type: 'klokke' }, klokke(30));
    expect(t.status).toBe('maskert');

    // Samme brief sendes på nytt mens klokken står «gyldig» — forkastes.
    t = motta(t, { type: 'brief', brief: lagBrief(1) }, klokke(30));
    expect(t.status).toBe('maskert');
    expect(t.forkastede.at(-1)?.grunn).toBe('maskert-enveis');
  });

  it('brief som ankommer allerede utløpt maskeres umiddelbart', () => {
    const t = motta(START_TILSTAND, { type: 'brief', brief: lagBrief(1) }, klokke(300));
    expect(t.status).toBe('maskert');
    expect(t.maskerte).toContain('B1');
  });

  it('offline: gjeldende beholdes med stale-flagg når expiresAt passeres', () => {
    let t = motta(START_TILSTAND, { type: 'brief', brief: lagBrief(1) }, klokke(15));
    t = motta(t, { type: 'offline' }, klokke(20));
    t = motta(t, { type: 'klokke' }, klokke(200));

    expect(t.status).toBe('stale');
    expect(t.gjeldende?.briefId).toBe('B1'); // beholdt, ikke kastet
    expect(t.maskerte).not.toContain('B1');

    // Tilbake online mens fortsatt utløpt → maskert.
    t = motta(t, { type: 'online' }, klokke(210));
    expect(t.status).toBe('maskert');
    expect(t.maskerte).toContain('B1');
  });

  it('revokering maskerer umiddelbart', () => {
    let t = motta(START_TILSTAND, { type: 'brief', brief: lagBrief(1) }, klokke(15));
    t = motta(t, { type: 'revokering', briefId: 'B1' }, klokke(16));
    expect(t.status).toBe('maskert');
    expect(t.maskerte).toContain('B1');

    // Enveis også her: re-sending forkastes.
    t = motta(t, { type: 'brief', brief: lagBrief(1) }, klokke(17));
    expect(t.forkastede.at(-1)?.grunn).toBe('maskert-enveis');
  });

  it('supersedes maskerer den erstattede briefen permanent', () => {
    let t = motta(START_TILSTAND, { type: 'brief', brief: lagBrief(1) }, klokke(15));
    t = motta(
      t,
      { type: 'brief', brief: lagBrief(2, { supersedes: 'B1' }) },
      klokke(25),
    );
    expect(t.gjeldende?.briefId).toBe('B2');
    expect(t.maskerte).toContain('B1');

    // Forsinket V1 etter supersede: forkastes som maskert (før versjonssjekk).
    t = motta(t, { type: 'brief', brief: lagBrief(1) }, klokke(26));
    expect(t.forkastede.at(-1)?.grunn).toBe('maskert-enveis');
  });

  it('validFrom i fremtiden → ventende, deretter aktiv når tiden er inne', () => {
    const brief = lagBrief(1, { validFromISO: iso(T0 + 60 * MIN) });
    let t = motta(START_TILSTAND, { type: 'brief', brief }, klokke(15));
    expect(t.status).toBe('ventende');

    t = motta(t, { type: 'klokke' }, klokke(70));
    expect(t.status).toBe('aktiv');
  });
});

/* ------------------------------------------------------------------ *
 * Del 2: property-aktig sekvenstest med seedet PRNG
 * ------------------------------------------------------------------ */

/** mulberry32 — deterministisk PRNG; Math.random er forbudt her. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Steg = { hendelse: BriefHendelse; klokke: VirtuellKlokke };

function lagSekvens(rnd: () => number): Steg[] {
  const antallVersjoner = 2 + Math.floor(rnd() * 4); // 2–5 versjoner
  const briefs: Brief[] = [];
  for (let v = 1; v <= antallVersjoner; v++) {
    briefs.push(
      lagBrief(v, {
        expiresAtISO: iso(T0 + v * 10 * MIN + (30 + Math.floor(rnd() * 180)) * MIN),
        supersedes: v > 1 && rnd() < 0.4 ? `B${v - 1}` : undefined,
      }),
    );
  }

  // Bland ankomstrekkefølgen (Fisher–Yates med seedet PRNG).
  for (let i = briefs.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [briefs[i], briefs[j]] = [briefs[j], briefs[i]];
  }

  const hendelser: BriefHendelse[] = briefs.map((b) => ({
    type: 'brief' as const,
    brief: b,
  }));
  // Fyll på med tids-, offline-, online- og revokeringshendelser.
  const antallEkstra = 3 + Math.floor(rnd() * 8);
  for (let i = 0; i < antallEkstra; i++) {
    const r = rnd();
    if (r < 0.55) hendelser.push({ type: 'klokke' });
    else if (r < 0.7) hendelser.push({ type: 'offline' });
    else if (r < 0.85) hendelser.push({ type: 'online' });
    else {
      const offer = 1 + Math.floor(rnd() * antallVersjoner);
      hendelser.push({ type: 'revokering', briefId: `B${offer}` });
    }
  }
  // Bland hele hendelsesrekkefølgen.
  for (let i = hendelser.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [hendelser[i], hendelser[j]] = [hendelser[j], hendelser[i]];
  }

  // Virtuell klokke: starter nær T0, hopper frem — og av og til BAKOVER.
  let naa = Math.floor(rnd() * 30);
  return hendelser.map((hendelse) => {
    const delta = Math.floor(rnd() * 150) - 40; // −40..+109 min
    naa = Math.max(0, naa + delta);
    return { hendelse, klokke: klokke(naa) };
  });
}

describe('brief-maskinen — property-invarianter (250 seedede sekvenser)', () => {
  const ANTALL_TILFELLER = 250;

  it('I1–I4 holder for alle sekvenser', () => {
    // Aggregerte tellere: beviser at invariantene faktisk ble utfordret
    // (ikke-vakuøsitet — grønt på fravær teller ikke).
    let antallForkastetEldre = 0;
    let antallMaskeringer = 0;
    let antallAktiv = 0;
    let antallStale = 0;

    for (let tilfelle = 0; tilfelle < ANTALL_TILFELLER; tilfelle++) {
      const rnd = mulberry32(0xb4b70a + tilfelle);
      const sekvens = lagSekvens(rnd);

      let tilstand: BriefTilstand = START_TILSTAND;
      const noensinneMaskert = new Set<string>();
      const supersedet = new Set<string>();

      for (const steg of sekvens) {
        const forrigeVersjon = tilstand.gjeldende?.versjon ?? 0;
        tilstand = motta(tilstand, steg.hendelse, steg.klokke);
        const ctx = `tilfelle=${tilfelle} hendelse=${JSON.stringify(steg.hendelse.type)} klokke=${steg.klokke.naaISO}`;

        // I1: gjeldende versjon synker aldri.
        const naaVersjon = tilstand.gjeldende?.versjon ?? 0;
        expect(naaVersjon, `I1 ${ctx}`).toBeGreaterThanOrEqual(forrigeVersjon);

        // Maskert-settet krymper aldri (enveis).
        for (const id of noensinneMaskert) {
          expect(tilstand.maskerte, `enveis ${ctx}`).toContain(id);
        }
        for (const id of tilstand.maskerte) noensinneMaskert.add(id);
        if (tilstand.gjeldende?.supersedes) {
          if (tilstand.maskerte.includes(tilstand.gjeldende.supersedes)) {
            supersedet.add(tilstand.gjeldende.supersedes);
          }
        }

        // I2 + I4: aktiv brief er aldri en maskert/supersedet id.
        if (tilstand.status === 'aktiv') {
          antallAktiv++;
          const aktivId = tilstand.gjeldende!.briefId;
          expect(noensinneMaskert.has(aktivId), `I2 ${ctx} id=${aktivId}`).toBe(false);
          expect(supersedet.has(aktivId), `I4 ${ctx} id=${aktivId}`).toBe(false);

          // I3: aktiv ⇒ innenfor gyldighetsvinduet ved gjeldende klokke.
          const naaMs = Date.parse(steg.klokke.naaISO);
          expect(naaMs, `I3-validFrom ${ctx}`).toBeGreaterThanOrEqual(
            Date.parse(tilstand.gjeldende!.validFromISO),
          );
          expect(naaMs, `I3-expiresAt ${ctx}`).toBeLessThan(
            Date.parse(tilstand.gjeldende!.expiresAtISO),
          );
        }
        if (tilstand.status === 'stale') {
          antallStale++;
          // Stale finnes kun offline — online skal utløp maskere.
          expect(tilstand.offline, `stale-krever-offline ${ctx}`).toBe(true);
        }
      }

      antallForkastetEldre += tilstand.forkastede.filter(
        (f) => f.grunn === 'eldre-versjon' || f.grunn === 'maskert-enveis',
      ).length;
      antallMaskeringer += tilstand.maskerte.length;
    }

    // Ikke-vakuøsitet: sekvensene må faktisk ha utfordret reglene.
    expect(antallForkastetEldre).toBeGreaterThan(50);
    expect(antallMaskeringer).toBeGreaterThan(100);
    expect(antallAktiv).toBeGreaterThan(200);
    expect(antallStale).toBeGreaterThan(10);
  });

  it('samme seed → samme forløp (deterministisk testgrunnlag)', () => {
    const kjør = () => {
      const rnd = mulberry32(4242);
      const sekvens = lagSekvens(rnd);
      let tilstand: BriefTilstand = START_TILSTAND;
      for (const steg of sekvens) tilstand = motta(tilstand, steg.hendelse, steg.klokke);
      return tilstand;
    };
    expect(kjør()).toEqual(kjør());
  });
});
