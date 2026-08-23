# Phase 4: 本番切り替え前検証

- 実施日: 2026-08-23（Asia/Tokyo）
- Production origin: <https://calmapercorso.com>
- Preview: <https://personal-log-site-preview.cloudflare-migration-plan.workers.dev/>
- Preview Worker version: `0bc3a6ca-a927-4e66-8623-b9256de5055a`
- 非変更確認: 本番WordPress、DNS、`calmapercorso.com`の接続先、GA4、Search Console、R2は変更していない

## 判定

Astroのコンテンツ・URL・SEO実装は本番切り替え候補として合格。全19記事と固定ページ3件は、保存済み変換元だけでなく2026-08-23時点の公開WordPress REST APIとも再照合し、slug、更新日時、正規化本文ハッシュが22/22件一致した。

ただし、現時点で本番切り替えを実行してはいけない。残る切り替えゲートは次の4点。

1. Cloudflareへ登録するWeb/verification DNS recordの確定とDNSSEC/DS確認
2. 同一ドメインのWordPress画像を維持するWorker Route除外設定の事前テスト
3. Search Console所有権方式の確認と、確定したGA4 Measurement IDのproduction設定・受信試験
4. お問い合わせの外部メール通知先とFormspree/Turnstile設定の決定・プライバシー文言更新

## 全ページ検証

`scripts/audit-prelaunch.mjs`を公開環境へ実行した結果は次のとおり。

| 対象 | 件数 | 結果 |
|---|---:|---|
| preview正常ルート | 28 | 28/28 HTTP 200 |
| 意図した未知ルート | 1 | HTTP 404 |
| WordPress公開記事 | 19 | 19/19 snapshotと一致 |
| WordPress固定ページ | 3 | 3/3 snapshotと一致 |
| WordPress画像URL | 26 unique | 26/26 HTTP 200 |
| URL mapping | 23 | 23/23 path・slug・trailing slash維持 |

記事19件でtitle、meta description、H1 1件、preview canonical、OGP、Twitter Card、BlogPosting、BreadcrumbList、featured image、本文画像、前後記事、カテゴリリンクを検証した。固定ページ、トップ、記事一覧、カテゴリ一覧、カテゴリ3ページもstatus、title、description、H1、canonical、OGP、Twitter Card、noindexを検証した。詳細は `prelaunch-page-audit.csv`、WordPress照合は `wordpress-live-diff.csv`、画像到達性は `image-http-audit.csv` に保存した。

本文変換レポートは17件`passed`、2件`warning`、未変換要素0、記事の手動レビュー残0。文字量差は0〜-0.34%で、空白・caption表現の正規化に由来し、意味のある本文欠落は検出されなかった。固定ページはお問い合わせの送信機能だけが意図的な未移行項目である。

### モバイルと長文表示

Phase 2で共通レイアウトを375px幅で確認済み。Phase 4では正式な長文19記事を用いて本文幅、行間、見出し、表の横スクロール、画像の最大幅、前後ナビをbuild検査し、`tokyo-taxi-driver-quit-reason`の関連記事表示を1280px実ブラウザで目視した。今回追加した関連記事は640px以下で画像72px＋本文の2列となる専用CSSを持つ。Phase 2以降、共通モバイル幅を壊す構造変更はない。実機Safari/Chromeの最終スモークテストは切り替え直前チェックとして残す。

## 手動確認2件

### debt-restructuring-failed

指定されたdescriptionは、任意整理後の返済額、デビットカード生活、返済継続に失敗した経緯、弁護士相談、自力返済へ切り替えた7年間という本文の中心内容と一致する。誇張や本文にない検索語もないため、Markdown側で正式採用した。WordPressは変更していない。

> 任意整理で返済負担は軽くなったものの、途中で支払いを続けられず自力返済へ切り替えた7年間の記録。デビットカード生活、弁護士相談、返済ルールと立て直せなかった経緯を振り返ります。

### tokyo-taxi-driver-quit-reason

AFFINGER関連記事カードは、`/bankruptcy-cancellation/`への相対リンク、記事タイトル、元抜粋、装飾サムネイルを保持した軽量な関連記事枠へ変換した。記事本文の「借金が移住で大問題へ発展した」という段落直後に置かれ、文脈は自然。リンク先はpreviewでHTTP 200、リンクテキストはリンク先H1と一致する。カード外観の完全再現は行っていない。

