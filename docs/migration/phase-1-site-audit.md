# Phase 1: WordPress 現状調査

- 対象: <https://calmapercorso.com/>
- 調査日: 2026-08-22（Asia/Tokyo）
- 調査方法: 公開 WordPress REST API、公開HTML、`robots.txt`、sitemap候補URLを読み取り専用で確認
- 非変更確認: WordPressの記事・設定・DNS・公開URLには変更を加えていない

## エグゼクティブサマリー

| 項目 | 調査結果 |
|---|---:|
| 公開記事 | 19件 |
| 公開固定ページ | 3件 |
| カテゴリ | 4件（使用中3件、空1件） |
| タグ | 0件 |
| アイキャッチ設定済み | 19/19記事 |
| 本文内画像 | 7参照、4記事 |
| 本文内の内部リンク | 1参照、1記事 |
| meta description | 18/19記事 |
| canonical | 19/19記事 |
| OGP | 19/19記事 |
| Twitter Card | 0/19記事 |
| XML sitemap | 有効なものを確認できず |
| 構造化データ | Breadcrumb microdataあり、Article schemaなし |
| Googleタグ | Google Site Kitによる `GT-WKP7ZVTQ` あり |

公開REST APIの `X-WP-Total: 19` と、取得できた公開記事19件が一致した。ここでいう件数は外部から取得可能な `publish` 状態の投稿であり、下書き・非公開・予約投稿の有無は管理画面権限がないため判定できない。

## URL・パーマリンク

公開記事19件の観測結果から、現在の記事URLはルート直下の `/%postname%/` 形式。日付やカテゴリは記事URLに含まれない。

- 記事: `https://calmapercorso.com/{post-slug}/`
- 固定ページ: `https://calmapercorso.com/{page-slug}/`
- カテゴリ: `https://calmapercorso.com/category/{category-slug}/`
- URL末尾: `/` あり

Astro版でもこのパスをそのまま生成する方針が最も安全。現時点のURL比較は [`url-mapping.csv`](./url-mapping.csv) に保存し、全URLを `preserve` としている。URL変更を前提とした301候補はまだ作成していない。

## 固定ページ

| ページ | URL |
|---|---|
| プロフィール | <https://calmapercorso.com/%e3%83%97%e3%83%ad%e3%83%95%e3%82%a3%e3%83%bc%e3%83%ab/> |
| プライバシーポリシー | <https://calmapercorso.com/privacy-policy-2/> |
| お問い合わせ | <https://calmapercorso.com/%e3%81%8a%e5%95%8f%e3%81%84%e5%90%88%e3%82%8f%e3%81%9b/> |

3ページとも自己参照canonicalあり、meta descriptionはなし。機械可読データは [`phase-1-fixed-pages.json`](./phase-1-fixed-pages.json) に保存した。

## カテゴリ

| 表示名 | slug | 公開記事数 | URL |
|---|---|---:|---|
| 転　職 | `career` | 13 | <https://calmapercorso.com/category/career/> |
| 借　金 | `money` | 6 | <https://calmapercorso.com/category/money/> |
| 移　住 | `relocation` | 5 | <https://calmapercorso.com/category/relocation/> |
| 未分類 | `uncategorized` | 0 | <https://calmapercorso.com/category/uncategorized/> |

複数カテゴリに所属する記事があるため、カテゴリ別件数の合計は記事総数を上回る。タグAPIの公開結果は空配列で、公開タグは0件だった。

## 公開記事一覧

タイトルはWordPressの投稿タイトル。HTMLの `<title>`、meta description、画像URL、内部リンク、canonicalなどの完全な値は [`phase-1-content-inventory.csv`](./phase-1-content-inventory.csv) と [`phase-1-content-inventory.json`](./phase-1-content-inventory.json) に保存した。

