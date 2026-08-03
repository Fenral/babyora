/**
 * DE TO LYS-INNGANGENE MÅ VÆRE IDENTISKE.
 *
 * Bakgrunn: `--dw-plate` / `--dw-plate-kant` ble lagt inn i
 * `@media (prefers-color-scheme: light)`, men ikke i `:root[data-theme="light"]`.
 * Symptomet: en bruker på et mørkt OS som velger «Lys» i Innstillinger arvet
 * den MØRKE platen, og garderoben marsjerte nedover den kremfargede lista som
 * mørke firkanter. Det var eierfunnet som alt var rettet én gang — og som kom
 * tilbake gjennom den andre lys-inngangen.
 *
 * Token-filens egen kommentar sier regelen den brøt: «begge lys-inngangene må
 * gi NØYAKTIG samme ring, ellers avhenger tilgjengelighet av om brukeren valgte
 * lys selv eller arvet den fra OS.»
 *
 * Denne testen sammenligner NØKKELSETTENE, ikke verdiene. Da fanger den hver
 * gang et token legges til i én blokk og glemmes i den andre — som er måten
 * feilen oppstår på, og som vil skje igjen.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(join(process.cwd(), 'src/styles/design-tokens-v2.css'), 'utf8');

/** Trekker ut kroppen til en blokk ved å telle klammer fra treffet. */
function blokk(kilde: string, start: RegExp): string {
  const m = start.exec(kilde);
  if (!m) return '';
  let dybde = 0;
  let i = m.index + m[0].length - 1;
  const fra = i + 1;
  for (; i < kilde.length; i += 1) {
    if (kilde[i] === '{') dybde += 1;
    else if (kilde[i] === '}') {
      dybde -= 1;
      if (dybde === 0) return kilde.slice(fra, i);
    }
  }
  return '';
}

function tokenNavn(kropp: string): Set<string> {
  return new Set([...kropp.matchAll(/(--[a-z0-9-]+)\s*:/gu)].map((m) => m[1]!));
}

describe('design-tokens-v2.css — de to lys-inngangene', () => {
  const auto = blokk(CSS, /@media \(prefers-color-scheme: light\)\s*\{/u);
  const eksplisitt = blokk(CSS, /:root\[data-theme="light"\]\s*\{/u);

  it('finner begge blokkene i det hele tatt', () => {
    // FORUTSETNING: uten denne kan testen under bestå på to tomme sett.
    expect(auto.length, 'auto-lys-blokken ble ikke funnet').toBeGreaterThan(200);
    expect(eksplisitt.length, 'data-theme="light"-blokken ble ikke funnet').toBeGreaterThan(200);
    expect(tokenNavn(auto).size, 'auto-lys deklarerer ingen tokens').toBeGreaterThan(10);
  });

  it('deklarerer nøyaktig de samme tokenene i begge', () => {
    const a = tokenNavn(auto);
    const e = tokenNavn(eksplisitt);
    const kunAuto = [...a].filter((t) => !e.has(t)).sort();
    const kunEksplisitt = [...e].filter((t) => !a.has(t)).sort();

    expect(kunAuto, `kun i @media-lys, mangler i [data-theme="light"]: ${kunAuto.join(', ')}`).toEqual([]);
    expect(kunEksplisitt, `kun i [data-theme="light"], mangler i @media-lys: ${kunEksplisitt.join(', ')}`).toEqual([]);
  });
});
