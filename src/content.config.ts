import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const categories = ['career', 'money', 'relocation'] as const;

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().min(20),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    categories: z.array(z.enum(categories)).min(1),
    featuredImage: z.url(),
    canonical: z.url(),
    wordpressId: z.number().int().positive(),
    logNumber: z.number().int().positive(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
