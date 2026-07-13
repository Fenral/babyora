#!/usr/bin/env node
/* Kopier nye Pro-PNG-er (transparent versjonen, ikke on-cream) inn i public/.
 *
 * Kilde:
 *   review/nano-banana-pro/full-run/transparent/garments/*.png
 *   review/nano-banana-pro/full-run/transparent/avatars/*.png
 *
 * Mål:
 *   public/illustrations/garments/*.png
 *   public/avatars/*.png    (kun avatar-A1..A7 + A1-hat + A2-hat — andre filer i public/avatars/ urørt)
 *
 * Backup-strategi: tar en backup av eksisterende filer til
 *   public/illustrations/_pre-pro-backup/ + public/avatars/_pre-pro-backup/
 * før noe skrives, slik at git-status forblir lesbar og man kan rulle tilbake
 * uten å gå via git.
 *
 * Usage:
 *   node scripts/swap-pro-assets.mjs --dry-run      # vis hva som ville bli kopiert
 *   node scripts/swap-pro-assets.mjs                # gjør swap
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));
const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");

const SRC_G = join(ROOT, "review", "nano-banana-pro", "full-run", "transparent", "garments");
const SRC_A = join(ROOT, "review", "nano-banana-pro", "full-run", "transparent", "avatars");
const DST_G = join(ROOT, "public", "illustrations", "garments");
const DST_A = join(ROOT, "public", "avatars");
// Backup goes OUTSIDE public/ so Vite doesn't bundle it.
const BK_G = join(ROOT, "tmp", "pre-pro-backup", "garments");
const BK_A = join(ROOT, "tmp", "pre-pro-backup", "avatars");

for (const d of [BK_G, BK_A]) if (!DRY && !existsSync(d)) mkdirSync(d, { recursive: true });

function listSrc(dir) {
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".png")) : [];
}

function swapOne(srcDir, dstDir, bkDir, file) {
  const srcPath = join(srcDir, file);
  const dstPath = join(dstDir, file);
  const bkPath = join(bkDir, file);
  if (!existsSync(srcPath)) return { file, status: "missing-source" };
  if (DRY) {
    return { file, status: existsSync(dstPath) ? "would-replace" : "would-add" };
  }
  if (existsSync(dstPath) && !existsSync(bkPath)) copyFileSync(dstPath, bkPath);
  copyFileSync(srcPath, dstPath);
  return { file, status: "swapped" };
}

console.log(DRY ? "DRY-RUN — no files will be touched" : "applying swap...");

const garments = listSrc(SRC_G);
console.log(`\n=== GARMENTS (${garments.length}) ===`);
let ok = 0, missing = 0;
for (const f of garments) {
  const r = swapOne(SRC_G, DST_G, BK_G, f);
  if (r.status === "swapped" || r.status === "would-replace" || r.status === "would-add") ok++;
  if (r.status === "missing-source") missing++;
  console.log(`  ${r.status.padEnd(16)} ${f}`);
}
console.log(`garments: ${ok} ok, ${missing} missing`);

const avatars = listSrc(SRC_A);
console.log(`\n=== AVATARS (${avatars.length}) ===`);
ok = 0; missing = 0;
for (const f of avatars) {
  const r = swapOne(SRC_A, DST_A, BK_A, f);
  if (r.status === "swapped" || r.status === "would-replace" || r.status === "would-add") ok++;
  if (r.status === "missing-source") missing++;
  console.log(`  ${r.status.padEnd(16)} ${f}`);
}
console.log(`avatars: ${ok} ok, ${missing} missing`);

if (DRY) console.log("\nDRY-RUN done — re-run without --dry-run to apply.");
else console.log(`\ndone — backups under tmp/pre-pro-backup/garments/ + tmp/pre-pro-backup/avatars/`);
