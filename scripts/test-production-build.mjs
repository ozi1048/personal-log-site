import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const root = process.cwd();
const buildDir = process.env.BUILD_DIR || 'dist-production';
const productionOrigin = 'https://calmapercorso.com';
const dist = (...parts) => resolve(root, buildDir, ...parts);
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

const mappedUrls = readFileSync(resolve(root, 'docs/migration/url-mapping.csv'), 'utf8')
  .trim().split(/\r?\n/).slice(1)
  .map((line) => line.split(',').slice(0, 2))
  .map(([oldUrl, newUrl]) => ({ oldUrl: new URL(oldUrl), newUrl: new URL(newUrl) }));

for (const { oldUrl, newUrl } of mappedUrls) {
  assert.equal(oldUrl.toString(), newUrl.toString(), `URL mapping changed: ${oldUrl}`);
  assert.ok(oldUrl.pathname.endsWith('/'), `trailing slash missing: ${oldUrl.pathname}`);
  assert.ok(existsSync(dist(routeFile(oldUrl.pathname))), `production route missing: ${oldUrl.pathname}`);
}

for (const post of inventory) {
  const html = read(post.slug, 'index.html');
  assert.doesNotMatch(html, /content="[^"]*noindex/i, `noindex remained on production article: ${post.slug}`);
  assert.match(html, /<meta name="robots" content="index, follow, max-image-preview:large">/);
  assert.ok(html.includes(`<link rel="canonical" href="${post.canonical}">`), `canonical mismatch: ${post.slug}`);
  assert.ok(html.includes(`<meta property="og:url" content="${post.canonical}">`), `OG URL mismatch: ${post.slug}`);
  const featuredImageUrl = `${productionOrigin}/images/posts/${post.slug}.webp`;
  assert.ok(html.includes(`/images/posts/${post.slug}.webp`), `featured image missing: ${post.slug}`);
  assert.ok(html.includes(`<meta property="og:image" content="${featuredImageUrl}">`), `production OGP image mismatch: ${post.slug}`);
  assert.ok(html.includes(`<meta name="twitter:image" content="${featuredImageUrl}">`), `production Twitter image mismatch: ${post.slug}`);
  assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, `H1 count mismatch: ${post.slug}`);
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /<meta property="og:title" content="[^"]+">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html, /"@type":"BlogPosting"/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.ok(html.includes(`"url":"${post.canonical}"`), `JSON-LD URL mismatch: ${post.slug}`);
  assert.ok(post.category_slugs.every((category) => html.includes(`/category/${category}/`)), `category link missing: ${post.slug}`);
  const logNumber = Number(post.title.match(/#(\d+)/)?.[1]);
  if (logNumber > 1) assert.match(html, /rel="prev"/, `previous article link missing: ${post.slug}`);
  if (logNumber < 19) assert.match(html, /rel="next"/, `next article link missing: ${post.slug}`);
  for (const image of post.body_images) {
    assert.ok(html.includes(image) || html.includes(encodeURI(image)), `body image missing: ${post.slug}`);
    const expectedAlt = expectedBodyImageAlts.get(image);
    if (expectedAlt) assert.ok(html.includes(`alt="${expectedAlt}"`), `body image alt missing: ${post.slug}`);
  }
}

const relatedCard = read('tokyo-taxi-driver-quit-reason', 'index.html');
assert.match(relatedCard, /class="related-reference"/);
assert.match(relatedCard, /href="\/bankruptcy-cancellation\/"/);

for (const page of fixedPages) {
  const pathname = new URL(page.url).pathname;
  const html = read(routeFile(pathname));
  assert.doesNotMatch(html, /content="[^"]*noindex/i, `noindex remained on production fixed page: ${pathname}`);
  assert.ok(html.includes(`<link rel="canonical" href="${page.canonical}">`), `fixed-page canonical mismatch: ${pathname}`);
  assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, `fixed-page H1 count mismatch: ${pathname}`);
}

for (const pathname of ['/', '/articles/', '/category/', '/category/career/', '/category/money/', '/category/relocation/']) {
  const html = read(routeFile(pathname));
  assert.doesNotMatch(html, /content="[^"]*noindex/i, `noindex remained: ${pathname}`);
  assert.ok(html.includes(`<link rel="canonical" href="${new URL(pathname, productionOrigin)}">`), `canonical mismatch: ${pathname}`);
  assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, `H1 count mismatch: ${pathname}`);
}

const productionContact = read('お問い合わせ', 'index.html');
assert.match(productionContact, /<form\b[^>]*id="contact-form"/i);
assert.match(productionContact, /action="https:\/\/formspree\.io\/f\/xeajwayl"/);
assert.match(productionContact, /data-enabled="true"/);
assert.match(productionContact, /name="email"[^>]*required/i);
assert.match(productionContact, /name="message"[^>]*required/i);
assert.doesNotMatch(productionContact, /Preview環境では誤送信防止のため/);
assert.match(productionContact, /class="cf-turnstile"/);
assert.match(productionContact, /data-sitekey="0x4AAAAAAEZOOB4bmw0qotmj"/);
assert.match(productionContact, /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/);
assert.match(productionContact, /cf-turnstile-response/);
assert.match(productionContact, /window\.turnstile\?\.reset\(\)/);
assert.match(read('privacy-policy-2', 'index.html'), /Formspree/);
assert.match(read('privacy-policy-2', 'index.html'), /Cloudflare Turnstile/);

const headers = read('_headers');
assert.doesNotMatch(headers, /X-Robots-Tag:\s*noindex/i, 'production _headers still sends noindex');
assert.match(headers, /X-Content-Type-Options: nosniff/);

const robots = read('robots.txt');
assert.match(robots, /Allow: \//);
assert.doesNotMatch(robots, /Disallow: \/(?:\r?\n|$)/);
assert.match(robots, /Sitemap: https:\/\/calmapercorso\.com\/sitemap\.xml/);

const sitemap = read('sitemap.xml');
assert.equal((sitemap.match(/<url>/g) ?? []).length, 28);
assert.doesNotMatch(sitemap, /workers\.dev|preview/i);
assert.doesNotMatch(sitemap, /404/);
assert.equal((sitemap.match(/https:\/\/calmapercorso\.com/g) ?? []).length, 28);

const rss = read('rss.xml');
assert.equal((rss.match(/<item>/g) ?? []).length, 19);
assert.match(rss, /https:\/\/calmapercorso\.com/);
assert.doesNotMatch(rss, /workers\.dev|preview/i);

const article = read(inventory[0].slug, 'index.html');
assert.match(article, /googletagmanager\.com\/gtag\/js\?id=G-S7GS8NFDWG/);
assert.match(article, /gtag\('config', gaMeasurementId\)/);

const notFound = read('404.html');
assert.match(notFound, /<meta name="robots" content="noindex, follow">/);
assert.doesNotMatch(notFound, /X-Robots-Tag/);

console.log('Verified production build: 23 preserved paths, 19 article SEO/schema/navigation records, fixed/category pages, production canonical/OG/JSON-LD, crawlable robots, production sitemap/RSS, conditional headers and GA injection.');
