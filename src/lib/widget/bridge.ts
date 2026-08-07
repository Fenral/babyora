/**
 * P9.1 (2026-06-13): Capacitor-bro for widget-oppdatering.
 *
 * Pluginet WidgetBridge (no.klemeg.app.WidgetBridge) eksponerer én
 * metode: updateSnapshot(json).
 *
 * - iOS (P9.2): skriver JSON til App Group 'group.no.klemeg.app' og
 *   kaller WidgetCenter.reloadAllTimelines()
 * - Android (P9.3): skriver til DataStore og sender
 *   AppWidgetManager.notifyAppWidgetViewDataChanged()-broadcast
 *
 * Native-delene legges til av widget-sesjonene. Denne bro-koden er
 * en JS-no-op hvis pluginet ikke finnes (web-utvikling eller widget
 * ikke installert).
 */

import { registerPlugin, Capacitor } from '@capacitor/core';
import type { WidgetSnapshot } from './snapshot.js';

interface WidgetBridgePlugin {
  updateSnapshot(options: { json: string }): Promise<void>;
}

const plugin = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

const SNAPSHOT_STALE_MS = 60 * 60 * 1000;
const STORAGE_KEY = 'babyora:widget:lastSnapshot';

interface PersistedSnapshot {
  snapshot: WidgetSnapshot;
  pushedAtMs: number;
}

function readLast(): PersistedSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSnapshot;
  } catch {
    return null;
  }
}

function writeLast(snapshot: WidgetSnapshot, pushedAtMs: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ snapshot, pushedAtMs }));
  } catch {
    // localStorage full eller deaktivert — bare logg
  }
}

/**
 * Send snapshot til widget-pluginet. Hvis native ikke er tilgjengelig
 * (web, ikke-Capacitor), hopp over stille.
 *
 * Trigger-policy per docs/widget-contract.md:
 *   1. Vellykket rec på Hjem
 *   2. Aktivitetsbytte
 *   3. Morgenvarsel
 *   4. App-resume hvis snapshot > 60 min gammel
 *
 * Denne funksjonen returnerer true hvis snapshot ble sendt, false hvis hoppet over.
 */
export async function pushWidgetSnapshot(snapshot: WidgetSnapshot, nowMs: number): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    writeLast(snapshot, nowMs);
    return false;
  }
  try {
    await plugin.updateSnapshot({ json: JSON.stringify(snapshot) });
    writeLast(snapshot, nowMs);
    return true;
  } catch (err) {
    // Plugin finnes ikke ennå (widget-sesjonene ikke ferdige) — silent OK
    if (typeof console !== 'undefined') {
      console.warn('WidgetBridge.updateSnapshot feilet:', err);
    }
    return false;
  }
}

/**
 * Sjekk om vi bør pushe ny snapshot. Returns true når:
 * - Aldri pushet før
 * - Forrige snapshot > 60 min gammel
 * - Snapshot innhold har endret seg meningsfullt (layerCount,
 *   layerBadgeBand, conditionKey, activity, eller topGarments-set)
 * - v2: brief-IDENTITETEN har endret seg (briefId) — en ny brief skal ut.
 *
 *   ENDRET 2026-08-07: klausulen sammenlignet også `versjon` og
 *   `expiresAtISO`. Begge er tidsstemplet ved utstedelse og flytter seg
 *   derfor ved HVERT kall. Da så alle snapshots nye ut, strupingen var satt
 *   ut av spill, og widgeten ville blitt skrevet på hver eneste
 *   innholdssjekk. Et bevegelig utløp er ikke en grunn til å vekke
 *   widgeten; en ny brief er. `briefId` utledes av innholdet, så den er
 *   stabil så lenge forelderen ser det samme.
 *
 *   60-minutters ferskhetsregelen over sørger uansett for at utløpet
 *   fornyes: en brief som varer én time kan ikke bli stående lenger enn
 *   det uten at staleness-grenen fyrer.
 */
export function shouldPushSnapshot(next: WidgetSnapshot, nowMs: number): boolean {
  const last = readLast();
  if (!last) return true;
  if (nowMs - last.pushedAtMs > SNAPSHOT_STALE_MS) return true;
  const a = last.snapshot;
  return (
    a.layerCount !== next.layerCount ||
    a.layerBadgeBand !== next.layerBadgeBand ||
    a.conditionKey !== next.conditionKey ||
    a.activity !== next.activity ||
    a.topGarments.join('|') !== next.topGarments.join('|') ||
    a.toppTilTaa.join('|') !== next.toppTilTaa.join('|') ||
    a.briefId !== next.briefId
  );
}
