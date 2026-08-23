# personal-log-site

`calmapercorso.com` のWordPress過去ログを、Markdown + Astro + Cloudflare Workersへ段階移行するプロジェクトです。

Phase 2では、本番WordPressを変更せず、4記事のサンプルでpreviewサイトを構築しています。

## 開発

```bash
pnpm install
pnpm dev
```

## build / test

```bash
pnpm build
pnpm test
```

## 環境変数

`.env.example` を参照してください。

- `PUBLIC_SITE_URL`: canonical、sitemap、RSSに使うpreview origin
- `PUBLIC_DEPLOYMENT_ENV`: previewでは`preview`。全ページがnoindexになる
- `PUBLIC_GA_MEASUREMENT_ID`: 将来のGA4設定口。previewでは空のままにする

## コンテンツ

記事は `src/content/posts/{category}/{slug}.md` で管理します。複数カテゴリはfrontmatterの`categories`配列で保持します。URLはフォルダ位置ではなく`slug`から `/{slug}/` を生成します。

## デプロイ

Cloudflare Workers Static Assetsとして`dist/`を配信します。DNSや`calmapercorso.com`のroute設定は使用しません。

```bash
PUBLIC_SITE_URL=https://personal-log-site-preview.cloudflare-migration-plan.workers.dev PUBLIC_DEPLOYMENT_ENV=preview pnpm deploy
```

Phase 1調査結果は [`docs/migration/phase-1-site-audit.md`](docs/migration/phase-1-site-audit.md) を参照してください。
