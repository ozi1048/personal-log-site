import { mkdir, readdir } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import sharp from 'sharp';

const sourceDirectory = process.argv.find((argument, index) => index >= 2 && argument !== '--');
if (!sourceDirectory) {
  throw new Error('Usage: pnpm prepare:featured-images -- <source-directory>');
}

const outputDirectory = resolve('public/images/posts');
await mkdir(outputDirectory, { recursive: true });

const files = (await readdir(sourceDirectory)).filter((file) => file.toLowerCase().endsWith('.png'));
for (const file of files) {
  const slug = basename(file, '.png');
  await sharp(resolve(sourceDirectory, file))
    .resize(1600, 900, { fit: 'cover', position: 'centre' })
    .webp({ quality: 78, effort: 6 })
    .toFile(resolve(outputDirectory, `${slug}.webp`));
}

console.log(`Prepared ${files.length} WebP featured images in ${outputDirectory}`);