## 画像alt

WordPressで空だった本文画像7件を実画像と周辺文脈で確認し、説明可能な6件へ自然なaltを追加した。関連記事用の小さなサムネイル1件は、直後に同じ内容のリンクテキストがあり装飾目的なので空altを維持した。caption 3件は保持。変更一覧は `image-alt-update-report.csv`。

## Production SEO build

実デプロイを行わず、隔離出力先`dist-production/`へ次の環境でbuildした。

```text
PUBLIC_DEPLOYMENT_ENV=production
PUBLIC_SITE_URL=https://calmapercorso.com
PUBLIC_GA_MEASUREMENT_ID=G-PHASE4TEST（検証専用ダミー）
BUILD_OUT_DIR=dist-production
```

確認結果:

- HTMLのpreview noindexが消える
- `_headers`から`X-Robots-Tag: noindex`が消える
- 404だけは`noindex, follow`を維持
- `robots.txt`は`Allow: /`と本番sitemap URLを出力
- canonical、OGP URL、BlogPosting/BreadcrumbList URLは`https://calmapercorso.com`
- sitemapは本番originの28 URLのみ。preview URLと404を含まない
- RSSは本番originの19 item
- GAタグはproductionかつMeasurement ID設定時だけ出力。previewでは出力しない

Phase 4で、静的な`public/_headers`を環境別build成果物へ変更した。これによりpreviewのnoindexを維持しながら、productionで誤ってHTTP noindexを残す問題を防いだ。

## sitemap / RSS

sitemap 28 URLの内訳は、トップ1、記事19、記事一覧1、カテゴリ一覧1、カテゴリ3、固定ページ3。`404.html`、preview origin、WordPress管理URLは含まない。RSSは公開記事19件だけを新しい順で含む。

## お問い合わせ方式の比較

| 方式 | 実装難易度 | 月額目安 | スパム対策 | 個人情報管理 | 障害・保守 | この規模への適性 |
|---|---|---:|---|---|---|---|
| Worker + Turnstile + メールAPI | 高 | 小規模なら$0候補、メールAPI次第 | 強い。tokenのサーバー検証必須 | 保存しない設計が可能だが、メール事業者は通る | CloudflareとメールAPIの監視、rate limit、再送実装が必要 | 将来の共通基盤向け |
| 外部フォーム（Formspree + Turnstile） | 低 | Freeは50件/月 | Turnstile、domain制限、サービス側filter | 第三者へ送信しFreeは30日保持 | ベンダー依存だが保守最小 | **現在の推奨** |
| `mailto:`のみ | 最小 | $0 | 公開アドレスが収集されやすい | メールクライアント内 | 端末設定依存、送信完了を確認しにくい | 一時的な退避策 |

推奨はFormspree Free + Cloudflare Turnstile。1フォーム、月50件以内を開始条件とし、送信元domain制限を有効化する。Turnstileは個人ブログ向けFree planがあり、FormspreeはTurnstileを直接サポートする。通知先は`calmapercorso.com`ではない外部メールアドレスとし、保持期間への同意、Formspreeを処理委託先としてプライバシーポリシーへ記載する文言を決めてから実装する。件数増加、独自保持方針、HakubaSafetyとの共通化が必要になった時点でWorker APIへ移行する。

