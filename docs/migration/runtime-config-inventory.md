# Runtime configuration inventory

Updated: 2026-09-13 (Asia/Tokyo)

This document records which parts of the personal-log-site migration are reproducible from GitHub and which settings intentionally remain in external services. It is a recovery/cutover reference; it must not contain passwords or secret keys.

## GitHub is the source of truth for

- Astro application source code and site UI
- 19 migrated article Markdown files and frontmatter
- Fixed pages, category pages, routing, SEO metadata, sitemap, RSS, structured data and robots behavior
- Featured-image assignments and image assets committed to the repository
- Preview / production-candidate / production build configuration files and scripts
- Contact form client implementation (Formspree endpoint usage, validation, Turnstile token handling, reset behavior)
- Public Turnstile Site Key only; this is not a secret
- GA4 Measurement ID used by the production build
- Migration documentation, DNS baseline/snapshots, prelaunch checks, rollback plan, NS-change readiness, image audits and featured-image plan
- Cloudflare Workers routing/cutover design, including the temporary `/wp-content/uploads/*` no-script exclusion required while legacy WordPress images still come from Xserver

## External service configuration that is NOT fully stored in GitHub

### Cloudflare

Stored externally in the Cloudflare account:

- Zone ownership and account access
- Current DNS zone state and authoritative nameserver delegation after cutover
- Worker deployments and versions already deployed to Cloudflare
- Worker Routes actually attached to `calmapercorso.com`
- Turnstile widget server-side configuration, including allowed hostnames
- Turnstile Secret Key
- Any future R2 buckets, object data, bindings, secrets or account-level settings

GitHub stores the intended routing/build configuration and migration documentation, but Cloudflare remains the runtime source of truth for live account state.

### Formspree

Stored externally in Formspree:

- Form project/account ownership
- CAPTCHA/Turnstile integration state
- Turnstile Secret Key entered in Formspree
- Restrict-to-domain setting for `calmapercorso.com`
- Email workflow destination and notification behavior
- Inbox/submission history

The Secret Key must never be copied into GitHub, docs or client-side environment variables.

### Google Analytics 4

- Measurement ID is documented/configured for the production build in the repository
- GA4 property ownership, data history, Realtime/DebugView state and account permissions remain in Google Analytics

### Google Search Console

- Migration/verification strategy is documented in GitHub
- Search Console property ownership, verification state, sitemap history and indexing state remain in Google
- DNS TXT verification must exist in the authoritative DNS zone after the NS change

### Xserver / WordPress

Until R2 migration and final retirement:

- Legacy WordPress installation and database remain on Xserver
- Existing `/wp-content/uploads/` images remain on Xserver
- Xserver backup archives and SQL backups are kept outside GitHub
- WordPress/Xserver account credentials are not stored in GitHub
- Historical DNS screenshots/exports are recovery references only

### Domain registration

- `calmapercorso.com` registration and nameserver-change authority remain in the Xserver domain management account
- Registrar/account credentials must not be stored in GitHub

## Secrets that must never be committed

- Turnstile Secret Key
- Formspree-side secret/CAPTCHA credentials
- Cloudflare API tokens or OAuth credentials
- Xserver login password
- Domain-management password
- WordPress passwords
- Database passwords from `wp-config.php`
- Google account credentials
- GitHub personal access tokens

## Recovery model

The repository plus access to the external service accounts is sufficient to reconstruct the Cloudflare version of the site.

Minimum recovery set:

1. GitHub repository `ozi1048/personal-log-site`
2. Cloudflare account access
3. Formspree account access
4. Google Analytics/Search Console account access
5. Xserver/domain account access until legacy WordPress images are migrated to R2 and Xserver is retired
6. Local/off-site WordPress files + SQL backup captured before NS cutover

## Current cutover model

1. GitHub `main` contains the Cloudflare/Astro site and the new documentary-style featured images.
2. Cloudflare Preview/production candidate can display the new site before production DNS/routing changes.
3. `calmapercorso.com` remains on WordPress until the nameserver and Worker Route cutover steps are explicitly executed.
4. During the first production stage, WordPress/Xserver stays available for rollback and image serving.
5. `/wp-content/uploads/*` must bypass the Worker while those image URLs still point at Xserver.
6. After stable production operation, migrate remaining image dependencies to R2, verify zero legacy image references, monitor, then retire Xserver.

## Do not delete before final Xserver retirement

- WordPress database backup
- `wp-content` backup
- `wp-config.php` backup (store securely, not in GitHub)
- Xserver DNS snapshot
- Xserver account access
- Domain-management access
- Current rollback documentation

## Final retirement gate

Xserver should only be cancelled after all of the following are true:

- Cloudflare site is stable in production
- Existing URLs and redirects are verified
- GA4 is receiving production traffic once per page view
- Search Console ownership and indexing are healthy
- Contact form works on the production hostname
- All legacy `/wp-content/uploads/` references have been migrated or removed
- R2/media delivery is verified
- The no-script Xserver image route is no longer needed
- A monitoring window has passed without rollback needs
