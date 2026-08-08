import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement, createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WARM_COLD_RECOVERY_COPY } from '../warm-cold-recovery.js';
import { PlaggDetailSheet } from '../../../components/PlaggDetailSheet.js';
import { OutfitExperience } from '../../../components/outfit/OutfitExperience.js';
import { VarmEllerKaldScreen } from '../../../screens/VarmEllerKaldScreen.js';
import { deepFlowCopyFor } from '../../../screens/deep-flow-copy.js';

const root = resolve(import.meta.dirname, '../../../..');

function source(path: string): string {
  return readFileSync(resolve(root, path), 'utf8');
}

describe('warm/cold recovery copy and alternative ownership', () => {
  it('keeps the established recovery copy byte-equivalent and deeply immutable', () => {
    expect(WARM_COLD_RECOVERY_COPY).toEqual({
      title: 'Kjenn nakken',
      instruction: 'Stikk to fingre under genseren bak i nakken — ikke hender eller føtter.',
      statuses: {
        warm: {
          key: 'varm', title: 'For varm', signal: 'Svett eller fuktig nakke', action: 'Ta av', ariaLabel: 'For varm — svett eller fuktig nakke, ta av et lag',
        },
        perfekt: {
          key: 'perfekt', title: 'Perfekt', signal: 'Lun og tørr nakke', action: 'Behold', ariaLabel: 'Perfekt — nakken er lun og tørr, alt stemmer',
        },
        cold: {
          key: 'kald', title: 'For kald', signal: 'Kjølig eller kald nakke', action: 'Legg til', ariaLabel: 'For kald — kjølig nakke, legg til et lag',
        },
      },
    });
    expect(Object.isFrozen(WARM_COLD_RECOVERY_COPY)).toBe(true);
    expect(Object.isFrozen(WARM_COLD_RECOVERY_COPY.statuses)).toBe(true);
    expect(Object.isFrozen(WARM_COLD_RECOVERY_COPY.statuses.warm)).toBe(true);
    expect(Object.isFrozen(WARM_COLD_RECOVERY_COPY.statuses.perfekt)).toBe(true);
    expect(Object.isFrozen(WARM_COLD_RECOVERY_COPY.statuses.cold)).toBe(true);

    const markup = renderToStaticMarkup(createElement(VarmEllerKaldScreen, { onBack: () => undefined }));
    const localized = deepFlowCopyFor('no').warmCold;
    expect(markup).toContain(localized.recoveryTitle);
    expect(markup).toContain(localized.recoveryInstruction);
    for (const status of localized.statuses) {
      expect(markup).toContain(status.title);
      expect(markup).toContain(status.signal);
      expect(markup).toContain(status.action);
      expect(markup).toContain(`aria-label="${status.ariaLabel}"`);
    }
  });

  it('keeps generic catalog candidates informational and reserves the action for finalized outfit options', () => {
    const detailSource = source('src/components/PlaggDetailSheet.tsx');
    const garmentListSource = source('src/components/outfit/OutfitGarmentList.tsx');
    expect(detailSource).not.toMatch(/swap-override-store|useSwapOverride|setSwap|handleSwap|Bytte til|Bytt til|SwapIcon|onClick=\{\(\) => handleSwap/);
    expect(detailSource).toContain('.plagg-detail-sheet .ba-press:focus-visible');
    expect(garmentListSource).toContain('hasAlternative &&');
    expect(garmentListSource).toContain('<span>{copy.outfit.swap}</span>');
    expect(garmentListSource).toContain('copy.outfit.swapGarment(label)');
    expect(garmentListSource).toContain('copy.outfit.noAlternatives(label)');
    expect(garmentListSource).toContain('className="outfit-row"');

    const markup = renderToStaticMarkup(createElement(PlaggDetailSheet, {
      garmentId: 'ullsokker', isOpen: false, onClose: () => undefined, triggerRef: createRef<HTMLElement>(),
    }));
    expect(markup).toContain('Alternative plagg');
    expect(markup).not.toMatch(/<button[^>]*>[^<]*(?:Bytt|Velg)|Bytt til|Bytte til/);
    expect(markup).not.toContain('role="button"');
    expect(OutfitExperience).toBeTypeOf('function');
  });
});
