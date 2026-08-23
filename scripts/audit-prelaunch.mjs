import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const previewOrigin = (process.env.PREVIEW_ORIGIN || 'https://personal-log-site-preview.cloudflare-migration-plan.workers.dev').replace(/\/$/, '');
const wordpressOrigin = 'https://calmapercorso.com';
const inventory = JSON.parse(readFileSync(resolve(root, 'docs/migration/phase-1-content-inventory.json'), 'utf8'));
const fixedPages = JSON.parse(readFileSync(resolve(root, 'docs/migration/phase-1-fixed-pages.json'), 'utf8'));
const sourcePosts = JSON.parse(readFileSync(resolve(root, 'docs/migration/source/wordpress-posts.json'), 'utf8'));
const sourcePages = JSON.parse(readFileSync(resolve(root, 'docs/migration/source/wordpress-pages.json'), 'utf8'));

const decode = (value = '') => value
  .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
  .replace(/&#x([0-9a-f]+);/gi, (_, number) => String.fromCodePoint(Number.parseInt(number, 16)))
  .replaceAll('&nbsp;', ' ').replaceAll('&amp;', '&').replaceAll('&quot;', '"')
  .replaceAll('&#039;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const stripHtml = (value = '') => decode(value.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const digest = (value) => createHash('sha256').update(stripHtml(value)).digest('hex');
const match = (html, pattern) => decode(html.match(pattern)?.[1]?.trim() ?? '');
const count = (html, pattern) => [...html.matchAll(pattern)].length;
const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const writeCsv = (path, headers, rows) => writeFileSync(resolve(root, path), `${headers.join(',')}\n${rows.map((row) => headers.map((header) => csv(row[header])).join(',')).join('\n')}\n`);
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

const conversionLines = readFileSync(resolve(root, 'docs/migration/content-conversion-report.csv'), 'utf8').trim().split(/\r?\n/);
const conversionHeaders = parseCsvLine(conversionLines[0]);
const conversionRows = conversionLines.slice(1).map((line) => Object.fromEntries(conversionHeaders.map((header, index) => [header, parseCsvLine(line)[index]])));
assert.equal(conversionRows.length, 19);
assert.ok(conversionRows.every((row) => row.conversion_success === 'true' && row.manual_review_required === 'false' && !row.unconverted_elements && Math.abs(Number(row.text_char_difference_percent)) <= 1), 'Content conversion report has unresolved article differences');

async function getJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'personal-log-site-prelaunch-audit/1.0' } });
  assert.equal(response.status, 200, `HTTP ${response.status}: ${url}`);
  return response.json();
}

const livePosts = await getJson(`${wordpressOrigin}/wp-json/wp/v2/posts?status=publish&per_page=100&_fields=id,slug,link,modified_gmt,title,content`);
const livePages = await getJson(`${wordpressOrigin}/wp-json/wp/v2/pages?status=publish&per_page=100&_fields=id,slug,link,modified_gmt,title,content`);
assert.equal(livePosts.length, 19, 'WordPress public post count changed');

const snapshotById = new Map([...sourcePosts, ...sourcePages].map((item) => [item.id, item]));
const liveDiffRows = [];
for (const live of [...livePosts, ...livePages.filter((item) => fixedPages.some((page) => page.wp_id === item.id))]) {
  const saved = snapshotById.get(live.id);
  const sameSlug = live.slug === saved?.slug;
  const sameModified = live.modified_gmt === saved?.modified_gmt;
  const sameContent = digest(live.content.rendered) === digest(saved?.content?.rendered);
  liveDiffRows.push({ wordpress_id: live.id, type: sourcePosts.some((item) => item.id === live.id) ? 'post' : 'page', slug: live.slug, same_slug: sameSlug, same_modified_gmt: sameModified, same_content_hash: sameContent, status: sameSlug && sameModified && sameContent ? 'matched' : 'changed' });
}
assert.equal(liveDiffRows.filter((row) => row.type === 'post').length, 19);
assert.equal(liveDiffRows.filter((row) => row.type === 'page').length, 3);
assert.ok(liveDiffRows.every((row) => row.status === 'matched'), 'WordPress content changed after Phase 3 snapshot');
writeCsv('docs/migration/wordpress-live-diff.csv', ['wordpress_id', 'type', 'slug', 'same_slug', 'same_modified_gmt', 'same_content_hash', 'status'], liveDiffRows);

const routes = [
  { path: '/', type: 'home' },
  { path: '/articles/', type: 'archive' },
  { path: '/category/', type: 'category-index' },
  ...['career', 'money', 'relocation'].map((slug) => ({ path: `/category/${slug}/`, type: 'category' })),
  ...inventory.map((post) => ({ path: `/${post.slug}/`, type: 'article', post })),
  ...fixedPages.map((page) => ({ path: decodeURIComponent(new URL(page.url).pathname), type: 'fixed-page' })),
  { path: '/phase-4-known-missing/', type: '404' },
];

