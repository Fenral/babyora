/**
 * avatar-gen batch — R8: genererer et sett komposittbilder og matter dem til
 * ekte alfa i ett steg (Gemini Nano Banana Pro → rembg).
 *
 * Metode (godkjent 2026-07-15): hvert bilde = identitets-master (f79-poc) +
 * de faktiske garments-clay-plagg-illustrasjonene som referanser → plagg og
 * farge matcher plagg-lista eksakt.
 *
 * Output → tools/avatar-gen/out/verified/<navn>.png (gitignorert). Kun etter
 * eiergodkjenning flyttes settet til public/avatars/verified/ + manifestet
 * (APPROVED_COMPOSITES) kobles mot AvatarStateKey-ID-ene.
 *
 * Bruk: tsx tools/avatar-gen/batch.ts [pose]   (pose = standing|sitting|all)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { ensureEnv, generateComposite } from './generate';

const ID = 'public/avatars/f79-poc/stage-2.png'; // identitets-master
const G = (name: string) => `public/illustrations/garments-clay/${name}.png`;

type Entry = { name: string; pose: 'standing' | 'sitting'; refs: string[]; outfit: string };

// Varmeskala stående (12–24 mnd). 6 nivåer sommer → ekstrem vinter.
const STANDING: Entry[] = [
  { name: 'std-1-sommer', pose: 'standing', refs: [G('kortermet-body'), G('solhatt')],
    outfit: 'a short-sleeve cream cotton bodysuit and a beige sun bucket hat; bare legs and bare feet' },
  { name: 'std-2-mild', pose: 'standing', refs: [G('langermet-body'), G('lue-tynn')],
    outfit: 'a long-sleeve cream bodysuit and a thin knitted hat; bare legs' },
  { name: 'std-3-kjolig', pose: 'standing', refs: [G('ull-jakke'), G('ull-bukse'), G('lue')],
    outfit: 'a wool cardigan jacket, wool trousers and a knitted hat' },
  { name: 'std-4-kald', pose: 'standing', refs: [G('kjoredress'), G('lue-m-ull')],
    outfit: 'a padded pram overall (kjøredress) and a grey chunky-knit earflap wool hat' },
  { name: 'std-5-vinter', pose: 'standing', refs: [G('vinterdress-isolert'), G('lue-m-ull'), G('votter')],
    outfit: 'a deep muted teal-green insulated padded snowsuit, a grey chunky-knit earflap wool hat and knitted mittens' },
  { name: 'std-6-ekstrem', pose: 'standing', refs: [G('vinterdress-isolert'), G('balaklava'), G('votter-dun'), G('vintersko-isolerte')],
    outfit: 'a deep muted teal-green insulated snowsuit, a balaclava covering the head and neck, thick down mittens and insulated winter boots' },
];

function buildPrompt(e: Entry): string {
  return (
    `Reference image 1 is a baby character — KEEP its identity EXACTLY: the large expressive glossy dark eyes, ` +
    `rosy round cheeks, small button nose, gentle warm smile, soft-3D clay Pixar render style, skin tone and head shape. ` +
    `The remaining reference images are garments. Dress the baby in EXACTLY these garments — ${e.outfit} — ` +
    `matching their EXACT muted colours and forms and the same soft matte clay material. ` +
    `${e.pose === 'standing' ? 'Standing, front-facing, full body, arms slightly out.' : 'Sitting, front-facing, full body.'} ` +
    `Plain solid pale off-white studio background (no magenta, no checkerboard). Consistent soft-clay 3D style across the whole figure.`
  );
}

function matte(rawPath: string, outPath: string): void {
  const py = `from rembg import remove\nopen(${JSON.stringify(outPath)},'wb').write(remove(open(${JSON.stringify(rawPath)},'rb').read()))`;
  const r = spawnSync('python', ['-c', py], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`rembg feilet for ${rawPath}: ${r.stderr}`);
}

async function main(): Promise<void> {
  ensureEnv();
  const poseArg = process.argv[2] ?? 'standing';
  const entries = STANDING.filter((e) => poseArg === 'all' || e.pose === poseArg);
  const outDir = resolve(process.cwd(), 'tools/avatar-gen/out/verified');
  await mkdir(outDir, { recursive: true });

  let i = 0;
  for (const e of entries) {
    i++;
    process.stdout.write(`[${i}/${entries.length}] ${e.name} … `);
    try {
      const raw = await generateComposite([ID, ...e.refs], buildPrompt(e));
      const rawPath = resolve(outDir, `${e.name}-raw.jpg`);
      const finalPath = resolve(outDir, `${e.name}.png`);
      await writeFile(rawPath, raw);
      matte(rawPath, finalPath);
      console.log('OK');
    } catch (err) {
      console.log('FEIL');
      console.error(`  ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  console.log(`Ferdig → ${outDir}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
