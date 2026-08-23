import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const origin = process.env.PUBLIC_SITE_URL || 'https://personal-log-site-preview.cloudflare-migration-plan.workers.dev';
const mapping = readFileSync(resolve(process.cwd(), 'docs/migration/url-mapping.csv'), 'utf8')
  .trim().split(/\r?\n/).slice(1)
  .map((line) => new URL(line.split(',')[0]));

for (const sourceUrl of mapping) {
  const response = await fetch(new URL(sourceUrl.pathname, origin), { redirect: 'follow' });
  assert.equal(response.status, 200, `preview route did not resolve to HTTP 200: ${sourceUrl.pathname}`);
  const finalPath = new URL(response.url).pathname;
  assert.equal(decodeURIComponent(finalPath), decodeURIComponent(sourceUrl.pathname), `preview path changed: ${sourceUrl.pathname} -> ${finalPath}`);
  assert.ok(finalPath.endsWith('/'), `trailing slash missing: ${finalPath}`);
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/, `X-Robots-Tag missing: ${finalPath}`);
}

const notFound = await fetch(new URL('/phase-3-known-404/', origin));
assert.equal(notFound.status, 404, 'unknown preview route must return HTTP 404');
const robots = await (await fetch(new URL('/robots.txt', origin))).text();
assert.match(robots, /Disallow: \//);
const sitemap = await (await fetch(new URL('/sitemap.xml', origin))).text();
assert.equal((sitemap.match(/<url>/g) ?? []).length, 28);
const rss = await (await fetch(new URL('/rss.xml', origin))).text();
assert.equal((rss.match(/<item>/g) ?? []).length, 19);

console.log(`Verified ${mapping.length} deployed WordPress paths resolve to HTTP 200 with equivalent paths, noindex headers, 404, sitemap and RSS.`);
