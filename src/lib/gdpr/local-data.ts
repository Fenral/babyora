/**
 * GDPR-helpers — eksporter + slett alle Babyora-lokale data.
 *
 * Babyora lagrer kun lokal data i localStorage (barn-profil, preferanser,
 * tooltip-flags, varsel-preferanser, abonnement-cache). Vi har ingen
 * server-side bruker-data utenom RevenueCat kvitteringer (som lever på
 * deres backend mot bruker-ID, ikke navn). Derfor er localStorage komplett
 * datakilde for GDPR Article 15 (innsyn) og 17 (sletting).
 *
 * Eksport: samler alle babyora:* + klemeg:* (legacy) nøkler til ett
 * JSON-objekt og trigger nedlasting i nettleseren via Blob+anchor.
 *
 * Sletting: itererer localStorage og fjerner alt med babyora:/klemeg:-prefiks.
 * Bevarer ikke-Babyora data (f.eks. Capacitor-pluginsnes egne nøkler).
 *
 * Brukes fra InnstillingerScreen sin GDPR-seksjon.
 */

const BABYORA_PREFIXES = ['babyora:', 'klemeg:'] as const;

/** Sjekk om en localStorage-nøkkel hører til Babyora-app (incl. legacy klemeg:). */
function isBabyoraKey(key: string): boolean {
  return BABYORA_PREFIXES.some((p) => key.startsWith(p));
}

/**
 * Samler alle Babyora-lokale data fra localStorage og returnerer som
 * et JSON-serialiserbart objekt. Verdiene parses som JSON hvis mulig,
 * ellers beholdes som streng.
 */
export interface ExportPayload {
  /** ISO 8601 timestamp da eksporten ble laget */
  exportedAt: string;
  /** App-versjon (fra package.json — settes av kallende sted) */
  appVersion: string;
  /** Schema-versjon for selve eksport-formatet */
  schemaVersion: 1;
  /** Alle Babyora-nøkler funnet i localStorage */
  localStorage: Record<string, unknown>;
}

export function collectLocalData(appVersion: string): ExportPayload {
  const payload: Record<string, unknown> = {};
  if (typeof window === 'undefined') {
    return {
      exportedAt: new Date().toISOString(),
      appVersion,
      schemaVersion: 1,
      localStorage: payload,
    };
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (!isBabyoraKey(key)) continue;
      const raw = localStorage.getItem(key);
      if (raw == null) continue;
      // Prøv å parse som JSON for at eksporten skal være lesbar — fall
      // tilbake til rå streng hvis det ikke er gyldig JSON (f.eks. enkle
      // boolean-flags som "1").
      try {
        payload[key] = JSON.parse(raw);
      } catch {
        payload[key] = raw;
      }
    }
  } catch {
    // Privat modus / quota — returner det vi har samlet så langt.
  }
  return {
    exportedAt: new Date().toISOString(),
    appVersion,
    schemaVersion: 1,
    localStorage: payload,
  };
}

/**
 * Trigger nedlasting av en JSON-fil med alle Babyora-lokale data.
 * Bruker Blob + anchor[download] — funker både i webview (Capacitor)
 * og vanlig nettleser. Filnavn inkluderer dato for ordens skyld.
 */
export function downloadLocalDataExport(appVersion: string): { ok: boolean; filename: string } {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { ok: false, filename: '' };
  }
  try {
    const payload = collectLocalData(appVersion);
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const filename = `babyora-mine-data-${today}.json`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Frigjør Blob-URL etter at klikket er fullført (litt forsinkelse
    // slik at noen nettlesere får tid til å starte nedlastingen).
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return { ok: true, filename };
  } catch (err) {
    console.warn('[Babyora] downloadLocalDataExport feilet', err);
    return { ok: false, filename: '' };
  }
}

/**
 * Slett alle Babyora-lokale data fra localStorage.
 * Returnerer antall nøkler som ble fjernet (for toast/UX-feedback).
 * Bevarer ikke-Babyora-nøkler (Capacitor-plugins, etc.).
 */
export function deleteAllLocalData(): { removed: number } {
  if (typeof window === 'undefined') return { removed: 0 };
  let removed = 0;
  try {
    // Kopier nøkler først — fjerning under iterasjon endrer length-indeks.
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isBabyoraKey(key)) keys.push(key);
    }
    for (const key of keys) {
      try {
        localStorage.removeItem(key);
        removed += 1;
      } catch {
        // Enkeltfeil — fortsett med resten.
      }
    }
  } catch {
    // Privat modus / quota — returner det vi rakk å fjerne.
  }
  return { removed };
}
