import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { CATEGORIES } from '../config/site';
import { publishedPosts } from '../lib/content';

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

export const GET: APIRoute = async ({ site }) => {
  const origin = site ?? new URL('https://personal-log-site-preview.cloudflare-migration-plan.workers.dev');
  const posts = publishedPosts(await getCollection('posts'));
  const staticPaths = [
    '/',
    '/articles/',
    '/category/',
    ...Object.values(CATEGORIES).map((category) => `/category/${category.slug}/`),
    '/プロフィール/',
    '/privacy-policy-2/',
    '/お問い合わせ/',
  ];

  const staticEntries: Array<{ loc: string; lastmod?: string }> = staticPaths.map((path) => ({
    loc: new URL(path, origin).toString(),
  }));
  const postEntries = posts.map((post) => ({
    loc: new URL(`/${post.data.slug}/`, origin).toString(),
    lastmod: post.data.updatedAt.toISOString(),
  }));

  const urls = [...staticEntries, ...postEntries]
    .map((entry) => `<url><loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}</url>`)
    .join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
