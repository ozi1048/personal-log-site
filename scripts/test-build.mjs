import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const dist = (...parts) => resolve(root, 'dist', ...parts);
const read = (...parts) => readFileSync(dist(...parts), 'utf8');

const expectedRoutes = [
  'index.html',
  'articles/index.html',
  'category/index.html',
  'category/career/index.html',
  'category/money/index.html',
  'category/relocation/index.html',
  'first-career-change/index.html',
  'bankruptcy-cancellation/index.html',
  'ijyu-shienkin-failed/index.html',
  'job-income-history/index.html',
  'プロフィール/index.html',
  'privacy-policy-2/index.html',
  'お問い合わせ/index.html',
  '404.html',
  'rss.xml',
  'robots.txt',
  'sitemap.xml',
];

for (const route of expectedRoutes) {
  assert.ok(existsSync(dist(route)), `missing route: ${route}`);
}

const mappedPaths = readFileSync(resolve(root, 'docs/migration/url-mapping.csv'), 'utf8')
  .split('\n')
  .slice(1)
  .filter(Boolean)
  .map((line) => new URL(line.split(',')[0]).pathname);

for (const slug of ['first-career-change', 'bankruptcy-cancellation', 'ijyu-shienkin-failed', 'job-income-history']) {
  assert.ok(mappedPaths.includes(`/${slug}/`), `sample slug absent from Phase 1 mapping: ${slug}`);
  assert.ok(existsSync(dist(slug, 'index.html')), `sample slug not generated: ${slug}`);
}

for (const file of ['index.html', 'first-career-change/index.html', 'category/career/index.html', '404.html']) {
  const html = read(file);
  assert.match(html, /<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">/);
  assert.match(html, /<link rel="canonical" href="https:\/\//);
  assert.match(html, /<meta property="og:title"/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
}

if (process.env.PUBLIC_SITE_URL) {
  assert.match(read('index.html'), new RegExp(`<link rel="canonical" href="${process.env.PUBLIC_SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/">`));
  assert.doesNotMatch(read('index.html'), /example\.invalid/);
}

const article = read('first-career-change/index.html');
assert.match(article, /"@type":"BlogPosting"/);
assert.match(article, /"@type":"BreadcrumbList"/);
assert.match(article, /rel="prev"|rel="next"/);

const robots = read('robots.txt');
assert.match(robots, /Disallow: \//);
assert.match(robots, /Sitemap: .*sitemap\.xml/);

const rss = read('rss.xml');
assert.match(rss, /<rss/);
assert.match(rss, /first-career-change/);

const sitemap = read('sitemap.xml');
assert.match(sitemap, /<urlset/);
assert.match(sitemap, /first-career-change/);
assert.match(sitemap, /category\/money/);

const headers = read('_headers');
assert.match(headers, /X-Robots-Tag: noindex, nofollow, noarchive, nosnippet/);

console.log(`Verified ${expectedRoutes.length} routes, 4 preserved sample slugs, SEO metadata, schemas, RSS, sitemap, robots and noindex headers.`);
