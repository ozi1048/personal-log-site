import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const ROOT = process.cwd();
const WP_ORIGIN = 'https://calmapercorso.com';
const POSTS_API = `${WP_ORIGIN}/wp-json/wp/v2/posts?per_page=100&status=publish&_embed=1`;
const PAGES_API = `${WP_ORIGIN}/wp-json/wp/v2/pages?per_page=100&status=publish&_embed=1`;
const CATEGORY_API = `${WP_ORIGIN}/wp-json/wp/v2/categories?per_page=100`;
const args = new Set(process.argv.slice(2));

const paths = {
  inventory: resolve(ROOT, 'docs/migration/phase-1-content-inventory.json'),
  fixedInventory: resolve(ROOT, 'docs/migration/phase-1-fixed-pages.json'),
  sourceDir: resolve(ROOT, 'docs/migration/source'),
  postsSource: resolve(ROOT, 'docs/migration/source/wordpress-posts.json'),
  pagesSource: resolve(ROOT, 'docs/migration/source/wordpress-pages.json'),
  categoriesSource: resolve(ROOT, 'docs/migration/source/wordpress-categories.json'),
  postsContent: resolve(ROOT, 'src/content/posts'),
  pagesContent: resolve(ROOT, 'src/content/pages'),
  report: resolve(ROOT, 'docs/migration/content-conversion-report.csv'),
  pageReport: resolve(ROOT, 'docs/migration/fixed-page-conversion-report.csv'),
  imageReport: resolve(ROOT, 'docs/migration/image-inventory.csv'),
  elementReport: resolve(ROOT, 'docs/migration/wordpress-html-elements.md'),
};

const categoryById = new Map();
const htmlEntityMap = new Map([
  ['amp', '&'], ['lt', '<'], ['gt', '>'], ['quot', '"'], ['apos', "'"], ['nbsp', ' '],
  ['#038', '&'], ['#8211', '–'], ['#8212', '—'], ['#8216', '‘'], ['#8217', '’'],
  ['#8220', '“'], ['#8221', '”'], ['#8230', '…'],
]);

function decodeEntities(value = '') {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, key) => {
    const normalized = key.toLowerCase();
    if (htmlEntityMap.has(normalized)) return htmlEntityMap.get(normalized);
    if (normalized.startsWith('#x')) return String.fromCodePoint(Number.parseInt(normalized.slice(2), 16));
    if (normalized.startsWith('#')) return String.fromCodePoint(Number.parseInt(normalized.slice(1), 10));
    return match;
  });
}