| 公開日 | カテゴリ | タイトル / URL |
|---|---|---|
| 2026-05-03 | 転職 | [【#19】 初めての転職が年収510万からの288万円へ。14回転職したジョブホッパーの全収入を晒します](https://calmapercorso.com/job-income-history/) |
| 2026-04-12 | 移住・転職 | [【#18】地方移住×転職14回目。未経験で建設の世界に飛び込んだ理由](https://calmapercorso.com/job-change-construction/) |
| 2026-04-05 | 転職 | [【#17】稼げていたのに辞めた。タクシードライバーを1年で終わりにした理由](https://calmapercorso.com/tokyo-taxi-driver-quit-reason/) |
| 2026-04-01 | 転職 | [【#16】ゆるく働いても稼げる？東京タクシードライバーのリアルな1日を完全公開](https://calmapercorso.com/tokyo-taxi-oneday-record/) |
| 2026-03-28 | 転職 | [【#15】流し？付け待ち？アプリ？元タクシードライバーの営業術](https://calmapercorso.com/taxi-eigyo-style/) |
| 2026-03-20 | 転職 | [【#14】東京のタクシードライバーは稼げる？新人で年収600万円の体験談](https://calmapercorso.com/tokyo-taxi-nenshu-real/) |
| 2026-03-15 | 転職 | [【#13】タクシードライバーの歩合給、正直60%って多い？少ない？](https://calmapercorso.com/taxi-buai-shikumi/) |
| 2026-03-13 | 転職 | [【#12】東京でタクシードライバーになるまでの1ヵ月半｜研修・免許・初月給料の現実](https://calmapercorso.com/tokyo-taxi-driver-first-month/) |
| 2026-02-28 | 借金・転職 | [【#11】借金まみれでタクシーに乗り込んだ。そして1年後、東京を出た](https://calmapercorso.com/taxi-driver-debt/) |
| 2026-02-20 | 移住 | [【#10】長野に移住したのは間違いだったのか！？](https://calmapercorso.com/nagano-iju-hansei/) |
| 2026-02-16 | 移住 | [「【#9】地方＝家賃が安い」は嘘？長野に移住して、固定費が上がった話](https://calmapercorso.com/nagano-migration-rent/) |
| 2026-02-07 | 移住・転職 | [【#8】移住支援金という「希望」と、条件という名の「壁」](https://calmapercorso.com/ijyu-shienkin-failed/) |
| 2026-01-29 | 転職 | [【#7】「もう少し頑張れば」と思い続けた９年間](https://calmapercorso.com/first-job-9years/) |
| 2026-01-25 | 借金・移住 | [【#6】自己破産直前、弁護士契約が強制解約になった話](https://calmapercorso.com/bankruptcy-cancellation/) |
| 2026-01-20 | 借金・転職 | [【#5】独立と副業に逃げ続けた結果](https://calmapercorso.com/side-hustle-obsession/) |
| 2026-01-18 | 借金 | [【#4】任意整理その後、立て直せなかった7年間](https://calmapercorso.com/debt-restructuring-failed/) |
| 2026-01-18 | 借金 | [【#3】借金10万円が、気づいたら400万円になっていた](https://calmapercorso.com/debt-swelling-4m/) |
| 2026-01-18 | 借金 | [【#2】債務整理を2回した僕が、最初に借りた10万円](https://calmapercorso.com/first-debt-100k/) |
| 2026-01-17 | 転職 | [【#1】初めての転職で、何かがズレ始めた](https://calmapercorso.com/first-career-change/) |

## 画像と内部リンク

全19記事にアイキャッチ画像が設定されている。アイキャッチのオリジナルURLは記事別インベントリの `featured_image` に保存した。

本文内画像は次の4記事で合計7参照。WordPressの `src` に現れる実際の表示用URLを記録しており、レスポンシブ画像の `srcset` 派生URLは重複カウントしていない。

- `job-income-history`: 1
- `tokyo-taxi-driver-quit-reason`: 1
- `taxi-buai-shikumi`: 2
- `ijyu-shienkin-failed`: 3

記事本文内の内部リンクは1件のみ確認できた。

- `tokyo-taxi-driver-quit-reason` → `bankruptcy-cancellation`

サイドバー、関連記事、パンくず、グローバルナビなどテーマが自動生成するリンクは、記事本文の移行対象ではないためこの内部リンク集計から除外した。

## SEO・計測の現状

### title / meta description

- 投稿タイトルとHTML `<title>` は別々に保存済み。テーマ側でHTMLタイトルを独自調整している記事がある。
- meta descriptionは18/19記事に存在。
- `debt-restructuring-failed` のみmeta descriptionが空。
- 固定ページ3件にはmeta descriptionがない。

### canonical

- 記事19/19件に自己参照canonicalあり。
- 固定ページ3/3件にも自己参照canonicalあり。
- Astro版では文字列の正規化やslug変更をせず、現在値をそのまま引き継ぐ必要がある。

### OGP / Twitter Card

- 記事19/19件に `og:type=article`、`og:title`、`og:url`、`og:description`、`og:image` がある。
- Twitter Card専用メタタグは確認できない。
- 現在の `og:description` はテーマが本文冒頭・目次から自動生成しており、SEO用meta descriptionとは異なる記事がある。移行時はMarkdownの `description` をOGPにも共用する方が一貫性を保ちやすい。

### sitemap

有効なXML sitemapは確認できなかった。

- `/wp-sitemap.xml`: HTTP 200だが `text/html` で、トップページ相当のHTMLを返す
- `/sitemap.xml`: HTTP 200だが `text/html` で、XMLではない
- `/sitemap_index.xml`: HTTP 404
- `robots.txt`: `Sitemap:` の記載なし

検索エンジンが巡回不能という意味ではないが、全URL発見性と更新通知の点でSEO上の改善対象。Preview版ではXML sitemapを実装し、本番切替時に `robots.txt` から参照させる。

### robots.txt

現在値は次のとおり。

```text
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
```

全体クロール禁止はない。XML sitemapへの参照はない。

### schema / structured data

- パンくずに schema.org の `BreadcrumbList` / `ListItem` microdataあり。
- JSON-LD (`application/ld+json`) は確認できない。
- Article / BlogPosting schemaは確認できない。

Astro版では `Article` と `BreadcrumbList` をJSON-LDで実装するのが妥当。

### GA4 / Search Console関連

- Google Site Kit 1.178.0 のgenerator情報あり。
- Google tag (`gtag.js`) とタグID `GT-WKP7ZVTQ` の読み込みあり。
- 公開HTMLには `G-...` 形式のGA4 Measurement IDは露出していないため、公開情報だけでは紐づくGA4プロパティを特定できない。
- Search Consoleの `google-site-verification` metaタグは公開HTMLにない。
- Site KitにSearch Consoleモジュールが存在することと、対象サイトが実際にSearch Consoleへ接続済みであることは別。接続状態は公開情報だけでは判定できないため、本番切替前にWordPress管理画面またはGoogle側で確認が必要。

## Phase 2へ引き継ぐ判断

1. 記事ルートは現在と同じ `/{slug}/` とし、19記事は301なしで維持する。
2. Markdownの `title` とHTML `<title>` の元データが異なる記事があるため、移行時は現行HTMLタイトルをSEOタイトル候補として保持する。
3. `debt-restructuring-failed` のdescriptionは自動生成せず、本文確認後に手動決定する。
4. 画像参照はMVPでは現行WordPress URLを利用し、URL解決関数を介して将来R2へ差し替えられる構成にする。
5. Preview環境は本番canonicalを出すか、preview URLをnoindexにするかを明確化する。既存SEO保護の観点では「preview全体をnoindex、canonicalは本番WordPress URL」が安全。
6. XML sitemap、RSS、Article JSON-LD、Breadcrumb JSON-LD、Twitter CardはCloudflare版で新規実装する。

## 保存ファイル

- [`phase-1-content-inventory.csv`](./phase-1-content-inventory.csv): 記事ごとの監査項目。画像・内部リンクはJSON配列文字列
- [`phase-1-content-inventory.json`](./phase-1-content-inventory.json): 同内容の機械処理向けJSON
- [`phase-1-fixed-pages.json`](./phase-1-fixed-pages.json): 固定ページ一覧とSEO項目
- [`phase-1-summary.json`](./phase-1-summary.json): 件数サマリー
- [`url-mapping.csv`](./url-mapping.csv): 現時点のURL維持方針

## 調査の限界

この監査は外部公開情報に基づく。WordPress管理画面内の下書き・非公開投稿、SEOプラグインの内部設定、GA4プロパティ、Search Consoleの所有権・接続状態は確認対象外。これらは情報が公開されていないため、推測で「接続済み」とは判定していない。
