# Phase 3: WordPressコンテンツ完全移行・照合

- 実施日: 2026-08-23（Asia/Tokyo）
- 対象: <https://calmapercorso.com/>
- Preview: <https://personal-log-site-preview.cloudflare-migration-plan.workers.dev/>
- 取得方法: 公開WordPress REST APIへの読み取り専用GET
- 非変更確認: WordPress、DNS、本番ドメインroute、GA4、Search Console、R2には変更なし

## 移行結果

| 対象 | WordPress | Markdown | Astro生成 | 結果 |
|---|---:|---:|---:|---|
| 公開記事 | 19 | 19 | 19 | 一致 |
| 固定ページ | 3 | 3 | 3 | 一致 |
| 使用中カテゴリ | 3 | 3 | 3 | 一致 |
| 本文画像 | 7 | 7 | 7 URLを保持 | 一致 |
| 本文内内部リンク | 1 | 1 | 1 | pathを維持 |

Phase 2の暫定4記事を含む全19記事を、WordPress REST APIの正式本文へ置き換えた。記事本文は合計4,358行のMarkdownとなった。RESTレスポンスは再変換・差分確認用に `docs/migration/source/` へ保存している。

## 生成物

- `src/content/posts/`: 正式本文19記事
- `src/content/pages/`: 正式本文3固定ページ
- `scripts/migrate-wordpress.mjs`: REST取得、照合、Markdown変換、レポート生成
- `docs/migration/source/wordpress-posts.json`: 記事の変換元HTML
- `docs/migration/source/wordpress-pages.json`: 固定ページの変換元HTML
- `docs/migration/source/wordpress-categories.json`: カテゴリの変換元
- `docs/migration/content-conversion-report.csv`: 記事別変換結果
- `docs/migration/fixed-page-conversion-report.csv`: 固定ページ別変換結果
- `docs/migration/image-inventory.csv`: 本文画像URL・alt・caption・title
- `docs/migration/wordpress-html-elements.md`: 要素分類と変換方針

公開サイトから再取得して変換する場合は `pnpm migrate:wordpress`、保存済みスナップショットから再現する場合は `pnpm migrate:wordpress:snapshot` を使う。前者もGETのみで、WordPressへの書き込み処理は持たない。

## Content Collection

記事にはPhase 2の必須項目に加え、以下を保持する。

- `seoTitle`: 現行HTML titleを正規化した表示用SEO title
- `sourceHtmlTitle`: Phase 1で記録した変更前HTML title
- `sourceInternalLinks`: 変更前の本番内部リンクURL
- `bodyImages`: 本文画像のURL、alt、caption
- `conversionWarnings`: 記事別の変換警告
- `sourceHtmlFile`: 変換元スナップショット

固定ページもContent Collection化し、WordPress ID、公開・更新日、canonical、既存pathを管理する。

## 変換結果と警告

記事19件はすべて変換成功。ステータスは `passed` 14件、`warning` 3件、`needs_manual_review` 2件、未変換要素を含む記事は0件だった。

### 手動確認が必要な記事

1. `tokyo-taxi-driver-quit-reason`: AFFINGER関連記事カードを通常リンクへ変換した。リンク先、画像、タイトル、抜粋は保持しているが、カード外観は再現していない。
2. `debt-restructuring-failed`: WordPressでmeta descriptionが欠落していたため、本文をもとにMarkdown側だけへ新規作成した。

作成したdescription案:

> 任意整理で返済負担は軽くなったものの、途中で支払いを続けられず自力返済へ切り替えた7年間の記録。デビットカード生活、弁護士相談、返済ルールと立て直せなかった経緯を振り返ります。

### 公開前に確認を推奨する画像

WordPress側で本文画像7件すべてのaltが空だった。URLと空のaltは忠実に保持したが、アクセシビリティと画像SEOのため、次の4記事はPhase 4で文脈に沿ったaltを執筆するか判断する。

- `job-income-history`（1画像）
- `tokyo-taxi-driver-quit-reason`（1画像）
- `taxi-buai-shikumi`（2画像）
- `ijyu-shienkin-failed`（3画像、captionは保持）

