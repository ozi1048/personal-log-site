import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const candidateOrigin = 'https://personal-log-site-production.cloudflare-migration-plan.workers.dev';
const productionOrigin = 'https://calmapercorso.com';

const mappedPaths = readFileSync(resolve(root, 'docs/migration/url-mapping.csv'), 'utf8')
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => new URL(line.split(',')[0]).pathname);

const extraPaths = [
  '/',
  '/articles/',
  '/category/',
  '/category/career/',
  '/category/money/',
  '/category/relocation/',
  '/sitemap.xml',
  '/robots.txt',
  '/rss.xml',
];

const paths = [...new Set([...mappedPaths, ...extraPaths])];
const normalizationRedirects = [];
for (const pathname of paths) {
  const requestedUrl = new URL(pathname, candidateOrigin);
  const initial = await fetch(requestedUrl, { redirect: 'manual' });
  if (initial.status === 307) {
    const location = initial.headers.get('location');
    assert.ok(location, `307 without Location: ${pathname}`);
    assert.equal(decodeURIComponent(new URL(location, requestedUrl).pathname), decodeURIComponent(pathname), `redirect changed path: ${pathname}`);
    normalizationRedirects.push(pathname);
  } else {
    assert.equal(initial.status, 200, `${pathname} returned ${initial.status}`);
  }
  const response = initial.status === 307 ? await fetch(requestedUrl) : initial;
  assert.equal(response.status, 200, `${pathname} returned ${response.status}`);
  if (!pathname.endsWith('.xml') && !pathname.endsWith('.txt')) {
    const html = await response.text();
    const canonical = new URL(pathname, productionOrigin).toString();
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `canonical mismatch: ${pathname}`);
    assert.ok(html.includes('G-S7GS8NFDWG'), `GA4 ID missing: ${pathname}`);
    assert.doesNotMatch(html, /content="[^"]*noindex/i, `noindex remained: ${pathname}`);
    assert.equal(response.headers.get('x-robots-tag'), null, `X-Robots-Tag remained: ${pathname}`);
  }
}

const robots = await (await fetch(new URL('/robots.txt', candidateOrigin))).text();
assert.match(robots, /Allow: \//);
assert.match(robots, /Sitemap: https:\/\/calmapercorso\.com\/sitemap\.xml/);

const contact = await (await fetch(new URL('/お問い合わせ/', candidateOrigin))).text();
assert.match(contact, /action="https:\/\/formspree\.io\/f\/xeajwayl"/);
assert.match(contact, /data-enabled="true"/);
assert.match(contact, /data-sitekey="0x4AAAAAAEZOOB4bmw0qotmj"/);

const missing = await fetch(new URL('/phase-5-known-missing/', candidateOrigin), { redirect: 'manual' });
assert.equal(missing.status, 404);

console.log(`Verified production candidate HTTP: ${paths.length} routes, production canonical/robots/GA4/contact, and 404. Encoding-only 307 normalization: ${normalizationRedirects.length}.`);
