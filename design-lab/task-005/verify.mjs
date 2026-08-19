import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { directions, scenario } from "./fixture.js";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
const app = await readFile(new URL("./app.js", import.meta.url), "utf8");
const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");

const luminance = (hex) => {
  const rgb = hex.match(/../g).map((part) => Number.parseInt(part, 16) / 255);
  const [red, green, blue] = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrast = (foreground, background) => {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

assert.equal(directions.length, 3, "Exactly three directions are required");
assert.equal(new Set(directions.map(({ id }) => id)).size, 3, "Direction IDs must be unique");
assert.match(app, /data-screen="onboarding"/);
assert.match(app, /data-screen="home"/);
assert.match(app, /data-screen="result"/);
assert.match(html, /id="blind-toggle"/);
assert.match(css, /\.blind \.direction-heading span/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(css, /min-width: 44px; min-height: 44px/);

for (const direction of directions) {
  assert.match(css, new RegExp(`\\.direction-${direction.id} \\{`), `Missing CSS for direction ${direction.code}`);
}

for (const required of ["child", "age", "place", "temperature", "feelsLike", "activity", "reason", "safety", "source"]) {
  assert.ok(scenario[required], `Scenario field ${required} is required`);
}
assert.equal(scenario.activities.length, 4, "All four MVP activities must be visible");
assert.equal(scenario.outfit.length, 6, "The shared outfit must contain six ordered items");

const keyTextPairs = [
  ["122536", "fbfdff", "A body"],
  ["ffffff", "075985", "A primary"],
  ["405865", "fff3df", "A safety"],
  ["243b2d", "f5efe2", "B body"],
  ["fffaf0", "31593d", "B primary"],
  ["fffaf0", "a9472e", "B selected activity"],
  ["314237", "e8b99d", "B safety"],
  ["5c6660", "f5efe2", "B inactive navigation"],
  ["f3f8fa", "07141d", "C body"],
  ["07141d", "d5ff3f", "C primary and safety"],
  ["60e6ff", "07141d", "C data"],
  ["9db4c0", "07141d", "C secondary text"],
];

for (const [foreground, background, label] of keyTextPairs) {
  assert.ok(contrast(foreground, background) >= 4.5, `${label} must meet WCAG AA text contrast`);
}

console.log("TASK-005 static contract: PASS");
console.log("3 directions × 3 screens, shared fixture, blind mode, 44px targets, AA key text pairs, reduced-motion fallback");
