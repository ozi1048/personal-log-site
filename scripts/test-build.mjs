import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const root = process.cwd();
const previewOrigin = process.env.PUBLIC_SITE_URL || 'https://personal-log-site-preview.cloudflare-migration-plan.workers.dev';
const dist = (...parts) => resolve(root, 'dist', ...parts);
const read = (...parts) => readFileSync(dist(...parts), 'utf8');
const inventory = JSON.parse(readFileSync(resolve(root, 'docs/migration/phase-1-content-inventory.json'), 'utf8'));
const fixedPages = JSON.parse(readFileSync(resolve(root, 'docs/migration/phase-1-fixed-pages.json'), 'utf8'));
const expectedBodyImageAlts = new Map([
  ['https://calmapercorso.com/wp-content/uploads/2026/05/image.png', '14回の転職に伴う年収推移グラフ'],
  ['https://calmapercorso.com/wp-content/uploads/2026/03/想定70000円-1-1024x821.png', 'タクシー月間売上が1日平均約7万円だった実績と月収シミュレーション'],
  ['https://calmapercorso.com/wp-content/uploads/2026/03/想定60000円.png', 'タクシー月間売上の実績と1日平均6万・6万5千・7万円の月収シミュレーション'],
  ['https://calmapercorso.com/wp-content/uploads/2026/02/image-1-1024x258.png', '移住支援金の対象者要件（東京圏での居住・通勤期間）'],
  ['https://calmapercorso.com/wp-content/uploads/2026/02/スクリーンショット-2026-02-07-16.13.16.png', '移住支援金の移住先での就業・テレワーク等の要件'],
  ['https://calmapercorso.com/wp-content/uploads/2026/02/image-1024x191.png', '大町市移住支援金の移住元に関する要件'],
]);

function routeFile(pathname) {
  const decoded = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, '');
  if (!decoded) return 'index.html';
  if (extname(decoded)) return decoded;
  return `${decoded}/index.html`;
}

function parseCsvLine(line) {
  const fields = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') { field += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { fields.push(field); field = ''; }
    else field += character;
  }
  fields.push(field);
  return fields;
}

const mapping = readFileSync(resolve(root, 'docs/migration/url-mapping.csv'), 'utf8')
  .trim().split(/\r?\n/).slice(1).map(parseCsvLine)
  .map((fields) => fields.map((field) => field.trim()))
  .map(([oldUrl, newUrl, status]) => ({ oldUrl, newUrl, status, pathname: new URL(newUrl).pathname }));

assert.equal(inventory.length, 19, 'Phase 1 inventory must contain 19 posts');
assert.equal(fixedPages.length, 3, 'Phase 1 fixed-page inventory must contain 3 pages');
assert.equal(mapping.length, 23, 'URL mapping must contain home + 19 posts + 3 fixed pages');

for (const item of mapping) {
  assert.equal(item.status, 'preserve', `URL mapping status changed: ${item.oldUrl}`);
  assert.equal(item.oldUrl, item.newUrl, `old/new URL mismatch: ${item.oldUrl}`);
  assert.ok(item.pathname.endsWith('/'), `missing trailing slash: ${item.pathname}`);
  assert.ok(existsSync(dist(routeFile(item.pathname))), `mapped route not generated: ${item.pathname}`);
}

const coreRoutes = [
  '/articles/', '/category/', '/category/career/', '/category/money/', '/category/relocation/',
  '/プロフィール/', '/privacy-policy-2/', '/お問い合わせ/', '/404.html', '/rss.xml', '/robots.txt', '/sitemap.xml',
];
for (const pathname of coreRoutes) assert.ok(existsSync(dist(routeFile(pathname))), `missing route: ${pathname}`);

const markdownPostCount = readdirSync(resolve(root, 'src/content/posts'), { recursive: true })
  .filter((file) => typeof file === 'string' && file.endsWith('.md')).length;
assert.equal(markdownPostCount, inventory.length, 'WordPress inventory and Markdown post counts differ');

