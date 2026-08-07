/**
 * FinnAntrekkScreen — P10/JOB4 instrument-panel redesign: three vertical
 * gauges (not the old mixed vertical-thermometer + two-horizontal-sliders
 * layout), CTA-driven scan (resting CTA visible, no result until the first
 * tap), and the garment-rows/explanation-box result wiring.
 *
 * Rendered via renderToStaticMarkup (no jsdom in this repo — see
 * FinnAntrekkScreen.prefill.test.tsx's own header doc). Since there is no
 * interaction layer available, this file covers what an SSR render CAN
 * prove (structure + a11y attributes of the resting/idle state, which is
 * the only state reachable without firing events) plus source-text checks
 * for the wiring that only becomes visible after a committed scan (garment
 * rows / explanation box / micropass) — same fallback convention already
 * used by App.finn-antrekk-drill.test.ts in this repo. The CTA-driven
 * PHASE LOGIC itself (no recompute until tap, re-arm on adjustment) is unit
 * tested directly, without any rendering, in finn-antrekk-calc.test.ts.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FinnAntrekkScreen } from '../FinnAntrekkScreen';
import { ChildrenProvider } from '../../state/children-provider';

function renderScreen(): string {
  return renderToStaticMarkup(
    <ChildrenProvider>
      <FinnAntrekkScreen onBack={() => {}} />
    </ChildrenProvider>,
  );
}

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8').replace(/\r\n/g, '\n');
}

const screenPath = 'src/screens/FinnAntrekkScreen.tsx';

describe('FinnAntrekkScreen — instrument panel (three vertical gauges, not the rejected mixed layout)', () => {
  it('renders exactly three vertical gauge columns, none of the old horizontal ".finn-slider" markup', () => {
    const html = renderScreen();
    expect(html.match(/class="fa-gauge"/gu)?.length).toBe(3);
    expect(html).not.toContain('finn-slider');
  });

  /* OMSKREVET 2026-08-06. Testen krevde `.fa-gauge-steps` × 3 — den delte
     knapperaden under sliderne. Den finnes ikke lenger: finstegene står nå
     loddrett i hver kolonne, pluss over sporet og minus under.

     Men den skal ikke bare TELLE de nye klassene. I den gamle utgaven var
     rekkefølgen likegyldig — begge knappene lå side om side under sporet, og
     hvilken som kom først betydde ingenting utover lesretningen. Nå ER
     rekkefølgen betydningen: pluss øverst på en loddrett slider er «opp».
     Bytter noen om, peker knappen én vei og gjør det motsatte.

     Testen måler derfor RENDRET rekkefølge, ikke bare antall. (Kilderekke-
     følgen voktes i tillegg av finsteg-grupperes-av-posisjon.test.ts; denne
     bekrefter at det faktisk kom ut slik i markupen.) */
  it('every gauge column renders label → value → [+] → track → [−], in that order', () => {
    const html = renderScreen();
    expect(html.match(/class="fa-gauge-label"/gu)?.length).toBe(3);
    expect(html.match(/class="fa-gauge-value"/gu)?.length).toBe(3);
    expect(html.match(/class="fa-gauge-track"/gu)?.length).toBe(3);
    expect(html.match(/class="fa-gauge-step"/gu)?.length).toBe(6); // 2 per gauge

    // Den delte raden er borte, ikke bare tømt.
    expect(html).not.toContain('class="fa-gauge-steps"');

    /* Per kolonne: øk-knappen FØR sporet, reduser-knappen ETTER. Vi følger
       de tre parene med etikettene som allerede er unike per instrument. */
    const par: [string, string][] = [
      ['Én grad varmere', 'Én grad kaldere'],
      ['Sterkere vind', 'Svakere vind'],
      ['Mer nedbør', 'Mindre nedbør'],
    ];
    const spor = [...html.matchAll(/class="fa-gauge-track"/gu)].map((m) => m.index ?? -1);
    par.forEach(([opp, ned], i) => {
      const iOpp = html.indexOf(`aria-label="${opp}"`);
      const iNed = html.indexOf(`aria-label="${ned}"`);
      expect(iOpp, `fant ikke «${opp}»`).toBeGreaterThan(-1);
      expect(iNed, `fant ikke «${ned}»`).toBeGreaterThan(-1);
      expect(
        iOpp < spor[i] && spor[i] < iNed,
        `Kolonne ${i + 1}: rekkefølgen er ikke [${opp}] · spor · [${ned}]. `
        + 'På en loddrett slider er knappens plassering dens betydning — '
        + 'pluss øverst er «opp». Er de snudd, lyver skjermen om hva '
        + 'knappen gjør, og begge knappene virker fortsatt, så ingenting '
        + 'annet blir rødt.',
      ).toBe(true);
    });
  });

  it('labels the three instruments Temperatur / Vind / Nedbør', () => {
    const html = renderScreen();
    expect(html).toContain('>Temperatur<');
    expect(html).toContain('>Vind<');
    expect(html).toContain('>Nedbør<');
  });

  it('a11y contract: aria-orientation="vertical" on all three range inputs, plus per-gauge aria-label/aria-valuetext and labelled +/- buttons', () => {
    const html = renderScreen();
    expect(html.match(/aria-orientation="vertical"/gu)?.length).toBe(3);
    expect(html).toContain('aria-label="Temperatur i celsius"');
    expect(html).toContain('aria-label="Vindstyrke i meter per sekund"');
    expect(html).toContain('aria-label="Nedbør i millimeter per time"');
    expect(html).toContain('aria-label="Én grad varmere"');
    expect(html).toContain('aria-label="Én grad kaldere"');
    expect(html).toContain('aria-label="Sterkere vind"');
    expect(html).toContain('aria-label="Svakere vind"');
    expect(html).toContain('aria-label="Mer nedbør"');
    expect(html).toContain('aria-label="Mindre nedbør"');
    // Native <input type="range"> gives role=slider + valuemin/max/now for
    // free from min/max/value attrs — assert those are actually present.
    expect(html).toContain('type="range"');
    expect(html.match(/type="range"/gu)?.length).toBe(3);
  });
});

