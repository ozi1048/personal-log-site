# Xserverメール / DNS方針（メール移行なし）

更新日: 2026-08-23

## 決定

`calmapercorso.com`の独自ドメインメールは今後使用しない。以前検討したXserverメール継続案は不採用とし、次の作業は実施しない。

- `mail.calmapercorso.com`の新設
- MXを`mail.calmapercorso.com`へ変更
- Xserverメールの送受信、SPF、DKIM検証
- メールクライアント設定の維持
- Cloudflare Email Routingへの移行

現在Xserver DNSに存在するMX、SPF、DKIMは履歴として`dns-baseline.json`に保存するが、Cloudflare zoneへメール継続目的で複製しない。現DNSにもPhase 4では変更を加えない。

## 目標構成

| 用途 | 構成 |
|---|---|
| Web | Cloudflare Workers |
| DNS | Cloudflare authoritative DNS |
| 画像 | 当面Xserver、検証後にCloudflare R2 |
| お問い合わせ | Formspree + Cloudflare Turnstile |
| 通知先 | Gmail等の外部メールアドレス |
| Xserver | R2移行・検証・rollback保持期間の完了後に解約 |

Cloudflare pending zoneには、Web配信とサービス所有権確認に必要なレコードだけを登録する。MX、Xserver用SPF/DKIM、`mail`、メール用途のwildcardは登録しない。`ftp`やwildcardも独立した利用実態が確認できない限り移行しない。

## 切り替え前の確認

独自ドメインメールを再現する作業は不要。ただし、意図せず重要アカウントに残っていないことを一度だけ確認する。

- WordPress、Xserver、ドメインregistrar、GitHub、Cloudflare、Google、Formspreeのログイン・復旧先
- プライバシーポリシー、プロフィール、過去記事に掲載された連絡先
- Formspreeの通知先・ownerを外部メールアドレスに設定
- 必要な過去メールがある場合はXserver解約前にexport

この確認は「メールを動かし続けるため」ではなく、利用終了時の取りこぼし防止である。Cloudflare切り替え後、`calmapercorso.com`宛メールが受信できないことは承認済みの仕様とする。

## Xserverに残る依存

R2移行までは、Xserver依存を既存WordPress画像の配信だけに限定する。

- `calmapercorso.com/*` → production Worker
- `calmapercorso.com/wp-content/uploads/*` → no-script routeでXserver originへ迂回
- apex A → `85.131.213.48`をproxiedで保持

メール、WordPress本文、問い合わせ送信はXserverへ依存させない。

## Xserver解約条件

次をすべて満たすまでXserverを停止・解約しない。

1. 26画像をR2へ移行し、status、MIME、byte数、SHA-256を照合
2. Markdownとbuild成果物の`/wp-content/uploads/`参照が0件
3. productionの全記事・固定ページ・OGP・RSSで画像表示を確認
4. R2移行後30日以上、画像404と表示障害がないことを監視
5. WordPress DB、`wp-content`、設定、DNS履歴を保管
6. Xserverを使わないrollback手順へ更新

Xserver解約は本番Web切り替えとは別の明示承認作業とする。
