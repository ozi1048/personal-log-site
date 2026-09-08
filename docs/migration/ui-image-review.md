# UI・アイキャッチ再レビュー（2026-09-08）

対象はpreview。19画像を一覧比較し、色調は維持。過剰に積まれた書類で借金を表現していた `debt-swelling-4m` の1枚を、日常の台所・財布・数通の封筒へ差し替えた。生成イメージであり、筆者の実際の自宅写真ではない。

## UI変更

- 記事一覧・カテゴリの見出しと記事間の大きな余白を短縮。
- 全記事カードを16:9へ統一。画像を絶対配置して、特にモバイルでリンク要素の高さが画像の固有寸法に引きずられる問題を防止。
- トップの最新記事は全幅の横並びカードへ。画像側も16:9を保ち、縦長トリミングを廃止。
- 記事見出しの最大文字サイズを64pxから46.4pxへ抑え、長いタイトルと写真の比重を調整。
- 記事詳細の写真も16:9へ。写真上の記録番号を小さくして主題を隠さない。
- カテゴリ一覧の古いマークアップを写真付きカードへ揃える。モバイルのカテゴリカードを高さ220pxへ調整。
- 読者向けの記事一覧説明から移行システムの説明を除去。

## 新しい画像

保存先: `public/images/posts/debt-swelling-4m.webp`（1600×900 WebP）。同じpathで更新し、frontmatterのaltを画像内容に合わせた。

生成方法: 組み込みimagegen、photorealistic-natural。

最終プロンプト: Use case: photorealistic-natural. Asset type: 16:9 landscape article cover for a quiet Japanese personal documentary blog about debt gradually growing from 100,000 to 4 million yen. A candid, unstyled close environmental photograph of a modest Japanese apartment kitchen table in soft overcast afternoon light. An ordinary worn dark wallet, three or four folded unmarked bill envelopes and a small closed household notebook on a lightly scratched pale wood table, an empty chair partly visible, lived-in but not messy. Composition with breathing space; objects centered within the middle 60 percent for web card cropping. Muted slate, natural beige and faded olive, realistic textures, gentle shadows, normal exposure, no cinematic drama. No tall stack of papers, no cash, no readable writing or numbers, no logos, no typography, no people, no advertising polish, no luxury interior. The emotion is mundane financial reality, reflective and human, not catastrophe. Wide 16:9 photograph.

検証はAstro check/build、既存のURL・SEO・画像テストとpreview画面確認。本番切り替えは対象外。