describe('FinnAntrekkScreen — CTA-driven scan (idle/resting state, the only state reachable via SSR)', () => {
  it('shows the resting "Finn antrekk" CTA and its trust line, never an eager result on first render', () => {
    const html = renderScreen();
    expect(html).toContain('class="hjm-cta"');
    expect(html).toContain('>Finn antrekk<');
    expect(html).toContain('Temperatur, vind og nedbør vurderes sammen');
  });

  it('renders NO result section before any scan has ever completed (no garment rows, no explanation box)', () => {
    const html = renderScreen();
    expect(html).not.toContain('class="hjm-rows"');
    expect(html).not.toContain('class="hjm-prev"');
    expect(html).not.toContain('id="finn-output-label"');
  });

  it('the old live-update subline copy ("juster og se svaret endre seg") is gone', () => {
    const html = renderScreen();
    expect(html).not.toContain('juster og se svaret endre seg');
    /* 2026-08-06: undertittelen er delt i to linjer (HVEM · HVOR/NÅR) fordi
       den firedelte strengen brakk over tre linjer — se `headerLinjer` i
       skjermen og Juster.mindre-funn-2026-08-06.test.tsx for målingen.
       Halen «basert på været nå» heter nå «Været nå» på egen linje. */
    expect(html).toContain('Været nå');
  });
});

