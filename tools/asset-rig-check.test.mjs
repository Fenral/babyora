/**
 * Tester for asset-rig-check.
 *
 * Alle testene her ville strøket før verktøyet fantes — men det er ikke
 * poenget. Poenget er hvilke FEIL de fanger hvis noen endrer verktøyet
 * senere, siden verktøyets tall er det eieren tar en B2-beslutning på:
 *
 *  - matrisefeil i sRGB→OKLab  (test 1)
 *  - naivt min/max på hue, som deler seg feil rundt 0°  (test 2)
 *  - manglende 1 px-erosjon, så halvgjennomsiktige kantpiksler blander
 *    bakgrunnsstoff inn i hue og luminans  (test 3)
 *  - en fargesjekk som glemmer utklippskontrakten, altså slipper et asset
 *    med rommet bakt inn gjennom fordi fargene tilfeldigvis stemmer  (test 5)
 *  - hue målt på et nesten nøytralt motiv, der vinkelen er støy  (test 6/7)
 *  - et bånd som ikke engang rommer sin egen fasit  (test 8)
 */
import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import {
  KALIBRERINGSSETT,
  PROOF_KATALOG,
  hueGrader,
  hueInnenfor,
  hueKonvolutt,
  kalibrerBand,
  malFil,
  malRaadata,
  srgbTilOklab,
  vurder,
} from './asset-rig-check.mjs';

/** Målingsform med trygge standardverdier — testene overstyrer det de gjelder. */
function maaling(overstyr = {}) {
  return {
    gjennomsiktigAndel: 0.7,
    middelLuminans: 0.65,
    middelChroma: 0.065,
    middelHue: 55,
    hueVektorChroma: 0.065,
    nokkellysX: -0.2,
    ...overstyr,
  };
}

const SYNTETISK_FASIT = [
  maaling({ middelLuminans: 0.6, middelChroma: 0.06, middelHue: 50, hueVektorChroma: 0.06, gjennomsiktigAndel: 0.6, nokkellysX: -0.2 }),
  maaling({ middelLuminans: 0.7, middelChroma: 0.07, middelHue: 60, hueVektorChroma: 0.07, gjennomsiktigAndel: 0.7, nokkellysX: -0.3 }),
];

describe('1 · sRGB → OKLab', () => {
  it('gir L≈1 og null chroma for hvitt', () => {
    const [L, a, b] = srgbTilOklab(255, 255, 255);
    expect(L).toBeCloseTo(1, 5);
    expect(Math.hypot(a, b)).toBeLessThan(1e-6);
  });

  it('gir null for svart og bevarer nøytralitet i gråtoner', () => {
    expect(srgbTilOklab(0, 0, 0)[0]).toBeCloseTo(0, 6);
    const [L, a, b] = srgbTilOklab(128, 128, 128);
    expect(L).toBeGreaterThan(0.4);
    expect(L).toBeLessThan(0.7);
    expect(Math.hypot(a, b)).toBeLessThan(1e-6);
  });

  it('plasserer rent rødt og rent blått på riktig side av hue-sirkelen', () => {
    const rod = srgbTilOklab(255, 0, 0);
    const bla = srgbTilOklab(0, 0, 255);
    expect(hueGrader(rod[1], rod[2])).toBeGreaterThan(20);
    expect(hueGrader(rod[1], rod[2])).toBeLessThan(45);
    expect(hueGrader(bla[1], bla[2])).toBeGreaterThan(240);
    expect(hueGrader(bla[1], bla[2])).toBeLessThan(290);
  });
});

