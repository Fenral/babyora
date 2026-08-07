/**
 * Tester for asset-rig-check.
 *
 * Testene 1–4 fanger regresjoner i selve målingen (matrisefeil i OKLab, naivt
 * min/max på hue, manglende erosjon, hardkodet kontrakt).
 *
 * Testene 5–10 er nye og ville ALLE strøket mot forrige versjon av verktøyet.
 * De holder fast tre ting den versjonen gjorde galt:
 *
 *  - maskoten sto i sitt eget kalibreringssett og var ett av tre assets som
 *    besto — den frikjente seg selv  (test 5, 6)
 *  - det fantes ingen vakt mot at en kalibrator også ble dømt, og en vakt uten
 *    forutsetning ville bestått på FRAVÆR  (test 6, 7)
 *  - fargebåndet ble brukt som RIGGDOM, selv om middels hue over et plagg er
 *    plaggets egen farge — som art bible kaller innhold  (test 8)
 *
 * Test 9 og 10 er de to positive: kontrakten fyrer i BEGGE retninger på ekte
 * data, og «bevist samme rendering» er en faktisk måling, ikke en påstand.
 */
import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import {
  BEVIS_MIN_PIKSLER,
  DEKKET_AV_PROOF,
  EGEN_MATERIALPROFIL,
  FINGERAVTRYKK_TOLERANSE,
  KALIBRERINGSSETT,
  KLIPPET_KATALOG,
  MONTER_KATALOG,
  PROOF_KATALOG,
  bevisSammeRendering,
  erSammeAsset,
  fargeavvik,
  fingeravtrykk,
  fingeravtrykkAvstand,
  hueAvstand,
  hueGrader,
  hueInnenfor,
  hueKonvolutt,
  kalibrerBand,
  lesRaa,
  malFil,
  malRaadata,
  malUnderMaske,
  srgbTilOklab,
  vaktIngenSelvdom,
  vurder,
} from './asset-rig-check.mjs';

/** Et fingeravtrykk med gitt silhuett-bredde — ulik bredde ⇒ ulikt asset. */
function syntetiskAvtrykk(motivBredde = 4, lysstyrke = 200) {
  const bredde = 8;
  const hoyde = 8;
  const data = Buffer.alloc(bredde * hoyde * 4);
  for (let y = 0; y < hoyde; y++) {
    for (let x = 0; x < bredde; x++) {
      const i = (y * bredde + x) * 4;
      const iMotiv = x >= 2 && x < 2 + motivBredde && y >= 2 && y <= 5;
      data[i] = lysstyrke;
      data[i + 1] = lysstyrke;
      data[i + 2] = lysstyrke;
      data[i + 3] = iMotiv ? 255 : 0;
    }
  }
  return fingeravtrykk({ data, width: bredde, height: hoyde, channels: 4 });
}

/** Målingsform med trygge standardverdier — testene overstyrer det de gjelder. */
function maaling(overstyr = {}) {
  return {
    fil: 'syntetisk.png',
    bredde: 512,
    hoyde: 512,
    gjennomsiktigAndel: 0.7,
    middelLuminans: 0.65,
    middelChroma: 0.065,
    middelHue: 55,
    hueVektorChroma: 0.065,
    nokkellysX: -0.2,
    fingeravtrykk: syntetiskAvtrykk(),
    ...overstyr,
  };
}