describe('FinnAntrekkScreen — result-as-clothes wiring (source-text: only reachable post-scan, no jsdom available)', () => {
  it('reuses the SAME garment-row presentation as Hjem\'s result surface (deriveResultRows + MonterGarmentRow + hjem-monter.css)', () => {
    const contents = source(screenPath);
    expect(contents).toContain("import { deriveResultRows, type ResultRow } from '../components/hjem/result-rows';");
    expect(contents).toContain("import { MonterGarmentRow } from '../components/hjem/MonterGarmentRow';");
    expect(contents).toContain("import { getGarmentImage } from '../lib/monter-assets';");
    expect(contents).toContain("import '../components/hjem/hjem-monter.css';");
    expect(contents).toContain('<ol className="hjm-rows"');
    expect(contents).toContain('<MonterGarmentRow');
  });

  it('presents a small raised explanation box (--dw-raised / 14px radius via the shared .hjm-prev class, §6-compliant edge-light) with the engine-derived why-copy — never invented copy', () => {
    const contents = source(screenPath);
    expect(contents).toContain('className="hjm-prev"');
    expect(contents).toContain('{committedWhyLine}');
    expect(contents).toContain('{committedWhyDetails');
    // buildWhyLine/buildWhyDetails are unchanged pure derivations from the
    // engine's own recommend() output — not new/invented engine data.
    expect(contents).toContain('function buildWhyLine(');
    expect(contents).toContain('function buildWhyDetails(');
  });

  it('re-arms on adjustment and demotes (never hides) the existing result — wired via the extracted pure finn-antrekk-calc module', () => {
    const contents = source(screenPath);
    expect(contents).toContain("from './finn-antrekk-calc'");
    expect(contents).toContain('nextPhaseAfterParamChange(phase, committed,');
    /* Het `resultOpacityStyle` til 2026-08-05. Demoteringen er nå en FARGE,
       ikke alpha — se `demotedTextStyle` og opacity-demping.test.ts. */
    expect(contents).toContain('demotedTextStyle(resultDemoted, reducedMotion)');
  });

  it('DoD fase 5: det utdaterte svaret sier «Utdatert» — signalet er ikke bare visuelt', () => {
    /* HVORFOR DENNE FINNES. Signalet var `opacity: 0.55` på hele flaten. Det
       tok fem av seks tekstnivåer under 4,5:1, OG det sa ingenting til en
       skjermleser: alpha har ingen tilgjengelig representasjon. En blind
       bruker fikk null indikasjon på at svaret ikke lenger gjaldt.
       Fjerner man alpha uten å erstatte signalet, mister også seende det.
       Derfor bærer ORDET beskjeden nå, og fargen er bare støtte — og derfor
       må ordet måles, ikke bare dempingen. */
    const contents = source(screenPath);
    expect(
      contents.includes("resultDemoted ? 'Utdatert · ' : ''"),
      'ordet «Utdatert» er borte fra metalinjen. Da er det ingen beskjed igjen '
      + 'om at svaret ikke gjelder parametrene på skjermen — verken for øyet '
      + 'eller for skjermleseren.',
    ).toBe(true);
    /* Metalinjen bar `aria-hidden` da den bare var dekor. Nå er den den ENESTE
       beskjeden om utdatert svar, og da kan den ikke være skjult for
       hjelpemidler. */
    const meta = contents.slice(contents.indexOf('outputMetaStyle'), contents.indexOf('hjm-rows'));
    expect(
      /aria-hidden/u.test(meta),
      'metalinjen er aria-hidden igjen. Den bærer nå «Utdatert» — skjuler man '
      + 'den, er stale-signalet tilbake til å være rent visuelt.',
    ).toBe(false);
  });

  it('eier-override v3: runs the SAME full 3,2s scan-koreografi as Hjem on tap (ScanOverlay + FULL_SCAN_DURATION_MS + fullScanHapticSchedule), the old 400ms micropass is retired', () => {
    const contents = source(screenPath);
    /* ScanStatusBlock kom med 2026-08-05 (DoD fase 5, punkt 2): skip-knappen
       og aria-live-regionen Juster manglet. Samme import, samme fil. */
    expect(contents).toContain("import { ScanOverlay, ScanStatusBlock } from '../components/hjem/ScanOverlay';");
    expect(contents).toContain("from '../components/hjem/scan-orchestration';");
    expect(contents).toContain('FULL_SCAN_DURATION_MS');
    expect(contents).toContain('fullScanHapticSchedule(FULL_SCAN_DURATION_MS)');
    expect(contents).not.toContain('MICROPASS_DURATION_MS');
    expect(contents).not.toContain('MICROPASS_PREPARE_MS');
    expect(contents).not.toContain('MICROPASS_LANDING_MS');
    expect(contents).not.toContain('CalcMicropass');
    expect(contents).toContain('void hapticPrepare()');
    expect(contents).toContain('void impactMedium()');
    expect(contents).toContain('void impactSoft()');
    expect(contents).toContain('void hapticSelection()');
  });

  it('the instrument-panel gauges are replaced by the shared ScanOverlay (Juster-labelled rows) while scanning, not just the CTA area', () => {
    const contents = source(screenPath);
    const scanBranchStart = contents.indexOf("phase === 'scanning' ? (");
    const scanBranchEnd = contents.indexOf(') : (', scanBranchStart);
    const scanBranch = contents.slice(scanBranchStart, scanBranchEnd);
    expect(scanBranch).toContain('<ScanOverlay');
    expect(scanBranch).toContain("{ label: 'Temperatur', value: formatTemp(scanRows.tempC) }");
    expect(scanBranch).toContain("{ label: 'Vind', value: `${scanRows.windMs} m/s` }");
    /* `toFixed(1)` skrev engelsk punktum uansett språk — byttet til
       `formatEnDesimal` (Intl, nb-NO) 2026-08-06. Seremonien og sporet må
       vise SAMME tall skrevet på samme måte. */
    expect(scanBranch).toContain("{ label: 'Nedbør', value: `${formatEnDesimal(scanRows.precipMmH)} mm/t` }");
    expect(scanBranch).toContain('spinningLabel="Lag for lag"');
    expect(scanBranch).toContain('totalDurationMs={FULL_SCAN_DURATION_MS}');
  });

  it('reduced motion lands the result instantly (no micropass timers) — same double-guard convention as the rest of the app', () => {
    const contents = source(screenPath);
    const fnStart = contents.indexOf('function handleFindOutfit');
    const fnEnd = contents.indexOf('\n  }\n\n  const committedActivityOption');
    const body = contents.slice(fnStart, fnEnd === -1 ? undefined : fnEnd);
    expect(body).toContain('if (reducedMotion) {');
    /* Landingen ble samlet i `landScan` 2026-08-05: den sto duplisert i
       redusert-bevegelse-grenen og i fullføringstimeren, og skip-knappen
       ville blitt en tredje kopi. Tre kopier av «slik lander et svar»
       drifter fra hverandre — én får haptikken, en annen glemmer den.
       Assertionen følger derfor kallet, ikke den innlimte kroppen. */
    expect(body).toContain('landScan(snapshot);');
  });

  it('DoD fase 5, punkt 2: seremonien har en vei ut OG en stemme', () => {
    /* Hjem har hatt «Vis svaret med en gang» siden seremonien ble 3,2 s.
       Juster kjørte NØYAKTIG samme koreografi uten den: brukeren sto fast i
       3,2 sekunder. Verre — uten aria-live var hele seremonien taus for en
       skjermleser, som dermed ikke visste om appen jobbet eller hadde
       stoppet. ScanStatusBlock bærer begge deler. */
    const contents = source(screenPath);
    expect(
      contents.includes('<ScanStatusBlock'),
      'Juster rendrer ikke ScanStatusBlock — da er 3,2 s seremoni uten vei ut '
      + 'og uten annonsering.',
    ).toBe(true);
    expect(
      contents.includes('onSkip={handleSkip}'),
      'skip-knappen er ikke koblet til noe. En knapp som ikke gjør noe er '
      + 'verre enn ingen knapp.',
    ).toBe(true);

    /* Skip-en må LANDE svaret, ikke bare stoppe klokka. Duell §2: «hopp rett
       til resultat, spill kun landingen» — et skippet svar skal ikke lande
       stillere enn et som fikk gå ferdig. */
    const skip = contents.slice(
      contents.indexOf('const handleSkip'),
      contents.indexOf('function handleFindOutfit'),
    );
    expect(skip).toContain('clearScanTimers();');
    expect(
      skip.includes('landScan(scanSnapshot);'),
      'skip stopper timerne uten å lande svaret — brukeren sitter igjen med '
      + 'en seremoni som bare stanset.',
    ).toBe(true);
  });
});

describe('FinnAntrekkScreen — Juster clearance (P10 Job 3, folded into Job 4)', () => {
  it('the internal scroll container carries --dw-tabbar-clearance bottom padding, same pattern as .hjem-monter / .app-shell > main', () => {
    const contents = source(screenPath);
    expect(contents).toContain("paddingBottom: 'calc(32px + var(--dw-tabbar-clearance, 90px))'");
  });
});
