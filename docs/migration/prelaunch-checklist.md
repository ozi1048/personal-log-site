# Prelaunch checklist

`[x]`はPhase 4で検証済み、`[ ]`は本番切り替え前に人が確認・承認する項目。未完了項目が1つでもあればNo-Go。

## Content / URL

- [x] 公開記事19/19をMarkdown化
- [x] 固定ページ3/3をMarkdown化
- [x] 公開WordPressと保存snapshotの本文hash 22/22一致
- [x] 既存URL 23/23のpath、slug、trailing slash維持
- [x] preview正常ルート28/28 HTTP 200
- [x] 未知URL HTTP 404
- [x] 既知内部リンク404なし
- [x] 前後記事、カテゴリ、時系列リンク
- [ ] 切り替え直前にWordPress更新凍結と再監査

## SEO / feeds

- [x] 記事title、description、H1、canonical、OGP、Twitter Card
- [x] 記事BlogPosting / BreadcrumbList
- [x] production canonical / OGP / JSON-LD URL
- [x] preview meta noindex / X-Robots-Tag / robots Disallow
- [x] production noindex解除、404だけnoindex
- [x] sitemap 28 production URL、preview/404なし
- [x] RSS 19 production item
- [x] `debt-restructuring-failed` description正式採用
- [ ] 本番直後にrobots/sitemapを外部HTTPで再確認

## Images / display

- [x] featured 19＋本文7＝26 unique URLがHTTP 200
- [x] 空alt 7件のうち説明可能な6件へ追加
- [x] 装飾関連記事サムネイル1件は空alt維持
- [x] AFFINGER関連記事のリンク先・文言・文脈・desktop表示
- [x] 共通layoutの375px確認（Phase 2）とPhase 4 responsive CSS確認
- [ ] iPhone Safari / Android Chrome実機スモークテスト
- [x] `/wp-content/uploads/*` no-script routeをCloudflare pending zoneへ設定（Worker無効を画面確認）
- [ ] NS切り替え後、no-script route経由で画像26/26をproduction domainから確認

## Contact

- [x] 3方式の比較とFormspree + Turnstile推奨を決定
- [x] Formspree Form ID `xeajwayl`とendpointを実装
- [x] production限定Ajax送信、入力validation、成功・失敗表示を実装
- [x] previewでendpointを出力せず、入力・送信を無効化
- [x] Turnstile widget、token必須確認、`cf-turnstile-response`送信、成功・失敗後resetを実装
- [x] Formspree CAPTCHAを有効化し、登録済みSecret Keyとの連携を実送信で確認（Secret Keyの値は表示・保存していない）
- [x] Turnstile Site Key `0x4AAAAAAEZOOB4bmw0qotmj`を公開build変数として記録
- [x] noindexを維持する`production-candidate` buildと専用Worker名を用意
- [x] production buildへ`PUBLIC_CONTACT_FORM_ENABLED=true`とSite Keyを設定し、別名Workerへdeploy
- [x] Formspree WorkflowにEmail通知actionがあることを画面確認
- [x] Formspreeの外部通知先emailへの実着信を確認（2026-08-26 23:07 JST）
- [x] Turnstile allowed hostnameが`calmapercorso.com`のみであることを画面確認
- [x] Formspree `Restrict to Domain`を`calmapercorso.com`で保存し、画面確認
- [x] 候補`workers.dev` hostnameを試験中だけ許可し、試験後に削除（最終状態は`calmapercorso.com`のみ）
- [x] FormspreeとCloudflare Turnstileの利用をプライバシーポリシーへ反映
- [x] production candidateで正常送信、必須validation、Turnstile未完了拒否、成功後resetを実ブラウザ確認
- [x] Formspree Inboxへの保存と外部通知先への実着信を確認
- [x] 通信・送信失敗時のメッセージ分岐をcandidate build testで確認

## Google

- [x] Google tag `GT-WKP7ZVTQ`の存在確認
- [x] GAタグの環境変数・production限定出力を検証
- [x] GA4 Measurement ID `G-S7GS8NFDWG`を記録
- [ ] Site Kitで接続中のaccount/property/web streamが`G-S7GS8NFDWG`と一致することを確認
- [x] production buildの`PUBLIC_GA_MEASUREMENT_ID`へ`G-S7GS8NFDWG`を設定し、候補HTMLで確認
- [ ] Tag Assistantで単一発火、GA4 Realtime/DebugViewで受信確認
- [x] Search Consoleは既存propertyを維持し、Change of Addressを実施しない方針を確認
- [x] DNS所有権確認TXT `google-site-verification=K2Dl7H9zuV7C8epZencG_7rctK9U8B1aZOlVR6FLFt4`を記録
- [ ] 現在のHTML verification fileをCloudflare版でも同一path・内容で維持できることを確認
- [ ] Cloudflare apex TXTへDNS所有権確認値を追加し、既存HTML方式と併用
- [ ] NS切り替え後、Search ConsoleでDNS方式の所有権を再確認

## DNS / Cloudflare

- [x] 公開DNS baselineとTTLを保存
- [x] 現NSがXserver、origin Aが`85.131.213.48`と確認
- [x] wildcard、MX、SPF、`default._domainkey` DKIMを現DNSの履歴として保存
- [x] 独自ドメインメールを終了し、メールrecordをCloudflareへ移行しない方針を文書化
- [x] 3600秒TTLは事前短縮必須でないと判断
- [ ] Xserver管理画面から完全なDNS zoneをexport
- [ ] 独自ドメインemailが各サービスのログイン・復旧先・公開連絡先に残っていないことを確認
- [x] Cloudflare pending zoneへWeb/verification record 3件だけを登録（apex A、www A、Google TXT）
- [x] apex TXTへ`google-site-verification=K2Dl7H9zuV7C8epZencG_7rctK9U8B1aZOlVR6FLFt4`を登録
- [x] MX、Xserver用SPF/DKIM、mail、ftp、未使用wildcardをCloudflareへ移行していないことを確認
- [ ] Cloudflare Email Routingが無効であることを確認
- [x] Cloudflare assigned NS `dom` / `kinsley`への直接queryでWeb recordとGoogle verification TXTを確認
- [x] DNSSEC/DS状態を確認（registrar WHOIS `Unsigned`、公開DSなし）
- [ ] Cloudflare NSへ変更後、Worker routeなしでWordPress/Web/画像を24〜48時間確認
- [x] production Workerを別名でdeployしversion固定（`3ff5563d-fa0a-4cd8-9125-1e1ac59d1d10`）
- [x] `/wp-content/uploads/*` no-script routeを先に設定
- [ ] `calmapercorso.com/*` production Worker routeを最後に設定
- [ ] HTTPS、Full (strict)、www挙動を確認

## Backup / rollback

- [ ] WordPress DB、wp-content、設定の直前backup
- [ ] Xserver DNS、Cloudflare DNS、route、Worker versionを保存
- [ ] rollback担当と判断基準を共有
- [ ] route解除でWordPressへ戻ることを事前確認
- [ ] WordPressを切り替え後30日以上停止しない
- [ ] R2移行・30日監視・参照0件までWordPress/Xserverを停止・解約しない

## Final commands

```text
pnpm migrate:wordpress:snapshot
pnpm build
pnpm test
pnpm test:production
pnpm test:production-candidate:http
pnpm audit:prelaunch
```

すべて成功し、上の`[ ]`が完了し、明示的な本番切り替え許可が出た場合だけ`production-cutover-plan.md`を実行する。
