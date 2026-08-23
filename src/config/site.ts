export const SITE = {
  name: 'calmapercorso',
  tagline: '失敗を繰り返した人間が、過去と向き合うための記録',
  description: '転職、借金、移住。うまくいかなかった選択を、順番に読み返す個人メディアです。',
  language: 'ja',
  author: 'calmapercorso',
  productionOrigin: 'https://calmapercorso.com',
  defaultOgImage: 'https://calmapercorso.com/wp-content/uploads/2026/05/転職14回、全収入推移。-1.png',
} as const;

export const CATEGORIES = {
  career: {
    slug: 'career',
    label: '転職',
    displayLabel: '転　職',
    description: '働き方を変えるたびに見えたもの。転職と仕事の記録。',
    marker: 'WORK',
  },
  money: {
    slug: 'money',
    label: '借金',
    displayLabel: '借　金',
    description: '借りた日から、整理し直すまで。お金と選択の記録。',
    marker: 'DEBT',
  },
  relocation: {
    slug: 'relocation',
    label: '移住',
    displayLabel: '移　住',
    description: '東京を離れ、長野で暮らしてわかったこと。移住の記録。',
    marker: 'MOVE',
  },
} as const;

export type CategorySlug = keyof typeof CATEGORIES;
