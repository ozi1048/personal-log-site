import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (...parts) => readFileSync(resolve(root, 'dist', ...parts), 'utf8');
const contact = read('お問い合わせ', 'index.html');
const headers = read('_headers');
const robots = read('robots.txt');

assert.match(contact, /data-enabled="true"/);
assert.match(contact, /action="https:\/\/formspree\.io\/f\/xeajwayl"/);
assert.match(contact, /class="cf-turnstile"/);
assert.match(contact, /data-sitekey="0x4AAAAAAEZOOB4bmw0qotmj"/);
assert.match(contact, /cf-turnstile-response/);
assert.match(contact, /送信できませんでした。時間をおいて、もう一度お試しください。/);
assert.match(contact, /メールアドレスを入力してください。/);
assert.match(contact, /お問い合わせ内容を入力してください。/);
assert.match(contact, /Turnstileの確認が必要です。/);
assert.match(contact, /window\.turnstile\?\.reset\(\)/);
assert.match(contact, /<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">/);
assert.match(headers, /X-Robots-Tag: noindex, nofollow, noarchive, nosnippet/);
assert.match(robots, /Disallow: \//);
assert.match(contact, /personal-log-site-production-candidate\.cloudflare-migration-plan\.workers\.dev/);
assert.doesNotMatch(contact, /<link rel="canonical" href="https:\/\/calmapercorso\.com/);

console.log('Verified noindex production candidate with active Formspree + Turnstile and candidate-host canonical.');
