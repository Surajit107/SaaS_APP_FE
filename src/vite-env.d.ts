/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  /** Base origin of the operator/admin SPA when served separately from this app. */
  readonly VITE_ADMIN_APP_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
