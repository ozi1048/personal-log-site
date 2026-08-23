import { SITE } from '../config/site';

export type ImageSource = string | undefined;

export function resolveImageUrl(source: ImageSource): string {
  if (!source) return SITE.defaultOgImage;
  if (source.startsWith('http://') || source.startsWith('https://')) return source;
  return new URL(source, SITE.productionOrigin).toString();
}
