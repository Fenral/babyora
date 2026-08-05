/**
 * Kontrakttest §4.2 — semantikk-kontrakten for retningstransformatorene.
 *
 * Gitt samme NoytraleFakta skal ETHVERT retningsuttrykk (P1-protokoll,
 * P2-spenn, P3-brief) bære samme sikkerhetsinnhold: samme safetyEvent-ids,
 * samme stoppkriterier, samme gyldighet. Formen er fri — semantikken låst.
 *
 * Transformatorene er ikke bygget ennå; her testes selve PORTEN
 * (semantikkAvtrykk + sjekkSemantikk) som de SKAL bestå senere:
 * et komplett mock-uttrykk passerer, et som mangler ett stoppkriterium
 * eller én safety-hendelse feiler.
 */

import { describe, expect, it } from 'vitest';
import { scenarioForId } from '../felles/scenarier';
import {
  hentFakta,
  semantikkAvtrykk,
  sjekkSemantikk,
  type NoytraleFakta,
  type RetningsUttrykk,
} from '../felles/fakta';

function faktaFor(id: string): NoytraleFakta {
  const scenario = scenarioForId(id);
  if (!scenario) throw new Error(`ukjent scenario: ${id}`);
  return hentFakta(scenario);
}

/** Et komplett uttrykk bygget direkte fra avtrykket (minste beståtte). */
function komplettUttrykk(retning: string, fakta: NoytraleFakta): RetningsUttrykk {
  const avtrykk = semantikkAvtrykk(fakta);
  return {
    retning,
    safetyEventIds: [...avtrykk.safetyEventIds],
    stoppkriterier: [...avtrykk.stoppkriterier],
    gyldigTil: avtrykk.gyldigTil,
  };
}

describe('semantikkAvtrykk — fasiten er ikke-vakuøs og deterministisk', () => {
  it('bilstol-scenariet bærer faktisk sikkerhetsinnhold (≥2 events, ≥1 stoppkriterium)', () => {
    const avtrykk = semantikkAvtrykk(faktaFor('bilstol'));
    // Motoren gir CK-6 (hard), HB-9 (hard) og SB-8 (soft) for bilstol i −13 °C.
    expect(avtrykk.safetyEventIds.length).toBeGreaterThanOrEqual(2);
    expect(avtrykk.safetyEventIds).toContain('HB-9');
    expect(avtrykk.stoppkriterier.length).toBeGreaterThanOrEqual(1);
    expect(avtrykk.gyldigTil).toBe('2026-01-15T16:30:00+01:00');
  });

  it('samme fakta → samme avtrykk (to kall er identiske)', () => {
    const fakta = faktaFor('bilstol');
    expect(semantikkAvtrykk(fakta)).toEqual(semantikkAvtrykk(fakta));
  });

  it('harde events har alltid stoppkriterium i faktalaget', () => {
    const fakta = faktaFor('bilstol');
    for (const event of fakta.safetyEvents) {
      if (event.prioritet === 'hard') {
        expect(event.stoppkriterium, `hard event ${event.id}`).toBeTruthy();
      }
      expect(event.forventetHandling).toBeTruthy();
      expect(event.innhold).toBeTruthy();
    }
  });
});

describe('sjekkSemantikk — porten transformatorene skal bestå', () => {
  it('komplett uttrykk passerer', () => {
    const fakta = faktaFor('bilstol');
    const resultat = sjekkSemantikk(komplettUttrykk('p1', fakta), fakta);
    expect(resultat.mangler).toEqual([]);
    expect(resultat.ok).toBe(true);
  });

  it('uttrykk som mangler ETT stoppkriterium feiler', () => {
    const fakta = faktaFor('bilstol');
    const uttrykk = komplettUttrykk('p1', fakta);
    const fjernet = uttrykk.stoppkriterier.pop();
    expect(fjernet).toBeTruthy(); // ikke-vakuøst: det VAR noe å fjerne

    const resultat = sjekkSemantikk(uttrykk, fakta);
    expect(resultat.ok).toBe(false);
    expect(
      resultat.mangler.some((m) => m.startsWith('stoppkriterium mangler')),
    ).toBe(true);
  });

  it('uttrykk som mangler ÉN safety-hendelse feiler', () => {
    const fakta = faktaFor('bilstol');
    const uttrykk = komplettUttrykk('p3', fakta);
    uttrykk.safetyEventIds = uttrykk.safetyEventIds.filter((id) => id !== 'HB-9');

    const resultat = sjekkSemantikk(uttrykk, fakta);
    expect(resultat.ok).toBe(false);
    expect(resultat.mangler).toContain('safety-event mangler: HB-9');
  });

  it('uttrykk med feil gyldighet feiler', () => {
    const fakta = faktaFor('bilstol');
    const uttrykk = komplettUttrykk('p3', fakta);
    uttrykk.gyldigTil = '2026-01-15T23:59:00+01:00';

    const resultat = sjekkSemantikk(uttrykk, fakta);
    expect(resultat.ok).toBe(false);
    expect(resultat.mangler.some((m) => m.startsWith('gyldighet avviker'))).toBe(true);
  });

  it('formen er fri: tre retninger med ulik form men samme semantikk passerer alle', () => {
    const fakta = faktaFor('bilstol');
    const avtrykk = semantikkAvtrykk(fakta);

    const uttrykk: RetningsUttrykk[] = [
      // P1-protokoll: samme innhold i omvendt rekkefølge.
      {
        retning: 'p1',
        safetyEventIds: [...avtrykk.safetyEventIds].reverse(),
        stoppkriterier: [...avtrykk.stoppkriterier].reverse(),
        gyldigTil: avtrykk.gyldigTil,
      },
      // P2-spenn: samme innhold + EKSTRA premisshendelse (mer er lov).
      {
        retning: 'p2',
        safetyEventIds: [...avtrykk.safetyEventIds, 'P2-PREMISS-1'],
        stoppkriterier: [...avtrykk.stoppkriterier],
        gyldigTil: avtrykk.gyldigTil,
      },
      // P3-brief: minste komplette uttrykk.
      komplettUttrykk('p3', fakta),
    ];

    for (const u of uttrykk) {
      const resultat = sjekkSemantikk(u, fakta);
      expect(resultat.mangler, `retning ${u.retning}`).toEqual([]);
      expect(resultat.ok).toBe(true);
    }
  });

  it('degradert fakta: avtrykket er tomt for events men gyldigheten håndheves fortsatt', () => {
    const fakta = faktaFor('manglende-vaerdata');
    const avtrykk = semantikkAvtrykk(fakta);
    expect(avtrykk.safetyEventIds).toEqual([]);
    expect(avtrykk.stoppkriterier).toEqual([]);

    const utenGyldighet: RetningsUttrykk = {
      retning: 'p1',
      safetyEventIds: [],
      stoppkriterier: [],
      gyldigTil: null,
    };
    expect(sjekkSemantikk(utenGyldighet, fakta).ok).toBe(false);
    expect(sjekkSemantikk(komplettUttrykk('p1', fakta), fakta).ok).toBe(true);
  });
});
