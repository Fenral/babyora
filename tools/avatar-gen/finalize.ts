/**
 * avatar-gen finalize — R8: flytter godkjente kompositter fra den gitignorerte
 * out/verified/ til public/avatars/verified/ og skriver en index.json som
 * mapper filnavn → positur + plagg-kombinasjon.
 *
 * Index-en er inngangen til det presise manifest-koblingssteget (index →
 * AvatarStateKey-ID → APPROVED_COMPOSITES), som gjøres mot motoren ved
 * V2-aktivering. Selve bildene er R8-leveransen.
 *
 * Bruk: tsx tools/avatar-gen/finalize.ts
 */
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { ALL } from './batch';

const SRC = resolve(process.cwd(), 'tools/avatar-gen/out/verified');
const DST = resolve(process.cwd(), 'public/avatars/verified');

/** «.../garments-clay/vinterdress-isolert.png» → «vinterdress-isolert» */
const garmentId = (p: string) => basename(p).replace(/\.png$/, '');

async function main(): Promise<void> {
  await mkdir(DST, { recursive: true });
  const index: Array<{ name: string; asset: string; pose: string; garments: string[]; outfit: string }> = [];
  let copied = 0;
  const missing: string[] = [];

  for (const e of ALL) {
    const src = resolve(SRC, `${e.name}.png`);
    if (!existsSync(src)) { missing.push(e.name); continue; }
    await copyFile(src, resolve(DST, `${e.name}.png`));
    copied++;
    index.push({
      name: e.name,
      asset: `/avatars/verified/${e.name}.png`,
      pose: e.pose,
      garments: e.refs.map(garmentId),
      outfit: e.outfit,
    });
  }

  await writeFile(resolve(DST, 'index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  console.log(`Kopiert ${copied}/${ALL.length} → public/avatars/verified/`);
  if (missing.length) console.log(`Mangler (ikke generert): ${missing.join(', ')}`);
  console.log('Skrev index.json');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
