import { mkdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const htmlUrl = new URL("../../docs/design.html", import.meta.url);
const outputUrl = new URL("./screenshots/", import.meta.url);
await mkdir(outputUrl, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1365, height: 1000 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(fileURLToPath(htmlUrl)).href, { waitUntil: "networkidle" });

await page.screenshot({ path: fileURLToPath(new URL("design-light.png", outputUrl)), fullPage: true });
await page.locator("#components").screenshot({ path: fileURLToPath(new URL("components-light.png", outputUrl)) });
await page.locator("#theme-toggle").click();
await page.locator("#components").screenshot({ path: fileURLToPath(new URL("components-dark.png", outputUrl)) });

await browser.close();
console.log("Captured light guide plus light/dark component sheets in design-lab/task-007/screenshots/");
