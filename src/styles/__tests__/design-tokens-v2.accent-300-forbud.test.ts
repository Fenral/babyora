/**
 * `--dw-accent-300` ER LYS, IKKE TYPOGRAFI.
 *
 * Tokenfilen sier det selv (`design-tokens-v2.css:31, 60`): «FORBUDT som
 * tekstfarge (lys, ikke typografi)» og «ALDRI tekst». Regelen var prosa, og
 * prosa håndhever ikke seg selv.
 *
 * Målt: #E7B087 gir 9,44:1 på det mørke lerretet — helt greit — men den
 * deklareres bare ÉN gang og står derfor uendret i lys modus, der den gir
 * **1,76:1 på kremhvitt**. Legacy-aliasene `--lag-marigold`,
 * `--layer-mellom` og `--terracotta-200` pekte på den i begge lys-blokkene,
 * så Tog-guiden og Varm-eller-kald leste lys amber på lyst papir.
 *
 * Sols dom: repareres på FORBRUKERNIVÅ. Tokenet omdefineres ikke for å redde
 * feil bruk — forbrukerne flyttes til riktig teksttoken, og bruken forbys.
 *
 * IKKE-VAKUØSITET: testen rapporterer hvor mange deklarasjoner den faktisk
 * skannet. Null = rødt.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROT = process.cwd();

function cssFiler(dir: string, ut: string[] = []): string[] {
  for (const navn of readdirSync(dir)) {
    const sti = join(dir, navn);
    if (statSync(sti).isDirectory()) {
      if (navn === 'node_modules' || navn === '__tests__') continue;
      cssFiler(sti, ut);
    } else if (navn.endsWith('.css') || navn.endsWith('.tsx')) {
      ut.push(sti);
    }
  }
  return ut;
}

/**
 * Egenskaper der en farge blir TYPOGRAFI. `border-color`, `background` og
 * `box-shadow` er lovlige — det er nettopp det tokenet er til for.
 */
const TEKSTEGENSKAPER = /(^|[;{\s])(-webkit-text-fill-)?color\s*:\s*[^;}]*--dw-accent-300/u;

describe('--dw-accent-300 er lys, ikke typografi', () => {
  const filer = cssFiler(join(ROT, 'src'));

  it('IKKE-VAKUØSITET: skannet faktisk filer', () => {
    expect(filer.length, 'ingen filer skannet — porten måler ingenting').toBeGreaterThan(20);
    const medTokenet = filer.filter((f) => readFileSync(f, 'utf8').includes('--dw-accent-300'));
    console.log(`\n  accent-300-forbud: ${filer.length} filer skannet, ${medTokenet.length} nevner tokenet\n`);
    expect(medTokenet.length, 'tokenet nevnes ingen steder — er det slettet?').toBeGreaterThan(0);
  });

  it('brukes aldri som color', () => {
    const brudd: string[] = [];
    for (const f of filer) {
      const linjer = readFileSync(f, 'utf8').split('\n');
      linjer.forEach((linje, i) => {
        if (TEKSTEGENSKAPER.test(linje)) {
          brudd.push(`${f.replace(ROT, '').replace(/\\/gu, '/')}:${i + 1}  ${linje.trim()}`);
        }
      });
    }
    expect(brudd, `--dw-accent-300 brukt som tekstfarge (1,76:1 på krem):\n  ${brudd.join('\n  ')}`)
      .toEqual([]);
  });

  it('legacy-aliasene peker ikke på lys amber der lerretet er lyst', () => {
    /* VIKTIG: `design-tokens.css` er LYS-FØRST — standard `:root` er lys, og
       dark er overstyringen. Motsatt av `design-tokens-v2.css`. Første utkast
       av denne porten lette etter «lys-blokker» og fant null, fordi de ikke
       finnes: lyset ER standarden. Ikke-vakuøsitetsregelen fanget det og
       nektet å bestå på et tomt skop — men først etter at jeg hadde rettet
       feil blokk i selve CSS-en (jeg endret dark, der fargen var riktig).
       Målet er derfor STANDARD-blokken, alt før første @media. */
    const raa = readFileSync(join(ROT, 'src/styles/design-tokens.css'), 'utf8');
    /* Kommentarene MÅ strippes først. Filens egen dokumentasjon nevner
       «@media» på linje 26, så et rått `indexOf('@media')` kuttet skopet til
       de 26 første linjene — og aliasene på linje 86-100 var aldri med. */
    const css = raa.replace(/\/\*[\s\S]*?\*\//gu, '');
    const forsteMedia = css.indexOf('@media');
    const standard = forsteMedia === -1 ? css : css.slice(0, forsteMedia);

    const farlige = ['--lag-marigold', '--layer-mellom', '--terracotta-200'];

    /* IKKE-VAKUØSITET, riktig utgave: ikke «er skopet stort nok» (det målte
       BYTES og godtok en kommentarblokk), men «finnes målene jeg leter etter
       faktisk her». En port som ikke fant sine egne mål, har ikke bestått. */
    const funnet = farlige.filter((a) => standard.includes(a));
    expect(funnet, `disse aliasene ble ikke funnet i standard-blokken — porten måler feil sted: ${
      farlige.filter((a) => !funnet.includes(a)).join(', ')}`).toEqual(farlige);
    const brudd: string[] = [];
    for (const alias of farlige) {
      if (new RegExp(`${alias}\\s*:\\s*var\\(--dw-accent-300\\)`, 'u').test(standard)) {
        brudd.push(`${alias} → --dw-accent-300 (1,76:1 på krem)`);
      }
    }
    expect(brudd, `lys amber som lagfarge på kremhvitt:\n  ${brudd.join('\n  ')}`).toEqual([]);
  });
});