for (const post of inventory) {
  const html = read(post.slug, 'index.html');
  const expectedDescription = (post.meta_description || '任意整理で返済負担は軽くなったものの、途中で支払いを続けられず自力返済へ切り替えた7年間の記録。デビットカード生活、弁護士相談、返済ルールと立て直せなかった経緯を振り返ります。').replace(/\s+/g, ' ').trim();
  const expectedSeoTitle = post.html_title.replace(/\s+-\s+calmapercorso$/i, '').trim();
  assert.ok(html.includes(`<title>${expectedSeoTitle.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')} | calmapercorso</title>`), `title mismatch: ${post.slug}`);
  assert.ok(html.includes(`<meta name="description" content="${expectedDescription.replaceAll('"', '&quot;')}">`), `description mismatch: ${post.slug}`);
  assert.match(html, /<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">/, `noindex missing: ${post.slug}`);
  assert.ok(html.includes(`<link rel="canonical" href="${previewOrigin}/${post.slug}/">`), `preview canonical mismatch: ${post.slug}`);
  assert.match(html, /<meta property="og:title"/);
  assert.match(html, /<meta property="og:description"/);
  assert.match(html, /<meta property="og:image"/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html, /"@type":"BlogPosting"/, `BlogPosting missing: ${post.slug}`);
  assert.match(html, /"@type":"BreadcrumbList"/, `BreadcrumbList missing: ${post.slug}`);
  for (const imageUrl of post.body_images) {
    assert.ok(html.includes(imageUrl) || html.includes(encodeURI(imageUrl)), `WordPress body image URL missing: ${post.slug} -> ${imageUrl}`);
    const expectedAlt = expectedBodyImageAlts.get(imageUrl);
    if (expectedAlt) assert.ok(html.includes(`alt="${expectedAlt}"`), `body image alt missing: ${post.slug} -> ${imageUrl}`);
  }
}

const relatedCard = read('tokyo-taxi-driver-quit-reason', 'index.html');
assert.match(relatedCard, /class="related-reference"/);
assert.match(relatedCard, /href="\/bankruptcy-cancellation\/"/);
assert.match(relatedCard, /【#6】自己破産直前、弁護士契約が強制解約になった話/);

for (const pathname of ['/', '/プロフィール/', '/privacy-policy-2/', '/お問い合わせ/', '/404.html']) {
  const html = read(routeFile(pathname));
  assert.match(html, /<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">/);
  assert.match(html, /<link rel="canonical" href="https:\/\//);
  assert.match(html, /<meta property="og:title"/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
}

const sitemap = read('sitemap.xml');
assert.match(sitemap, /<urlset/);
assert.equal((sitemap.match(/<url>/g) ?? []).length, 28, 'sitemap must contain 19 posts + 9 site routes');
for (const post of inventory) assert.match(sitemap, new RegExp(`/${post.slug}/`), `post absent from sitemap: ${post.slug}`);
for (const pathname of ['/プロフィール/', '/privacy-policy-2/', '/お問い合わせ/']) {
  assert.ok(sitemap.includes(encodeURI(pathname)) || sitemap.includes(pathname), `fixed page absent from sitemap: ${pathname}`);
}

const rss = read('rss.xml');
assert.match(rss, /<rss/);
assert.equal((rss.match(/<item>/g) ?? []).length, 19, 'RSS must contain all 19 posts');
for (const post of inventory) assert.match(rss, new RegExp(`/${post.slug}/`), `post absent from RSS: ${post.slug}`);

const robots = read('robots.txt');
assert.match(robots, /User-agent: \*/);
assert.match(robots, /Disallow: \//);
assert.match(robots, /Sitemap: .*sitemap\.xml/);
const headers = read('_headers');
assert.match(headers, /X-Robots-Tag: noindex, nofollow, noarchive, nosnippet/);

const htmlFiles = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.name.endsWith('.html')) htmlFiles.push(absolute);
  }
}
walk(dist());

const ignoredPaths = new Set(['/favicon.svg', '/rss.xml', '/sitemap.xml']);
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:|#)/.test(href)) continue;
    const pathname = new URL(href, previewOrigin).pathname;
    if (pathname.startsWith('/_astro/') || ignoredPaths.has(pathname)) continue;
    assert.ok(existsSync(dist(routeFile(pathname))), `known internal link is 404: ${pathname} (from ${file})`);
  }
}

assert.match(read('404.html'), /404/);
assert.match(read('お問い合わせ', 'index.html'), /現在、このページからお問い合わせは送信できません/);
assert.doesNotMatch(read('お問い合わせ', 'index.html'), /<form\b/i, 'Contact Form 7 form must not be active in preview');

console.log('Verified 19 posts, 3 fixed pages, 3 categories, 23 preserved WordPress paths, SEO/JSON-LD, 28 sitemap URLs, 19 RSS items, preview noindex and internal links.');
