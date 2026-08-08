/**
 * OnboardingBabyHero — maskoten på onboardingstegene.
 *
 * ENDRET 2026-08-07: testene her målte et videomaskineri som aldri kjørte.
 * De asserterte `autoPlay`, `playsInline` og at «signatursekvensen spilles én
 * gang» — men alle fire kallsteder i OnboardingScreen sendte
 * `playMotion={false}`, så `<video>` ble aldri rendret i produktet. Testene
 * var grønne fordi de kalte komponenten med andre props enn appen gjør.
 *
 * Det er den farligste typen test: den beskriver en funksjon som ikke finnes,
 * og gjør at ingen oppdager at filmen er død kode.
 *
 * Nå måles det komponenten faktisk gjør, og porten under holder maskineriet
 * borte — kommer et `<video>` tilbake uten at noen kobler det til, feller den.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OnboardingBabyHero } from '../OnboardingBabyHero.js';

const KILDE = readFileSync(
  resolve(__dirname, '../OnboardingBabyHero.tsx'),
  'utf8',
).replace(/\r\n/gu, '\n');

describe('OnboardingBabyHero', () => {
  it('viser den stående maskoten på de kompakte stegene', () => {
    const html = renderToStaticMarkup(<OnboardingBabyHero variant="compact" />);

    expect(html).toContain('ob-baby-hero compact');
    expect(html).toContain('/monter/maskot-staaende-cut-360.webp');
    expect(html).not.toContain('ob-baby-frame');
    // Dekorativ: skal aldri annonseres av skjermleser.
    expect(html).toContain('aria-hidden="true"');
  });

  it('setter kontekstmarkøren på steget som har en', () => {
    const html = renderToStaticMarkup(
      <OnboardingBabyHero variant="compact" context="birthday" />,
    );

    expect(html).toContain('ob-baby-context birthday');
    expect(html).toContain('/monter/maskot-staaende-cut-360.webp');
  });

  it('velkomststeget bruker sin egen variant', () => {
    const html = renderToStaticMarkup(<OnboardingBabyHero variant="welcome" />);
    expect(html).toContain('ob-baby-hero welcome');
  });

  /* PORTEN: filmen skal ikke snike seg tilbake som død kode.

     Den lå her i månedsvis uten å spilles fordi ingenting målte om den
     faktisk KJØRTE — bare at markupen kunne inneholde en `<video>` hvis man
     kalte komponenten med props appen aldri sendte. Testen under måler
     kilden, ikke en render, nettopp fordi det var kilden som løy. */
  it('har ikke videomaskineri — filmen er arkivert, ikke gjemt', () => {
    const utenKommentarer = KILDE
      .replace(/\/\*[\s\S]*?\*\//gu, '')
      .replace(/\/\/.*$/gmu, '');

    expect(utenKommentarer).not.toContain('<video');
    expect(utenKommentarer).not.toContain('autoPlay');
    expect(utenKommentarer).not.toContain('playMotion');
    expect(utenKommentarer).not.toContain('babyora-intro');

    // Skal filmen vekkes, er det en beslutning om to signaturøyeblikk i
    // åpningen — se hodekommentaren. Da skrives denne porten om bevisst.
    expect(KILDE).toContain('docs/mocks/arkiv/illustrations-onboarding');
  });
});
