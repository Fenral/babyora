/**
 * Motor 2.0 Task 16 — tynn script-wrapper.
 * Selve builderen bor i src/lib/clothing-engine-v2/review-export.ts
 * (testbar uten node-typer i app-tsconfig). Kjør: npm run engine:v2:review
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReviewExport } from '../src/lib/clothing-engine-v2/review-export.js';

const __filename = fileURLToPath(import.meta.url);
const root = dirname(dirname(__filename));
const out = resolve(root, 'docs/superpowers/evidence/engine-v2-scenarios.json');
writeFileSync(out, JSON.stringify(buildReviewExport(), null, 2) + '\n');
console.log(`OK — skrev ${out}`);