参考: [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/)、[Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)、[Formspree account limits](https://help.formspree.io/articles/account-management/account-limits)、[Formspree Turnstile](https://help.formspree.io/articles/form-and-project-settings/protecting-your-forms-with-cloudflare-turnstile/)

## GA4 / Search Console

GA4 Measurement IDは管理情報から`G-S7GS8NFDWG`と確定した。公開HTMLで確認済みのSite Kit Google tag ID `GT-WKP7ZVTQ`とは役割が異なるため、Cloudflare版にはMeasurement IDを使用する。Search Console verification metaは公開HTMLにはない。

切り替え前にWordPress管理画面の Site Kit > Settings > Connected Services で次を記録する。

- Analytics account / property / web data streamと、Measurement IDが`G-S7GS8NFDWG`であること
- 「Place Google Analytics code」の状態と、同じタグを別プラグインが出していないか
- Search Console propertyがDomainか`https://calmapercorso.com/` URL-prefixか
- verified ownerと所有権確認方式（DNS TXT、HTML tag/file、GA等）
- 現在のsitemap送信先と最終取得状態

Cloudflare版はproduction環境変数`PUBLIC_GA_MEASUREMENT_ID`へ`G-S7GS8NFDWG`を設定する。ソースコードやpreview環境へ直書きせず、`GT-WKP7ZVTQ`をMeasurement IDとして代用しない。production build後、Tag AssistantとGA4 Realtime/DebugViewでpage_viewを1回だけ送ることを確認する。Search Consoleは同一domain・同一URL移行なのでChange of Addressは使わず、既存propertyを維持し、所有権tokenをCloudflare DNSまたはHTMLへ引き継ぐ。

参考: [Google tag setup](https://developers.google.com/tag-platform/gtagjs)、[Site Kit Analytics](https://sitekit.withgoogle.com/documentation/supported-services/analytics/)、[Site Kit Search Console](https://sitekit.withgoogle.com/documentation/supported-services/search-console/)、[Search Console ownership verification](https://support.google.com/webmasters/answer/9008080)

## 画像とR2計画

現在の公開参照はfeatured image 19件＋本文画像7件の26 unique URL。WordPress停止前に次のPhaseでR2へ移す。

1. `image-http-audit.csv`の26 URLをdownloadし、HTTP status、MIME、byte数、SHA-256をmanifest化
2. 元URLpathを保ったobject keyでR2 Standardへupload
3. `media.calmapercorso.com`のCustom DomainをR2へ接続し、実画像を照合
4. `resolveImageUrl()`にorigin mappingを追加し、Markdown本文URLは変換スクリプトで一括置換
5. build成果物に`/wp-content/uploads/`参照が0件であることを自動テスト
6. fingerprint済みobjectは`Cache-Control: public, max-age=31536000, immutable`、置換可能なkeyは短いTTL＋purge運用
7. 30日以上、404・転送量・表示を監視後にWordPress停止を判断

R2 StandardのFree tierは10 GB-month、Class A 100万/月、Class B 1000万/月で、本件26画像は通常その範囲に収まる見込み。productionは`r2.dev`ではなくCustom Domainを使い、Cloudflare Cacheを有効にする。

参考: [R2 pricing](https://developers.cloudflare.com/r2/pricing/)、[R2 custom-domain cache](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/)

## DNS / 画像継続に関する重要事項

現在のauthoritative NSは`ns1.xserver.jp`〜`ns5.xserver.jp`、apex/www/wildcardは`85.131.213.48`、公開レコードのTTLは概ね3600秒。現DNSにはMX、SPF、DKIMがあるが、独自ドメインメールを終了する方針に変更したためCloudflareへ移行しない。切り替え前に独自ドメインemailが各サービスの復旧先等に残っていないことだけを確認する。詳細は`dns-baseline.json`と`xserver-mail-dns-plan.md`。

Worker Custom Domainはhostnameの全pathでWorker自身がoriginになる。そのまま切り替えると`https://calmapercorso.com/wp-content/uploads/...`もWorkerへ届き、26画像が404になる。したがってR2前の本番切り替えはCustom Domainではなく、旧Xserverをoriginに残すWorker Routeを使う。

- `calmapercorso.com/*` → production Worker
- `calmapercorso.com/wp-content/uploads/*` → **no script**（旧WordPress originへ迂回）
- 必要に応じて`/wp-admin/*`、`/wp-login.php*`、`/wp-json/*`もno-script route

Cloudflare Routesは既存originの前段で動き、より具体的なno-script routeでWorkerを迂回できる。Custom Domain化はR2移行後に行う。参考: [Workers Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)、[Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

## テスト結果

- `pnpm migrate:wordpress:snapshot`: 19記事・3固定ページを再現
- `pnpm build`: 成功、Astro check 0 errors / 0 warnings / 0 hints、29 pages
- `pnpm test`: 成功
- `pnpm test:production`: 成功
- `pnpm audit:prelaunch`: 成功
- preview deploy: 成功、version `0bc3a6ca-a927-4e66-8623-b9256de5055a`
- DNS/WordPress本番変更: 0件
