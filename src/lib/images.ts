import { SITE } from '../config/site';

export type ImageSource = string | undefined;

export function resolveImageUrl(source: ImageSource, origin: string = SITE.productionOrigin): string {
  if (!source) return SITE.defaultOgImage;
  if (source.startsWith('http://') || source.startsWith('https://')) return source;
  return new URL(source, origin).toString();
}

export function resolveDisplayImageUrl(source: ImageSource): string {
  if (!source) return new URL(SITE.defaultOgImage).pathname;
  return source;
}
