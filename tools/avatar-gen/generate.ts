/**
 * avatar-gen — R8 avatar-produksjon via Gemini API (Nano Banana Pro).
 *
 * Nano Banana Pro = Google «Gemini 3 Pro Image». Vi kaller REST-API-et direkte
 * med fetch (ingen SDK-avhengighet). Master-bildet leses LOKALT og sendes som
 * referanse (inline_data) — edit-chain uten opplasting: barnet genereres aldri
 * fra bunn, hvert bilde redigerer en godkjent master.
 *
 * Nøkkel: sett GEMINI_API_KEY i .env (gitignorert — committes ALDRI) eller som
 * miljøvariabel. Modell overstyres med GEMINI_IMAGE_MODEL.
 *
 * Bruk:
 *   tsx tools/avatar-gen/generate.ts list
 *     → lister bilde-kapable modeller nøkkelen har tilgang til (bekreft modell-ID).
 *   tsx tools/avatar-gen/generate.ts gen --master <sti.png> [--master <sti2.png>] \
 *       --prompt "<edit-instruksjon>" --out <ut.png>
 *     → redigerer master(e) → skriver nytt bilde.
 *
 * Ingen del av app-bygget; rent produksjonsverktøy. Ingen bilder committes
 * automatisk (tools/avatar-gen/out/ er gitignorert via .env*-mønsteret? nei —
 * eksplisitt: legg out/ i .gitignore hvis råkandidater ikke skal spores).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-3-pro-image-preview';

/** Minimal .env-lesing (ingen dep). Leser .env.local så .env (prosjektets
 *  konvensjon er .env.local); fyller process.env for manglende nøkler. */
function loadDotEnv(): void {
  for (const file of ['.env.local', '.env']) {
    const envPath = resolve(process.cwd(), file);
    if (!existsSync(envPath)) continue;
    const text = readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error(
      'Mangler GEMINI_API_KEY. Legg den i .env (GEMINI_API_KEY=...) — filen er\n' +
        'gitignorert og committes aldri — eller sett den som miljøvariabel.',
    );
    process.exit(2);
  }
  return key;
}

function model(): string {
  return process.env.GEMINI_IMAGE_MODEL ?? DEFAULT_MODEL;
}

async function listModels(): Promise<void> {
  const res = await fetch(`${API_BASE}/models`, { headers: { 'x-goog-api-key': apiKey() } });
  if (!res.ok) {
    console.error(`list feilet: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const data = (await res.json()) as {
    models?: Array<{ name: string; supportedGenerationMethods?: string[]; description?: string }>;
  };
  const all = data.models ?? [];
  const image = all.filter(
    (m) => /image/i.test(m.name) || /image/i.test(m.description ?? ''),
  );
  console.log(`Bilde-relaterte modeller (${image.length} av ${all.length} totalt):`);
  for (const m of image) {
    console.log(`  ${m.name}  [${(m.supportedGenerationMethods ?? []).join(', ')}]`);
  }
  if (!image.length) {
    console.log('  (ingen bilde-modeller funnet — sjekk at nøkkelen har Nano Banana Pro-tilgang)');
    console.log('  Alle modeller:');
    for (const m of all) console.log(`    ${m.name}`);
  }
}

function parseGenArgs(argv: string[]): { masters: string[]; prompt: string; out: string } {
  const masters: string[] = [];
  let prompt = '';
  let out = '';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--master') masters.push(argv[++i]);
    else if (argv[i] === '--prompt') prompt = argv[++i];
    else if (argv[i] === '--out') out = argv[++i];
  }
  if (!masters.length || !prompt || !out) {
    console.error('Bruk: gen --master <sti.png> [--master <sti2.png>] --prompt "<tekst>" --out <ut.png>');
    process.exit(2);
  }
  return { masters, prompt, out };
}

/** Trekk ut første bilde-part fra Gemini-svaret (håndterer camelCase + snake_case). */
function extractImage(json: unknown): { mime: string; b64: string } | null {
  const parts =
    // @ts-expect-error — dynamisk API-form
    json?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const inline = p.inlineData ?? p.inline_data;
    if (inline?.data) return { mime: inline.mimeType ?? inline.mime_type ?? 'image/png', b64: inline.data };
  }
  return null;
}

async function generate(argv: string[]): Promise<void> {
  const { masters, prompt, out } = parseGenArgs(argv);
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  for (const m of masters) {
    const buf = await readFile(resolve(process.cwd(), m));
    parts.push({ inline_data: { mime_type: 'image/png', data: buf.toString('base64') } });
  }
  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ['IMAGE'] },
  };
  const res = await fetch(`${API_BASE}/models/${model()}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey(), 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`generering feilet: ${res.status}\n${await res.text()}`);
    process.exit(1);
  }
  const json = await res.json();
  const img = extractImage(json);
  if (!img) {
    console.error('Fant ingen bilde-part i svaret. Rå-svar:');
    console.error(JSON.stringify(json, null, 2).slice(0, 2000));
    process.exit(1);
  }
  const outPath = resolve(process.cwd(), out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, Buffer.from(img.b64, 'base64'));
  console.log(`OK: skrev ${out} (${img.mime}, modell ${model()})`);
}

async function main(): Promise<void> {
  loadDotEnv();
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'list') await listModels();
  else if (cmd === 'gen') await generate(rest);
  else {
    console.error('Bruk: tsx tools/avatar-gen/generate.ts <list|gen> [...]');
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
