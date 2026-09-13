# CalmaPercorso Design System

## Direction

CalmaPercorso is a quiet, photographic personal archive. Its visual language combines the warm editorial restraint of the Claude reference with the generous spacing and image confidence of the Apple reference, while retaining CalmaPercorso's own identity.

This is inspiration, not imitation. Do not copy another company's logo, proprietary font, distinctive illustration, or branded component.

## Experience goals

- Honest rather than aspirational.
- Calm rather than empty.
- Editorial rather than app-like.
- Personal rather than corporate.
- Photographic, but always readable.
- Designed for long Japanese reading sessions on mobile.

The interface should feel like opening a carefully kept field journal: natural paper, dark ink, one restrained rust accent, and photographs that carry memory rather than decoration.

## Color system

| Role | Token | Value | Use |
|---|---|---:|---|
| Paper | `--paper` | `#f4f1e9` | Main canvas |
| Paper deep | `--paper-deep` | `#e9e4d8` | Quiet section and note backgrounds |
| White | `--white` | `#fffdf8` | Cards and elevated reading surfaces |
| Ink | `--ink` | `#1d292b` | Primary text and dark sections |
| Muted ink | `--muted` | `#68716f` | Metadata and secondary copy |
| Rust | `--rust` | `#a0442d` | Eyebrows, focus, restrained emphasis |
| Rust dark | `--rust-dark` | `#783222` | Hover and active states |
| Line | `--line` | `#d5d0c5` | Hairlines and structural dividers |

Rules:

- Rust is a signal, not a fill color for large areas.
- Avoid bright gradients, neon colors, pure-black page backgrounds, and multiple competing accents.
- Photographs may introduce natural blue, green, and brown; UI colors should remain restrained around them.
- Text and interactive states must meet WCAG AA contrast.

## Typography

- Japanese editorial headings and article prose: a readable Mincho/serif stack.
- Navigation, metadata, labels, forms, and utilities: a neutral system sans-serif stack.
- Never depend on a proprietary reference-brand font.
- Use large display type only where the copy remains natural in Japanese.

Recommended hierarchy:

| Role | Size | Weight | Line height |
|---|---:|---:|---:|
| Home hero | `clamp(1.72rem, 5vw, 3.4rem)` | 500–600 | 1.45–1.62 |
| Page title | `clamp(2.3rem, 5vw, 3.6rem)` | 600 | 1.3 |
| Article title | `clamp(1.8rem, 3.6vw, 2.9rem)` | 500 | 1.55 |
| Section heading | `clamp(1.7rem, 4vw, 2.5rem)` | 600 | 1.45 |
| Article body | `1rem–1.1rem` | 400 | 2.05–2.2 |
| Metadata | `.68rem–.78rem` | 600–700 | 1.6 |

Use uppercase English eyebrows sparingly as navigational markers. The Japanese title remains the primary message.

## Layout and spacing

- Reading width: approximately 660–760px.
- General content width: approximately 1180px.
- Use generous vertical sections, typically 64–110px on desktop and 48–72px on mobile.
- Prefer hairline dividers and whitespace over boxed containers.
- Align content to a clear grid, while allowing one large photograph to create the page's visual anchor.
- Keep the homepage order: hero, three threads, recent records, theme chronology, about.

## Photography

- Prefer real or realistic images of roads, mountains, stations, rooms, tools, receipts, and lived environments.
- Images should feel observational, not like glossy advertising.
- Favor natural light, subdued saturation, depth, and a visible sense of place.
- Do not add embedded text or watermarks.
- Preserve meaningful alt text. Decorative images use empty alt text.
- Maintain the established 16:9 article-image system unless a deliberate layout change is approved.

## Components

### Header and navigation

- Quiet and compact; it should not compete with the hero or article title.
- Use text links, visible focus styles, and simple mobile disclosure.
- Avoid floating glass navigation, oversized pills, and app-dashboard patterns.

### Hero

- One cinematic photograph with a controlled dark scrim.
- Place the title where both Japanese line breaks and the photograph remain legible.
- The supporting statement should be brief and factual.
- Avoid multiple CTAs, animation, carousels, or decorative gradients.

### Category entrances

- Treat the three categories as equal narrative threads.
- Photography supplies differentiation; typography and spacing stay consistent.
- Hover may use a slight image scale or tonal shift, never dramatic motion.

### Article cards

- Image, sequence/category metadata, title, excerpt, and date form the hierarchy.
- Use little or no shadow. Prefer whitespace or a one-pixel border.
- Titles may vary in length without breaking the grid.

### Article pages

- Optimize for uninterrupted reading.
- Use generous paragraph spacing and clear H2/H3 separation.
- Tables must scroll horizontally on narrow screens.
- Quotes and notes use paper-depth contrast or a rust hairline, not loud callouts.

### Forms and buttons

- Controls use square or subtly rounded corners; avoid universal pills.
- Primary actions use dark ink or rust-dark fills.
- Minimum touch target: 44px.
- Focus must remain clearly visible.

## Motion

- Motion is optional and short: 150–250ms.
- Use only for hover feedback, menu disclosure, or gentle image treatment.
- Respect `prefers-reduced-motion` and never animate the reading body.

## Responsive behavior

- Build mobile-first.
- Collapse multi-column category and article grids to one column.
- Keep hero text readable without relying on a precise crop.
- Avoid horizontal page scrolling; only comparison tables may scroll inside their container.
- Do not reduce article text below a comfortable Japanese reading size.

## Do

- Let personal writing and photographs carry the emotion.
- Use warm neutral surfaces and precise spacing.
- Keep navigation predictable and URLs unchanged.
- Reuse existing components and CSS tokens.
- Verify desktop and mobile rendering after every material visual change.

## Do not

- Turn the site into a SaaS landing page.
- Use glassmorphism, neon gradients, floating blobs, or excessive rounded cards.
- Add inspirational slogans that change the author's meaning.
- Make failure look glamorous or sensational.
- Copy Claude or Apple brand assets or trade dress.
- Trade readability for visual novelty.

## Agent implementation note

When implementing this file, preserve content, slugs, SEO metadata, contact behavior, preview noindex controls, and deployment boundaries. Prefer incremental changes to `src/styles/global.css` and existing components. Do not redesign working pages unless the task explicitly requests implementation.
