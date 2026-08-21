import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const mdUrl = new URL("../../docs/design.md", import.meta.url);
const htmlUrl = new URL("../../docs/design.html", import.meta.url);
const auditUrl = new URL("../../docs/evidence/live-layout-audit.md", import.meta.url);
const md = await readFile(mdUrl, "utf8");
const html = await readFile(htmlUrl, "utf8");
const audit = await readFile(auditUrl, "utf8");

const frontMatter = md.match(/^---\r?\n([\s\S]*?)\r?\n---/u)?.[1];
assert.ok(frontMatter, "docs/design.md must start with YAML front matter");
assert.match(frontMatter, /^version: 0\.1\.0$/mu);
assert.match(frontMatter, /^name: Snudly Ro$/mu);

const sectionBody = (name, next) => {
  const match = frontMatter.match(new RegExp(`^${name}:\\r?\\n([\\s\\S]*?)(?=^${next}:)`, "mu"));
  assert.ok(match, `Missing ${name} token section`);
  return match[1];
};

const parseSimpleMap = (name, next) => {
  const body = sectionBody(name, next);
  return new Map(
    [...body.matchAll(/^  ([a-z][\w-]+):\s+"?([^"\r\n]+)"?$/gmu)].map((match) => [match[1], match[2]]),
  );
};

const parseNestedMap = (name, next) => {
  const result = new Map();
  for (const match of sectionBody(name, next).matchAll(/^  ([a-z][\w-]+):\r?\n((?:    [^\r\n]+(?:\r?\n|$))+)/gmu)) {
    const properties = new Map();
    for (const property of match[2].matchAll(/^    ([a-z][\w]+):\s+(.+)$/gmu)) {
      const rawValue = property[2].trim();
      const value = rawValue.startsWith('"') && rawValue.endsWith('"') ? rawValue.slice(1, -1) : rawValue;
      properties.set(property[1], value);
    }
    result.set(match[1], properties);
  }
  return result;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

const colors = parseSimpleMap("colors", "typography");
const typography = parseNestedMap("typography", "rounded");
const rounded = parseSimpleMap("rounded", "spacing");
const spacing = parseSimpleMap("spacing", "components");
const componentsBody = frontMatter.match(/^components:\r?\n([\s\S]*)$/mu)?.[1] ?? "";
const components = [...componentsBody.matchAll(/^  ([a-z][\w-]+):\s*$/gmu)].map((match) => match[1]);

assert.ok(colors.size >= 40, "Light and dark semantic color tokens are required");
assert.equal(typography.size, 11, "The type scale must contain eleven named roles");
assert.equal(rounded.size, 7, "The radius scale must contain seven roles");
assert.equal(spacing.size, 11, "The spacing scale must contain eleven roles");
assert.equal(components.length, 15, "Fifteen component/state contracts are required");

for (const [token, value] of colors) {
  assert.match(html, new RegExp(`--color-${token}:\\s*${value};`, "iu"), `HTML must mirror colors.${token}`);
}
for (const [token, value] of rounded) {
  assert.match(html, new RegExp(`--rounded-${token}:\\s*${value};`, "iu"), `HTML must mirror rounded.${token}`);
}
for (const [token, value] of spacing) {
  assert.match(html, new RegExp(`--space-${token}:\\s*${value};`, "iu"), `HTML must mirror spacing.${token}`);
}
const typographyProperties = new Map([
  ["fontFamily", "family"], ["fontSize", "size"], ["fontWeight", "weight"],
  ["lineHeight", "leading"], ["letterSpacing", "tracking"],
]);
for (const [token, properties] of typography) {
  for (const required of ["fontFamily", "fontSize", "fontWeight", "lineHeight"]) {
    assert.ok(properties.has(required), `typography.${token}.${required} is required`);
  }
  for (const [property, value] of properties) {
    const cssProperty = typographyProperties.get(property);
    assert.ok(cssProperty, `Unknown typography property: ${property}`);
    assert.match(html, new RegExp(`--type-${token}-${cssProperty}:\\s*${escapeRegex(value)};`, "u"), `HTML must value-mirror typography.${token}.${property}`);
  }
}

const componentMarkers = {
  "button-primary": "btn--primary",
  "button-primary-pressed": "btn--pressed",
  "button-primary-disabled": "btn--disabled",
  "button-secondary": "btn--secondary",
  "weather-panel": 'class="weather-panel"',
  "content-card": 'class="card"',
  "garment-row": 'class="garment-row"',
  "choice-chip": 'class="chip',
  "choice-chip-selected": "chip--selected",
  input: "input-wrap",
  "safety-notice": 'class="safety"',
  "bottom-navigation": 'class="bottom-nav"',
  "bottom-navigation-active": "nav-item--active",
  "bottom-sheet": 'class="bottom-sheet"',
  "recovery-state": 'class="recovery-state"',
};
for (const component of components) {
  assert.ok(html.includes(componentMarkers[component]), `HTML must render components.${component}`);
}

const tokenPaths = new Set([
  ...[...colors.keys()].map((token) => `colors.${token}`),
  ...[...typography.keys()].map((token) => `typography.${token}`),
  ...[...rounded.keys()].map((token) => `rounded.${token}`),
  ...[...spacing.keys()].map((token) => `spacing.${token}`),
]);
for (const reference of componentsBody.matchAll(/\{([^}]+)\}/gu)) {
  assert.ok(tokenPaths.has(reference[1]), `Unknown component token reference: ${reference[1]}`);
}

