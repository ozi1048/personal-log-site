# Agent instructions

## Start here

Before changing this repository, read in full:

1. `PROJECT.md`
2. `ARCHITECTURE.md`
3. `DESIGN.md` when present
4. `README.md`
5. Every task-relevant file under `docs/migration/`

Inspect the current branch and working tree before editing. Repository state overrides remembered conversation context.

## Non-negotiable safeguards

- Do not change DNS, nameservers, custom domains, production Worker routes, or the live WordPress site without explicit user approval.
- Do not deploy to production merely because a build succeeds.
- Do not commit secrets, API tokens, Formspree credentials, Turnstile secret keys, or local environment files.
- Preserve all established article slugs and trailing-slash URLs unless a task explicitly authorizes a migration.
- Preserve article body copy and factual meaning during infrastructure or design-only work.
- Do not replace existing images or alt text without checking the relevant migration inventories and the rendered result.
- Do not add a CMS, database, framework, or dependency unless the requested change needs it.

## Implementation rules

- Use the existing Astro content collections, layouts, and components.
- Keep global visual tokens and shared rules in `src/styles/global.css`; avoid page-local duplication.
- Keep site identity and category metadata in `src/config/site.ts`.
- Maintain semantic HTML, visible keyboard focus, useful alternative text, sufficient contrast, and reduced-motion behavior.
- Design mobile-first and verify both narrow and wide layouts.
- Keep preview and production-candidate builds non-indexable.
- Treat public `PUBLIC_*` values as client-visible; never mistake the prefix for secret storage.
- Prefer the smallest coherent change that satisfies the task.

## Content rules

- Maintain the author's candid, restrained first-person tone.
- Do not turn personal records into generic self-help, sales copy, or exaggerated success narratives.
- Keep the three primary content threads and their canonical slugs: `career`, `money`, and `relocation`.
- New posts belong under `src/content/posts/{category}/`, but their public URL is determined by frontmatter `slug`.
- When changing frontmatter or content structure, validate every affected entry through Astro's schema.

## Design work

- Treat `DESIGN.md` as the visual source of truth once approved.
- Adapt reference systems to CalmaPercorso; do not copy another company's branding, logo, proprietary font, or signature trade dress.
- Retain the site's editorial identity: quiet, honest, photographic, and readable.
- Do not sacrifice Japanese long-form readability for oversized display type or excessive animation.
- Preserve the hierarchy of hero, three category threads, recent records, chronology, and about section unless the task explicitly changes information architecture.

## Verification

For ordinary code or content changes, run:

```bash
pnpm check
pnpm build
pnpm test
```

Run the relevant candidate/production validation scripts when configuration or release behavior changes. Visually inspect changed pages at mobile and desktop widths. Report commands run, failures, and any checks that require external credentials or live infrastructure.

## Git and delivery

- Keep unrelated user changes intact.
- Use focused commits and explain behavioral or operational impact.
- Do not claim a deployment, DNS switch, or production change unless its resulting state was verified.
- If a requested action could affect the live domain, stop at a reviewed candidate unless the user explicitly authorized the live change.
