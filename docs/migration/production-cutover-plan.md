# Production cutover plan

この文書は実行計画であり、Phase 4では一項目も本番へ適用していない。実行には明示的な許可が必要。

## 採用する切り替え方式

R2移行前は、`calmapercorso.com`をWorker Custom Domainにしない。Cloudflare DNSのproxied A recordを旧WordPress (`85.131.213.48`)へ向けたまま、Workers RouteでAstroを前段配信する。`/wp-content/uploads/*`をno-script routeで旧originへ迂回し、画像URLを変えずに維持する。

この方式なら、問題時はWorker Routeを外すだけで同じA recordのWordPressへ戻せる。R2移行後にCustom Domainへ単純化する。

## T-7〜T-2日: 切り替え前

1. GitHub `main`のcommit SHAと担当者を記録し、CIのcheck/build/test成功を確認する。
2. production想定buildを`PUBLIC_DEPLOYMENT_ENV=production`、`PUBLIC_SITE_URL=https://calmapercorso.com`で再実行する。
3. `pnpm audit:prelaunch`を再実行し、22 WordPress record・29 preview route・26画像が全件passすることを確認する。
4. WordPress database、`wp-content`、設定ファイルをXserver側で完全backupし、復元手順を試験する。
5. `url-mapping.csv`、WordPress sitemap、robots.txt、主要HTML、レスポンスヘッダーを保存する。
6. Xserver DNS管理画面から**全レコードをexportまたは画面保存**する。公開照会だけで完全性を判断しない。
7. `xserver-mail-dns-plan.md`の利用終了方針に従い、独自ドメインメールがアカウント復旧先、公開連絡先、Formspree通知先に残っていないことを確認する。必要な過去メールはXserver解約前にexportする。
8. Cloudflare pending zoneにはapex、必要なwww、Search Console等のverification recordだけを登録する。2026-08-29にapex/www AとGoogle TXTの3件を登録し、assigned NS `dom` / `kinsley`への直接queryで一致を確認済み。MX、Xserver用SPF/DKIM、mail、ftp、未使用wildcardは複製していない。切り替え前にCloudflare Email Routingが無効であることを再確認する。
9. registrarのDNSSEC/DS状態を確認する。DSがある場合はCloudflare公式手順に従い、NS変更前に安全に移行する。
10. Cloudflare production Workerをpreviewとは別名でdeployし、version IDを記録する。2026-08-27に`personal-log-site-production` version `3ff5563d-fa0a-4cd8-9125-1e1ac59d1d10`を本番routeなしでdeploy済み。
11. production Workerのversion preview URLで28正常URL、404、canonical、robots、画像を検証する。
12. GA4の`G-S7GS8NFDWG`をCloudflare production環境変数`PUBLIC_GA_MEASUREMENT_ID`へ設定し、build成果物に1タグだけ存在することを確認する。ソースコードとpreview環境には設定しない。
13. Search Consoleは既存propertyを維持する。現在のHTML verification fileを同一path・内容でCloudflare版にも残し、追加するDNS TXTと二重化する。Change of Addressは実施しない。
14. Formspree Form ID `xeajwayl`の外部メール通知、CAPTCHA、production candidate実送信は2026-08-26に確認済み。切り替え前にFormspree domain制限が`calmapercorso.com`であること、Turnstile allowed hostnameが同ドメインのみであることを再確認し、productionへ`PUBLIC_CONTACT_FORM_ENABLED=true`と公開Site Keyを設定する。Secret Keyはコード、GitHub、文書、クライアント成果物へ含めない。
15. ロールバック担当、Cloudflare/Xserver/registrarへログインできる担当、判定時刻を決める。
16. `dns-pre-ns-snapshot.md`と`ns-change-readiness.md`を使い、backupの展開・SQL・checksum、スマートフォン実機、監視担当と記録先を確認する。

### DNS TTL判断

現在のA/NS/MX等は概ね3600秒。1時間は切り替えとして十分短く、TTLを事前変更する必須性は低い。Cloudflare proxied recordはAuto 300秒になる。NS delegationの伝播はレコードTTLと別で最大24時間を見込むため、コンテンツ切り替え当日にNS変更を重ねない。

推奨は二段階。

1. Cloudflare pending zoneへWebと所有権確認に必要なrecordだけを登録する。独自ドメインメール用recordは移行しない。
2. 数日前にCloudflareへNSを移す。ただしWeb Aは旧WordPress origin、Worker RouteなしでWordPressと画像を継続する。
3. NSが全resolverでCloudflareへ揃い、Web、画像、HTTPS、verification recordが正常なことを24〜48時間確認してからWorker Routeを有効化する。
4. NS変更後・包括Worker Route接続前に`pnpm verify:production-images`を実行する。26/26成功しない限りRouteを接続しない。

