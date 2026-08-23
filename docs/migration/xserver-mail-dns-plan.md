# Xserverメール継続用DNS設計

- 調査日: 2026-08-23（Asia/Tokyo）
- 目的: WebをCloudflare Workersへ移す期間中も、Xserverの既存メール送受信を維持する
- 実施状況: 公開DNSとSMTPを読み取り検証しただけで、DNS・Xserver・Cloudflareには変更なし

## 結論

現在の`MX calmapercorso.com -> calmapercorso.com`を、apex Web recordをCloudflare proxy化した後も維持するのは不可。MX targetの`calmapercorso.com`がCloudflare Anycast IPを返すようになり、Cloudflareの通常HTTP proxyはSMTP port 25をXserverへ中継しないためである。

移行期間はWebとメールを分離し、次を採用候補とする。

```text
A   mail.calmapercorso.com  85.131.213.48             DNS only
MX  calmapercorso.com       mail.calmapercorso.com     priority 0
```

`mail`はMX配送専用。メールソフトのPOP/IMAP/SMTP接続先は変更せず、Xserver公式推奨の`sv16667.xserver.jp`を使う。実際にXserver SMTPが提示した証明書は`*.xserver.jp`であり、`mail.calmapercorso.com`をメールソフトのSSL接続先にすると証明書名が一致しない。

この構成はDNSとして妥当で、Cloudflare公式のメール分離例とも一致する。ただしXserverの標準初期値はMXをapexへ向けるため、実変更前にXserverサポートまたはサーバーパネルで「外部ネームサーバー利用時も、同一Xserver IPを指すmail hostをMX targetにできる」ことを最終確認する。

## 現在値の読み取り結果

| 項目 | 現在値 | 検証結果 |
|---|---|---|
| apex A | `85.131.213.48` | Xserver origin |
| www A | `85.131.213.48` | Xserver origin |
| wildcard A | `*.calmapercorso.com -> 85.131.213.48` | ランダム名で解決を確認 |
| mail A | `85.131.213.48` | 現在はwildcard由来か明示recordか公開DNSだけでは判別不可 |
| MX | `calmapercorso.com`, priority 0 | apex依存 |
| Xserver host | `sv16667.xserver.jp -> 85.131.213.48` | origin IPと一致 |
| SPF | `v=spf1 +a:sv16667.xserver.jp +a:calmapercorso.com +mx include:spf.sender.xserver.jp ~all` | 1 record |
| DKIM | `default._domainkey.calmapercorso.com` | `v=DKIM1; k=rsa; p=...`を確認 |
| DMARC | `_dmarc.calmapercorso.com` | 公開recordなし |
| MTA-STS / TLS-RPT | `_mta-sts` / `_smtp._tls` | 公開TXT recordなし。`mta-sts` A応答はwildcard由来 |
| SMTP STARTTLS証明書 | `CN=*.xserver.jp`, SAN `*.xserver.jp`, `xserver.jp` | メールソフトは`sv16667.xserver.jp`を使用すべき |

Xserver公式のDNS初期値も、apex/www/wildcard A、MX→apex、SPFという現在構成と一致する。Xserverは他社ネームサーバー利用時、サーバーパネルに表示されるDKIM recordを他社DNSへ追加するよう案内している。

参考:

