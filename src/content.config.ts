import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const categories = ['career', 'money', 'relocation'] as const;
const migratedImage = z.object({
  url: z.url(),
  alt: z.string(),
  caption: z.string(),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().min(1),
    seoTitle: z.string().min(1),
    sourceHtmlTitle: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().min(20),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    categories: z.array(z.enum(categories)).min(1),
    featuredImage: z.union([z.url(), z.string().startsWith('/')]),
    featuredImageAlt: z.string().min(1),
    canonical: z.url(),
    wordpressId: z.number().int().positive(),
    logNumber: z.number().int().positive(),
    sourceInternalLinks: z.array(z.url()).default([]),
    bodyImages: z.array(migratedImage).default([]),
    conversionWarnings: z.array(z.string()).default([]),
    sourceHtmlFile: z.string().min(1),
    draft: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().min(1),
    path: z.string().startsWith('/').endsWith('/'),
    description: z.string().min(20),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    canonical: z.url(),
    wordpressId: z.number().int().positive(),
    eyebrow: z.string().min(1),
    conversionWarnings: z.array(z.string()).default([]),
    sourceHtmlFile: z.string().min(1),
  }),
});

export const collections = { posts, pages };
