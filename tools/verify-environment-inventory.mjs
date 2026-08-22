import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [example, inventory, prd, gitignore, forecastClient, analytics, billing] = await Promise.all([
  read('.env.example'),
  read('docs/evidence/environment-inventory.md'),
  read('docs/prd.md'),
  read('.gitignore'),
  read('src/lib/met-no/client.ts'),
  read('src/lib/analytics/track.ts'),
  read('src/lib/billing/revenuecat.ts'),
]);

const prdVariablesBody = prd.match(/Required client\/build variables:\r?\n\r?\n([\s\S]*?)\r?\n\r?\nCommon gotchas:/u)?.[1];
assert.ok(prdVariablesBody, 'PRD variable table must be readable');
const required = [...prdVariablesBody.matchAll(/`([A-Z][A-Z0-9_]+)`/gu)].map((match) => match[1]);
assert.equal(required.length, 12, 'PRD must define twelve required client/build variables');
assert.equal(new Set(required).size, required.length, 'PRD variable names must be unique');

const assignments = new Map();
for (const match of example.matchAll(/^([A-Z][A-Z0-9_]*)=(.*)$/gmu)) {
  assert.ok(!assignments.has(match[1]), `.env.example duplicates ${match[1]}`);
  assignments.set(match[1], match[2]);
}

for (const variable of required) {
  assert.ok(assignments.has(variable), `.env.example must declare ${variable}`);
  const inventoryRows = inventory.match(new RegExp('^\\| `' + variable + '` \\|', 'gmu')) ?? [];
  assert.equal(inventoryRows.length, 1, `Inventory must contain exactly one contract row for ${variable}`);
}

for (const secret of ['SENTRY_AUTH_TOKEN', 'GEMINI_API_KEY']) {
  assert.equal(assignments.get(secret), '', `${secret} must be empty in the tracked template`);
}
for (const forbidden of ['SUPABASE_SERVICE_ROLE_KEY', 'APPLE_PRIVATE_KEY', 'GOOGLE_SERVICE_ACCOUNT_JSON']) {
  assert.ok(!assignments.has(forbidden), `${forbidden} must never be in the client/local template`);
}
for (const [name, value] of assignments) {
  assert.ok(!/^VITE_.*(?:SECRET|TOKEN|PRIVATE|SERVICE_ROLE)/u.test(name), `${name} looks secret but is client-visible`);
  assert.doesNotMatch(value, /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AIzaSy[A-Za-z0-9_-]{20,}|\b(?:appl|goog)_[A-Za-z0-9]{16,}|sb_(?:secret|service_role)_[A-Za-z0-9_-]+)/u, `${name} contains a credential-like value`);
}

assert.match(forecastClient, /VITE_FORECAST_PROXY/u);
assert.match(analytics, /VITE_POSTHOG_KEY/u);
assert.match(analytics, /VITE_POSTHOG_HOST/u);
assert.match(billing, /VITE_REVENUECAT_PUBLIC_KEY_IOS/u);
assert.match(billing, /VITE_REVENUECAT_PUBLIC_KEY_ANDROID/u);
assert.match(inventory, /Sentry initialization is absent/u);
assert.match(inventory, /No Supabase dependency\/client is present/u);
assert.match(inventory, /snudly\.vercel\.app/u);
assert.match(inventory, /wool-app\.vercel\.app/u);
assert.match(inventory, /No `\.env\.local` or external console value was opened/u);

assert.match(gitignore, /^\.env\*$/mu);
assert.match(gitignore, /^!\.env\.example$/mu);

console.log(`TASK-008 environment inventory: PASS (${required.length} PRD variables, ${assignments.size} template assignments)`);
console.log('Secret placeholders are empty; runtime readers, owners, environments, console gates, and deferred integrations are mapped');
