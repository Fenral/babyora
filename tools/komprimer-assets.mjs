/**
 * komprimer-assets.mjs — tar bundelvekten ned fra 293 MB til under 10.
 *
 * FUNN 2026-08-07: `du -sh android/app/src/main/assets/public` ga 311 MB.
 * Play tillater 200 MB nedlastingsstørrelse for basemodulen. Årsaken er
 * ikke mange filer, men at hver enkelt er en full-oppløsnings PNG:
 * garments-clay er 62 stykker à 1024x1024 og ~1,1 MB, tegnet på ~150 px.
 *
 * Målt på de faktiske filene: 512 px WebP q82 gir 17 KB per plagg mot
 * 1112 KB — 98,5 % lettere, og fortsatt skarpt på en 3x-skjerm.
 *
 * SKRIVER .webp VED SIDEN AV ORIGINALEN. Sletter ingenting uten `--slett`,
 * og da bare filer som har fått en verifisert .webp-tvilling. Rekkefølgen
 * er med vilje: konverter, bytt stiene i koden, se på skjermbildene, SÅ
 * slett. Et bilde som forsvinner fra en flate er lett å se og vanskelig å
 * oppdage i en diff.
 *
 * Maks-sidene under er satt per mappe ut fra hvor stort appen faktisk
 * tegner bildet, med rikelig margin. Endres en flate til å vise et bilde
 * større, må tallet her opp — derfor står begrunnelsen ved siden av.
 */
import { readdir, stat, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import sharp from 'sharp';

const ROT = resolve(process.cwd(), 'public');

/** @type {ReadonlyArray<{ mappe: string, maks: number, hvorfor: string }>} */
const MAPPER = [
  { mappe: 'illustrations/garments-clay', maks: 640, hvorfor: 'plaggkort ~150 px, TOG-guiden ~180 px' },
  { mappe: 'illustrations/garments', maks: 640, hvorfor: 'samme flater som clay-settet' },
  { mappe: 'avatars', maks: 768, hvorfor: 'påkledningsringens figur er den største, ~240 px' },
  { mappe: 'illustrations/vinterprogram', maks: 640, hvorfor: 'leksjonsomslag 132 px' },
  { mappe: 'monter', maks: 768, hvorfor: 'maskoten henger over panelet, ~153 px, men asset heter -360' },
  { mappe: 'illustrations/characters', maks: 640, hvorfor: 'nakkesjekk-illustrasjonen ~160 px' },
  { mappe: 'illustrations/dressup', maks: 640, hvorfor: 'samme familie som characters' },
  { mappe: 'illustrations/onboarding', maks: 640, hvorfor: 'maskot i onboarding ~224 px' },
  { mappe: 'weather-3d', maks: 512, hvorfor: 'værikon ~64 px' },
  { mappe: 'weather-bgs', maks: 1024, hvorfor: 'bakgrunn dekker hele bredden' },
];

const KVALITET = 82;

async function filer(dir) {
  const ut = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) ut.push(...(await filer(full)));
    else if (['.png', '.jpg', '.jpeg'].includes(extname(e.name).toLowerCase())) ut.push(full);
  }
  return ut;
}

const slett = process.argv.includes('--slett');
let sumFør = 0;
let sumEtter = 0;
let antall = 0;
const mislyktes = [];

for (const { mappe, maks, hvorfor } of MAPPER) {
  const dir = join(ROT, mappe);
  if (!existsSync(dir)) {
    console.log(`  hopper over ${mappe} — finnes ikke`);
    continue;
  }
  let mFør = 0;
  let mEtter = 0;
  let mAntall = 0;

  for (const kilde of await filer(dir)) {
    const mål = kilde.replace(/\.(png|jpe?g)$/iu, '.webp');
    try {
      const før = (await stat(kilde)).size;
      const bilde = sharp(kilde);
      const meta = await bilde.metadata();
      const lengst = Math.max(meta.width ?? 0, meta.height ?? 0);

      await (lengst > maks ? bilde.resize({ width: maks, height: maks, fit: 'inside' }) : bilde)
        .webp({ quality: KVALITET, effort: 6 })
        .toFile(mål);

      const etter = (await stat(mål)).size;
      mFør += før;
      mEtter += etter;
      mAntall += 1;

      if (slett) await unlink(kilde);
    } catch (err) {
      mislyktes.push(`${kilde}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  sumFør += mFør;
  sumEtter += mEtter;
  antall += mAntall;
  const mb = (n) => (n / 1048576).toFixed(1);
  console.log(
    `  ${mappe.padEnd(30)} ${mb(mFør).padStart(7)} MB → ${mb(mEtter).padStart(6)} MB` +
    `  (${mAntall} filer, maks ${maks} px — ${hvorfor})`,
  );
}

console.log('');
console.log(`  ${antall} filer · ${(sumFør / 1048576).toFixed(1)} MB → ${(sumEtter / 1048576).toFixed(1)} MB` +
  `  (${(100 - (sumEtter / sumFør) * 100).toFixed(1)} % lettere)`);

if (mislyktes.length > 0) {
  console.log('');
  console.log(`  ${mislyktes.length} filer feilet:`);
  for (const m of mislyktes.slice(0, 10)) console.log(`    ${m}`);
  process.exitCode = 1;
}

if (!slett) {
  console.log('');
  console.log('  Originalene står igjen. Bytt stiene i koden, se på skjermbildene,');
  console.log('  og kjør så med --slett.');
}