describe('2 · hue-konvolutten er en BUE, ikke et min/max', () => {
  it('velger den korte buen over 0° i stedet for hele sirkelen', () => {
    const bue = hueKonvolutt([350, 5, 10]);
    expect(bue.fra).toBe(350);
    expect(bue.til).toBe(10);
    expect(bue.spenn).toBeCloseTo(20, 6);
    // Et naivt min/max ville gitt [5, 350] og sluppet 180° inn.
    expect(hueInnenfor(355, bue)).toBe(true);
    expect(hueInnenfor(0, bue)).toBe(true);
    expect(hueInnenfor(180, bue)).toBe(false);
  });

  it('kollapser til et punkt når alle vinklene er like', () => {
    const bue = hueKonvolutt([61, 61, 61]);
    expect(bue.spenn).toBe(0);
    expect(hueInnenfor(61, bue)).toBe(true);
    expect(hueInnenfor(90, bue)).toBe(false);
  });
});

/** 8×8 RGBA: gjennomsiktig kant, 4×4 motiv, venstre halvdel av motivet lysest. */
function syntetiskAsset({ lys = [220, 190, 150], mork = [120, 100, 78], ugjennomsiktigKant = false } = {}) {
  const width = 8;
  const height = 8;
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const iMotiv = x >= 2 && x <= 5 && y >= 2 && y <= 5;
      const farge = iMotiv && x <= 3 ? lys : mork;
      data[i] = farge[0];
      data[i + 1] = farge[1];
      data[i + 2] = farge[2];
      data[i + 3] = iMotiv || ugjennomsiktigKant ? 255 : 0;
    }
  }
  return { data, width, height, channels: 4 };
}

describe('3 · masken er alfamasken ERODERT 1 px', () => {
  const raa = syntetiskAsset();
  const m = malRaadata(raa);

  it('teller bare piksler som selv og hvis fire naboer er helt ugjennomsiktige', () => {
    // Motivet er 4×4 (16 piksler), men ytterringen har gjennomsiktige naboer
    // → bare den indre 2×2-kjernen overlever erosjonen.
    expect(m.heltAndel).toBeCloseTo(16 / 64, 10);
    expect(m.pikslerIMotiv).toBe(4);
    expect(m.gjennomsiktigAndel).toBeCloseTo(48 / 64, 10);
  });

  it('måler L, C og h på de faktiske pikselverdiene', () => {
    const [Ll, al, bl] = srgbTilOklab(220, 190, 150);
    const [Lm, am, bm] = srgbTilOklab(120, 100, 78);
    // Kjernen er to lyse (x=3) og to mørke (x=4) piksler.
    expect(m.middelLuminans).toBeCloseTo((Ll + Lm) / 2, 10);
    expect(m.middelChroma).toBeCloseTo((Math.hypot(al, bl) + Math.hypot(am, bm)) / 2, 10);
    expect(m.middelHue).toBeCloseTo(hueGrader((al + am) / 2, (bl + bm) / 2), 10);
    expect(m.hueVektorChroma).toBeCloseTo(Math.hypot((al + am) / 2, (bl + bm) / 2), 10);
  });

  it('finner nøkkellyset på den lyse siden', () => {
    expect(m.nokkellysX).toBeLessThan(0);
  });

  it('rapporterer null gjennomsiktighet når rommet er bakt inn', () => {
    const bakt = malRaadata(syntetiskAsset({ ugjennomsiktigKant: true }));
    expect(bakt.gjennomsiktigAndel).toBe(0);
    expect(bakt.pikslerIMotiv).toBeGreaterThan(m.pikslerIMotiv);
  });
});

describe('4 · båndet utledes av fasiten, aldri hardkodet', () => {
  const band = kalibrerBand(SYNTETISK_FASIT);

  it('legger marginen på spennet, ikke på hver referanse', () => {
    expect(band.luminans.min).toBeCloseTo(0.6, 10);
    expect(band.luminans.maks).toBeCloseTo(0.7, 10);
    expect(band.luminans.lav).toBeCloseTo(0.6 - 0.1 * band.margin, 10);
    expect(band.luminans.hoy).toBeCloseTo(0.7 + 0.1 * band.margin, 10);
  });

  it('setter utklippsgulvet under fasitens laveste, ikke på den', () => {
    expect(band.utklipp.proofMin).toBeCloseTo(0.6, 10);
    expect(band.utklipp.gulv).toBeLessThan(band.utklipp.proofMin);
    expect(band.utklipp.gulv).toBeGreaterThan(0);
  });

  it('nekter å kalibrere på et tomt sett i stedet for å finne på et bånd', () => {
    expect(() => kalibrerBand([])).toThrow();
  });
});

