/**
 * INNSTILLINGSRADEN — og vedtaket om å IKKE lage en generisk rad.
 *
 * Fase 2B målte 16 radlignende komponenter og stilte ett spørsmål: deler de
 * faktisk struktur, eller ser de bare like ut? Denne porten holder BEGGE
 * halvdelene av svaret på plass.
 *
 * JA, ÉN ER EKTE: 22 forekomster fra 15 kallsteder, målt identiske til
 * 0,06 px — padding 13/14, gap 12, ikon 32x32 radius 9, høyde 58,00–59,27.
 * Det eneste som varierer er høyre side.
 *
 * NEI, PLAGGRADEN ER DET IKKE: fire uavhengige implementasjoner måler
 * 72,00 / 66,00 / 97,58 / 102,00 px — 36 px spredning. En felles primitiv
 * ville erstattet fire kallsteder, men bare ved å ENDRE geometrien på tre av
 * dem. Det er et designvedtak om at de SKAL bli like, ikke en observasjon om
 * at de allerede er det. Porten passer på at ingen sniker inn en `GarmentRow`
 * uten at den beslutningen er tatt i åpent lende.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SettingsRow } from '../SettingsRow';

const ROT = process.cwd();
const utenKommentar = (k: string): string =>
  k.replace(/\/\*[\s\S]*?\*\//gu, (m) => m.replace(/[^\n]/gu, ' '));
const CSS = utenKommentar(readFileSync(join(ROT, 'src/components/controls/settings-row.css'), 'utf8'));

function filer(dir: string, ut: string[] = []): string[] {
  for (const navn of readdirSync(dir)) {
    const sti = join(dir, navn);
    if (statSync(sti).isDirectory()) {
      if (navn === '__tests__' || navn === 'node_modules') continue;
      filer(sti, ut);
    } else if (navn.endsWith('.tsx') || navn.endsWith('.css')) ut.push(sti);
  }
  return ut;
}

describe('innstillingsraden', () => {
  it('IKKE-VAKUØSITET: stilarket har regler å måle', () => {
    expect(CSS.replace(/\s+/gu, '').length, 'settings-row.css er tom').toBeGreaterThan(300);
  });

  it('en rad som fører videre er en <button>, ellers en <div>', () => {
    /* Ikke kosmetikk: en <button> som ikke gjør noe dukker opp i
       tabrekkefølgen og lover en handling som ikke finnes. */
    const trykkbar = renderToStaticMarkup(<SettingsRow label="Språk" onClick={() => {}} />);
    expect(trykkbar).toContain('<button');
    expect(trykkbar).toContain('dw-rad--trykkbar');

    const statisk = renderToStaticMarkup(<SettingsRow label="Versjon" value="1.4.2" />);
    expect(statisk, 'en rad uten handling skal ikke være en knapp').not.toContain('<button');
    expect(statisk).not.toContain('dw-rad--trykkbar');
  });

  it('høyre side er variabel — det er hele grunnen til at primitiven finnes', () => {
    expect(renderToStaticMarkup(<SettingsRow label="Tema" value="Mørk" />)).toContain('dw-rad-verdi');
    expect(renderToStaticMarkup(<SettingsRow label="Varsler" trailing={<i>b</i>} />)).toContain('dw-rad-hoyre');
    /* Bar rad: ingen høyre side i det hele tatt (Tema-raden i dag). */
    expect(renderToStaticMarkup(<SettingsRow label="Bare tekst" />)).not.toContain('dw-rad-hoyre');
  });

  it('underteksten klippes til to linjer så lista beholder rytmen', () => {
    /* Målt i dag: en rad med to linjer blir 74,86 px mot naboenes 58,00 —
       29 % høyere. Uten klipping mister lista rytmen sin. */
    expect(CSS).toMatch(/\.dw-rad-under\s*\{[^}]*-webkit-line-clamp:\s*2/u);
  });

  it('verdien til høyre spiser aldri etiketten', () => {
    expect(CSS).toMatch(/\.dw-rad-verdi\s*\{[^}]*max-width:\s*42%/u);
  });

  it('raden går aldri under trykkmålet', () => {
    /* Høyden settes i praksis av innholdet — 32 px ikon + 26 px padding = 58,
       så min-height er sjelden bindende. Gulvet står for radene UTEN ikon. */
    expect(CSS).toMatch(/\.dw-rad\s*\{[^}]*min-height:\s*var\(--dw-size-touch\)/u);
  });

  it('VEDTAK: ingen generisk Row eller GarmentRow finnes', () => {
    /* De fire plaggradene måler 72,00 / 66,00 / 97,58 / 102,00 px. Skal de
       bli like, er det en synlig designrunde — ikke et komponent-commit. */
    const kandidater = filer(join(ROT, 'src'))
      .filter((f) => /[\\/](GarmentRow|Row)\.tsx$/u.test(f));
    expect(
      kandidater.map((f) => f.replace(ROT, '')),
      'en generisk radprimitiv har dukket opp. Fire plaggrader spriker 36 px; '
      + 'å samle dem er et designvedtak som skal tas i åpent lende.',
    ).toEqual([]);
  });

  it('RATSJETT: ToolsSense-kopien er borte og kommer ikke tilbake', () => {
    /* ToolsSection hadde seks stilobjekter kopiert ORDRETT fra
       InnstillingerScreen. Duplisering som denne lar de to stedene drive fra
       hverandre uten at noen ser det. */
    const tools = readFileSync(join(ROT, 'src/components/family/ToolsSection.tsx'), 'utf8');
    expect(tools, 'ToolsSection bruker ikke radprimitiven').toContain('SettingsRow');
    const egne = ['rowStyle', 'rowIconStyle', 'rowBodyStyle', 'rowLabelStyle', 'rowChevronStyle']
      .filter((n) => new RegExp(`const ${n}\\s*:`, 'u').test(tools));
    expect(egne, `ToolsSection har igjen egne radstiler: ${egne.join(', ')}`).toEqual([]);
  });
});
