/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_GA_MEASUREMENT_ID?: string;
  readonly PUBLIC_DEPLOYMENT_ENV?: 'preview' | 'production-candidate' | 'production';
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_CONTACT_FORM_ENABLED?: 'true' | 'false';
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
