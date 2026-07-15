import { describe, it, expect } from 'vitest';
import { verifiedAvatarAsset } from '../verified-avatar';

describe('verifiedAvatarAsset', () => {
  it('matcher ytterste plagg + positur til riktig varmenivå', () => {
    expect(verifiedAvatarAsset('standing', 'kortermet body', null)).toMatch(/std-1-sommer\.png$/);
    expect(verifiedAvatarAsset('sitting', 'kortermet body', null)).toMatch(/sit-1-sommer\.png$/);
    expect(verifiedAvatarAsset('standing', 'isolert vinterdress', null)).toMatch(/std-5-vinter\.png$/);
    expect(verifiedAvatarAsset('standing', 'kjøredress', null)).toMatch(/std-4-kald\.png$/);
    expect(verifiedAvatarAsset('standing', 'regntøy / skall', null)).toMatch(/std-7-regn\.png$/);
    expect(verifiedAvatarAsset('standing', 'vindtett skall', null)).toMatch(/std-8-vind\.png$/);
  });

  it('snødress + balaklava løftes til ekstrem-varianten', () => {
    expect(verifiedAvatarAsset('standing', 'isolert vinterdress', 'balaklava')).toMatch(/std-6-ekstrem\.png$/);
    // …men vanlig lue holder seg på vinter.
    expect(verifiedAvatarAsset('standing', 'isolert vinterdress', 'lue m/ ull')).toMatch(/std-5-vinter\.png$/);
  });

  it('ukjent/manglende ytterplagg → null (nøytral silhuett, aldri feil antrekk)', () => {
    expect(verifiedAvatarAsset('standing', null, null)).toBeNull();
    expect(verifiedAvatarAsset('standing', 'noe helt ukjent plagg', null)).toBeNull();
    // Et plagg uten asset-nivå (f.eks. bleie) → null.
    expect(verifiedAvatarAsset('standing', 'bleie', null)).toBeNull();
  });
});
