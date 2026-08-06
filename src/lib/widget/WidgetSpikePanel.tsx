/**
 * Native spike (2026-08-06) — UPOLERT testpanel for widget-feasibility.
 *
 * Eneste app-side-kobling spiken trenger (Sols avgrensning: minst mulig
 * inngrep i src). Panelet:
 *   1. skriver et test-snapshot (kontrakt v2) til widgeten via
 *      WidgetBridge — med valgbart utløp, slik at eieren kan observere
 *      degraderingen VED expiresAt uten app-åpning;
 *   2. viser siste deep link appen ble åpnet med (appUrlOpen), slik at
 *      «trykk på widget → babyora://brief/<briefId>» kan verifiseres
 *      uten devtools på enheten.
 *
 * Synlig kun på native (TestFlight/APK) og i dev-web. Slettes når
 * spiken er besvart — dette er bevisverktøy, ikke produkt.
 */
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { withBriefFields, type WidgetSnapshot } from './snapshot';
import { pushWidgetSnapshot } from './bridge';

function testSnapshot(nowISO: string): WidgetSnapshot {
  return {
    v: 1,
    childName: 'Testbarn',
    updatedAtISO: nowISO,
    tempC: 4,
    feelsLikeC: 1,
    conditionKey: 'partly-cloudy',
    layerCount: 3,
    layerBadgeBand: 'medium',
    topGarments: ['ullsett tynt', 'ull-mellomlag', 'kjøredress'],
    toppTilTaa: ['lue', 'votter'],
    activity: 'vogn',
    deepLink: 'babyora://hjem',
  };
}

const boksStil: React.CSSProperties = {
  margin: '16px 24px',
  padding: 12,
  border: '2px dashed #b45309',
  borderRadius: 8,
  fontSize: '0.8rem',
  lineHeight: 1.5,
};

const knappStil: React.CSSProperties = {
  display: 'block',
  width: '100%',
  margin: '6px 0',
  padding: '10px 12px',
  fontSize: '0.85rem',
  borderRadius: 6,
  border: '1px solid #b45309',
  background: 'transparent',
  color: 'inherit',
  textAlign: 'left',
};

export function WidgetSpikePanel(): React.ReactElement | null {
  const [status, setStatus] = useState<string>('Ingen test-brief sendt ennå');
  const [sisteDeepLink, setSisteDeepLink] = useState<string>('(ingen mottatt)');

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const p = CapacitorApp.addListener('appUrlOpen', (event) => {
      setSisteDeepLink(event.url);
    });
    return () => {
      void p.then((h) => h.remove());
    };
  }, []);

  if (!Capacitor.isNativePlatform() && !import.meta.env.DEV) return null;

  async function sendTestBrief(utloperOmSek: number): Promise<void> {
    const naa = Date.now();
    const expiresAtISO = new Date(naa + utloperOmSek * 1000).toISOString();
    const briefId = `spike-${naa}`;
    const snapshot = withBriefFields(testSnapshot(new Date(naa).toISOString()), {
      expiresAtISO,
      versjon: Math.floor(naa / 1000), // alltid nyere enn forrige (I1)
      briefId,
      deltaTekst: '+1 ull-lag: føles 6° kaldere enn i går',
    });
    const sendt = await pushWidgetSnapshot(snapshot, naa);
    const kl = new Date(naa + utloperOmSek * 1000).toLocaleTimeString('nb-NO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setStatus(
      sendt
        ? `Sendt: ${briefId} — utløper kl. ${kl}. Gå til hjemskjermen og se på widgeten.`
        : `Bygget, men native bro utilgjengelig (web?): ${briefId}, utløp kl. ${kl}`,
    );
  }

  return (
    <section style={boksStil} aria-label="Widget-spike testpanel">
      <strong>Widget-spike (testverktøy — fjernes)</strong>
      <button type="button" style={knappStil} onClick={() => void sendTestBrief(2 * 60)}>
        Send test-brief · utløper om 2 min
      </button>
      <button type="button" style={knappStil} onClick={() => void sendTestBrief(15 * 60)}>
        Send test-brief · utløper om 15 min
      </button>
      <div>Status: {status}</div>
      <div>Siste deep link inn: {sisteDeepLink}</div>
    </section>
  );
}
