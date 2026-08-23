# Phase 2: Cloudflare preview

- 実装日: 2026-08-23
- Preview: <https://personal-log-site-preview.cloudflare-migration-plan.workers.dev/>
- Cloudflare Worker: `personal-log-site-preview`
- 配信方式: Cloudflare Workers Static Assets
- 本番WordPress、DNS、`calmapercorso.com`のroute: 変更なし

## 構成

- Astro 6 static output
- Astro Content Collections + Markdown
- Cloudflare Workers Static Assets
- `@astrojs/rss`
- JavaScriptなしの基本UI（GA設定時を除く）

記事は `src/content/posts/{primary-category}/{slug}.md` に配置する。URLはファイルの場所ではなくfrontmatterの`slug`から `/{slug}/` を生成するため、カテゴリ変更が記事URLへ影響しない。

## Content Collection schema

必須フィールド:

- `title`
- `slug`
- `description`
- `publishedAt`
- `updatedAt`
- `categories`: `career | money | relocation` の配列
- `featuredImage`
- `canonical`: WordPress本番canonicalを移行元データとして保持
- `wordpressId`
- `logNumber`

`categories`は配列なので複数カテゴリを維持できる。`featuredImage`は `resolveImageUrl()` を介し、将来R2のURLへ差し替えられる。

## サンプル移行

4/19記事をMarkdownサンプルとして実装した。

- `first-career-change` (#1 / career)
- `bankruptcy-cancellation` (#6 / money + relocation)
- `ijyu-shienkin-failed` (#8 / relocation + career)
- `job-income-history` (#19 / career)

本文はPhase 2のルーティング・表示確認用抜粋であり、WordPress本文の完全移行・差分照合はPhase 3で行う。

## URL

- 記事: `/{slug}/`
- 記事一覧: `/articles/`
- カテゴリ一覧: `/category/`
- カテゴリ: `/category/{category-slug}/`
- プロフィール: `/%E3%83%97%E3%83%AD%E3%83%95%E3%82%A3%E3%83%BC%E3%83%AB/`
- プライバシー: `/privacy-policy-2/`
- お問い合わせ: `/%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B/`

301 redirectは追加していない。Cloudflareの`auto-trailing-slash`でフォルダ型HTMLを末尾スラッシュ付きURLとして配信する。

## Preview SEO

- すべてのHTMLに `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">`
- すべてのCloudflare応答に `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`
- `robots.txt`で `Disallow: /`
- canonicalはpreview origin自身を使用
- 本番WordPress canonicalはfrontmatterに保持するが、preview HTMLには出さない
- title / description / OGP / Twitter Card
- sitemap: `/sitemap.xml`
- RSS: `/rss.xml`
- 記事にBlogPosting JSON-LD
- 記事にBreadcrumbList JSON-LD

`PUBLIC_DEPLOYMENT_ENV=production`へ明示的に変更した場合だけ、frontmatterに保存した本番canonicalを使う。Phase 2では常に`preview`。

## Google Analytics

`PUBLIC_GA_MEASUREMENT_ID`があり、かつ`PUBLIC_DEPLOYMENT_ENV=production`の場合だけタグを出力する。previewではMeasurement IDを設定しておらず、Googleタグは出力されない。

## 検証

- `astro check`: 0 errors / 0 warnings / 0 hints
- `astro build`: 成功
- `pnpm test`: 17生成ルート、4サンプルslug、カテゴリ、固定ページ、404、SEOメタデータ、JSON-LD、RSS、sitemap、robots、noindexヘッダーを確認
- Cloudflare実環境: トップ・記事・カテゴリがHTTP 200、未知URLがカスタム404でHTTP 404
- レスポンスヘッダー: `X-Robots-Tag`を確認
- ブラウザ: desktopと375px幅を確認、横方向overflowなし

## Phase 3前の確認事項

1. 19記事の本文をWordPressから取得し、Markdown変換・差分確認する。
2. 固定ページ3件の正式本文を移行する。
3. WordPressショートコード、ブロック、埋め込み、内部リンクを変換ルール化する。
4. `debt-restructuring-failed`のdescriptionを手動決定する。
5. 画像をWordPress URLのまま本番移行するか、先にR2へ移すかを決める。
6. GA4 Measurement IDとSearch Consoleの現行所有権を確認する。
7. previewで全19 URLを照合した後にのみ、本番切替計画を作る。
