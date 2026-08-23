import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../config/site';
import { byNewest, publishedPosts } from '../lib/content';

export async function GET(context: { site?: URL }) {
  const posts = publishedPosts(await getCollection('posts')).sort(byNewest);
  return rss({
    title: `${SITE.name} — 過去と向き合うための記録`,
    description: SITE.description,
    site: context.site ?? new URL('https://personal-log-site-preview.cloudflare-migration-plan.workers.dev'),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/${post.data.slug}/`,
      categories: post.data.categories,
    })),
    customData: '<language>ja</language>',
  });
}
