import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import i18n from '../../../i18n/index';
import { PlaggDetailSheet } from '../../PlaggDetailSheet';
import { KlePaaStepper, type KlePaaStep } from '../KlePaaStepper';
import { klePaaCopyFor } from '../kle-paa-copy';

const STEPS: readonly KlePaaStep[] = [
  {
    itemId: 'item-1',
    label: 'ullsokker',
    displayLabel: 'Test garment',
    roleLabel: 'Base layer',
    materialPoint: null,
    alternatives: [{ optionId: 'alt-1', label: 'bomullssokker', displayLabel: 'Cotton socks' }],
  },
  {
    itemId: 'item-2',
    label: 'lue',
    displayLabel: 'Second garment',
    roleLabel: 'Accessory',
    materialPoint: null,
    alternatives: [],
  },
];

const CASES = [
  ['en', 'Step 1 of 2', 'Change garment', 'Next', 'Wool socks', 'Alternative garments', 'See alternatives in the library'],
  ['sv', 'Steg 1 av 2', 'Byt plagg', 'Nästa', 'Ullstrumpor', 'Alternativa plagg', 'Se alternativ i biblioteket'],
  ['da', 'Trin 1 af 2', 'Skift beklædning', 'Næste', 'Uldsokker', 'Alternative beklædningsdele', 'Se alternativer i biblioteket'],
  ['no', 'Steg 1 av 2', 'Bytt plagg', 'Neste', 'Ullsokker', 'Alternative plagg', 'Se alternativer i biblioteket'],
] as const;

describe('Kle på and garment details localization', () => {
  it.each(CASES)('renders owned UI in %s', async (
    language,
    progress,
    swap,
    next,
    garment,
    alternatives,
    library,
  ) => {
    await i18n.changeLanguage(language);

    const stepper = renderToStaticMarkup(
      <KlePaaStepper steps={STEPS} onClose={() => undefined} onSwap={() => undefined} />,
    );
    expect(stepper).toContain(progress);
    expect(stepper).toContain(swap);
    expect(stepper).toContain(next);

    const detail = renderToStaticMarkup(
      <PlaggDetailSheet
        garmentId="ullsokker"
        isOpen={false}
        onClose={() => undefined}
        triggerRef={createRef<HTMLElement>()}
        onOpenLibrary={() => undefined}
      />,
    );
    expect(detail).toContain(garment);
    expect(detail).toContain(alternatives);
    expect(detail).toContain(library);
  });

  it('falls back to English for German and unknown languages', () => {
    expect(klePaaCopyFor('de').stepper.next).toBe('Next');
    expect(klePaaCopyFor('xx').detail.libraryLink).toBe('See alternatives in the library');
  });
});
