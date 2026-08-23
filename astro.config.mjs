import { defineConfig } from 'astro/config';
import { writeFile } from 'node:fs/promises';
const site = process.env.PUBLIC_SITE_URL || 'https://personal-log-site-preview.cloudflare-migration-plan.workers.dev';
const isPreview = process.env.PUBLIC_DEPLOYMENT_ENV !== 'production';
const headers = `/*\n${isPreview ? '  X-Robots-Tag: noindex, nofollow, noarchive, nosnippet\n' : ''}  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n`;

export default defineConfig({
  site,
  outDir: process.env.BUILD_OUT_DIR || './dist',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [{
    name: 'environment-headers',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        await writeFile(new URL('_headers', dir), headers, 'utf8');
      },
    },
  }],
});
