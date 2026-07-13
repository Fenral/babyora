#!/usr/bin/env node
/* F79: clay snø-ikon (kald-mocken viser sol på snø-dag — undergraver fasit).
 * Kost: ~1,4 NOK. */
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

let KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  try {
    KEY = readFileSync('C:\\Users\\SkotvoldSivertSende\\OneDrive - IdrettsKontor\\Skrivebord\\nano banan 2.txt', 'utf8').trim();
  } catch {}
}
if (!KEY) { console.error('mangler nøkkel'); process.exit(1); }

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent?key=${KEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: `A single volumetric 3D snow-cloud icon for a premium weather app.
Soft 3D claymation render, hand-sculpted plasticine, matte material, soft
top-left studio lighting. A soft rounded clay cloud in cool off-white
(#E8ECF2) with 5-6 small rounded clay snowflake dots in pale ice-blue
(#B9CEE6) drifting below it. Gentle and calm, NO face. Centered, generous
margin, square 1:1. No text, no watermarks. The icon must never contain
magenta/pink.
BACKGROUND (CRITICAL): SOLID BRIGHT MAGENTA (#FF00FF), flat and uniform,
covering all canvas outside the icon. No gradient, no checkerboard.` }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
  }),
});
if (!res.ok) { console.error('HTTP', res.status, (await res.text()).slice(0, 250)); process.exit(1); }
const json = await res.json();
const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
if (!part) { console.error('ingen bildedata:', JSON.stringify(json).slice(0, 300)); process.exit(1); }
writeFileSync('public/avatars/f79-poc/raw/sno-raw.png', Buffer.from(part.inlineData.data, 'base64'));

const { data, info } = await sharp('public/avatars/f79-poc/raw/sno-raw.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const mag = Math.min(r, b) - g;
  if (mag > 90) data[i + 3] = 0;
  else if (mag > 40) {
    data[i + 3] = Math.round(255 * (1 - (mag - 40) / 50));
    const avg = Math.round((r + b) / 2);
    data[i] = Math.min(r, avg - Math.round(mag * 0.35));
    data[i + 2] = Math.min(b, avg - Math.round(mag * 0.35));
  } else if (mag > 15) {
    const t = Math.round((g + Math.min(r, b)) / 2);
    data[i] = Math.min(r, t + 10);
    data[i + 2] = Math.min(b, t + 10);
  }
}
await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile('public/weather-3d/sno.png');
console.log('sno.png klar');
