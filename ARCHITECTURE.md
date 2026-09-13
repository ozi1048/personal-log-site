# Architecture

## Overview

CalmaPercorso is a statically generated Astro site deployed through Cloudflare Workers Static Assets.

```text
Markdown content + site configuration
                ↓
        Astro content collections
                ↓
      pages, layouts, components
                ↓
       static HTML, CSS, RSS, XML
                ↓
    Cloudflare Workers Static Assets
```

The runtime serves generated assets. There is no application database and no server-side content API.

## Major areas

### Content

- `src/content/posts/`: migrated article Markdown grouped by primary category.
- `src/content/pages/`: profile, contact, and privacy content.
- `src/content.config.ts`: Astro collection schemas and validation.
- `src/config/site.ts`: site identity, canonical production origin, and category metadata.

### Rendering

- `src/pages/`: route entry points, including dynamic article and category routes.
- `src/layouts/`: shared page shells for articles and fixed pages.
- `src/components/`: reusable navigation, cards, timeline, images, and contact UI.
- `src/styles/global.css`: global tokens and component/layout styles.

Article URLs are flat (`/{slug}/`) even though source files are grouped into category folders.

### SEO and discovery

- `src/lib/seo.ts`: metadata helpers.
- `src/pages/sitemap.xml.ts`: generated sitemap.
- `src/pages/rss.xml.ts`: generated feed.
- `src/pages/robots.txt.ts`: environment-aware crawler rules.
- `astro.config.mjs`: canonical site origin, trailing-slash behavior, and response headers.

Preview and production-candidate builds must emit `noindex` controls. Only the production environment may be indexable.

### Contact form

The contact page uses a client-side Formspree submission flow with Cloudflare Turnstile. Public identifiers may be exposed through `PUBLIC_*` configuration. Secret keys must remain outside client code and Git.

### Deployment environments

| Environment | Build output | Purpose | Search indexing |
|---|---|---|---|
| Preview | `dist/` | Routine review | Disabled |
| Production candidate | `dist-production/` | Final checks using production-like configuration, without a live domain route | Disabled |
| Production | `dist-production/` | `calmapercorso.com` | Enabled |

- `wrangler.jsonc` targets the preview Worker.
- `wrangler.production.jsonc` targets the production-named Worker configuration.
- DNS, nameserver, custom-domain, and Worker route changes are separate infrastructure actions and are never implied by a code deployment.

## Build and validation

Primary commands:

- `pnpm check`: Astro and TypeScript validation.
- `pnpm build`: preview/static build.
- `pnpm test`: build and featured-image checks.
- `pnpm test:candidate`: production-candidate build and contact checks.
- `pnpm test:production`: production build validation.
- `pnpm audit:prelaunch`: full prelaunch audit.

Migration and release-specific utilities live in `scripts/`; their reports and operational plans live in `docs/migration/`.

## Change boundaries

- Content migration, visual design, contact delivery, and production cutover are separate concerns.
- Visual work should normally change components/styles, not frontmatter, slugs, or article copy.
- Infrastructure work should not silently alter the public site or DNS.
- Generated build directories and local secrets are not source files.