const pageRows = [];
for (const route of routes) {
  const response = await fetch(`${previewOrigin}${encodeURI(route.path)}`, { redirect: 'manual', headers: { 'User-Agent': 'personal-log-site-prelaunch-audit/1.0' } });
  const html = await response.text();
  const expectedStatus = route.type === '404' ? 404 : 200;
  const title = match(html, /<title>([\s\S]*?)<\/title>/i);
  const description = match(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const canonical = match(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const h1Count = count(html, /<h1(?:\s|>)/gi);
  const noindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
  const xRobots = response.headers.get('x-robots-tag') || '';
  const ogComplete = ['og:title', 'og:description', 'og:url', 'og:image'].every((property) => html.includes(`property="${property}"`));
  const twitterComplete = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'].every((name) => html.includes(`name="${name}"`));
  const blogPosting = /"@type":"BlogPosting"/.test(html);
  const breadcrumb = /"@type":"BreadcrumbList"/.test(html);
  const internalLinks = [...html.matchAll(/href="(\/[^"]*)"/g)].map((item) => item[1]);
  const contentComparison = route.type === 'article' ? 'snapshot_matched_and_conversion_passed' : route.type === 'fixed-page' ? 'snapshot_matched' : 'not_applicable';
  const checks = [
    response.status === expectedStatus,
    title.length > 0,
    description.length > 0,
    h1Count === 1,
    canonical.startsWith(`${previewOrigin}/`),
    noindex,
    xRobots.includes('noindex'),
    ogComplete,
    twitterComplete,
    route.type !== 'article' || (blogPosting && breadcrumb),
    route.type !== 'article' || html.includes(route.post.featured_image) || html.includes(encodeURI(route.post.featured_image)),
    route.type !== 'article' || route.post.category_slugs.every((slug) => html.includes(`/category/${slug}/`)),
  ];
  pageRows.push({
    path: route.path, type: route.type, http_status: response.status, title_present: title.length > 0,
    meta_description_present: description.length > 0, h1_count: h1Count, canonical,
    noindex_meta: noindex, x_robots_noindex: xRobots.includes('noindex'), og_complete: ogComplete,
    twitter_card_complete: twitterComplete, blogposting_jsonld: route.type === 'article' ? blogPosting : 'not_applicable',
    breadcrumb_jsonld: route.type === 'article' ? breadcrumb : 'not_applicable',
    featured_image: route.type === 'article' ? (html.includes(route.post.featured_image) || html.includes(encodeURI(route.post.featured_image))) : 'not_applicable',
    body_image_count: route.type === 'article' ? route.post.body_images.length : 'not_applicable',
    internal_link_count: internalLinks.length,
    previous_link: route.type === 'article' ? (/rel="prev"/.test(html) || Number(route.post.title.match(/#(\d+)/)?.[1]) === 1) : 'not_applicable',
    next_link: route.type === 'article' ? (/rel="next"/.test(html) || Number(route.post.title.match(/#(\d+)/)?.[1]) === 19) : 'not_applicable',
    category_links: route.type === 'article' ? route.post.category_slugs.every((slug) => html.includes(`/category/${slug}/`)) : 'not_applicable',
    content_comparison: contentComparison, status: checks.every(Boolean) ? 'passed' : 'failed',
  });
}
writeCsv('docs/migration/prelaunch-page-audit.csv', Object.keys(pageRows[0]), pageRows);
const failedPages = pageRows.filter((row) => row.status !== 'passed');
assert.ok(failedPages.length === 0, `One or more preview page checks failed: ${failedPages.map((row) => row.path).join(', ')}`);

const imageUrls = [...new Set(inventory.flatMap((post) => [post.featured_image, ...post.body_images]).filter(Boolean))];
const imageRows = [];
for (const url of imageUrls) {
  const response = await fetch(encodeURI(url), { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': 'personal-log-site-prelaunch-audit/1.0' } });
  imageRows.push({ url, http_status: response.status, content_type: response.headers.get('content-type') || '', content_length: response.headers.get('content-length') || '', status: response.ok ? 'passed' : 'failed' });
}
assert.equal(imageUrls.length, 26, 'Expected 19 featured + 7 body image references');
assert.ok(imageRows.every((row) => row.status === 'passed'), 'One or more WordPress image URLs failed');
writeCsv('docs/migration/image-http-audit.csv', ['url', 'http_status', 'content_type', 'content_length', 'status'], imageRows);

console.log(`Prelaunch audit passed: ${pageRows.length} preview routes, ${liveDiffRows.length} WordPress records, ${imageRows.length} unique images.`);
