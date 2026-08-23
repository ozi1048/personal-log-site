import type { APIRoute } from 'astro';
import { isPreview } from '../lib/seo';

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://personal-log-site-preview.cloudflare-migration-plan.workers.dev');
  const body = isPreview
    ? `User-agent: *\nDisallow: /\n\nSitemap: ${new URL('/sitemap.xml', origin)}\n`
    : `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', origin)}\n`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
