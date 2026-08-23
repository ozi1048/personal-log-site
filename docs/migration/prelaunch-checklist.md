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
- [ ] `/wp-content/uploads/*` no-script routeで画像26/26をproduction候補domainから確認

## Contact

- [x] 3方式の比較とFormspree + Turnstile推奨を決定
- [ ] Formspree account/form IDと通知先emailを決定
- [ ] Turnstile site/secret key、allowed hostname、domain制限を設定
- [ ] 保持期間・処理委託先をプライバシーポリシーへ反映
- [ ] production candidateで正常送信、validation、spam、失敗表示を試験

## Google

- [x] Google tag `GT-WKP7ZVTQ`の存在確認
- [x] GAタグの環境変数・production限定出力を検証
- [ ] Site KitでGA4 account/property/stream/`G-...`を記録
- [ ] `PUBLIC_GA_MEASUREMENT_ID`へ実IDを設定
- [ ] Tag Assistantで単一発火、GA4 Realtime/DebugViewで受信確認
- [ ] Search Console property type、owner、verification方式を記録
- [ ] DNS/HTML verification tokenをCloudflare版へ維持

## DNS / Cloudflare

- [x] 公開DNS baselineとTTLを保存
- [x] 現NSがXserver、origin Aが`85.131.213.48`と確認
- [x] 3600秒TTLは事前短縮必須でないと判断
- [ ] Xserver管理画面から完全なDNS zoneをexport
- [ ] Cloudflare pending zoneへ全recordを複製
- [ ] DNSSEC/DS状態をregistrarで確認
- [ ] Cloudflare NSへ変更後、Worker routeなしでWordPress/web/mailを確認
- [ ] production Workerを別名でdeployしversion固定
- [ ] `/wp-content/uploads/*` no-script routeを先に設定
- [ ] `calmapercorso.com/*` production Worker routeを最後に設定
- [ ] HTTPS、Full (strict)、www挙動を確認

## Backup / rollback

- [ ] WordPress DB、wp-content、設定の直前backup
- [ ] Xserver DNS、Cloudflare DNS、route、Worker versionを保存
- [ ] rollback担当と判断基準を共有
- [ ] route解除でWordPressへ戻ることを事前確認
- [ ] WordPressを切り替え後30日以上停止しない
- [ ] R2移行・30日監視・参照0件までWordPressを削除しない

## Final commands

```text
pnpm migrate:wordpress:snapshot
pnpm build
pnpm test
pnpm test:production
pnpm audit:prelaunch
```

すべて成功し、上の`[ ]`が完了し、明示的な本番切り替え許可が出た場合だけ`production-cutover-plan.md`を実行する。