const SYNTETISK_FASIT = [
  maaling({ fil: 'a.png', middelLuminans: 0.6, middelChroma: 0.06, middelHue: 50, hueVektorChroma: 0.06, gjennomsiktigAndel: 0.6 }),
  maaling({ fil: 'b.png', middelLuminans: 0.7, middelChroma: 0.07, middelHue: 60, hueVektorChroma: 0.07, gjennomsiktigAndel: 0.7 }),
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

  it('måler korteste vinkelavstand over 0°, ikke tallforskjellen', () => {
    expect(hueAvstand(350, 10)).toBeCloseTo(20, 9);
    expect(hueAvstand(10, 350)).toBeCloseTo(20, 9);
    expect(hueAvstand(0, 180)).toBeCloseTo(180, 9);
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

  it('rapporterer null gjennomsiktighet når rommet er bakt inn', () => {
    const bakt = malRaadata(syntetiskAsset({ ugjennomsiktigKant: true }));
    expect(bakt.gjennomsiktigAndel).toBe(0);
    expect(bakt.pikslerIMotiv).toBeGreaterThan(m.pikslerIMotiv);
  });
});

describe('4 · kontrakten utledes av fasiten, aldri hardkodet', () => {
  const band = kalibrerBand(SYNTETISK_FASIT);

  it('setter utklippsgulvet under fasitens laveste, ikke på den', () => {
    expect(band.utklipp.proofMin).toBeCloseTo(0.6, 10);
    expect(band.utklipp.gulv).toBeLessThan(band.utklipp.proofMin);
    expect(band.utklipp.gulv).toBeGreaterThan(0);
  });

  it('legger fargespennets margin på spennet, ikke på hver referanse', () => {
    expect(band.farge.luminans.min).toBeCloseTo(0.6, 10);
    expect(band.farge.luminans.maks).toBeCloseTo(0.7, 10);
    expect(band.farge.luminans.lav).toBeCloseTo(0.6 - 0.1 * band.margin, 10);
    expect(band.farge.luminans.hoy).toBeCloseTo(0.7 + 0.1 * band.margin, 10);
  });

  it('nekter å kalibrere på et tomt sett i stedet for å finne på en kontrakt', () => {
    expect(() => kalibrerBand([])).toThrow(/tomt/i);
  });

  it('FORUTSETNING: nekter en kalibrator som selv har rommet bakt inn', () => {
    // Uten denne blir gulvet 0 og utklippsporten kan aldri fyre — den ville
    // bestått på fravær for hvert eneste asset.
    const medBakt = [...SYNTETISK_FASIT, maaling({ fil: 'bakt.png', gjennomsiktigAndel: 0 })];
    expect(() => kalibrerBand(medBakt)).toThrow(/gulvet ville blitt 0|0 % gjennomsiktighet/i);
  });
});

describe('5 · maskoten er UTE av kalibreringssettet', () => {
  it('kalibrerer på plaggene alene — ingen maskot, ingen værikoner', () => {
    expect(KALIBRERINGSSETT).toHaveLength(6);
    for (const navn of KALIBRERINGSSETT) {
      expect(navn.startsWith('maskot'), `${navn} har eget materiale og skal ikke kalibrere`).toBe(false);
      expect(navn.startsWith('vaer-'), `${navn} har eget materiale og skal ikke kalibrere`).toBe(false);
    }
  });

  it('dokumenterer hvem som ble tatt ut og hvorfor', () => {
    expect(Object.keys(EGEN_MATERIALPROFIL)).toContain('maskot.png');
    for (const navn of Object.keys(EGEN_MATERIALPROFIL)) {
      expect(KALIBRERINGSSETT).not.toContain(navn);
    }
  });

  it('maskoten åpnet hue-buen alene — ekte måling', async () => {
    const plagg = [];
    for (const navn of KALIBRERINGSSETT) plagg.push(await malFil(join(PROOF_KATALOG, navn)));
    const maskot = await malFil(join(PROOF_KATALOG, 'maskot.png'));

    const utenMaskot = kalibrerBand(plagg);
    const medMaskot = kalibrerBand([...plagg, maskot]);
    // Maskoten ligger under plaggenes varmeste ende (46,8° mot 51,3°) og
    // utvider derfor buen uten å tilføre en eneste plaggreferanse.
    expect(maskot.middelHue).toBeLessThan(utenMaskot.farge.hue.fraRaa);
    expect(medMaskot.farge.hue.spenn).toBeGreaterThan(utenMaskot.farge.hue.spenn);
  }, 60_000);
});

describe('6 · vakten mot selvdom', () => {
  const kalibrering = [maaling({ fil: 'ullsett-tykt.png' })];
  /** Samme mål, helt annen silhuett — et annet asset. */
  const annetAsset = (fil) => maaling({ fil, fingeravtrykk: syntetiskAvtrykk(2, 60) });

  it('kaster når et asset er både kalibrator og dømt', () => {
    const dømt = [annetAsset('noe-annet.png'), maaling({ fil: 'kopi.png' })];
    expect(() => vaktIngenSelvdom(kalibrering, dømt)).toThrow(/både kalibrator og dømt/i);
  });

  it('slipper gjennom når settene er disjunkte, og sier hvor mange par den så', () => {
    const kvittering = vaktIngenSelvdom(kalibrering, [annetAsset('x.png')]);
    expect(kvittering.sammenlignedePar).toBe(1);
    expect(kvittering.selvtestet).toBe(1);
  });

  it('kaster IKKE på navneoverlapp alene — men rapporterer det', () => {
    // Steg 12 PLANLEGGER å erstatte plagg-tykt-ullsett.png med kalibratoren.
    // En plan er ikke en identitet: i dag er filen en annen rendering, og et
    // verktøy som nekter å kjøre på en plan er ubrukelig.
    expect(DEKKET_AV_PROOF['ullsett-tykt.png']).toBe('plagg-tykt-ullsett.png');
    const kvittering = vaktIngenSelvdom(kalibrering, [annetAsset('plagg-tykt-ullsett.png')]);
    expect(kvittering.navneoverlapp).toHaveLength(1);
    expect(kvittering.navneoverlapp[0].dømt).toBe('plagg-tykt-ullsett.png');
  });

  it('fyrer så snart Steg 12 faktisk har kopiert filen inn', () => {
    // Samme fingeravtrykk under det nye navnet = kopieringen har skjedd.
    const kopiert = maaling({ fil: 'plagg-tykt-ullsett.png' });
    expect(() => vaktIngenSelvdom(kalibrering, [kopiert])).toThrow(/både kalibrator og dømt/i);
  });

  it('fyrer på det HISTORISKE tilfellet: maskoten i begge sett', async () => {
    const proofMaskot = await malFil(join(PROOF_KATALOG, 'maskot.png'));
    const monterMaskot = await malFil(join(MONTER_KATALOG, 'maskot.webp'));
    // To filer på disk, ikke byte-identiske — men samme asset. Det var hullet.
    expect(erSammeAsset(proofMaskot, monterMaskot)).toBe(true);
    expect(() => vaktIngenSelvdom([proofMaskot], [monterMaskot])).toThrow(/både kalibrator og dømt/i);
  }, 60_000);

  it('slår IKKE sammen to mørke, avmettede plagg — middelverdier gjorde det', async () => {
    // Første identitetstest sammenlignet middels L/C/h. proof/vinterdress og
    // monter/plagg-skallbukse er begge mørke og nesten nøytrale, og kollapset
    // til «samme asset». Fingeravtrykket skiller dem på silhuetten.
    const vinterdress = await malFil(join(PROOF_KATALOG, 'vinterdress.png'));
    const skallbukse = await malFil(join(MONTER_KATALOG, 'plagg-skallbukse.webp'));
    expect(Math.abs(vinterdress.middelLuminans - skallbukse.middelLuminans)).toBeLessThan(0.05);
    expect(erSammeAsset(vinterdress, skallbukse)).toBe(false);
    expect(fingeravtrykkAvstand(vinterdress.fingeravtrykk, skallbukse.fingeravtrykk).dAlfa)
      .toBeGreaterThan(FINGERAVTRYKK_TOLERANSE.dAlfa * 3);
  }, 60_000);
});

describe('7 · vaktens FORUTSETNING — den skal ikke bestå på fravær', () => {
  const kalibrering = [maaling({ fil: 'k.png' })];

  it('kaster på tomt vurdert sett i stedet for å melde «ingen kollisjon»', () => {
    expect(() => vaktIngenSelvdom(kalibrering, [])).toThrow(/0 par kan aldri fyre/i);
  });

  it('kaster på tomt kalibreringssett', () => {
    expect(() => vaktIngenSelvdom([], [maaling()])).toThrow(/0 par kan aldri fyre/i);
  });

  it('kaster når identitetstesten ikke engang fyrer på et asset mot seg selv', () => {
    // En ødelagt identitetstest ville gitt «0 kollisjoner» for ALT — en
    // frikjennelse testen ikke kan bære.
    const alltidUlik = () => false;
    expect(() => vaktIngenSelvdom(kalibrering, [maaling({ fil: 'x.png' })], { erSamme: alltidUlik }))
      .toThrow(/mot seg selv/i);
  });

  it('kaster når en måling mangler fingeravtrykk i stedet for å falle tilbake', () => {
    const utenAvtrykk = { ...maaling({ fil: 'u.png' }), fingeravtrykk: undefined };
    expect(() => erSammeAsset(maaling(), utenAvtrykk)).toThrow(/mangler fingeravtrykk/i);
  });
});

describe('8 · fargen dømmer IKKE — den rapporteres', () => {
  const band = kalibrerBand(SYNTETISK_FASIT);

  it('feller et asset med rommet bakt inn', () => {
    const avvik = vurder(maaling({ gjennomsiktigAndel: 0 }), band);
    expect(avvik.map((a) => a.akse)).toContain('utklipp');
  });

  it('feller IKKE et ekte utklipp som bare har en annen egenfarge', () => {
    // plagg-badebukse: h 219° (blå) mot fasitens 50–60° (varm ull). Forrige
    // versjon felte den på hue — altså for å være blå. «Plaggets farge er
    // innhold» (art bible §Materialer).
    const blaa = maaling({ middelHue: 219, hueVektorChroma: 0.034, middelChroma: 0.034, middelLuminans: 0.36 });
    expect(vurder(blaa, band)).toEqual([]);
  });

  it('rapporterer den samme fargen som kontekst, på en egen kanal', () => {
    const blaa = maaling({ middelHue: 219, hueVektorChroma: 0.034, middelChroma: 0.034, middelLuminans: 0.36 });
    expect(fargeavvik(blaa, band).map((a) => a.akse)).toContain('hue');
  });

  it('lar et nesten nøytralt motiv slippe hue-konteksten — vinkelen er støy', () => {
    const noytral = maaling({ middelHue: 300, hueVektorChroma: 0.005 });
    expect(fargeavvik(noytral, band).map((a) => a.akse)).not.toContain('hue');
  });
});

describe('9 · kontrakten fyrer i BEGGE retninger på ekte data', () => {
  it('kalibratorene består sin egen kontrakt', async () => {
    const kalibrering = [];
    for (const navn of KALIBRERINGSSETT) kalibrering.push(await malFil(join(PROOF_KATALOG, navn)));
    expect(kalibrering).toHaveLength(6);

    const band = kalibrerBand(kalibrering);
    for (const m of kalibrering) {
      expect(vurder(m, band), `${m.fil} skal bestå kontrakten den selv kalibrerer`).toEqual([]);
    }
    expect(band.utklipp.gulv).toBeGreaterThan(0);
  }, 60_000);

  it('FORUTSETNING: porten feller en ekte, helt ugjennomsiktig PNG fra disk', async () => {
    // Uten dette ville «0 funn» kunne bety at porten aldri kan fyre.
    // b1-porttest.png er et porttest-ark, ikke et asset — det blir aldri
    // klippet, så saken råtner ikke når assets promoteres.
    const kalibrering = [];
    for (const navn of KALIBRERINGSSETT) kalibrering.push(await malFil(join(PROOF_KATALOG, navn)));
    const band = kalibrerBand(kalibrering);

    const bakt = await malFil(join(PROOF_KATALOG, 'b1-porttest.png'));
    expect(bakt.gjennomsiktigAndel).toBe(0);
    expect(bakt.kantbaand).toBeTruthy();
    expect(vurder(bakt, band).map((a) => a.akse)).toContain('utklipp');
  }, 60_000);
});

/** Bygger den bakte varianten av et utklipp: rommet fylt inn, alfa nullet ut. */
function bakInnRom(utklipp, bakgrunn = [46, 34, 22]) {
  const data = Buffer.from(utklipp.data);
  for (let p = 0; p < utklipp.width * utklipp.height; p++) {
    const i = p * utklipp.channels;
    if (data[i + 3] === 255) continue;
    data[i] = bakgrunn[0];
    data[i + 1] = bakgrunn[1];
    data[i + 2] = bakgrunn[2];
    data[i + 3] = 255;
  }
  return { ...utklipp, data };
}

describe('10 · «ferdig utklipp» er en måling, ikke en påstand', () => {
  it('kjenner igjen et utklipp av SAMME rendering som den bakte filen', async () => {
    const utklipp = await lesRaa(join(KLIPPET_KATALOG, 'plagg-votter.webp'));
    const bakt = bakInnRom(utklipp);
    // Forutsetning for at saken betyr noe: den bakte varianten er faktisk bakt.
    expect(malRaadata(bakt).gjennomsiktigAndel).toBe(0);
    expect(malRaadata(utklipp).gjennomsiktigAndel).toBeGreaterThan(0.3);

    const bevis = bevisSammeRendering(bakt, utklipp);
    expect(bevis.sammeRendering).toBe(true);
    expect(bevis.piksler).toBeGreaterThan(BEVIS_MIN_PIKSLER);
    // Klipping nuller bare alfa — RGB under masken skal være uendret.
    expect(bevis.dL).toBeLessThan(1e-9);
  }, 60_000);

  it('sier nei når RGB under masken er endret — da er det en ANNEN rendering', async () => {
    const utklipp = await lesRaa(join(KLIPPET_KATALOG, 'plagg-votter.webp'));
    const forskjøvet = bakInnRom(utklipp);
    for (let p = 0; p < forskjøvet.width * forskjøvet.height; p++) {
      const i = p * forskjøvet.channels;
      if (utklipp.data[i + 3] !== 255) continue;
      forskjøvet.data[i] = Math.min(255, forskjøvet.data[i] + 60);
    }
    expect(bevisSammeRendering(forskjøvet, utklipp).sammeRendering).toBe(false);
  }, 60_000);

  it('sier nei når kandidaten er et ANNET plagg', async () => {
    const votter = await lesRaa(join(KLIPPET_KATALOG, 'plagg-votter.webp'));
    const feilUtklipp = await lesRaa(join(KLIPPET_KATALOG, 'plagg-stroempebukse.webp'));
    expect(bevisSammeRendering(bakInnRom(votter), feilUtklipp).sammeRendering).toBe(false);
  }, 60_000);

  it('FORUTSETNING: nekter å bevise noe uten nok sammenlignede piksler', () => {
    const bilde = syntetiskAsset();
    const maske = syntetiskAsset();
    expect(malUnderMaske(bilde, maske).n).toBeLessThan(BEVIS_MIN_PIKSLER);
    const bevis = bevisSammeRendering(bilde, maske);
    expect(bevis.sammeRendering).toBe(false);
    expect(bevis.grunn).toMatch(/sammenlignede piksler/);
  });

  it('FORUTSETNING: nekter når dimensjonene ikke stemmer', () => {
    const a = syntetiskAsset();
    const b = { ...syntetiskAsset(), width: 4, height: 16 };
    expect(bevisSammeRendering(a, b).grunn).toMatch(/dimensjoner/);
  });
});
