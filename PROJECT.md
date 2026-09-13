# CalmaPercorso

## Purpose

CalmaPercorso (`calmapercorso.com`) is a Japanese personal editorial site that records career changes, debt, relocation, and the choices behind them without polishing them into success stories.

The repository is also the migration target for the former WordPress site. It preserves the public content and URLs while moving presentation and delivery to Markdown, Astro, and Cloudflare Workers.

## Product principles

- Preserve the author's first-person voice and chronological record.
- Make long-form Japanese articles calm, readable, and easy to follow.
- Treat failure and uncertainty honestly; do not rewrite them as motivational advice.
- Keep the three primary threads clear: career (`career`), debt (`money`), and relocation (`relocation`).
- Prefer a small, dependable static site over unnecessary application complexity.
- Preserve existing public URLs, metadata, images, and search visibility during migration.

## Current scope

- Homepage with a photographic hero, three category entrances, recent posts, and timeline links.
- Article, category, profile, contact, privacy, RSS, sitemap, robots, and 404 pages.
- Markdown content collections for 19 migrated posts and three fixed pages.
- Cloudflare Workers Static Assets deployments for preview, production candidate, and production.
- Formspree contact delivery protected by Cloudflare Turnstile.
- GA4 support in the production build.
- Build, content, featured-image, URL, and prelaunch validation scripts.

## Out of scope

- A database-backed CMS or authenticated authoring interface.
- Comments, memberships, user accounts, or community features.
- Automatic publication from AI-generated content.
- URL changes or broad editorial rewrites during infrastructure or visual work.
- DNS, nameserver, production route, or live-site changes without explicit user approval.

## Content model

Posts live in `src/content/posts/{category}/{slug}.md`. The folder is organizational; the canonical route is always derived from frontmatter as `/{slug}/`.

Important fields include the title, slug, publication dates, log number, categories, excerpt, featured image, and image alt text. A post may belong to more than one category.

Site-wide identity and category definitions live in `src/config/site.ts`.

## Definition of done

A change is complete when:

1. Existing content and URLs remain intact unless the task explicitly changes them.
2. `pnpm check`, `pnpm build`, and `pnpm test` pass.
3. Changed layouts are checked at desktop and mobile widths.
4. Preview/non-production output remains `noindex`.
5. No secret or private credential is committed.
6. Production infrastructure is unchanged unless explicitly authorized.

## Source of truth

For current behavior, trust the repository in this order:

1. Code and configuration on the active branch
2. `PROJECT.md`
3. `ARCHITECTURE.md`
4. `DESIGN.md`
5. `AGENTS.md`
6. `README.md` and migration records under `docs/migration/`

Historical migration documents describe what was observed or planned at that time. They do not override current code.
