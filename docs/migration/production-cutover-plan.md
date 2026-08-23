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
7. `xserver-mail-dns-plan.md`に従い、先にXserver authoritative DNS上で明示的な`mail A`と`MX -> mail`を検証する。24時間の送受信・SPF・DKIM合格前にNS移行へ進まない。
8. apex、www、wildcard、MX、SPF、DKIM、mail、ftp、verification TXTなどをCloudflare pending zoneへ複製する。mail/ftp/wildcardはDNS only、web origin Aだけを切り替え時にproxiedとする。Cloudflare Email Routingは有効化しない。
9. registrarのDNSSEC/DS状態を確認する。DSがある場合はCloudflare公式手順に従い、NS変更前に安全に移行する。
10. Cloudflare production Workerをpreviewとは別名でdeployし、version IDを記録する。まだrouteを付けない。
11. production Workerのversion preview URLで28正常URL、404、canonical、robots、画像を検証する。
12. GA4の`G-...`をCloudflare production環境変数へ設定し、build成果物に1タグだけ存在することを確認する。
13. Search Console propertyと所有権tokenを記録し、Cloudflare DNS/HTMLへ引き継ぐ準備をする。
14. Formspree + Turnstileの送信先、domain制限、保持期間、プライバシー文言を承認し、production previewで試験送信する。
15. ロールバック担当、Cloudflare/Xserver/registrarへログインできる担当、判定時刻を決める。

### DNS TTL判断

現在のA/NS/MX等は概ね3600秒。1時間は切り替えとして十分短く、TTLを事前変更する必須性は低い。Cloudflare proxied recordはAuto 300秒になる。NS delegationの伝播はレコードTTLと別で最大24時間を見込むため、コンテンツ切り替え当日にNS変更を重ねない。

推奨は二段階。

1. 明示許可後、Xserver DNS上で`mail A`を明示化し、MXを`mail.calmapercorso.com`へ分離して先行検証する。
2. 同一recordをCloudflare pending zoneへ複製してから、数日前にCloudflareへNSを移す。ただしWeb Aは旧WordPress origin、Worker RouteなしでWordPressを継続。
3. NSが全resolverでCloudflareへ揃い、Web、mail A、MX、SPF、DKIM、実送受信が正常なことを24〜48時間確認してからWorker Routeを有効化。

参考: [Cloudflare full DNS setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)、[DNS TTL](https://developers.cloudflare.com/dns/manage-dns-records/reference/ttl/)

## T-0: 切り替え

以下は明示許可後にだけ実行する。

1. WordPressに切り替え後の編集凍結を宣言し、直前backupと公開19記事の更新日時を再確認する。
2. Cloudflare zoneがActive、旧origin Aがproxied、HTTPSがFull (strict)で正常なことを確認する。
3. production Workerの確定versionを100% deployする。
4. Workers Routeを次の順で登録する。
   - 先に`calmapercorso.com/wp-content/uploads/*`をno script
   - 必要なら`wp-admin`、`wp-login.php`、`wp-json`もno script
   - 最後に`calmapercorso.com/*`をproduction Worker
5. `www.calmapercorso.com`は旧挙動を記録した上で、proxied DNS＋Redirect Ruleによりapexへ恒久redirectする。勝手に追加しない。
6. HTTPS、証明書、HTTP→HTTPS、末尾スラッシュ、画像origin迂回を確認する。
7. 切り替え時刻、Worker version、route一覧、Cloudflare DNS exportを保存する。

## T+0〜30分: 直後確認

`url-mapping.csv`の23 URLすべてと、追加ルートを自動・目視確認する。

- `/`
- 記事19 URL
- `/プロフィール/`、`/privacy-policy-2/`、`/お問い合わせ/`
- `/articles/`、`/category/`、カテゴリ3 URL
- `/sitemap.xml`、`/robots.txt`、`/rss.xml`
- 存在しないURL 1件

各URLでstatus、title、H1、canonical、noindex不在、OGP、schema、CSS、featured/body image、内部リンクを確認する。画像26 URLへ直接アクセスし200を確認する。PCとiPhone/Android相当幅でトップ、長文記事、関連記事、表、前後ナビ、お問い合わせを確認する。

GA4はTag Assistantで重複タグがないことを確認し、Realtime/DebugViewにテストpage_viewが到着することを確認する。Search Consoleはrobots.txtとsitemapをURL検査し、既存sitemap URLを再送信する。

## T+30分〜48時間

- Workers 4xx/5xx、旧origin画像4xx、response time、メール送受信を監視
- GA4 page_viewとSearch Console ownershipを確認
- sitemap 28 URLとRSS 19件を再取得
- WordPressは削除・停止・更新しない
- 重大条件に該当したら`rollback-plan.md`を即実行

## Go / No-Go条件

Goは次をすべて満たす場合のみ。

- 23/23既存pathがproduction candidateで200
- 画像26/26がRoute迂回で200
- production noindex 0、404だけnoindex
- GA4 Measurement ID確定・単一発火
- Search Console ownership維持方法確定
- contact試験送信成功
- DNS全record複製、`MX -> mail`、mail DNS only、SPF/DKIM pass、双方向メール送受信成功
- rollback担当が旧WordPressへ戻す操作を確認済み

1件でも未達ならNo-Go。本番切り替えを延期する。
