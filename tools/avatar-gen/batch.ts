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
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ensureEnv, generateComposite } from './generate';

const ID = 'public/avatars/f79-poc/stage-2.png'; // identitets-master
const G = (name: string) => `public/illustrations/garments-clay/${name}.png`;

export type Entry = { name: string; pose: 'standing' | 'sitting'; refs: string[]; outfit: string };

// 6 varmenivåer (sommer → ekstrem), gjenbrukt for begge positurer.
const WARMTH = (p: 'standing' | 'sitting', pfx: string): Entry[] => [
  { name: `${pfx}-1-sommer`, pose: p, refs: [G('kortermet-body'), G('solhatt')],
    outfit: 'a short-sleeve cream cotton bodysuit and a beige sun bucket hat; bare legs and bare feet' },
  { name: `${pfx}-2-mild`, pose: p, refs: [G('langermet-body'), G('lue-tynn')],
    outfit: 'a long-sleeve cream bodysuit and a thin knitted hat; bare legs' },
  { name: `${pfx}-3-kjolig`, pose: p, refs: [G('ull-jakke'), G('ull-bukse'), G('lue')],
    outfit: 'a wool cardigan jacket, wool trousers and a knitted hat' },
  { name: `${pfx}-4-kald`, pose: p, refs: [G('kjoredress'), G('lue-m-ull')],
    outfit: 'a padded pram overall (kjøredress) and a grey chunky-knit earflap wool hat' },
  { name: `${pfx}-5-vinter`, pose: p, refs: [G('vinterdress-isolert'), G('lue-m-ull'), G('votter')],
    outfit: 'a deep muted teal-green insulated padded snowsuit, a grey chunky-knit earflap wool hat and knitted mittens' },
  { name: `${pfx}-6-ekstrem`, pose: p, refs: [G('vinterdress-isolert'), G('balaklava'), G('votter-dun'), G('vintersko-isolerte')],
    outfit: 'a deep muted teal-green insulated snowsuit, a balaclava covering the head and neck, thick down mittens and insulated winter boots' },
];

// 6 varianter per positur: skall, hals/vindvotter, alt-hodeplagg, synlig fottøy.
const VARIANTS = (p: 'standing' | 'sitting', pfx: string): Entry[] => [
  // Planregel: kun YTTERSTE synlige plagg. Skallet er eneste ytterplagg.
  { name: `${pfx}-7-regn`, pose: p, refs: [G('regntoy-skall'), G('lue')],
    outfit: 'ONLY an outer waterproof rain suit (a full rain shell jacket and trousers) as the single visible garment, plus a knitted hat — no other clothing visible over or under it' },
  { name: `${pfx}-8-vind`, pose: p, refs: [G('vindtett-skall'), G('lue')],
    outfit: 'ONLY an outer windproof shell suit (a full shell jacket and trousers) as the single visible garment, plus a knitted hat — no other clothing visible over or under it' },
  { name: `${pfx}-9-vinter-hals`, pose: p, refs: [G('vinterdress-isolert'), G('lue-m-ull'), G('hals'), G('votter')],
    outfit: 'a teal-green insulated snowsuit, a grey earflap wool hat, a neck gaiter (halsedisse) and knitted mittens' },
  { name: `${pfx}-10-vindvotter`, pose: p, refs: [G('vinterdress-isolert'), G('lue-m-ull'), G('vindvotter-skall')],
    outfit: 'a teal-green insulated snowsuit, a grey earflap wool hat and windproof shell mittens' },
  { name: `${pfx}-11-mild-lue`, pose: p, refs: [G('langermet-body'), G('lue')],
    outfit: 'a long-sleeve cream bodysuit and a knitted wool hat; bare legs' },
  { name: `${pfx}-12-kald-sko`, pose: p, refs: [G('kjoredress'), G('lue-m-ull'), G('vintersko')],
    outfit: 'a padded pram overall (kjøredress), a grey earflap wool hat and visible winter boots' },
];

export const ALL: Entry[] = [
  ...WARMTH('standing', 'std'), ...VARIANTS('standing', 'std'),
  ...WARMTH('sitting', 'sit'), ...VARIANTS('sitting', 'sit'),
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
  const poseArg = process.argv[2] ?? 'all'; // standing | sitting | all
  const outDir = resolve(process.cwd(), 'tools/avatar-gen/out/verified');
  await mkdir(outDir, { recursive: true });
  // Idempotent: hopp over allerede genererte (så 'all' fyller kun hull).
  const entries = ALL.filter(
    (e) => (poseArg === 'all' || e.pose === poseArg) && !existsSync(resolve(outDir, `${e.name}.png`)),
  );

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
  console.log(`Ferdig (${entries.length} nye) → ${outDir}`);
}

// Kjør kun ved direkte kall (ikke når finalize.ts importerer ALL).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
