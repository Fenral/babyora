import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * FINSTEGENE GRUPPERES AV POSISJON, IKKE AV AVSTAND.
 *
 * Målt 2026-08-06 på den gamle utgaven: seks knapper i én vannrett rad under
 * de tre sliderne, med 16 px mellom knappene INNI et par og 4–5 px MELLOM
 * parene. Grupperingen sa altså det motsatte av hva knappene gjorde.
 *
 * Avstand kunne ikke løse det. De 16 px er et låst gulv (dommerfunn C7:
 * bomtrykk med votter), og regnestykket går ikke opp på 390 px:
 * 6 × 44 + 3 × 16 = 312 av ~336 tilgjengelige. Det er 24 px igjen til to
 * mellomrom som måtte blitt STØRRE enn 16.
 *
 * Eieren foreslo loddrett: pluss over sporet, minus under. Da trengs ingen
 * avstand, fordi POSISJONEN BLIR BETYDNINGEN — pluss øverst på en loddrett
 * slider er «opp», minus nederst er «ned». Hvert par tilhører synlig sin egen
 * kolonne. Breddeskranken forsvinner: 44 px per kolonne, ikke 104.
 *
 * DENNE PORTEN VOKTER REKKEFØLGEN, som er hele grunnen til at det virker.
 * Bytter noen om på + og −, er retningsbetydningen borte og skjermen lyver om
 * hva knappen gjør — uten at noe annet blir rødt.
 */
const TSX = resolve(process.cwd(), 'src/components/instrument/VerticalGauge.tsx');
const CSS = resolve(process.cwd(), 'src/components/instrument/vertical-gauge.css');

function les(p: string): string {
  return readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
}

describe('finstegene grupperes av posisjon', () => {
  it('pluss står FØR sporet og minus ETTER — retningen er betydningen', () => {
    const src = les(TSX);
    const iPluss = src.indexOf('aria-label={incrementLabel}');
    const iSpor = src.indexOf('className="fa-gauge-track"');
    const iMinus = src.indexOf('aria-label={decrementLabel}');

    expect(iPluss, 'fant ikke øk-knappen').toBeGreaterThan(-1);
    expect(iSpor, 'fant ikke sporet').toBeGreaterThan(-1);
    expect(iMinus, 'fant ikke reduser-knappen').toBeGreaterThan(-1);

    expect(
      iPluss < iSpor && iSpor < iMinus,
      'Rekkefølgen er ikke [+] · spor · [−]. På en LODDRETT slider er '
      + 'knappens plassering dens betydning: pluss øverst er «opp», minus '
      + 'nederst er «ned». Snus de, peker knappen én vei og gjør det '
      + 'motsatte — og ingen annen port fanger det, fordi begge knappene '
      + 'fortsatt finnes og virker.',
    ).toBe(true);
  });

  it('begge finstegene ligger i SAMME kolonne som sitt eget spor', () => {
    const src = les(TSX);
    const start = src.indexOf('<div className="fa-gauge-track-wrap"');
    const slutt = src.indexOf('</div>', src.indexOf('{minLabel}'));
    const kolonne = src.slice(start, slutt);

    expect(start, 'fant ikke kolonnen').toBeGreaterThan(-1);
    expect(kolonne).toContain('aria-label={incrementLabel}');
    expect(
      kolonne.includes('aria-label={decrementLabel}'),
      'Reduser-knappen ligger utenfor sin egen sliderkolonne. Da er den '
      + 'tilbake i en delt rad, og grupperingen må igjen bevises med '
      + 'avstand — som ikke får plass på 390 px.',
    ).toBe(true);
  });

  it('den gamle delte knapperaden er borte, ikke bare tømt', () => {
    /* En tom .fa-gauge-steps ville stått som en invitasjon til å fylle den
       igjen. Regelen skal være synlig i fraværet, ikke bare i innholdet. */
    expect(les(TSX)).not.toContain('className="fa-gauge-steps"');
    expect(les(CSS)).not.toMatch(/^\.fa-gauge-steps\s*\{/mu);
  });

  it('trykkmålet på 44 px står urørt', () => {
    const css = les(CSS);
    const m = /\.fa-gauge-step\s*\{[^}]*\}/u.exec(css);
    expect(m, 'fant ikke .fa-gauge-step').not.toBeNull();
    const b = m![0];
    expect(b).toMatch(/width:\s*44px/u);
    expect(
      /height:\s*44px/u.test(b),
      'Finstegknappen er ikke lenger 44 × 44. Hele grunnen til at den '
      + 'loddrette løsningen ble valgt, var at den beholder trykkmålet — '
      + 'krymping var alternativet den erstattet.',
    ).toBe(true);
  });
});
