import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const output = new URL("./screenshots/", import.meta.url);
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1365, height: 1000 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") browserErrors.push(message.text());
});
page.on("pageerror", (error) => browserErrors.push(error.message));
await page.goto("http://127.0.0.1:4176/design-lab/task-005/?blind=1", { waitUntil: "networkidle" });

assert.equal(await page.locator(".direction").count(), 3, "Three directions must render");
assert.equal(await page.locator(".phone").count(), 9, "Nine phone concepts must render");
assert.deepEqual(
  await page.locator(".phone").evaluateAll((phones) =>
    phones.map((phone) => {
      const { width, height } = phone.getBoundingClientRect();
      return [width, height];
    }),
  ),
  Array.from({ length: 9 }, () => [390, 844]),
  "Every concept must use a 390×844 viewport",
);

const screenText = await page.locator(".direction").evaluateAll((sections) =>
  sections.map((section) => [...section.querySelectorAll(".phone")].map((phone) => phone.textContent.replace(/\s+/g, " ").trim())),
);
assert.deepEqual(screenText[0], screenText[1], "A and B must use identical screen content");
assert.deepEqual(screenText[0], screenText[2], "A and C must use identical screen content");

const undersizedControls = await page.locator(".phone button").evaluateAll((buttons) =>
  buttons
    .map((button) => ({ label: button.getAttribute("aria-label") || button.textContent.trim(), box: button.getBoundingClientRect() }))
    .filter(({ box }) => box.width < 44 || box.height < 44)
    .map(({ label, box }) => `${label}: ${Math.round(box.width)}×${Math.round(box.height)}`),
);
assert.deepEqual(undersizedControls, [], "All rendered controls must be at least 44×44 CSS pixels");
assert.deepEqual(browserErrors, [], "The lab must render without browser errors");

for (const id of ["a", "b", "c"]) {
  await page.locator(`.direction-${id}`).screenshot({
    path: new URL(`direction-${id}.png`, output).pathname.slice(1),
  });
}

await browser.close();
console.log("TASK-005 browser contract: PASS");
console.log("Captured three title-blind direction sheets in design-lab/task-005/screenshots/");
