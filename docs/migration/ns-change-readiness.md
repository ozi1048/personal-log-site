# NS change readiness runbook

この文書はNS変更前後の確認手順であり、NS変更や本番Worker Route接続を許可するものではない。

## 1. Xserver / WordPress完全backup

### 取得対象

1. Xserverの自動バックアップが対象日・対象サーバーで利用可能か確認する。
2. WordPress databaseをphpMyAdminまたはXserverのバックアップ機能からSQLでexportする。文字コード、全table、DROP/CREATE情報を含める。
3. `wp-content`全体（uploads、themes、plugins、mu-pluginsがあればそれも）を保存する。
4. `wp-config.php`、`.htaccess`、robots、verification file、WordPress root直下の独自ファイルを保存する。
5. WordPress core/plugin/theme/PHPのversion、Site Kit設定画面、パーマリンク設定、一般設定を画面保存する。
6. DBとfile backupをXserver外の2か所に保存し、ファイル名、取得時刻、容量、SHA-256を記録する。認証情報をGitHubへcommitしない。

### 完了判定

- archiveが開け、`wp-content/uploads`の代表画像を展開できる
- SQLが空でなく、`wp_posts`、`wp_postmeta`、`wp_options`相当tableを含む
- stagingまたはローカルで復元試験を行うか、Xserverの復元手順・対象日を担当者が確認済み
- rollback担当者がXserver、Cloudflare、registrarへログインできる
- backupの保管場所と復元開始手順を担当者間で共有済み

## 2. 実機スマートフォン確認

iPhone SafariとAndroid Chromeで、Wi-Fiとモバイル回線の少なくとも一方ずつを使う。表示幅エミュレーションだけでは完了扱いにしない。

確認ページ:

- `/`
- `/articles/`
- 長文記事、本文画像付き記事、複数カテゴリ記事を各1件
- `/category/career/`、`/category/money/`、`/category/relocation/`
- `/プロフィール/`、`/privacy-policy-2/`、`/お問い合わせ/`
- 存在しないURL

確認項目:

- 横スクロール、文字切れ、重なりがない
- 本文幅、行間、H2/H3、リスト、引用、画像、captionが読みやすい
- ヘッダー、カテゴリ、前後記事、同カテゴリリンクをタップできる
- 画像がぼやけすぎず、viewport外へはみ出さない
- Contactのlabel、キーボード種別、Turnstile、送信中・成功・各エラー表示
- 404からトップへ戻れる
- Safari/Chromeでコンソール相当の目立つJSエラーやレイアウト崩れがない

結果は機種、OS、browser version、確認日時、合否、スクリーンショット名をprelaunch checklistへ記録する。

## 3. NS変更後24〜48時間の監視

本番Worker Routeはまだ接続せず、Cloudflare proxied AからXserver WordPressを配信する状態で監視する。

| 時点 | 確認内容 | 失敗時 |
| --- | --- | --- |
| 0〜15分 | Cloudflare zone Active、assigned NS、A/TXT、HTTPS、トップ、代表記事、画像 | NS設定とCloudflare recordを再確認。必要ならNS rollback |
| 30分 | 23既存path、固定ページ、WordPress sitemap/robots、画像26件 | 1件でも404/5xxならWorker接続禁止 |
| 1・3・6時間 | 1.1.1.1、8.8.8.8、ISP/モバイル回線のNS/A、証明書、Cloudflare 4xx/5xx | resolver差を記録し継続監視。origin障害ならrollback判断 |
| 12・24時間 | 全URL、画像26件、wp-adminログイン、Search Console TXT、Formspreeページ | 異常があればWorker接続延期 |
| 48時間 | 全項目再検査、監視ログ確定、Worker Route Go判定 | 未解決が1件でもあればNo-Go |

WordPressは監視中に停止・削除せず、記事更新は凍結する。独自ドメインメールは監視対象にしない。

## 4. 画像26件の二段階検査

コマンド:

```text
pnpm verify:production-images
```

第1段階はNS変更後・本番Worker Route接続前に実行し、Cloudflare経由でXserver画像26/26がHTTP 200、`image/*`、空bodyでないことを確認する。

第2段階は包括Route `calmapercorso.com/*`をproduction Workerへ接続した直後に同じコマンドを実行する。この時点で26/26が成功すれば、より具体的なno-script routeがAstro Workerより優先され、画像がoriginへ迂回していることを実通信で確認できる。1件でも失敗、HTML応答、0 byteなら包括Routeを直ちに解除する。

## 5. Search Console DNS確認

1. `dig TXT calmapercorso.com +short`を複数resolverで実行し、Google verification値を確認する。
2. Search Consoleの既存propertyを開き、設定 > 所有権の確認から「ドメイン名プロバイダ」が確認済みになることを確認する。
3. HTMLファイル方式が既存propertyで有効なら、そのpathと内容がCloudflare版にも存在することを確認する。
4. propertyを新規作成せず、Change of Addressを実施しない。
5. sitemap URLを維持し、Worker切り替え後に取得成功を再確認する。

## 6. GA4 / Tag Assistant確認

1. Site Kitで接続中のweb streamが`G-S7GS8NFDWG`と一致することを切り替え前に確認する。
2. Worker切り替え後、Chrome Tag Assistantで`https://calmapercorso.com/`へ接続する。
3. トップ、記事、カテゴリ、Contactを1回ずつ閲覧し、各page_viewが1回だけ送信されることを確認する。
4. GA4 RealtimeまたはDebugViewで自分のdevice/page_locationを確認する。
5. WordPress Site Kit由来の旧タグとAstroタグが同一ページで二重発火していないことを確認する。
6. 広告blocker・同意設定で見えない場合は、無効化した検証用profileで再確認し、結果と時刻を記録する。

## 7. Production Worker RouteのGo条件

次をすべて満たすまで包括Routeを接続しない。

- NS変更から最低24時間、推奨48時間経過し、主要resolverがCloudflare NSへ収束
- WordPressの23既存path、トップ、カテゴリ、固定ページが200
- 第1段階の画像検査が26/26成功
- HTTPS、CSS、WordPress sitemap/robots、wp-admin rollback先が正常
- Search Console TXTが公開DNSで確認可能
- production Worker version、環境変数、CI成功commitが記録済み
- backup、DNS snapshot、rollback担当、即時解除手順が確認済み
- 実機スマートフォン確認が完了
- ユーザーから本番Worker Route接続の明示的許可がある

接続直後は第2段階の画像検査と23 URL検査を最優先で行う。失敗条件に1件でも該当したらRouteを解除し、WordPress配信へ戻す。