describe('5 · utklippskontrakten står FØR fargene', () => {
  const band = kalibrerBand(SYNTETISK_FASIT);

  it('felles et asset med rommet bakt inn selv når fargene ligger midt i båndet', () => {
    const avvik = vurder(maaling({ gjennomsiktigAndel: 0 }), band);
    expect(avvik.map((a) => a.akse)).toContain('utklipp');
    // Nettopp dette er fella: L/C/h stemmer, men de beskriver rommet.
    expect(avvik.map((a) => a.akse)).not.toContain('luminans');
    expect(avvik.map((a) => a.akse)).not.toContain('chroma');
  });

  it('slipper gjennom et ekte utklipp med samme farger', () => {
    expect(vurder(maaling(), band)).toEqual([]);
  });
});

describe('6 · hue måles bare over chroma-porten', () => {
  const band = kalibrerBand(SYNTETISK_FASIT);

  it('dømmer hue når motivet har farge', () => {
    const avvik = vurder(maaling({ middelHue: 300, hueVektorChroma: 0.05 }), band);
    expect(avvik.map((a) => a.akse)).toContain('hue');
  });

  it('lar et nesten nøytralt motiv slippe hue-dommen — vinkelen er støy', () => {
    const avvik = vurder(maaling({ middelHue: 300, hueVektorChroma: 0.005 }), band);
    expect(avvik.map((a) => a.akse)).not.toContain('hue');
  });
});

describe('7 · en nøytral referanse skal ikke utvide hue-båndet', () => {
  it('holder en avmettet fasit-asset utenfor kalibreringen', () => {
    const medNoytral = [
      ...SYNTETISK_FASIT,
      maaling({ middelHue: 317, hueVektorChroma: 0.005, middelLuminans: 0.65, middelChroma: 0.065 }),
    ];
    const band = kalibrerBand(medNoytral);
    expect(band.hue.kalibrertPaa).toBe(2);
    expect(band.hue.utenforPort).toBe(1);
    expect(hueInnenfor(317, band.hue)).toBe(false);
    expect(hueInnenfor(55, band.hue)).toBe(true);
  });
});

describe('8 · fasiten ligger innenfor sitt eget bånd (ekte proof-assets)', () => {
  it('kalibrerer på de 9 proof-assetene og finner null avvik i dem', async () => {
    const proof = [];
    for (const navn of KALIBRERINGSSETT) proof.push(await malFil(join(PROOF_KATALOG, navn)));
    expect(proof).toHaveLength(9);

    const band = kalibrerBand(proof);
    // Proof-settets vinterdress er en mørk, nesten avmettet flate — den skal
    // falle utenfor chroma-porten og dermed ikke kalibrere hue.
    expect(band.hue.kalibrertPaa).toBe(8);
    expect(band.hue.utenforPort).toBe(1);
    expect(band.nokkellysVenstre).toBe(true);

    for (const m of proof) {
      expect(vurder(m, band), `${m.fil} skal ligge innenfor båndet den selv kalibrerer`).toEqual([]);
    }
  }, 30_000);

  it('gir hvert proof-asset et ekte alfa-utklipp å måle', async () => {
    const m = await malFil(join(PROOF_KATALOG, KALIBRERINGSSETT[0]));
    expect(m.gjennomsiktigAndel).toBeGreaterThan(0.3);
    expect(m.pikslerIMotiv).toBeGreaterThan(1000);
    expect(Number.isFinite(m.middelLuminans)).toBe(true);
  }, 30_000);
});