参考: [Cloudflare full DNS setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)、[DNS TTL](https://developers.cloudflare.com/dns/manage-dns-records/reference/ttl/)

## T-0: 切り替え

以下は明示許可後にだけ実行する。

1. WordPressに切り替え後の編集凍結を宣言し、直前backupと公開19記事の更新日時を再確認する。
2. Cloudflare zoneがActive、旧origin Aがproxied、HTTPSがFull (strict)で正常なことを確認する。
3. production Workerの確定versionを100% deployする。
4. Workers Routeを次の順で確認・登録する。
   - 事前登録済みの`calmapercorso.com/wp-content/uploads/*` no scriptが存在することを確認
   - 必要なら`wp-admin`、`wp-login.php`、`wp-json`もno script
   - 最後に`calmapercorso.com/*`をproduction Worker
5. `www.calmapercorso.com`は旧挙動を記録した上で、proxied DNS＋Redirect Ruleによりapexへ恒久redirectする。勝手に追加しない。
6. HTTPS、証明書、HTTP→HTTPS、末尾スラッシュ、画像origin迂回を確認する。
7. 切り替え時刻、Worker version、route一覧、Cloudflare DNS exportを保存する。
8. 包括Route接続直後に`pnpm verify:production-images`を再実行する。26件のうち1件でも200/image応答でなければ、包括Routeを即時解除する。

## T+0〜30分: 直後確認

`url-mapping.csv`の23 URLすべてと、追加ルートを自動・目視確認する。

- `/`
- 記事19 URL
- `/プロフィール/`、`/privacy-policy-2/`、`/お問い合わせ/`
- `/articles/`、`/category/`、カテゴリ3 URL
- `/sitemap.xml`、`/robots.txt`、`/rss.xml`
- 存在しないURL 1件

各URLでstatus、title、H1、canonical、noindex不在、OGP、schema、CSS、featured/body image、内部リンクを確認する。画像26 URLへ直接アクセスし200を確認する。PCとiPhone/Android相当幅でトップ、長文記事、関連記事、表、前後ナビ、お問い合わせを確認する。

GA4はTag Assistantで重複タグがないことを確認し、Realtime/DebugViewにテストpage_viewが到着することを確認する。Search ConsoleはDNS TXT方式で所有権を再確認し、HTMLファイル方式も維持されていることを確認する。その後robots.txtとsitemapをURL検査し、既存sitemap URLを再送信する。Change of Addressは実施しない。

## T+30分〜48時間

- Workers 4xx/5xx、旧origin画像4xx、response time、Formspree通知を監視
- GA4 page_viewとSearch Console ownershipを確認
- sitemap 28 URLとRSS 19件を再取得
- WordPressは削除・停止・更新しない
- 重大条件に該当したら`rollback-plan.md`を即実行
- 監視頻度と判定表は`ns-change-readiness.md`に従う

## Go / No-Go条件

### NS変更のGo条件

`prelaunch-checklist.md`のNS change gateをすべて完了すること。特にWordPress/Xserver完全backup、Xserver管理画面のDNS全record保存、各管理画面へログインできるrollback担当、監視時間枠、明示的なNS変更許可が必須。NS変更時点ではA recordを旧WordPressに維持し、本番Worker Routeを接続しない。

### 本番Worker Route接続のGo条件

Goは次をすべて満たす場合のみ。

- 23/23既存pathがproduction candidateで200
- NS変更後・包括Route接続前に画像26/26がCloudflare経由で200/image応答
- production noindex 0、404だけnoindex
- GA4 Measurement ID `G-S7GS8NFDWG`のproduction設定・単一発火
- Search Consoleの既存property、HTML verification file、Google verification TXTが維持され、DNS方式で再確認可能
- Formspree + Turnstileから外部メールアドレスへの試験通知成功
- 必要なWeb/verification DNS recordがCloudflareに登録され、旧メールrecordを移行しない方針を確認済み
- rollback担当が旧WordPressへ戻す操作を確認済み
- iPhone Safari / Android Chromeの実機スモークテスト完了
- NS変更後24時間以上（推奨48時間）のWordPress配信監視で重大障害なし
- 本番Worker Route接続について明示的な許可あり

1件でも未達ならNo-Go。本番Worker Route接続を延期する。no-script routeによる実際の迂回は包括Route接続直後の画像26件再検査で確定し、失敗時は即時Route解除とする。