function stripHtml(value = '') {
  return decodeEntities(value)
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripMarkdown(value = '') {
  return value
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~`>|-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows, columns) {
  return `${columns.join(',')}\n${rows.map((row) => columns.map((column) => csvCell(row[column])).join(',')).join('\n')}\n`;
}

function yamlString(value) {
  return JSON.stringify(decodeEntities(value));
}

function yamlArray(name, values) {
  return values.length ? `${name}:\n${values.map((value) => `  - ${yamlString(value)}`).join('\n')}` : `${name}: []`;
}

function writeGenerated(file, value) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, value.endsWith('\n') ? value : `${value}\n`, 'utf8');
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'personal-log-site migration/phase-3' } });
  if (!response.ok) throw new Error(`GET ${url} failed: ${response.status}`);
  return response.json();
}

async function loadSource() {
  if (args.has('--from-snapshot')) {
    return {
      posts: JSON.parse(readFileSync(paths.postsSource, 'utf8')),
      pages: JSON.parse(readFileSync(paths.pagesSource, 'utf8')),
      categories: JSON.parse(readFileSync(paths.categoriesSource, 'utf8')),
    };
  }

  const [posts, pages, categories] = await Promise.all([
    fetchJson(POSTS_API),
    fetchJson(PAGES_API),
    fetchJson(CATEGORY_API),
  ]);
  return { posts, pages, categories };
}

function normalizePost(post) {
  return {
    id: post.id,
    type: post.type,
    slug: post.slug,
    link: post.link,
    date: post.date,
    date_gmt: post.date_gmt,
    modified: post.modified,
    modified_gmt: post.modified_gmt,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    categories: post.categories,
    featured_media: post.featured_media,
    embeddedFeaturedMedia: post.embeddedFeaturedMedia ?? post._embedded?.['wp:featuredmedia']?.map((media) => ({
      id: media.id,
      source_url: media.source_url,
      alt_text: media.alt_text,
      caption: media.caption,
    })) ?? [],
  };
}

function normalizeCategory(category) {
  return { id: category.id, count: category.count, name: category.name, slug: category.slug };
}

function classify(html) {
  const count = (pattern) => [...html.matchAll(pattern)].length;
  const wpClasses = [...html.matchAll(/class="([^"]*\bwp-block-[^\"]*)"/gi)]
    .flatMap((match) => match[1].split(/\s+/).filter((value) => value.startsWith('wp-block-')));
  return {
    paragraphs: count(/<p\b/gi),
    h2: count(/<h2\b/gi),
    h3: count(/<h3\b/gi),
    lists: count(/<(?:ul|ol)\b/gi),
    quotes: count(/<blockquote\b/gi),
    bold: count(/<(?:strong|b)\b/gi),
    links: count(/<a\b/gi),
    images: count(/<img\b/gi),
    tables: count(/<table\b/gi),
    wpBlocks: [...new Set(wpClasses)].sort(),
    shortcodes: [...html.matchAll(/\[[a-z][^\]\n]*\]/gi)].map((match) => match[0]),
    embeds: count(/<(?:iframe|embed|object|script)\b/gi),
    affingerCards: count(/class="[^"]*\bst-cardlink\b/gi),
    affingerDecorations: count(/class="[^"]*(?:\bst-|\bclip-memo)[^"]*"/gi),
    contactForms: count(/<form\b[^>]*class="[^"]*\bwpcf7-form(?:\s|\")/gi),
  };
}

function extractImages(html) {
  const figures = [...html.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi)];
  const captionBySrc = new Map();
  for (const figure of figures) {
    const src = figure[1].match(/<img\b[^>]*\bsrc="([^"]+)"/i)?.[1];
    const caption = stripHtml(figure[1].match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1] ?? '');
    if (src && caption) captionBySrc.set(decodeEntities(src), caption);
  }

  return [...html.matchAll(/<img\b([^>]*)>/gi)].map((match) => {
    const attributes = match[1];
    const src = decodeEntities(attributes.match(/\bsrc="([^"]+)"/i)?.[1] ?? '');
    return {
      url: src,
      alt: decodeEntities(attributes.match(/\balt="([^"]*)"/i)?.[1] ?? ''),
      caption: captionBySrc.get(src) ?? '',
      title: decodeEntities(attributes.match(/\btitle="([^"]*)"/i)?.[1] ?? ''),
    };
  }).filter((image) => image.url);
}

function extractInternalLinks(html) {
  return [...new Set([...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)]
    .map((match) => decodeEntities(match[1]))
    .filter((href) => {
      try { return new URL(href, WP_ORIGIN).origin === WP_ORIGIN; } catch { return false; }
    })
    .map((href) => new URL(href, WP_ORIGIN).toString()))];
}

function markdownConverter() {
  const service = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    strongDelimiter: '**',
    emDelimiter: '*',
  });
  service.use(gfm);
  service.addRule('spacer', {
    filter: (node) => node.nodeName === 'DIV' && node.classList.contains('wp-block-spacer'),
    replacement: () => '\n\n',
  });
  service.addRule('contactForm', {
    filter: (node) => node.nodeName === 'FORM' && node.classList.contains('wpcf7-form'),
    replacement: () => '\n\n> **Previewではお問い合わせフォームを送信できません。** 既存WordPressのContact Form 7設定は移行元スナップショットに保持し、Cloudflare向け送信方式は本番切替前に決定します。\n\n現行フォームの入力項目：\n\n- 氏名（必須）\n- メールアドレス（必須）\n- 題名（必須）\n- メッセージ本文\n\n<!-- Contact Form 7 form ID: 74; manual migration required -->\n\n',
  });
  return service;
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function flattenAffingerCards(html) {
  return html.replace(/<a\b([^>]*class="[^"]*\bst-cardlink\b[^"]*"[^>]*)>([\s\S]*?)<\/a>/gi, (_whole, attributes, body) => {
    const href = decodeEntities(attributes.match(/\bhref="([^"]+)"/i)?.[1] ?? '');
    const imageTag = body.match(/<img\b[^>]*>/i)?.[0] ?? '';
    const title = stripHtml(body.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1] ?? '関連記事');
    const excerpt = stripHtml(body.match(/class="[^"]*\bst-card-excerpt\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? '');
    return `<figure class="migrated-related-card">${imageTag}<figcaption><a href="${escapeHtml(href)}">こちらも合わせて：${escapeHtml(title)}</a></figcaption></figure>${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ''}`;
  });
}

function convertHtml(html) {
  const previewLinkedHtml = flattenAffingerCards(html).replace(
    /href=(['"])https:\/\/calmapercorso\.com(\/[^'\"]*)\1/gi,
    'href=$1$2$1',
  );
  const markdown = markdownConverter().turndown(previewLinkedHtml);
  return markdown
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function descriptionForPost(item, inventory) {
  if (inventory.meta_description) return inventory.meta_description.replace(/\s+/g, ' ').trim();
  if (item.slug === 'debt-restructuring-failed') {
    return '任意整理で返済負担は軽くなったものの、途中で支払いを続けられず自力返済へ切り替えた7年間の記録。デビットカード生活、弁護士相談、返済ルールと立て直せなかった経緯を振り返ります。';
  }
  throw new Error(`Missing meta description: ${item.slug}`);
}

function seoTitleForPost(inventory) {
  return decodeEntities(inventory.html_title).replace(/\s+-\s+calmapercorso$/i, '').trim();
}

const pageConfig = {
  '%e3%83%97%e3%83%ad%e3%83%95%e3%82%a3%e3%83%bc%e3%83%ab': {
    id: 'profile', path: '/プロフィール/', description: '転職10回以上、任意整理と自己破産、40代での地方移住を経験したcalmapercorso運営者のプロフィール。', label: 'ABOUT THIS ARCHIVE',
  },
  'privacy-policy-2': {
    id: 'privacy-policy', path: '/privacy-policy-2/', description: 'calmapercorsoにおける個人情報、広告、アクセス解析、著作権、免責事項についての方針。', label: 'PRIVACY POLICY',
  },
  '%e3%81%8a%e5%95%8f%e3%81%84%e5%90%88%e3%82%8f%e3%81%9b': {
    id: 'contact', path: '/お問い合わせ/', description: 'calmapercorsoへのお問い合わせページ。Cloudflare previewでは送信機能を停止しています。', label: 'CONTACT',
  },
};

function postFrontmatter(item, inventory, images, internalLinks, warnings) {
  return [
    '---',
    `title: ${yamlString(stripHtml(item.title.rendered))}`,
    `seoTitle: ${yamlString(seoTitleForPost(inventory))}`,
    `sourceHtmlTitle: ${yamlString(inventory.html_title)}`,
    `slug: ${yamlString(item.slug)}`,
    `description: ${yamlString(descriptionForPost(item, inventory))}`,
    `publishedAt: ${item.date}+09:00`,
    `updatedAt: ${item.modified}+09:00`,
    yamlArray('categories', inventory.category_slugs),
    `featuredImage: ${yamlString(inventory.featured_image)}`,
    `canonical: ${yamlString(inventory.canonical)}`,
    `wordpressId: ${item.id}`,
    `logNumber: ${Number(stripHtml(item.title.rendered).match(/#(\d+)/)?.[1])}`,
    yamlArray('sourceInternalLinks', internalLinks),
    ...(images.length ? ['bodyImages:', ...images.flatMap((image) => [
      `  - url: ${yamlString(image.url)}`,
      `    alt: ${yamlString(image.alt)}`,
      `    caption: ${yamlString(image.caption)}`,
    ])] : ['bodyImages: []']),
    yamlArray('conversionWarnings', warnings),
    `sourceHtmlFile: ${yamlString('docs/migration/source/wordpress-posts.json')}`,
    'draft: false',
    '---',
  ].join('\n');
}

function pageFrontmatter(item, config, warnings) {
  return [
    '---',
    `title: ${yamlString(stripHtml(item.title.rendered))}`,
    `path: ${yamlString(config.path)}`,
    `description: ${yamlString(config.description)}`,
    `publishedAt: ${item.date}+09:00`,
    `updatedAt: ${item.modified}+09:00`,
    `canonical: ${yamlString(item.link)}`,
    `wordpressId: ${item.id}`,
    `eyebrow: ${yamlString(config.label)}`,
    yamlArray('conversionWarnings', warnings),
    `sourceHtmlFile: ${yamlString('docs/migration/source/wordpress-pages.json')}`,
    '---',
  ].join('\n');
}

const source = await loadSource();
const inventory = JSON.parse(readFileSync(paths.inventory, 'utf8'));

for (const category of source.categories) categoryById.set(category.id, category.slug);
const normalizedPosts = source.posts.map(normalizePost);
const normalizedPages = source.pages.map(normalizePost);
writeGenerated(paths.postsSource, JSON.stringify(normalizedPosts, null, 2));
writeGenerated(paths.pagesSource, JSON.stringify(normalizedPages, null, 2));
writeGenerated(paths.categoriesSource, JSON.stringify(source.categories.map(normalizeCategory), null, 2));

if (normalizedPosts.length !== 19) throw new Error(`Expected 19 published posts, got ${normalizedPosts.length}`);
if (normalizedPages.length !== 3) throw new Error(`Expected 3 published pages, got ${normalizedPages.length}`);
if (inventory.length !== normalizedPosts.length) throw new Error('Phase 1 inventory count does not match REST result');

rmSync(paths.postsContent, { recursive: true, force: true });
mkdirSync(paths.postsContent, { recursive: true });
mkdirSync(paths.pagesContent, { recursive: true });

const reportRows = [];
const pageRows = [];
const imageRows = [];
const aggregate = { paragraphs: 0, h2: 0, h3: 0, lists: 0, quotes: 0, bold: 0, links: 0, images: 0, tables: 0, embeds: 0, affingerCards: 0, affingerDecorations: 0, contactForms: 0, wpBlocks: new Set() };

for (const item of normalizedPosts) {
  const phaseOne = inventory.find((candidate) => candidate.wp_id === item.id);
  if (!phaseOne || phaseOne.slug !== item.slug) throw new Error(`Inventory mismatch for WordPress ID ${item.id}`);
  const actualCategories = item.categories.map((id) => categoryById.get(id)).filter(Boolean).filter((slug) => slug !== 'uncategorized');
  if (JSON.stringify(actualCategories) !== JSON.stringify(phaseOne.category_slugs)) throw new Error(`Category mismatch for ${item.slug}`);

  const html = item.content.rendered;
  const stats = classify(html);
  const images = extractImages(html);
  const internalLinks = extractInternalLinks(html);
  const warnings = [];
  const unconverted = [];
  if (stats.affingerCards) warnings.push('AFFINGER関連記事カードを通常リンクへ変換（表示要確認）');
  if (images.some((image) => !image.alt)) warnings.push(`WordPress元画像のalt欠落: ${images.filter((image) => !image.alt).length}件`);
  if (!phaseOne.meta_description) warnings.push('WordPressで欠落していたmeta descriptionを本文から新規作成');
  if (stats.shortcodes.length) { warnings.push(`ショートコード: ${stats.shortcodes.length}件`); unconverted.push(...stats.shortcodes); }
  if (stats.embeds) { warnings.push(`埋め込み要素: ${stats.embeds}件`); unconverted.push('embed'); }

  const markdown = convertHtml(html);
  const categoryDir = phaseOne.category_slugs[0];
  writeGenerated(resolve(paths.postsContent, categoryDir, `${item.slug}.md`), `${postFrontmatter(item, phaseOne, images, internalLinks, warnings)}\n\n${markdown}`);

  const sourceChars = stripHtml(html).length;
  const markdownChars = stripMarkdown(markdown).length;
  const manual = Boolean(unconverted.length || stats.affingerCards || !phaseOne.meta_description);
  const status = unconverted.length || manual ? 'needs_manual_review' : warnings.length ? 'warning' : 'passed';
  reportRows.push({
    wordpress_id: item.id,
    slug: item.slug,
    status,
    conversion_success: 'true',
    warning_count: warnings.length,
    warnings,
    unconverted_elements: unconverted,
    body_image_count: images.length,
    internal_link_count: internalLinks.length,
    source_text_chars: sourceChars,
    markdown_text_chars: markdownChars,
    text_char_difference: markdownChars - sourceChars,
    text_char_difference_percent: sourceChars ? (((markdownChars - sourceChars) / sourceChars) * 100).toFixed(2) : '0.00',
    manual_review_required: manual ? 'true' : 'false',
  });
  images.forEach((image, index) => imageRows.push({ type: 'post', wordpress_id: item.id, slug: item.slug, image_number: index + 1, url: image.url, alt: image.alt, caption: image.caption, title: image.title }));
  for (const [key, value] of Object.entries(stats)) {
    if (typeof value === 'number') aggregate[key] += value;
    if (key === 'wpBlocks') value.forEach((block) => aggregate.wpBlocks.add(block));
  }
}

for (const item of normalizedPages) {
  const config = pageConfig[item.slug];
  if (!config) throw new Error(`Unknown fixed page slug: ${item.slug}`);
  const html = item.content.rendered;
  const stats = classify(html);
  const warnings = [];
  const unconverted = [];
  if (stats.contactForms) {
    warnings.push('Contact Form 7フォームは静的な案内へ置換。送信機能は未実装');
    unconverted.push('Contact Form 7 submission and validation');
  }
  if (stats.affingerDecorations) warnings.push('AFFINGERメモ装飾を通常本文へ変換（文言は保持）');
  if (stats.embeds && !stats.contactForms) { warnings.push(`埋め込み要素: ${stats.embeds}件`); unconverted.push('embed'); }
  const markdown = convertHtml(html);
  writeGenerated(resolve(paths.pagesContent, `${config.id}.md`), `${pageFrontmatter(item, config, warnings)}\n\n${markdown}`);
  const sourceChars = stripHtml(html).length;
  const markdownChars = stripMarkdown(markdown).length;
  pageRows.push({
    wordpress_id: item.id,
    slug: item.slug,
    path: config.path,
    status: unconverted.length ? 'needs_manual_review' : warnings.length ? 'warning' : 'passed',
    conversion_success: 'true',
    warning_count: warnings.length,
    warnings,
    unconverted_elements: unconverted,
    source_text_chars: sourceChars,
    markdown_text_chars: markdownChars,
    text_char_difference: markdownChars - sourceChars,
    manual_review_required: unconverted.length ? 'true' : 'false',
  });
  for (const [key, value] of Object.entries(stats)) {
    if (typeof value === 'number') aggregate[key] += value;
    if (key === 'wpBlocks') value.forEach((block) => aggregate.wpBlocks.add(block));
  }
}

writeGenerated(paths.report, toCsv(reportRows, [
  'wordpress_id', 'slug', 'status', 'conversion_success', 'warning_count', 'warnings', 'unconverted_elements',
  'body_image_count', 'internal_link_count', 'source_text_chars', 'markdown_text_chars',
  'text_char_difference', 'text_char_difference_percent', 'manual_review_required',
]));
writeGenerated(paths.pageReport, toCsv(pageRows, [
  'wordpress_id', 'slug', 'path', 'status', 'conversion_success', 'warning_count', 'warnings',
  'unconverted_elements', 'source_text_chars', 'markdown_text_chars', 'text_char_difference', 'manual_review_required',
]));
writeGenerated(paths.imageReport, toCsv(imageRows, ['type', 'wordpress_id', 'slug', 'image_number', 'url', 'alt', 'caption', 'title']));

const reportMarkdown = `# WordPress HTML変換分類\n\n` +
`- 生成元: 公開WordPress REST APIの保存スナップショット\n` +
`- 対象: 公開記事 ${normalizedPosts.length}件、固定ページ ${normalizedPages.length}件\n` +
`- 元HTML: \`docs/migration/source/wordpress-*.json\` に保存\n\n` +
`## 要素別の処理\n\n` +
`| 要素 | 件数 | 処理 | 判定 |\n|---|---:|---|---|\n` +
`| 通常段落 | ${aggregate.paragraphs} | Markdown段落 | 自動変換 |\n` +
`| H2 | ${aggregate.h2} | \`##\` | 自動変換 |\n` +
`| H3 | ${aggregate.h3} | \`###\` | 自動変換 |\n` +
`| リスト | ${aggregate.lists} | Markdownリスト | 自動変換 |\n` +
`| 引用 | ${aggregate.quotes} | Markdown引用 | 自動変換 |\n` +
`| 太字 | ${aggregate.bold} | \`**text**\` | 自動変換 |\n` +
`| リンク | ${aggregate.links} | Markdownリンク。内部リンクは相対path化し、元URLをfrontmatterにも保持 | 自動変換 |\n` +
`| 本文画像 | ${aggregate.images} | Markdown画像。URL・alt・captionを保持 | 自動変換 |\n` +
`| 表 | ${aggregate.tables} | GitHub Flavored Markdown表 | 自動変換・表示確認推奨 |\n` +
`| WordPressブロックclass | ${aggregate.wpBlocks.size}種類 | 意味要素をMarkdown化、装飾classは除去 | 自動変換 |\n` +
`| ショートコード | 0 | 該当なし | — |\n` +
`| 埋め込み/script | ${aggregate.embeds} | Contact Form 7由来scriptは実行せず元HTMLのみ保持 | 手動確認 |\n` +
`| AFFINGER関連記事カード | ${aggregate.affingerCards} | 通常リンクへ変換 | 手動表示確認 |\n` +
`| AFFINGER装飾 | ${aggregate.affingerDecorations} | 文言と意味要素を保持し、テーマ装飾は除去 | 自動変換 |\n` +
`| Contact Form 7 | ${aggregate.contactForms} | preview案内へ置換。送信機能は未移行 | 手動確認 |\n\n` +
`## 検出したWordPressブロックclass\n\n${[...aggregate.wpBlocks].sort().map((block) => `- \`${block}\``).join('\n') || '- なし'}\n\n` +
`## 保持方針\n\n変換後Markdownで削除したテーマ装飾やフォーム実行コードも、元のREST HTMLスナップショットに残している。本文画像URLはWordPressのままとし、表示時は既存の画像URLヘルパーを継続利用する。\n`;
writeGenerated(paths.elementReport, reportMarkdown);

console.log(`Migrated ${normalizedPosts.length} posts and ${normalizedPages.length} pages.`);
console.log(`Article statuses: ${JSON.stringify(reportRows.reduce((counts, row) => ({ ...counts, [row.status]: (counts[row.status] ?? 0) + 1 }), {}))}`);
