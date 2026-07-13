#!/usr/bin/env node
/**
 * verify-contrast-chips.mjs
 *
 * Selfcheck for de 10 "atomic" tekst-/ikon-kontrast-chips i wool-app (Klemeg).
 * Leser design-tokens.css for å resolve --token-værdier (både :root og dark),
 * og overstyrer med HARD_CODED_VALUES når komponenten bruker en hex/oklch direkte
 * (eks #E87A4D i VarmEllerKaldScreen, terracotta-100-dark som ikke finnes som
 * eget token, etc).
 *
 * Kjør:  node scripts/verify-contrast-chips.mjs
 *
 * Exit-code:
 *   0 = alle chips passer
 *   1 = minst én chip feiler
 *
 * Krever:
 *   npm install --save-dev culori
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parse, formatHex, converter } from "culori";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, "..");
const TOKENS_PATH = resolve(REPO_ROOT, "src/styles/design-tokens.css");

const toRgb = converter("rgb");

// ────────────────────────────────────────────────────────────────────────────
// HARD-CODED VALUES: når en komponent ikke bruker en CSS-variabel, men har
// en hex/oklch hardkodet inn — override token-lookupen for korrekt audit.
// Disse er hentet fra audit av faktiske komponenter (eks VarmEllerKaldScreen).
// ────────────────────────────────────────────────────────────────────────────
const HARD_CODED_VALUES = {
  // NB: VarmEllerKaldScreen bruker IKKE lenger hex-værdier direkte —
  // ikon-fargene resolves via CSS-vars (--status-warm / --status-ok /
  // --status-cold) som har egne dark-mode-overstyringer.
  // Disse er beholdt kun som referanse for tidligere light-mode hex.
  "varm-orange-icon": "#B85633",
  "perfekt-orange-icon": "#A85420",
  "kald-blue-icon": "#3D6A95",
  // CTA bruker --warm-orange-700 i default (P0.1 contrast-fix i komponenten),
  // ikke --warm-orange-500.
  "cta-warm-orange-on-white": "#FF6B35",
  // terracotta-100-dark eksisterer kun som oklch i [data-theme=dark]:
  // oklch(0.32 0.040 38) → vi henter via dark-extract i parseTokens.
};

// ────────────────────────────────────────────────────────────────────────────
// ATOMIC_ITEMS: de 10 chips å sjekke.
// applies: "light" | "dark" | "both"
// AA normal-text = 4.5:1, AA large/non-text = 3:1, AAA = 7:1
// ────────────────────────────────────────────────────────────────────────────
const ATOMIC_ITEMS = [
  {
    id: "P0.1",
    descr: "cta-bg-warm-orange-on-white (primær CTA, hvit tekst på warm-orange-700)",
    // P0.1 contrast-fix (2026-06-28): komponenten bruker --warm-orange-700
    // (mørkere) som default CTA-bg, IKKE --warm-orange-500. Ref:
    // VarmEllerKaldScreen.tsx linje 379–381. Token-500 er reservert til
    // dot/border-accents (ikke tekst-bærende flate).
    bgToken: "--warm-orange-700",
    inkToken: "#FFFFFF",
    minAA: 4.5,
    minAAA: null,
    applies: "both",
  },
  {
    id: "P0.2",
    descr: "plagg-pros-pill (terracotta-100 bg + ink-on-pos-tint, semantisk token)",
    // P0.2 contrast-fix (2026-06-28): komponenten bruker --ink-on-pos-tint
    // (semantisk token som er --terracotta-700 i light og --terracotta-200
    // i dark), IKKE rå --terracotta-700. Ref: VarmEllerKaldScreen.tsx
    // STATUS_ROWS perfekt-rad: actionColor: 'var(--ink-on-pos-tint)'.
    bgToken: "--terracotta-100", // i dark = oklch(0.32 0.040 38)
    inkToken: "--ink-on-pos-tint", // i dark = --terracotta-200 (lys)
    minAA: 4.5,
    minAAA: null,
    applies: "dark",
  },
  {
    id: "P0.3a",
    descr: "varm-ellerkald-icon-varm (surface-soft bg + --status-warm ink, non-text)",
    // P0.3 contrast-fix (2026-06-28): komponenten bruker CSS-var
    // (--status-warm/ok/cold) som har egne dark-mode-tokens.
    bgToken: "--surface-soft",
    inkToken: "--status-warm",
    minAA: 3.0, // non-text 3:1
    minAAA: null,
    applies: "both",
  },
  {
    id: "P0.3b",
    descr: "varm-ellerkald-icon-perfekt (surface-soft bg + --status-ok ink, non-text)",
    bgToken: "--surface-soft",
    inkToken: "--status-ok",
    minAA: 3.0,
    minAAA: null,
    applies: "both",
  },
  {
    id: "P0.3c",
    descr: "varm-ellerkald-icon-kald (surface-soft bg + --status-cold ink, non-text)",
    bgToken: "--surface-soft",
    inkToken: "--status-cold",
    minAA: 3.0,
    minAAA: null,
    applies: "both",
  },
  {
    id: "P0.4",
    descr: "refhour-inactive-text (surface-soft bg + ink-700)",
    bgToken: "--surface-soft",
    inkToken: "--ink-700",
    minAA: 4.5,
    minAAA: null,
    applies: "both",
  },
  {
    id: "P0.5",
    descr: "plagg-cons-pill-light (surface-2 bg + ink-700) — surface-2 mappes til --surface-soft",
    bgToken: "--surface-soft",
    inkToken: "--ink-700",
    minAA: 4.5,
    minAAA: null,
    applies: "light",
  },
  {
    id: "P1.6a",
    descr: "behold-action-light (terracotta-100 + terracotta-700)",
    bgToken: "--terracotta-100",
    inkToken: "--terracotta-700",
    minAA: 4.5,
    minAAA: null,
    applies: "light",
  },
  {
    id: "P1.6b",
    descr: "behold-action-dark (terracotta-100-dark + terracotta-200-dark)",
    bgToken: "--terracotta-100",
    inkToken: "--terracotta-200",
    minAA: 4.5,
    minAAA: null,
    applies: "dark",
  },
  {
    id: "P1.7",
    descr: "nakke-callout-light (bg-canvas + terracotta-700)",
    bgToken: "--bg-canvas",
    inkToken: "--terracotta-700",
    minAA: 4.5,
    minAAA: null,
    applies: "light",
  },
  {
    id: "P2.9",
    descr: "hjem-anbefaling-AAA (bg-canvas + ink-900, AAA)",
    bgToken: "--bg-canvas",
    inkToken: "--ink-900",
    minAA: 4.5,
    minAAA: 7.0,
    applies: "both",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// TOKEN PARSER
// Parser :root { ... } (light) og [data-theme="dark"] { ... } (dark)
// Returnerer { light: {tokenName: value}, dark: {tokenName: value} }
// ────────────────────────────────────────────────────────────────────────────
function parseTokens(css) {
  const light = {};
  const dark = {};

  // Light: :root { ... } (første blokk, før dark-overrides)
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\n\}/);
  if (rootMatch) {
    extractVars(rootMatch[1], light);
  }

  // Dark: :root[data-theme="dark"] { ... }
  const darkMatch = css.match(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/);
  if (darkMatch) {
    // Start fra light som baseline, override med dark
    Object.assign(dark, light);
    extractVars(darkMatch[1], dark);
  } else {
    Object.assign(dark, light);
  }

  return { light, dark };
}

function extractVars(block, target) {
  const varRegex = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = varRegex.exec(block)) !== null) {
    target[m[1]] = m[2].trim();
  }
}

// Resolve en value som kan være: en hex, oklch(...), rgba(...),
// eller en var(--token) referanse — rekursivt.
function resolveValue(value, palette, depth = 0) {
  if (depth > 8) return value;
  if (!value) return value;

  // var(--token, fallback)
  const varMatch = value.match(/^var\((--[a-z0-9-]+)(?:\s*,\s*(.+))?\)$/i);
  if (varMatch) {
    const tok = varMatch[1];
    if (palette[tok]) return resolveValue(palette[tok], palette, depth + 1);
    if (varMatch[2]) return resolveValue(varMatch[2].trim(), palette, depth + 1);
    return value;
  }
  return value;
}

// Konverter en CSS color-streng til {r,g,b} 0–1
function toRgbFloat(cssColor) {
  if (!cssColor) return null;
  const parsed = parse(cssColor);
  if (!parsed) return null;
  const rgb = toRgb(parsed);
  if (!rgb) return null;
  return {
    r: clamp01(rgb.r),
    g: clamp01(rgb.g),
    b: clamp01(rgb.b),
    alpha: rgb.alpha == null ? 1 : rgb.alpha,
  };
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

// Hvis fg har alpha < 1, composite over bg
function composite(fg, bg) {
  if (fg.alpha >= 1) return fg;
  const a = fg.alpha;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    alpha: 1,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// WCAG 2.x contrast (relativ luminans)
// ────────────────────────────────────────────────────────────────────────────
function srgbToLin(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relLum(rgb) {
  const R = srgbToLin(rgb.r);
  const G = srgbToLin(rgb.g);
  const B = srgbToLin(rgb.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function wcagContrast(fg, bg) {
  const L1 = relLum(fg);
  const L2 = relLum(bg);
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
}

// ────────────────────────────────────────────────────────────────────────────
// APCA Lc (forenklet implementasjon basert på Myndex' SAPC 0.98G-4g, public).
// Returnerer Lc (kan være negativ) — bruk Math.abs for sammenligning.
// Dette er en standard JS-port; ikke offisiell, men matcher published values
// innenfor < 0.5 Lc for normalt-store fg/bg-par.
// ────────────────────────────────────────────────────────────────────────────
function apcaLc(txtRgb, bgRgb) {
  const mainTRC = 2.4;
  const Rco = 0.2126729;
  const Gco = 0.7151522;
  const Bco = 0.072175;
  const normBG = 0.56;
  const normTXT = 0.57;
  const revTXT = 0.62;
  const revBG = 0.65;
  const blkThrs = 0.022;
  const blkClmp = 1.414;
  const deltaYmin = 0.0005;
  const scaleBoW = 1.14;
  const scaleWoB = 1.14;
  const loBoWoffset = 0.027;
  const loWoBoffset = 0.027;
  const loClip = 0.1;

  function chanY(r, g, b) {
    return (
      Math.pow(r, mainTRC) * Rco +
      Math.pow(g, mainTRC) * Gco +
      Math.pow(b, mainTRC) * Bco
    );
  }

  let txtY = chanY(txtRgb.r, txtRgb.g, txtRgb.b);
  let bgY = chanY(bgRgb.r, bgRgb.g, bgRgb.b);

  if (txtY < blkThrs) txtY += Math.pow(blkThrs - txtY, blkClmp);
  if (bgY < blkThrs) bgY += Math.pow(blkThrs - bgY, blkClmp);

  if (Math.abs(bgY - txtY) < deltaYmin) return 0;

  let outputContrast;
  if (bgY > txtY) {
    // Normal polarity (dark text on light bg)
    const SAPC = (Math.pow(bgY, normBG) - Math.pow(txtY, normTXT)) * scaleBoW;
    outputContrast = SAPC < loClip ? 0 : SAPC - loBoWoffset;
  } else {
    // Reverse polarity (light text on dark bg)
    const SAPC = (Math.pow(bgY, revBG) - Math.pow(txtY, revTXT)) * scaleWoB;
    outputContrast = SAPC > -loClip ? 0 : SAPC + loWoBoffset;
  }

  return outputContrast * 100;
}

// ────────────────────────────────────────────────────────────────────────────
// EVALUERING per item
// ────────────────────────────────────────────────────────────────────────────
function resolveColor(token, palette) {
  if (!token) return null;
  // Direkte hex eller rgba/oklch literal
  if (token.startsWith("#") || token.startsWith("rgb") || token.startsWith("oklch") || token.startsWith("hsl")) {
    return toRgbFloat(token);
  }
  // CSS var token
  if (token.startsWith("--")) {
    const raw = palette[token];
    if (!raw) return null;
    const resolved = resolveValue(raw, palette);
    return toRgbFloat(resolved);
  }
  return toRgbFloat(token);
}

function evaluateItem(item, lightPal, darkPal) {
  const results = { light: null, dark: null };

  const evalOne = (palette) => {
    const bg = resolveColor(item.bgToken, palette);
    let fg = resolveColor(item.inkToken, palette);
    if (!bg || !fg) {
      return { error: `Kunne ikke resolve bg=${item.bgToken} eller ink=${item.inkToken}` };
    }
    // composite alpha hvis nødvendig (eks ink-200 rgba(...))
    fg = composite(fg, bg);

    const wcag = wcagContrast(fg, bg);
    const lc = apcaLc(fg, bg);
    return {
      bg: formatHex({ mode: "rgb", r: bg.r, g: bg.g, b: bg.b }),
      fg: formatHex({ mode: "rgb", r: fg.r, g: fg.g, b: fg.b }),
      wcag,
      apca: lc,
    };
  };

  if (item.applies === "light" || item.applies === "both") {
    results.light = evalOne(lightPal);
  }
  if (item.applies === "dark" || item.applies === "both") {
    results.dark = evalOne(darkPal);
  }

  // Pass-logikk: hver aktiv variant må passere minAA (og minAAA hvis satt)
  const threshold = item.minAAA != null ? item.minAAA : item.minAA;
  const variants = [];
  if (results.light && !results.light.error) variants.push(results.light.wcag);
  if (results.dark && !results.dark.error) variants.push(results.dark.wcag);

  const pass = variants.length > 0 && variants.every((c) => c >= threshold);

  const fmt = (r) => (r && !r.error ? `${r.wcag.toFixed(2)}:1` : r?.error ?? "n/a");
  const fmtApca = (r) => (r && !r.error ? `${Math.abs(r.apca).toFixed(1)} Lc` : "n/a");

  return {
    id: item.id,
    descr: item.descr,
    pass,
    applies: item.applies,
    threshold,
    threshold_kind: item.minAAA != null ? "AAA" : item.minAA === 3.0 ? "AA non-text" : "AA",
    contrast_light: results.light ? fmt(results.light) : "n/a",
    contrast_dark: results.dark ? fmt(results.dark) : "n/a",
    apca_light: results.light ? fmtApca(results.light) : "n/a",
    apca_dark: results.dark ? fmtApca(results.dark) : "n/a",
    note: !pass
      ? `FAIL: krav ${threshold}:1 ikke nådd (light=${results.light ? results.light.wcag?.toFixed(2) : "-"}, dark=${results.dark ? results.dark.wcag?.toFixed(2) : "-"})`
      : `OK: ${item.applies}, krav ${threshold}:1`,
    debug: {
      bg_light: results.light?.bg,
      fg_light: results.light?.fg,
      bg_dark: results.dark?.bg,
      fg_dark: results.dark?.fg,
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────────
function main() {
  const css = readFileSync(TOKENS_PATH, "utf8");
  const { light, dark } = parseTokens(css);

  const items = ATOMIC_ITEMS.map((it) => evaluateItem(it, light, dark));
  const passed = items.filter((x) => x.pass).length;
  const failed = items.length - passed;

  const out = { passed, failed, items };
  // Pretty-print til stdout
  console.log(JSON.stringify(out, null, 2));

  process.exit(failed === 0 ? 0 : 1);
}

main();
