# Phase 4: 本番切り替え前検証

- 実施日: 2026-08-23〜2026-08-29（Asia/Tokyo）
- Production origin: <https://calmapercorso.com>
- Preview: <https://personal-log-site-preview.cloudflare-migration-plan.workers.dev/>
- Preview Worker version: `0bc3a6ca-a927-4e66-8623-b9256de5055a`
- 非変更確認: 本番WordPress、公開NS、`calmapercorso.com`の接続先、GA4/Search Console設定、R2は変更していない。Cloudflareには未委任のpending zoneだけを準備した

## 判定

Astroのコンテンツ・URL・SEO実装は本番切り替え候補として合格。全19記事と固定ページ3件は、保存済み変換元だけでなく2026-08-23時点の公開WordPress REST APIとも再照合し、slug、更新日時、正規化本文ハッシュが22/22件一致した。

ただし、現時点で本番切り替えを実行してはいけない。2026-08-29時点でDNS/Contact/production Workerの準備は完了し、残る切り替えゲートは次の4点。

1. Xserver DNS zone完全export、WordPress直前backup、独自ドメインemail依存の最終確認
2. CloudflareへNSを変更した後、Worker本番routeを付けずにWordPress/画像/no-script routeを24〜48時間確認
3. Site Kitの接続先照合、Tag AssistantとGA4 Realtime/DebugViewによる単一発火・受信確認
4. Search ConsoleのHTML verification file確認と、NS変更後のDNS TXT所有権再確認

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
PUBLIC_GA_MEASUREMENT_ID=G-S7GS8NFDWG
PUBLIC_CONTACT_FORM_ENABLED=true
PUBLIC_TURNSTILE_SITE_KEY=公開Site Key
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

Formspree Form ID `xeajwayl`を使うAstro + Vanilla JSフォームを実装した。Ajax送信、必須validation、送信中・成功・失敗表示を持ち、previewではendpointを出力せず入力と送信を無効化する。productionは`PUBLIC_CONTACT_FORM_ENABLED=true`を明示した別名Workerへdeploy済み。

Turnstile Site Key `0x4AAAAAAEZOOB4bmw0qotmj`を公開build変数として設定し、`production-candidate`とproduction buildでwidget、token送信、resetを検証した。Cloudflare画面ではallowed hostnameが`calmapercorso.com`のみであることを確認した。Secret Keyの値はコード、GitHub、文書、クライアント成果物には保存しない。

2026-08-26にFormspree CAPTCHAを有効化し、production candidateで必須入力エラー、Turnstile未完了時の拒否、正常送信、成功後のフォーム・Turnstile resetを実ブラウザ確認した。正常送信はFormspree Inboxへ保存され、外部通知先にも同日23:07 JSTに着信した。候補`workers.dev` hostnameは試験中だけTurnstileへ追加し、試験後に削除済みで、最終allowed hostnameは`calmapercorso.com`のみ。2026-08-29にFormspree `Restrict to Domain`も`calmapercorso.com`で保存した。通信・送信失敗時の表示分岐はcandidate build testで確認した。ダミーアドレスと明示的なtest文面による再試験1件はFormspreeのSpamへ分類されたが、実運用相当の送信は正常処理されたためBlocking issueとはしない。プライバシーポリシーにはFormspreeとCloudflare Turnstileの利用を追記済み。件数増加、独自保持方針、HakubaSafetyとの共通化が必要になった時点でWorker APIへ移行する。