- [Xserver DNSレコード初期値・SPF](https://www.xserver.ne.jp/manual/man_domain_dns_setting.php)
- [Xserver DKIM設定](https://www.xserver.ne.jp/manual/man_mail_dkim.php)
- [Xserverメールソフト設定](https://www.xserver.ne.jp/manual/man_mail_setting.php)
- [Cloudflare email DNS records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/email-records/)
- [Cloudflare email troubleshooting](https://developers.cloudflare.com/dns/troubleshooting/email-issues/)

## Cloudflareへ複製する推奨record

| Type | Name | Content | Proxy | TTL | 用途 |
|---|---|---|---|---:|---|
| A | `@` | `85.131.213.48` | Proxied | Auto | Web。旧WordPress origin＋Worker Route |
| A | `www` | `85.131.213.48` | Proxied | Auto | Web redirect用 |
| A | `mail` | `85.131.213.48` | **DNS only** | 3600 | Xserver SMTP配送専用 |
| A | `ftp` | `85.131.213.48` | **DNS only** | 3600 | 利用中の場合だけ維持 |
| A | `*` | `85.131.213.48` | **DNS only** | 3600 | 移行中の互換性。利用状況確認後に削除候補 |
| MX | `@` | `mail.calmapercorso.com` | DNS only | 3600 | priority 0 |
| TXT | `@` | 現在のSPF全文 | DNS only | 3600 | Xserver送信認証 |
| TXT | `default._domainkey` | Xserver表示値と完全一致 | DNS only | 3600 | DKIM |
| TXT | Google等のverification | 現在値を完全複製 | DNS only | 現在値 | 所有権維持 |

重要事項:

- MX record自体と、そのtargetである`mail`のA recordは両方DNS onlyにする。
- `mail`をCNAMEにしない。MX targetは明示的なA recordにする。
- wildcardをProxiedにしない。mail/ftp/未知のXserver serviceがHTTP proxyへ吸われるのを避ける。
- 明示的な`mail` recordはwildcardより優先される。
- Cloudflare Email Routingは有効化しない。自動でMXが書き換わる可能性がある。
- DKIMの長いTXT値は、Xserverサーバーパネルの表示値を文字欠落なく複製する。DNS応答で複数文字列に分割表示されても、論理的には1つのTXT値として連結される。

## SPF方針

切り替え時は現在のSPFをそのまま複製する。`a:sv16667.xserver.jp`、新しい`mx`、`include:spf.sender.xserver.jp`によってXserver送信元が引き続き許可される。

apexをProxiedにすると`a:calmapercorso.com`はCloudflare edge IPを許可するため不要になるが、SPF変更をNS/Web切り替えと同時に重ねない。メール安定後、Xserverサポート確認と送信header検証を行った別作業で、次のように絞る候補とする。

```text
v=spf1 a:sv16667.xserver.jp mx include:spf.sender.xserver.jp ~all
```

これは将来案であり、Phase 4では変更しない。SPFを複数TXT recordに分けてはいけない。

## DKIM / DMARC方針

- DKIMは現在の`default._domainkey`を完全複製する。Xserver側のDKIM設定はONのままにする。
- DMARCは現在公開されていない。NS移行と同時に新設せず、メール安定後に必要なら`p=none`から段階導入する。
- MTA-STS/TLS-RPTも現在有効ではない。`mail.calmapercorso.com`はXserver証明書のSANに含まれないため、MX分離と同時にMTA-STSを新設しない。MTA-STSを導入する場合はMX hostnameとXserver証明書の整合を別途設計する。
- DKIM selectorやkeyを再生成した場合は、XserverとCloudflare DNSの値が一致するまで切り替えない。

## `sv16667.xserver.jp`を直接MXにする代替案

```text
MX calmapercorso.com -> sv16667.xserver.jp  priority 0
```

技術上の利点は、XserverがIPを変更しても追従でき、SMTP証明書名とも一致すること。欠点はXserverの公開マニュアル上の標準MX構成ではないこと。Xserverサポートから明示的に利用可能との回答を得た場合だけ採用候補とし、現時点の第一案にはしない。

## 安全な実施順序

DNS変更の許可後も、NS変更とMX変更を同時に行わない。

### Stage 1: Xserver authoritative DNS上で先行検証

1. Xserver DNSの完全なexport/画面保存を取得。
2. `mail A 85.131.213.48`を明示recordとして追加する。
3. MXをapexから`mail.calmapercorso.com`へ変更する。
4. TTL 3600の2倍以上待ち、さらに24時間メールを監視する。
5. 外部→Xserver、Xserver→外部、返信をテストする。
6. 受信メールheaderでSPF=pass、DKIM=passを確認する。
7. IMAP 993、POP 995、SMTP 465の既存メールソフト接続を確認する。接続先は`sv16667.xserver.jp`のまま。

Stage 1で問題があれば、Cloudflareへ進まずMXをapexへ戻す。

### Stage 2: Cloudflare pending zoneへ同一値を複製

1. 上表のrecordをCloudflareへ登録する。
2. Cloudflareから割り当てられたauthoritative NSへ直接問い合わせ、A/MX/SPF/DKIMを照合する。
3. `mail`が`85.131.213.48`を返し、Cloudflare IPを返さないことを確認する。
4. Email Routingが無効であることを確認する。

### Stage 3: NSだけをCloudflareへ変更

1. Webはまだ旧WordPressのまま、Worker RouteなしでNSを変更する。
2. 1.1.1.1、8.8.8.8、ISP resolverでNS/MX/mail A/SPF/DKIMを確認する。
3. 外部との送受信と既存メールソフトを再テストする。
4. 24〜48時間安定してからWorker Routeを有効化する。

Web Worker切り替え時にはMX、mail、SPF、DKIMを変更しない。

## 合格条件

- `dig MX calmapercorso.com`が`mail.calmapercorso.com` priority 0
- `dig A mail.calmapercorso.com`が`85.131.213.48`で、Cloudflare Anycastではない
- apex WebはCloudflare proxied IPを返す
- SPF recordが1件で、外部受信headerがSPF=pass
- `default._domainkey`が解決し、外部受信headerがDKIM=pass
- Gmail等からの受信、Xserverからの送信、返信が成功
- IMAP/POP/SMTP clientは`sv16667.xserver.jp`でSSLエラーなし
- Worker有効化後も上記結果が変わらない

## ロールバック

- Stage 1のMX変更で問題: Xserver DNSのMXを`calmapercorso.com`へ戻す。この段階ではapexはまだXserver IPを直接返すため旧構成へ戻れる。
- Cloudflare NS移行後にDNS record不備: `mail`をDNS onlyの`85.131.213.48`へ修正し、MX/SPF/DKIMを保存値へ戻す。
- Cloudflare authoritative DNS自体の問題: registrarのNSをXserverへ戻す。
- apex MXへ完全に戻す必要がある場合: Worker Routeを解除し、apexをDNS onlyで`85.131.213.48`へ戻してからMXをapexへ戻す。apexがProxiedのままMXをapexへ戻してはいけない。
