/**
 * Dybdedoktrine-lint — mekanisk tripwire for DESIGN.md-doktrinen (2026-07-31).
 *
 * Heuristiske sjekker på mock-/komponent-filer i Monter-verdenen. Fanger de
 * fem doktrinebruddene som prosa ikke klarer å håndheve:
 *   D1  Rad-lister rett på canvas (hairline-rader uten hevet flate rundt)
 *   D2  Hevet flate uten lyslogikk (raised-bakgrunn uten inset topplys)
 *   D3  Bilde-thumbs uten vitrine-bakgrunn (naken <img> mot mørk flate)
 *   D4  Interaktive mål under 44px (min-height < 44 på button/knapp-klasser)
 *   D5  Ubetinget innslags-animasjon (animation på rader uten .is-fresh-gate
 *       eller reduced-motion-fallback)
 *
 * Kjøres: node tools/design-doctrine-lint.mjs [filer...]
 * Uten argumenter: docs/mocks/monter/*.html
 * Exit 0 = rent, 2 = funn. Heuristikk, ikke parser — falske positive rettes
 * ved å presisere mønsteret her, ikke ved å skru av sjekken.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const files = args.length
  ? args
  : readdirSync('docs/mocks/monter')
      .filter((f) => f.endsWith('.html'))
      .map((f) => join('docs/mocks/monter', f));

let findings = 0;
const report = (file, rule, msg) => {
  findings++;
  console.log(`FUNN ${rule}  ${file}\n      ${msg}`);
};

for (const file of files) {
  const css = readFileSync(file, 'utf8');

  // D1: hairline-rader (border-top ELLER border-bottom pa *row*-klasser) krever
  // en godkjent hevet gruppeflate i samme fil. Godkjente container-klasser er
  // doktrinens register: rows, week-surface, plans, group.
  const hasHairlineRows =
    /\.[\w-]*row[\w-]*[^{]*{[^}]*border-(top|bottom):\s*1px solid/.test(css);
  const hasRaisedListSurface =
    /\.(rows|week-surface|plans|group)\s*{[^}]*background[^}]*}/s.test(css) &&
    /\.(rows|week-surface|plans|group)\s*{[^}]*box-shadow[^}]*inset/s.test(css);
  if (hasHairlineRows && !hasRaisedListSurface) {
    report(file, 'D1', 'Rad-liste med hairlines uten godkjent hevet gruppeflate (rows/week-surface/plans/group med raised bakgrunn + inset topplys).');
  }

  // D2: hver bruk av --dw-raised som bakgrunn skal ha inset-lys i samme regel
  for (const m of css.matchAll(/([.#][\w-]+)\s*{([^}]*var\(--dw-raised\)[^}]*)}/g)) {
    const [, sel, body] = m;
    if (/background/.test(body) && !/inset/.test(body) && !/\.thumb/.test(sel)) {
      report(file, 'D2', `${sel} bruker raised-bakgrunn uten inset topplys i box-shadow.`);
    }
  }

  // D3: thumb-klasser med <img> skal ha bakgrunn (vitrine + lastefeil-fallback)
  if (/class="thumb"/.test(css)) {
    const thumbRule = css.match(/\.thumb\s*{[^}]*}/s);
    if (!thumbRule || !/background/.test(thumbRule[0])) {
      report(file, 'D3', '.thumb mangler vitrine-bakgrunn (background), naken img mot mørk flate.');
    }
  }

  // D4: min-height under 44px på interaktive klasser
  for (const m of css.matchAll(/(\.[\w-]+)[^{]*{[^}]*min-height:\s*(\d+)px[^}]*}/g)) {
    const [, sel, h] = m;
    const interactive = /(btn|cta|skip|why|toggle|row|tab|loc|strip|ghost)/.test(sel);
    if (interactive && Number(h) < 44) {
      report(file, 'D4', `${sel} har min-height ${h}px — under 44px-gulvet.`);
    }
  }

  // D5: rad-animasjon skal være gated (.is-fresh) og ha reduced-motion-fallback
  const hasRowAnimation = /\.row\s*{[^}]*animation:/s.test(css);
  if (hasRowAnimation) {
    if (!/is-fresh/.test(css)) {
      report(file, 'D5', 'Rad-animasjon uten .is-fresh-gate — cachede åpninger betaler koreografi-skatt.');
    }
    if (!/prefers-reduced-motion/.test(css)) {
      report(file, 'D5', 'Rad-animasjon uten prefers-reduced-motion-fallback.');
    }
  }
}

if (findings === 0) {
  console.log(`Dybdedoktrine-lint: ${files.length} filer, 0 funn.`);
  process.exit(0);
} else {
  console.log(`\nDybdedoktrine-lint: ${findings} funn i ${files.length} filer.`);
  process.exit(2);
}
