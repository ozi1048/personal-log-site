# Rollback plan

前提: 本番切り替え後もWordPress/Xserverを少なくとも30日、backupを含めて稼働状態で保持する。WordPressの記事更新・削除・停止はしない。

## 即時rollback条件

- `url-mapping.csv`の既存URLが1件でも404/5xx
- `/wp-content/uploads/`画像が1件でも継続的に404
- productionにnoindexまたは誤canonical
- HTTPS証明書エラー、CSS欠落、重大な本文欠落
- GA4二重計測または全停止が解消できない
- メールDNS障害

## Primary rollback: Worker Route解除

1. 新規編集を止め、発生時刻、症状、対象URL、Worker versionを記録する。
2. Cloudflare Workers Routesから`calmapercorso.com/*`のproduction Worker routeを解除する。
3. apex A record `85.131.213.48`は変更しない。route解除後は旧WordPress originへ戻る。
4. `/`、19記事、固定3、画像3点、`wp-login.php`、sitemap、robotsを確認する。
5. Cloudflare cacheにAstro HTMLが残る場合は対象HTMLだけpurgeする。画像cacheは原因がない限り全消去しない。
6. `dig`と複数回線でDNS/HTTP propagationを確認する。
7. WordPressが正常なら障害通知と原因分析を行い、再切り替えは新しいGo判定後にする。

Routeを使う計画では、A recordは最初から旧WordPressを指し続けるため、通常rollbackにDNS書換えは不要。これがCustom Domainより安全な理由である。

## DNS/zone障害時のrollback

Cloudflare NS移行そのものに問題がある場合のみ、registrarでauthoritative NSを保存済みの`ns1.xserver.jp`〜`ns5.xserver.jp`へ戻す。

1. 事前保存したXserverゾーンが変更されず有効であることを確認する。
2. registrarでCloudflare NSをXserver NSへ戻す。DNSSEC/DSがある場合は整合を先に確認する。
3. 最大24時間を見込み、1.1.1.1、8.8.8.8、ISP resolverでNS/A/MXを確認する。
4. `https://calmapercorso.com/`とメール送受信を確認する。

もしCustom Domainを誤って採用した場合は、Custom Domain/Worker routeを解除し、apex Aを`85.131.213.48`へ復元してから確認する。ただしPhase 4計画ではCustom Domainを採用しない。

## Search Console / GA4

domainとURLは変わらないため、Search ConsoleのChange of Addressは不要。rollback時もpropertyやsitemapを削除しない。所有権tokenを残し、URL inspectionとsitemap fetchだけ確認する。

GA4はWordPressのSite Kitタグへ戻る。Astro Worker route解除後、HTMLにAstro側タグが混在しないことをTag Assistantで確認する。Cloudflare環境変数やWorker自体を削除する必要はなく、再発防止までrouteを外しておく。

## 復旧完了条件

- 23/23既存URLがWordPressで200
- 画像26/26が200
- canonicalが本番URL、noindexなし
- WordPress管理画面にログイン可能
- mail送受信正常
- GA4が1回だけ発火
- DNS resolverの結果が採用したrollback方式と一致

Cloudflare Worker version自体の不具合で、domain routingは正常な場合は`wrangler rollback`またはDashboardのDeploymentsから直前安定versionへ戻すこともできる。参考: [Workers rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)

