/**
 * plagg-katalog-integritet — T1B: automatisert kontroll av katalogsannhet
 * for ALLE 60 katalogobjekter (Sols releasekrav: «automatisert kontroll for
 * manglende display-navn og ugyldig bilde-ID», analysesløyfen runde 10).
 *
 * Asserterer per id:
 *  (a) visningsnavn finnes, er i sync på tvers av alle tre kildene
 *      (katalog-audit/display-names.json ↔ src/data/garment-display-names.json
 *      ↔ plagg-katalog.json sitt label-felt) og er ULIKT rå db-streng-
 *      formatet (aldri ren småbokstav-streng).
 *  (b) katalog-illustrasjonen finnes som fil i public/illustrations/garments/.
 *  (c) det delte UI-oppslaget peker på katalogens eksakte, flate WebP for
 *      alle plagg — ingen bokstavplassholder og ingen sti som 404-er.
 *  (d) skjemafeltene katalogen HAR (category/label/aliases/illustration/
 *      what/when) er utfylt og gyldige. Felter Bytt-kompatibilitet vil
 *      trenge, men som katalogen MANGLER (kroppsdekning, varmebidrag,
 *      fukt/vind/vann-funksjon, avhengigheter, presis lagrolle), blir IKKE
 *      diktet opp her — testen håndhever i stedet at hullet er dokumentert
 *      per id i katalog-audit/t1b-validering.md (T3s startpunkt).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GARMENT_DISPLAY_NAMES, garmentDisplayName } from '../garment-display-names';
import { dbStringFor, garmentIdFor, garmentPng } from '../garment-illustrations';
import { getGarmentImage } from '../../lib/monter-assets';

type KatalogItem = Readonly<{
  id: string;
  category: string;
  label: string;
  aliases: readonly string[];
  illustration: string;
  what: string;
  when: string;
  subcategory?: string;
}>;

const ROOT = process.cwd();

const katalog = JSON.parse(
  readFileSync(resolve(ROOT, 'public/plagg-katalog.json'), 'utf8'),
) as { items: readonly KatalogItem[] };

const auditDisplayNames = JSON.parse(
  readFileSync(resolve(ROOT, 'katalog-audit/display-names.json'), 'utf8'),
) as Record<string, string>;

const t1bReport = readFileSync(
  resolve(ROOT, 'katalog-audit/t1b-validering.md'),
  'utf8',
);

const KNOWN_CATEGORIES = new Set(['innerst', 'mellomlag', 'yttertoy', 'ekstra', 'utstyr']);

/** Felt Bytt-kompatibilitet trenger (runde 4/T1B) som skjemaet kan mangle. */
const BYTT_FIELDS = ['kroppsdekning', 'varmebidrag', 'funksjon', 'avhengigheter', 'lagrolle'] as const;

