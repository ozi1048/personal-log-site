import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const postsDirectory = resolve(root, 'src/content/posts');
const markdownFiles = readdirSync(postsDirectory, { recursive: true })
  .filter((file) => typeof file === 'string' && file.endsWith('.md'));

assert.equal(markdownFiles.length, 19, 'Expected 19 Markdown posts');

const imagePaths = new Set();
for (const file of markdownFiles) {
  const source = readFileSync(resolve(postsDirectory, file), 'utf8');
  const slug = source.match(/^slug:\s*["']([^"']+)["']/m)?.[1];
  const imagePath = source.match(/^featuredImage:\s*["']([^"']+)["']/m)?.[1];
  const alt = source.match(/^featuredImageAlt:\s*["']([^"']+)["']/m)?.[1];

  assert.ok(slug, `Missing slug: ${file}`);
  assert.equal(imagePath, `/images/posts/${slug}.webp`, `Unexpected featured image path: ${file}`);
  assert.ok(alt?.trim(), `Missing featured image alt: ${file}`);
  assert.ok(!imagePaths.has(imagePath), `Featured image reused: ${imagePath}`);
  imagePaths.add(imagePath);

  const absolutePath = resolve(root, 'public', imagePath.slice(1));
  assert.ok(existsSync(absolutePath), `Featured image file missing: ${imagePath}`);
  assert.ok(statSync(absolutePath).size <= 350_000, `Featured image exceeds 350 KB: ${imagePath}`);

  const metadata = await sharp(absolutePath).metadata();
  assert.equal(metadata.format, 'webp', `Featured image is not WebP: ${imagePath}`);
  assert.equal(metadata.width, 1600, `Unexpected image width: ${imagePath}`);
  assert.equal(metadata.height, 900, `Unexpected image height: ${imagePath}`);
}

assert.equal(imagePaths.size, 19, 'Expected 19 unique featured images');
console.log('Verified 19 unique WebP featured images, 16:9 dimensions, file size, paths and alt text.');
