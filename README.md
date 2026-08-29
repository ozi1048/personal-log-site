# personal-log-site

`calmapercorso.com` のWordPress過去ログを、Markdown + Astro + Cloudflare Workersへ段階移行するプロジェクトです。

Phase 4まで完了し、本番WordPressを変更せず、公開19記事・固定ページ3件を移行したpreviewサイトと本番切り替え計画を構築しています。本番DNS・本番domain routeは未変更です。

## 開発

```bash
pnpm install
pnpm dev
```

## build / test

```bash
pnpm build
pnpm test
pnpm test:production
pnpm test:production-candidate:http
pnpm audit:prelaunch
```

## 環境変数

`.env.example` を参照してください。

- `PUBLIC_SITE_URL`: canonical、sitemap、RSSに使うpreview origin
- `PUBLIC_DEPLOYMENT_ENV`: previewでは`preview`。全ページがnoindexになる
- `PUBLIC_GA_MEASUREMENT_ID`: 将来のGA4設定口。previewでは空のままにする
- `PUBLIC_CONTACT_FORM_ENABLED`: productionで`true`の場合だけFormspree送信を有効化する
- `PUBLIC_TURNSTILE_SITE_KEY`: Turnstileの公開Site Key。Secret Keyはクライアント環境変数やGitHubへ置かない

`production-candidate`はFormspree + Turnstileを有効にしつつ、meta robots、`X-Robots-Tag`、robots.txtでnoindexを維持する。候補Workerは本番routeを持たない別名を使う。

```bash
pnpm test:candidate
pnpm deploy:candidate
```

実送信前に、Turnstile allowed hostnameとFormspree domain制限へ候補の`workers.dev` hostnameを一時追加する。本番切り替え後は候補hostnameを削除し、`calmapercorso.com`だけに戻す。

## コンテンツ

記事は `src/content/posts/{category}/{slug}.md` で管理します。複数カテゴリはfrontmatterの`categories`配列で保持します。URLはフォルダ位置ではなく`slug`から `/{slug}/` を生成します。

## デプロイ

PreviewはCloudflare Workers Static Assetsとして`dist/`を配信します。次のコマンドはpreview Workerだけを更新し、DNSや`calmapercorso.com`のroute設定は使用しません。

```bash
PUBLIC_SITE_URL=https://personal-log-site-preview.cloudflare-migration-plan.workers.dev PUBLIC_DEPLOYMENT_ENV=preview pnpm deploy
```

Phase 4の検証結果は [`docs/migration/phase-4-prelaunch-validation.md`](docs/migration/phase-4-prelaunch-validation.md)、実行前チェックは [`docs/migration/prelaunch-checklist.md`](docs/migration/prelaunch-checklist.md) を参照してください。本番切り替えは明示的な許可があるまで実行しません。

Route未接続のproduction候補は`wrangler.production.jsonc`で別名管理します。`pnpm deploy:production-candidate`は本番用canonical、GA4、Contact設定を含むStatic Assetsをworkers.devへdeployしますが、`calmapercorso.com`のRouteやCustom Domainは設定しません。
