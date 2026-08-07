/**
 * MÅLEPUNKT for funnet «widgeten har ingen datakilde» (2026-08-06).
 *
 * Funnet var ikke at plumbingen manglet — den fantes og var testet — men at
 * INGENTING i appen kalte den. Testene her måler mekanismen: at koblingen
 * bygger et ekte snapshot, struper det, respekterer Capacitor-vakten og
 * aldri kaster. At HjemScreen faktisk monterer hooken måles i
 * src/screens/__tests__/HjemScreen.widget-kallsted.test.ts (kildelesing —
 * repoet har ingen jsdom, og renderToStaticMarkup kjører aldri effekter).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recommendation, WeatherInput } from '../../wool-layers/types.js';

// Capacitor mockes slik at både web-grenen (no-op) og native-grenen kan
// måles. `vi.hoisted` fordi bridge.ts kaller registerPlugin ved modullast.
const cap = vi.hoisted(() => ({
  erNative: false,
  updateSnapshot: vi.fn(async (_options: { json: string }) => {}),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => cap.erNative },
  registerPlugin: () => ({ updateSnapshot: cap.updateSnapshot }),
}));

import { sendWidgetSnapshotHvisEndret, widgetInnholdsnokkel } from '../use-widget-snapshot.js';

const vaer: WeatherInput = {
  feelsLikeC: 1,
  tempC: 4,
  windMs: 2,
  precipMmH: 0,
  symbolCode: 'partlycloudy_day',
};

const rec: Recommendation = {
  activity: 'vogn',
  tempBand: 'kjolig',
  layers: [
    { category: 'innerst', items: ['ullsett tynt'] },
    { category: 'yttertoy', items: ['kjøredress'] },
    { category: 'ekstra', items: ['lue'] },
  ],
  notes: [],
  structuredNotes: [],
  summary: 'Vogn',
  safetyFlags: [],
  severity: 'NONE',
};

const kilde = { childName: 'Lillian', weather: vaer, rec, activity: 'vogn' } as const;

const T0 = Date.parse('2026-08-06T07:30:00.000Z');

/** Minimal localStorage — bridge.ts sin ferskhetsmarkør trenger en. */
function fakeLocalStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    length: 0,
  };
}