describe('plagg-katalog-integritet (T1B)', () => {
  /* 60 -> 61 den 2026-08-06: `vintersokker` kom til.

     Tallet er ikke et maal, det er en RATSJE — det skal bare endres naar
     katalogen faktisk endres, og i samme commit. Et katalogtall som
     stille foelger med, vokter ingenting. */
  const ANTALL_PLAGG = 61;

  it('katalogen har nøyaktig 61 objekter med unike id-er', () => {
    expect(katalog.items).toHaveLength(ANTALL_PLAGG);
    const ids = katalog.items.map((item) => item.id);
    expect(new Set(ids).size).toBe(ANTALL_PLAGG);
  });

  it('(a) alle tre visningsnavn-kildene er identiske for alle 61 id-er', () => {
    expect(Object.keys(auditDisplayNames)).toHaveLength(ANTALL_PLAGG);
    expect(Object.keys(GARMENT_DISPLAY_NAMES)).toHaveLength(ANTALL_PLAGG);
    for (const item of katalog.items) {
      // katalog-audit-fasiten ↔ src-modulen (kopien kan aldri drive).
      expect(GARMENT_DISPLAY_NAMES[item.id], item.id).toBe(auditDisplayNames[item.id]);
      // katalogens label-felt ↔ fasiten (én kanonisk kilde, håndhevet).
      expect(item.label, item.id).toBe(auditDisplayNames[item.id]);
    }
  });

  it('(a) visningsnavn finnes og er ulikt rå db-streng-format for alle 60', () => {
    for (const item of katalog.items) {
      const name = garmentDisplayName(item.id);
      expect(name, item.id).toBeTruthy();
      // Aldri rå småbokstav-start («tykt ullsett»-mønsteret).
      expect(name.charAt(0), item.id).toBe(name.charAt(0).toUpperCase());
      expect(name.charAt(0), item.id).not.toBe(name.charAt(0).toLowerCase());
      // Aldri identisk med den rå db-strengen motoren emitterer.
      const db = dbStringFor(item.id);
      expect(name, item.id).not.toBe(db);
      // Aldri identisk med selve id-en (kebab-case).
      expect(name, item.id).not.toBe(item.id);
    }
  });

  it('(b) katalog-illustrasjonen finnes i public/illustrations/garments/ for alle 60', () => {
    for (const item of katalog.items) {
      const file = resolve(ROOT, 'public/illustrations/garments', `${item.id}.webp`);
      expect(existsSync(file), `${item.id} → ${file}`).toBe(true);
      // garmentPng(id) skal peke på samme fil (via BASE_URL) — aldri en
      // plassholder for katalog-id-er (alle 60 har egen PNG).
      expect(garmentPng(item.id), item.id).toContain(`illustrations/garments/${item.id}.webp`);
      // Katalogens egen illustration-URL skal referere samme filnavn.
      expect(item.illustration, item.id).toContain(`/illustrations/garments/${item.id}.webp`);
    }
  });

  it('(c) UI-oppslaget dekker alle 61 med eksakt flat WebP', () => {
    for (const item of katalog.items) {
      const path = getGarmentImage(item.id);
      const fileName = path.split('/').at(-1)!;
      expect(path, item.id).toBe(`/illustrations/garments/${item.id}.webp`);
      expect(fileName, item.id).toBe(`${item.id}.webp`);
      const file = resolve(ROOT, 'public/illustrations/garments', fileName);
      expect(existsSync(file), `${item.id} → ${path}`).toBe(true);
    }
  });

  it('(c) tidligere mismatch-/placeholder-plagg bruker nå sine egne motiv', () => {
    for (const id of ['kjoredress', 'ullsett-tynt', 'lue', 'tynn-ull-mellomlag']) {
      expect(getGarmentImage(id), id).toBe(`/illustrations/garments/${id}.webp`);
    }
  });

  it('(c) den sammensatte tøffel-sko-anbefalingen viser skoen, ikke bare sokken (audit 1a)', () => {
    expect(garmentIdFor('tøffel-sko + tykke ullsokker')).toBe('toffel-sko');
    // …uten å endre kanonisk db-streng for id-en (motor-/alternativ-nøkkel).
    expect(dbStringFor('toffel-sko')).toBe('tøffel-sko');
  });

  it('(d) feltene skjemaet HAR er utfylt og gyldige for alle 60', () => {
    for (const item of katalog.items) {
      expect(KNOWN_CATEGORIES.has(item.category), `${item.id}: category=${item.category}`).toBe(true);
      expect(item.label.trim().length, item.id).toBeGreaterThan(0);
      expect(Array.isArray(item.aliases) && item.aliases.length > 0, item.id).toBe(true);
      expect(item.what.trim().length, item.id).toBeGreaterThan(0);
      expect(item.when.trim().length, item.id).toBeGreaterThan(0);
    }
  });

  it('(d) manglende Bytt-kompatibilitetsfelt er dokumentert per id i t1b-validering.md — aldri diktet opp', () => {
    for (const item of katalog.items) {
      const missing = BYTT_FIELDS.filter(
        (field) => !(field in (item as unknown as Record<string, unknown>)),
      );
      if (missing.length === 0) continue;
      // Hullet skal være synlig i rapporten (T3s startpunkt) — testen
      // finner ALDRI på verdier for felter katalogen ikke har.
      expect(t1bReport.includes(item.id), `${item.id} mangler [${missing.join(', ')}] og må stå i katalog-audit/t1b-validering.md`).toBe(true);
    }
  });
});