const expectedHeadings = [
  "Overview",
  "Colors",
  "Typography",
  "Layout",
  "Elevation & Depth",
  "Shapes",
  "Components",
  "Do's and Don'ts",
];
const headings = [...md.matchAll(/^## (.+)$/gmu)].map((match) => match[1]);
assert.deepEqual(headings, expectedHeadings, "Canonical prose headings must be unique and ordered");
assert.equal(new Set(headings).size, headings.length, "Duplicate level-two headings are forbidden");
assert.match(md, /owner waived TASK-006 target-dad testing on 2026-08-22/u);
assert.match(md, /preserves the owner-supplied live deployment's result-first layout/u);
assert.match(md, /Open after the TASK-006 waiver and through implementation review:/u);
assert.match(md, /local source currently contains a three-root-tab variant/u);
assert.match(md, /recorded in `docs\/evidence\/live-layout-audit\.md`/u);
for (const screen of ["home", "planlegg", "verktoy", "familie", "dark-home", "dark-settings"]) {
  assert.match(audit, new RegExp(`live-${screen}\\.png`, "u"), `Live audit must reference ${screen} screenshot`);
  await readFile(new URL(`./screenshots/live-${screen}.png`, import.meta.url));
}
assert.match(html, /id="theme-toggle"/u);
assert.match(html, /Open after TASK-006 waiver/u);
assert.match(html, /TASK-006 waived by owner/u);
assert.match(html, /live visual reference has four slots; local source has three root tabs/u);
assert.match(html, /class="type-list" lang="no"/u);
assert.match(html, /class="component-grid" lang="no"/u);
assert.match(html, /prefers-reduced-motion: reduce/u);

const luminance = (hex) => {
  const rgb = hex.slice(1).match(/../gu).map((part) => Number.parseInt(part, 16) / 255);
  const [red, green, blue] = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};
const contrast = (foreground, background) => {
  const values = [luminance(colors.get(foreground)), luminance(colors.get(background))].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};
const textPairs = [
  ["on-surface", "canvas"], ["on-surface", "surface"], ["on-surface-muted", "canvas"],
  ["on-primary", "primary"], ["on-accent", "accent"], ["on-accent", "accent-pressed"],
  ["primary", "surface"], ["accent", "accent-soft"], ["warning", "warning-surface"],
  ["disabled-ink", "disabled-surface"], ["on-primary", "success"], ["on-primary", "warning"],
  ["on-primary", "error"], ["on-primary", "info"], ["dark-on-surface", "dark-canvas"],
  ["dark-on-surface", "dark-surface"], ["dark-on-surface-muted", "dark-canvas"],
  ["dark-on-primary", "dark-primary"], ["dark-on-accent", "dark-accent"],
  ["dark-primary", "dark-surface"], ["dark-accent", "dark-accent-soft"],
  ["dark-warning", "dark-warning-surface"], ["dark-disabled-ink", "dark-disabled-surface"],
  ["dark-on-primary", "dark-success"], ["dark-on-primary", "dark-warning"],
  ["dark-on-primary", "dark-error"], ["dark-on-primary", "dark-info"],
];
for (const [foreground, background] of textPairs) {
  assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background} must meet WCAG AA`);
}
for (const [focus, background] of [["focus", "canvas"], ["focus", "surface"], ["dark-focus", "dark-canvas"], ["dark-focus", "dark-surface"]]) {
  assert.ok(contrast(focus, background) >= 3, `${focus} on ${background} must meet non-text focus contrast`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const browserErrors = [];
page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
page.on("pageerror", (error) => browserErrors.push(error.message));
await page.goto(pathToFileURL(fileURLToPath(htmlUrl)).href, { waitUntil: "networkidle" });

assert.equal(await page.locator(".component-demo").count(), 10, "All component groups must render");
assert.equal(await page.locator(".swatch").count(), colors.size - 8, "Every non-semantic color must render as a swatch");
for (const width of [390, 320]) {
  await page.setViewportSize({ width, height: 844 });
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.equal(horizontalOverflow, 0, `The guide must not overflow horizontally at ${width}px`);
}
await page.setViewportSize({ width: 390, height: 844 });
const undersized = await page.locator("button, input").evaluateAll((elements) =>
  elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { label: element.textContent?.trim() || element.getAttribute("aria-label") || element.id, width: box.width, height: box.height };
  }).filter(({ width, height }) => width < 44 || height < 44),
);
assert.deepEqual(undersized, [], "Rendered interactive controls must be at least 44×44 CSS pixels");
const lightBackground = await page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor);
await page.locator("#theme-toggle").click();
assert.equal(await page.locator("html").getAttribute("data-theme"), "dark", "Theme toggle must activate dark mode");
await page.waitForTimeout(220);
const darkBackground = await page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor);
assert.notEqual(lightBackground, darkBackground, "Theme toggle must change rendered colors");
assert.deepEqual(browserErrors, [], "The guide must render without browser errors");
await browser.close();

console.log("TASK-007 design-system contract: PASS");
console.log(`${colors.size} colors, ${typography.size} type roles, ${spacing.size} spacing steps, ${rounded.size} radii, ${components.length} component contracts`);
console.log("Mirroring, token references, AA contrast, 320/390px layout, 44px controls, and light/dark toggle verified");