## 固定ページ

- プロフィール: WordPress正式本文へ置換。文字量差0。
- プライバシーポリシー: 正式文言を保持し、AFFINGERメモ枠の装飾だけを通常本文へ平坦化。文字量差0。
- お問い合わせ: Contact Form 7のフォームID・元HTMLをスナップショットに保持。previewでは送信処理を無効化し、入力項目と停止案内を表示する。

Contact Form 7はWordPressのnonce、RESTエンドポイント、Akismet、プラグインJavaScriptに依存するため、そのまま静的サイトへ移植していない。本番切替前の候補は次の通り。

1. Cloudflare Workerの専用POST API + Turnstile + トランザクションメールサービス
2. 外部フォームサービスを利用し、送信先・保存期間・プライバシーポリシーを明示
3. 送信件数が少ない場合は、スパム対策を含めてメールリンクのみで運用

採用前に、送信先、保存の有無、個人情報の保持期間、スパム対策、障害時の再送方針を決める必要がある。

## WordPressとの相違点

- Gutenbergの意味要素はMarkdown化し、WordPress/AFFINGER固有のclassと装飾は除去した。
- AFFINGER関連記事カード1件は通常リンク表示になった。
- 表3件はGFM表へ変換し、スマートフォンでは横スクロールできるCSSを追加した。
- WordPressの段落間空白をMarkdownの段落へ正規化した。記事別の文字量差は0〜-0.34%で、本文削除ではなく空白・caption表現の正規化による差。
- 内部リンクはpreview hostで移動できる相対pathへ変換した。変更前の絶対URLはfrontmatterと変換元HTMLに保持した。
- 本文画像とアイキャッチはWordPress URLを参照する。R2移行は実施していない。
- 固定ページにはWordPressでmeta descriptionがなかったため、preview用descriptionをMarkdown側で追加した。
- Contact Form 7の送信機能はpreviewでは動作しない。

## URL・SEO照合

`url-mapping.csv`の23行（トップ1、記事19、固定3）について、old/new URL一致、末尾スラッシュ、生成ファイル存在を自動確認する。301リダイレクトは追加していない。

各記事で次を検証する。

- title / meta description
- preview originのcanonical
- OGP / Twitter Card
- BlogPosting / BreadcrumbList JSON-LD
- `noindex, nofollow, noarchive, nosnippet`
- 本文画像URL

Previewの多重防御として、HTML meta robots、Cloudflare `_headers`の`X-Robots-Tag`、`robots.txt`の`Disallow: /`を継続する。本番canonicalはfrontmatterに保持するが、preview HTMLへは出さない。

## テスト結果

- `pnpm check`: 0 errors / 0 warnings / 0 hints
- `pnpm build`: 成功、29 HTMLページを生成
- `pnpm test`: 成功
- 公開記事: 19/19 route生成
- 固定ページ: 3/3 route生成
- カテゴリ: 3/3 route生成
- WordPress既存path: 23/23生成、slug変更なし、末尾スラッシュ維持
- Cloudflare実環境: 23/23が最終HTTP 200、`X-Robots-Tag`あり。日本語2 URLはpercent-encodingを小文字から大文字へ307正規化した後に同一pathの200（301ではない）
- sitemap: 28 URL（記事19 + サイト/一覧/カテゴリ/固定9）
- RSS: 19 item
- 内部リンク: 既知404なし
- お問い合わせ: activeな`form`要素なし

## Phase 4前の確認事項

1. 警告2記事と、alt欠落4記事を実画面で編集確認する。
2. お問い合わせ方式と個人情報の扱いを決定する。
3. GA4 Measurement ID、Search Console所有権、現行Google tagの扱いを確認する。
4. 本番後もWordPress画像を参照する期間と、R2移行・URL置換計画を決める。
5. production環境でcanonical/noindex/robotsを切り替える手順をステージングで検証する。
6. 全23 URLのHTTP 200、ヘッダー、schema、画像を本番切替直前に再取得して比較する。
7. DNS TTL、切替手順、ロールバック先を文書化する。ここまで確認するまではDNSを変更しない。
