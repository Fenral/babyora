import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { captureAudit } from './capture';
import { buildAnalysisPrompt } from './prompt';
import { renderNextPrompt, renderReport } from './report';
import { scoreAudit } from './score';
import type { AuditAnalysis, ScoredAudit } from './types';

export interface CliArgs {
  command: 'prepare' | 'finalize';
  baseUrl: string;
  run: string | null;
  previous: string | null;
}

export function parseArgs(argv: string[]): CliArgs {
  const command = argv[0];
  if (command !== 'prepare' && command !== 'finalize') {
    throw new Error('Use only "prepare" or "finalize". The audit has no apply command.');
  }
  const valueAfter = (flag: string): string | null => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] ?? null : null;
  };
  const run = valueAfter('--run');
  if (command === 'finalize' && !run) throw new Error('finalize requires --run <directory>');
  return {
    command,
    /* STANDARD ER PRODUKSJONSBYGGET, IKKE DEV.

       Sto på 127.0.0.1:5173 — vite dev. Det ga to konsekvenser, begge
       målt 2026-08-06:
         1. dev viser flater som aldri sendes til en forelder
            (import.meta.env.DEV), og et dommerpanel meldte BLOKKERENDE
            på en av dem;
         2. 127.0.0.1 traff ikke i det hele tatt — Vite binder til ::1 på
            denne maskinen, og alle elleve fangster ga
            ERR_CONNECTION_REFUSED.

       Standarden peker nå på preview-porten. capture.ts nekter dessuten
       å revidere en dev-server uansett hva som sendes inn. */
    baseUrl: valueAfter('--base-url') ?? 'http://localhost:4173',
    run,
    previous: valueAfter('--previous'),
  };
}

const toolDir = dirname(fileURLToPath(import.meta.url));
const runsDir = join(toolDir, 'runs');

function runId(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function absolute(input: string): string {
  return isAbsolute(input) ? input : resolve(process.cwd(), input);
}

async function prepare(args: CliArgs): Promise<void> {
  const id = runId();
  const runDir = join(runsDir, id);
  await mkdir(runDir, { recursive: true });
  const manifest = await captureAudit({ baseUrl: args.baseUrl, runId: id, runDir });
  await writeFile(join(runDir, 'analysis-prompt.md'), buildAnalysisPrompt({ manifest }), 'utf8');
  const captured = manifest.captures.filter((item) => item.status === 'captured').length;
  console.log(`Audit prepared: ${runDir}`);
  console.log(`Captured ${captured}/${manifest.captures.length} states.`);
  console.log('Next: inspect screenshots, write analysis.json, then run audit:finalize.');
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, 'utf8')) as T;
}

async function finalize(args: CliArgs): Promise<void> {
  const runDir = absolute(args.run!);
  const analysis = await readJson<AuditAnalysis>(join(runDir, 'analysis.json'));
  const previous = args.previous
    ? await readJson<ScoredAudit>(join(absolute(args.previous), 'scored-analysis.json'))
    : null;
  const scored = scoreAudit(analysis, previous);
  await writeFile(join(runDir, 'scored-analysis.json'), `${JSON.stringify(scored, null, 2)}\n`, 'utf8');
  await writeFile(join(runDir, 'report.md'), renderReport(scored), 'utf8');
  await writeFile(join(runDir, 'next-improvement-prompt.md'), renderNextPrompt(scored), 'utf8');
  console.log(`Audit finalized: ${runDir}`);
  console.log(scored.complete ? `Total score: ${scored.totalScore}/100` : `Incomplete audit; provisional score: ${scored.provisionalScore}/100`);
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);
  if (args.command === 'prepare') await prepare(args);
  else await finalize(args);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

