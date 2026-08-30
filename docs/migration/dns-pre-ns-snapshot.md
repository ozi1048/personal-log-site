# DNS snapshot immediately before NS change

取得日時: 2026-08-30 10:41:58 JST

この記録は読み取り専用の公開DNS queryと、Cloudflare assigned nameserverへの直接queryで取得した。Xserver管理画面内の非公開・未列挙recordを完全に証明するものではないため、NS変更前にXserver管理画面の全record画面もPDFまたはスクリーンショットで保存する。

## 現在公開中のauthoritative DNS

| name | type | TTL | value |
| --- | --- | ---: | --- |
| `calmapercorso.com` | A | 3600 | `85.131.213.48` |
| `www.calmapercorso.com` | A | 3600 | `85.131.213.48` |
| `calmapercorso.com` | NS | 3600 | `ns1.xserver.jp`〜`ns5.xserver.jp` |
| `calmapercorso.com` | MX | 3600 | priority 0, `calmapercorso.com` |
| `calmapercorso.com` | TXT | 3600 | Xserver用SPFあり |
| `default._domainkey.calmapercorso.com` | TXT | 3600 | Xserver用DKIM公開鍵あり |
| `calmapercorso.com` | SOA | 3600 | `ns1.xserver.jp root.xserver.jp 0 10800 3600 604800 3600` |
| `calmapercorso.com` | DS | - | 応答なし |

公開NSは引き続きXserverで、A recordはWordPress originを指している。独自ドメインメールは終了方針のため、MX/SPF/DKIMはCloudflareへ複製しないが、rollback資料として値を保存する。DKIM全文は`dns-baseline.json`では意図的に省略し、必要な完全値はXserver管理画面の保存物を正とする。

## Cloudflare pending zone

割当NS:

- `dom.ns.cloudflare.com`
- `kinsley.ns.cloudflare.com`

両assigned NSへの直接queryで次を確認した。

| name | type | TTL | value |
| --- | --- | ---: | --- |
| `calmapercorso.com` | A | 300 | `85.131.213.48` |
| `www.calmapercorso.com` | A | 300 | `85.131.213.48` |
| `calmapercorso.com` | TXT | 300 | `google-site-verification=K2Dl7H9zuV7C8epZencG_7rctK9U8B1aZOlVR6FLFt4` |

Cloudflare側にはMX、Xserver用SPF/DKIM、mail、ftp、wildcardを登録していない。NS変更、本番Worker Route接続、WordPress変更はこのsnapshot取得時点で未実施。

## NS変更直前に追加保存する管理画面資料

- Xserver DNSレコード一覧の全画面またはexport
- ドメイン管理会社の現在NSとDNSSEC/DS画面
- Cloudflare DNS record export
- Cloudflare Workers Routes一覧（no-script routeを含む）
- production Worker version IDとdeployment画面
- WordPress/Xserver backupの取得日時、ファイル名、容量、checksum

