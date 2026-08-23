import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export const byNewest = (a: Post, b: Post) =>
  b.data.publishedAt.getTime() - a.data.publishedAt.getTime();

export const byLogNumber = (a: Post, b: Post) => a.data.logNumber - b.data.logNumber;

export const publishedPosts = (posts: Post[]) => posts.filter((post) => !post.data.draft);

export const postPath = (post: Post) => `/${post.data.slug}/`;

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

export function adjacentPosts(posts: Post[], current: Post) {
  const ordered = [...posts].sort(byLogNumber);
  const index = ordered.findIndex((post) => post.id === current.id);
  return {
    previous: index > 0 ? ordered[index - 1] : undefined,
    next: index < ordered.length - 1 ? ordered[index + 1] : undefined,
  };
}
