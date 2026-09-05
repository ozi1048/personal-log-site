# Featured image management

更新日: 2026-09-05

## 方針

- 全19記事に、記事内容に合わせた個別の写真ベース画像を割り当てる。
- 画像内にタイトル文字を置かず、静かな個人ドキュメンタリーの色調へ統一する。
- 公開ファイルは `public/images/posts/` にslug名で保存する。
- 配信形式はWebP、寸法は1600×900（16:9）、現行ファイルは36〜136KB。
- 記事詳細では `featuredImageAlt` を使用する。一覧のリンク画像は直後に同一記事タイトルがあるため空altとする。
- 画像は今回の初期編集用に生成した独自素材。権利不明な外部写真は使用していない。

## 記事と画像の対応

| slug | category | image path | alt text | 備考 |
|---|---|---|---|---|
| `first-career-change` | career | `/images/posts/first-career-change.webp` | 郊外の駅ホームで電車を見送る会社員 | 初期編集用生成画像。公開前に人物・駅の印象を目視確認 |
| `first-job-9years` | career | `/images/posts/first-job-9years.webp` | 夜のオフィスに残された明かりのついた机 | 初期編集用生成画像 |
| `job-income-history` | career | `/images/posts/job-income-history.webp` | 収入記録の書類とグラフを開いた静かな机 | 初期編集用生成画像。図表の文字は判読用途ではない |
| `taxi-buai-shikumi` | career | `/images/posts/taxi-buai-shikumi.webp` | 夜明けの東京を走るタクシーの運転席 | 初期編集用生成画像 |
| `taxi-eigyo-style` | career | `/images/posts/taxi-eigyo-style.webp` | 分かれ道を前にした東京のタクシー車内 | 初期編集用生成画像 |
| `tokyo-taxi-driver-first-month` | career | `/images/posts/tokyo-taxi-driver-first-month.webp` | 教習コースを歩く指導員と研修中のタクシー | 初期編集用生成画像 |
| `tokyo-taxi-driver-quit-reason` | career | `/images/posts/tokyo-taxi-driver-quit-reason.webp` | 勤務を終えたあとの空のタクシー運転席 | 初期編集用生成画像 |
| `tokyo-taxi-nenshu-real` | career | `/images/posts/tokyo-taxi-nenshu-real.webp` | 雨上がりの高架下を走る東京のタクシー | 初期編集用生成画像 |
| `tokyo-taxi-oneday-record` | career | `/images/posts/tokyo-taxi-oneday-record.webp` | 休憩中のタクシー車内から見える川沿いの街 | 初期編集用生成画像 |
| `bankruptcy-cancellation` | money | `/images/posts/bankruptcy-cancellation.webp` | 書類封筒が残された法律事務所の待合室 | 初期編集用生成画像 |
| `debt-restructuring-failed` | money | `/images/posts/debt-restructuring-failed.webp` | 返済用の封筒とノートが置かれた夜の机 | 初期編集用生成画像 |
| `debt-swelling-4m` | money | `/images/posts/debt-swelling-4m.webp` | 財布の横に積み重なった請求書の束 | 初期編集用生成画像 |
| `first-debt-100k` | money | `/images/posts/first-debt-100k.webp` | 夜のATMでカードを差し出す若者の手元 | 初期編集用生成画像 |
| `side-hustle-obsession` | money | `/images/posts/side-hustle-obsession.webp` | 荷物とノートが積まれた深夜の自宅作業机 | 初期編集用生成画像 |
| `taxi-driver-debt` | money | `/images/posts/taxi-driver-debt.webp` | 荷物を載せて夜明けの東京に停まるタクシー | 初期編集用生成画像 |
| `ijyu-shienkin-failed` | relocation | `/images/posts/ijyu-shienkin-failed.webp` | 山が見える役所の廊下で書類を持って待つ人 | 初期編集用生成画像 |
| `job-change-construction` | relocation | `/images/posts/job-change-construction.webp` | 地方の建設現場に置かれた作業靴とヘルメット | 初期編集用生成画像 |
| `nagano-iju-hansei` | relocation | `/images/posts/nagano-iju-hansei.webp` | 雪山を窓越しに見つめる移住者の後ろ姿 | 初期編集用生成画像 |
| `nagano-migration-rent` | relocation | `/images/posts/nagano-migration-rent.webp` | 段ボールと鍵が置かれた雪国の空き部屋 | 初期編集用生成画像 |

## 生成・差し替え手順

1. 新しいPNG素材をslug名（例: `first-career-change.png`）で同じ入力フォルダへ置く。
2. `pnpm prepare:featured-images -- <入力フォルダ>` を実行する。
3. `public/images/posts/<slug>.webp` が1600×900で更新されたことを確認する。
4. 必要に応じてMarkdownの `featuredImageAlt` を実際の画像内容に合わせて修正する。
5. `pnpm build` と `pnpm test` を実行する。

## 生成時の共通プロンプト方針

写真調の個人ドキュメンタリー、16:9横長、落ち着いた低彩度、自然光、余白のある構図、広告写真やストック写真らしい誇張を避ける、画像内文字・ロゴ・透かしなし。careerは駅・夜の職場・タクシー、moneyは生活感のある机・書類・ATM、relocationは山・雪・地方の部屋や仕事場を主題にし、19記事ごとに異なる場面を指定した。

## 公開前の人手確認

- 生成画像は19記事すべて個別で、同一画像の使い回しはない。
- 一般的な意味での共通プレースホルダーは残っていない。ただし全画像は初期編集用の生成素材なので、実体験写真へ置き換えられる記事は後から優先的に差し替える。
- 特に人物が写る画像、タクシー車両、給与グラフ風の机上画像は、記事経験との整合性と不自然な細部を公開前に再確認する。