beforeEach(() => {
  cap.erNative = false;
  cap.updateSnapshot.mockReset();
  cap.updateSnapshot.mockImplementation(async () => {});
  vi.stubGlobal('localStorage', fakeLocalStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('widgetInnholdsnokkel — struping på innhold, ikke på render', () => {
  it('er null når været mangler', () => {
    expect(widgetInnholdsnokkel({ ...kilde, weather: null })).toBeNull();
  });

  it('er null når anbefalingen mangler', () => {
    expect(widgetInnholdsnokkel({ ...kilde, rec: null })).toBeNull();
  });

  it('er uendret for et nytt, men innholdslikt vær-objekt (ny render → ingen ny sending)', () => {
    const a = widgetInnholdsnokkel(kilde);
    const b = widgetInnholdsnokkel({ ...kilde, weather: { ...vaer } });
    expect(a).not.toBeNull();
    expect(b).toBe(a);
  });

  it('ignorerer endringer snapshotet uansett runder bort (4,0 → 4,3 °C)', () => {
    expect(widgetInnholdsnokkel({ ...kilde, weather: { ...vaer, tempC: 4.3 } }))
      .toBe(widgetInnholdsnokkel(kilde));
  });

  it('endrer seg når aktiviteten byttes', () => {
    expect(widgetInnholdsnokkel({ ...kilde, activity: 'utelek' }))
      .not.toBe(widgetInnholdsnokkel(kilde));
  });

  it('endrer seg når anbefalingens plagg endrer seg', () => {
    const annen: Recommendation = {
      ...rec,
      layers: [{ category: 'innerst', items: ['ullsett tykt'] }],
    };
    expect(widgetInnholdsnokkel({ ...kilde, rec: annen }))
      .not.toBe(widgetInnholdsnokkel(kilde));
  });
});

describe('sendWidgetSnapshotHvisEndret', () => {
  it('sender ikke uten vær eller anbefaling', async () => {
    expect(await sendWidgetSnapshotHvisEndret({ ...kilde, weather: null }, T0))
      .toBe('mangler-data');
    expect(await sendWidgetSnapshotHvisEndret({ ...kilde, rec: null }, T0))
      .toBe('mangler-data');
    expect(cap.updateSnapshot).not.toHaveBeenCalled();
  });

  it('sender første gang, og hopper over uendret innhold rett etterpå', async () => {
    expect(await sendWidgetSnapshotHvisEndret(kilde, T0)).toBe('sendt');
    expect(await sendWidgetSnapshotHvisEndret(kilde, T0 + 60_000)).toBe('uendret');
  });

  it('sender på nytt når anbefalingen endrer seg', async () => {
    await sendWidgetSnapshotHvisEndret(kilde, T0);
    const varmere: Recommendation = {
      ...rec,
      layers: [{ category: 'innerst', items: ['body kortermet'] }],
    };
    expect(await sendWidgetSnapshotHvisEndret({ ...kilde, rec: varmere }, T0 + 60_000))
      .toBe('sendt');
  });

  it('sender på nytt når forrige snapshot er over 60 minutter gammelt', async () => {
    await sendWidgetSnapshotHvisEndret(kilde, T0);
    expect(await sendWidgetSnapshotHvisEndret(kilde, T0 + 61 * 60_000)).toBe('sendt');
  });

  it('rører ALDRI native-pluginet utenfor native (Capacitor-vakten i bridge.ts)', async () => {
    cap.erNative = false;
    expect(await sendWidgetSnapshotHvisEndret(kilde, T0)).toBe('sendt');
    expect(cap.updateSnapshot).not.toHaveBeenCalled();
  });

  it('leverer faktisk JSON til pluginet på native', async () => {
    cap.erNative = true;
    expect(await sendWidgetSnapshotHvisEndret(kilde, T0)).toBe('sendt');
    expect(cap.updateSnapshot).toHaveBeenCalledTimes(1);
    const snapshot = JSON.parse(cap.updateSnapshot.mock.calls[0][0].json) as Record<string, unknown>;
    expect(snapshot.childName).toBe('Lillian');
    expect(snapshot.tempC).toBe(4);
    expect(snapshot.activity).toBe('vogn');
    expect(snapshot.topGarments).toEqual(['ullsett tynt', 'kjøredress']);
    expect(snapshot.toppTilTaa).toEqual(['lue']);
  });

  it('kaster aldri — en plugin-feil gir stille fallback', async () => {
    cap.erNative = true;
    cap.updateSnapshot.mockRejectedValueOnce(new Error('plugin mangler'));
    await expect(sendWidgetSnapshotHvisEndret(kilde, T0)).resolves.toBeTypeOf('string');
  });
});
describe('utløp — widgeten må kunne visne av seg selv', () => {
  /* Mekanismen er bevist på enhet (to observasjoner 7. august): iOS bytter
     til en degradert entry ved `expiresAt` uten at appen åpnes. Men den kan
     ikke utløses uten feltet, og feltet ble satt av spike-panelet — som er
     slettet. Testene her måler koblingen, ikke mekanismen. */

  beforeEach(() => {
    cap.erNative = true;
    cap.updateSnapshot.mockClear();
  });

  function sendtSnapshot(): Record<string, unknown> {
    const kall = cap.updateSnapshot.mock.calls.at(-1);
    if (!kall) throw new Error('updateSnapshot ble aldri kalt');
    return JSON.parse((kall[0] as { json: string }).json) as Record<string, unknown>;
  }

  it('setter utløp til nøyaktig værdataenes ferskhet — ikke et valgt tall', async () => {
    expect(await sendWidgetSnapshotHvisEndret(kilde, T0)).toBe('sendt');
    const snap = sendtSnapshot();

    // CACHE_TTL_MS i met-no/client.ts: «1 time per met.no-anbefaling».
    // Endres den, skal DENNE testen falle — det er hele poenget med at de
    // to stedene deler konstant.
    expect(snap.expiresAtISO).toBe(new Date(T0 + 60 * 60 * 1000).toISOString());
    expect(snap.v).toBe(2);
  });

  it('utløpet ligger ETTER utstedelsen, aldri før', async () => {
    await sendWidgetSnapshotHvisEndret(kilde, T0);
    const snap = sendtSnapshot();
    expect(Date.parse(snap.expiresAtISO as string)).toBeGreaterThan(
      Date.parse(snap.updatedAtISO as string),
    );
  });

  it('samme råd gir samme briefId — ellers ville strupingen vært borte', async () => {
    await sendWidgetSnapshotHvisEndret(kilde, T0);
    const forste = sendtSnapshot();
    // 61 min senere: ferskhetsregelen tvinger en ny sending, men innholdet
    // er det samme, så briefen er den samme briefen — bare fornyet.
    await sendWidgetSnapshotHvisEndret(kilde, T0 + 61 * 60_000);
    const andre = sendtSnapshot();

    expect(forste.briefId).toBeTruthy();
    expect(andre.briefId).toBe(forste.briefId);
    // versjon = utstedelsestidspunkt, så et nyere råd slår alltid et eldre (I1).
    expect(andre.versjon as number).toBeGreaterThan(forste.versjon as number);
    // ...og utløpet er flyttet fram med fornyelsen.
    expect(Date.parse(andre.expiresAtISO as string))
      .toBeGreaterThan(Date.parse(forste.expiresAtISO as string));
    expect(andre.deepLink).toBe(`babyora://brief/${andre.briefId as string}`);
  });

  it('ET ANNET råd gir en annen briefId', async () => {
    await sendWidgetSnapshotHvisEndret(kilde, T0);
    const forste = sendtSnapshot();
    const annet = { ...kilde, activity: 'baeresele' as const };
    await sendWidgetSnapshotHvisEndret(annet, T0 + 60_000);
    expect(sendtSnapshot().briefId).not.toBe(forste.briefId);
  });
});
