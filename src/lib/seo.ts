import { SITE } from '../config/site';

export const isPreview = import.meta.env.PUBLIC_DEPLOYMENT_ENV !== 'production';

export function canonicalFor(pathname: string, sourceCanonical?: string): string {
  if (!isPreview && sourceCanonical) return sourceCanonical;
  const origin = import.meta.env.SITE || import.meta.env.PUBLIC_SITE_URL || 'https://personal-log-site-preview.cloudflare-migration-plan.workers.dev';
  return new URL(pathname, origin).toString();
}

export function articleSchema(input: {
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt: Date;
  updatedAt: Date;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    url: input.url,
    mainEntityOfPage: input.url,
    image: [input.image],
    datePublished: input.publishedAt.toISOString(),
    dateModified: input.updatedAt.toISOString(),
    author: { '@type': 'Person', name: SITE.author },
    publisher: { '@type': 'Organization', name: SITE.name },
    inLanguage: SITE.language,
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