参考: [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/)、[Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)、[Formspree account limits](https://help.formspree.io/articles/account-management/account-limits)、[Formspree Turnstile](https://help.formspree.io/articles/form-and-project-settings/protecting-your-forms-with-cloudflare-turnstile/)

## GA4 / Search Console

GA4 Measurement IDは管理情報から`G-S7GS8NFDWG`と確定した。公開HTMLで確認済みのSite Kit Google tag ID `GT-WKP7ZVTQ`とは役割が異なるため、Cloudflare版にはMeasurement IDを使用する。Search Console verification metaは公開HTMLにはない。

切り替え前にWordPress管理画面の Site Kit > Settings > Connected Services で次を記録する。

- Analytics account / property / web data streamと、Measurement IDが`G-S7GS8NFDWG`であること
- 「Place Google Analytics code」の状態と、同じタグを別プラグインが出していないか
- Search Console propertyがDomainか`https://calmapercorso.com/` URL-prefixか
- verified ownerと所有権確認方式（DNS TXT、HTML tag/file、GA等）
- 現在のsitemap送信先と最終取得状態

Cloudflare版はproduction build変数`PUBLIC_GA_MEASUREMENT_ID`へ`G-S7GS8NFDWG`を設定し、Route未接続の別名Worker HTMLでタグ出力を確認した。Astro + Static Assetsでは公開変数はbuild時に埋め込まれるため、Worker runtime secretとしては扱わない。preview環境には設定せず、`GT-WKP7ZVTQ`をMeasurement IDとして代用しない。Tag AssistantとGA4 Realtime/DebugViewによるpage_viewの単一受信確認は本番hostname接続後に行う。Search Consoleは同一domain・同一URL移行なのでChange of Addressは使わず、既存propertyを維持する。DNS TXTはCloudflare pending zoneへ登録し、割当NSへの直接queryで確認済み。

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

2026-08-29にCloudflare pending zoneを無料プラン・手動入力で作成した。登録したDNSはproxied A `@` / `www` → `85.131.213.48`と、DNS-onlyのGoogle verification TXTの3件だけで、MX/SPF/DKIM/mail/ftp/wildcardは登録していない。割当NSは`dom.ns.cloudflare.com`と`kinsley.ns.cloudflare.com`で、両NSへの直接queryでレコードを確認した。公開NSは引き続きXserver、WHOISはDNSSEC `Unsigned`、公開DSはない。

2026-08-30に公開DNSとassigned NSへの直接queryを再取得し、`dns-pre-ns-snapshot.md`へ保存した。NS変更前後のbackup、実機確認、24〜48時間監視、画像二段階検査、Search Console、GA4、Worker Route Go条件は`ns-change-readiness.md`へ集約した。現在のXserver直配信に対して新しい`pnpm verify:production-images`を実行し、26/26がHTTP 200・`image/png`・非空bodyであることを確認した。これは現時点のorigin baselineであり、no-script routeの実経路確認は包括Worker Route接続直後に再実行して確定する。

同zoneへ`calmapercorso.com/wp-content/uploads/*`をWorkerなし（no-script）で先行登録し、画面上で「このルートではワーカーは無効」を確認した。Xserver origin画像26/26はHTTP 200。NS変更後・包括Worker Route接続前にCloudflare経由のorigin配信を確認し、no-script routeが包括Routeより優先されることのend-to-end確認は包括Route接続直後に同じ26件を再検査して確定する。

## テスト結果

- `pnpm migrate:wordpress:snapshot`: 19記事・3固定ページを再現
- `pnpm build`: 成功、Astro check 0 errors / 0 warnings / 0 hints、29 pages
- `pnpm test`: 成功
- `pnpm test:production`: 成功
- `pnpm test:production-candidate:http`: 成功、31 route、production canonical/robots/GA4/contact、404
- `pnpm audit:prelaunch`: 成功
- preview deploy: 成功、version `0bc3a6ca-a927-4e66-8623-b9256de5055a`
- production candidate deploy: 成功、<https://personal-log-site-production.cloudflare-migration-plan.workers.dev/>、version `3ff5563d-fa0a-4cd8-9125-1e1ac59d1d10`、本番routeなし
- 日本語固定ページ2件は小文字percent encodingから大文字percent encodingへ307正規化後200。decode後pathと末尾スラッシュは同一
- 公開NS/WordPress本番変更: 0件
