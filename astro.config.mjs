import { defineConfig } from 'astro/config';
const site = process.env.PUBLIC_SITE_URL || 'https://personal-log-site-preview.cloudflare-migration-plan.workers.dev';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
