import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const productionOrigin = (process.env.PRODUCTION_ORIGIN || 'https://calmapercorso.com').replace(/\/$/, '');
const inventory = JSON.parse(readFileSync(resolve(process.cwd(), 'docs/migration/phase-1-content-inventory.json'), 'utf8'));
const sourceOrigin = 'https://calmapercorso.com';
const urls = [...new Set(inventory.flatMap((post) => [post.featured_image, ...post.body_images]).filter(Boolean))];

assert.equal(urls.length, 26, `Expected 26 image URLs, found ${urls.length}`);

const failures = [];
for (const sourceUrl of urls) {
  const pathname = new URL(sourceUrl, sourceOrigin).pathname;
  const testUrl = `${productionOrigin}${pathname}`;
  try {
    const response = await fetch(testUrl, {
      redirect: 'follow',
      headers: { 'User-Agent': 'personal-log-site-production-image-check/1.0' },
    });
    const bytes = new Uint8Array(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || '';
    const passed = response.status === 200 && contentType.toLowerCase().startsWith('image/') && bytes.byteLength > 0;
    console.log(`${passed ? 'PASS' : 'FAIL'} ${response.status} ${contentType || '-'} ${bytes.byteLength} ${pathname}`);
    if (!passed) failures.push({ testUrl, status: response.status, contentType, bytes: bytes.byteLength });
  } catch (error) {
    failures.push({ testUrl, error: error.message });
    console.log(`FAIL request-error ${pathname}: ${error.message}`);
  }
}

assert.equal(failures.length, 0, `Image verification failed:\n${JSON.stringify(failures, null, 2)}`);
console.log(`Production image verification passed: ${urls.length}/${urls.length} images via ${productionOrigin}.`);
