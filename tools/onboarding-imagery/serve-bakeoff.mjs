#!/usr/bin/env node

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.cwd());
const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

export function startBakeoffServer(port = 4174) {
  const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);
    let relative = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');
    if (!relative) relative = 'docs/mocks/onboarding-imagery-bakeoff/index.html';
    let target = path.resolve(ROOT, relative);
    if (target !== ROOT && !target.startsWith(`${ROOT}${path.sep}`)) throw new Error('Path outside repository');
    const metadata = await stat(target);
    if (metadata.isDirectory()) target = path.join(target, 'index.html');
    const file = await stat(target);
    if (!file.isFile()) throw new Error('Not a file');
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Length': file.size,
      'Content-Type': MIME[path.extname(target).toLowerCase()] ?? 'application/octet-stream',
    });
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const port = Number(process.argv[2] ?? 4174);
  await startBakeoffServer(port);
  console.log(`Babyora bake-off: http://127.0.0.1:${port}/docs/mocks/onboarding-imagery-bakeoff/`);
}
