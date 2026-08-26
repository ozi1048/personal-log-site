# WordPress HTML変換分類

- 生成元: 公開WordPress REST APIの保存スナップショット
- 対象: 公開記事 19件、固定ページ 3件
- 元HTML: `docs/migration/source/wordpress-*.json` に保存

## 要素別の処理

| 要素 | 件数 | 処理 | 判定 |
|---|---:|---|---|
| 通常段落 | 1791 | Markdown段落 | 自動変換 |
| H2 | 69 | `##` | 自動変換 |
| H3 | 79 | `###` | 自動変換 |
| リスト | 4 | Markdownリスト | 自動変換 |
| 引用 | 0 | Markdown引用 | 自動変換 |
| 太字 | 55 | `**text**` | 自動変換 |
| リンク | 4 | Markdownリンク。内部リンクは相対path化し、元URLをfrontmatterにも保持 | 自動変換 |
| 本文画像 | 7 | Markdown画像。URL・alt・captionを保持 | 自動変換 |
| 表 | 3 | GitHub Flavored Markdown表 | 自動変換・表示確認推奨 |
| WordPressブロックclass | 12種類 | 意味要素をMarkdown化、装飾classは除去 | 自動変換 |
| ショートコード | 0 | 該当なし | — |
| 埋め込み/script | 1 | Contact Form 7由来scriptは実行せず元HTMLのみ保持 | 手動確認 |
| AFFINGER関連記事カード | 1 | 通常リンクへ変換 | 手動表示確認 |
| AFFINGER装飾 | 17 | 文言と意味要素を保持し、テーマ装飾は除去 | 自動変換 |
| Contact Form 7 | 1 | AstroのFormspreeフォームへ置換。元HTMLはsnapshotに保持 | 実装済み |

## 検出したWordPressブロックclass

- `wp-block-column`
- `wp-block-column-is-layout-flow`
- `wp-block-columns`
- `wp-block-columns-is-layout-flex`
- `wp-block-contact-form-7-contact-form-selector`
- `wp-block-heading`
- `wp-block-image`
- `wp-block-list`
- `wp-block-separator`
- `wp-block-spacer`
- `wp-block-st-blocks-memo`
- `wp-block-table`

## 保持方針

変換後Markdownで削除したテーマ装飾やフォーム実行コードも、元のREST HTMLスナップショットに残している。本文画像URLはWordPressのままとし、表示時は既存の画像URLヘルパーを継続利用する。
