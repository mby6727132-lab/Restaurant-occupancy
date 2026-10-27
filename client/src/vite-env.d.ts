/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** כתובת ה-API של השרת, כולל /api (למשל https://example.com/api) */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
