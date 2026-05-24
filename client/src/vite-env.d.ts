/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_NODE_ENV: string;
  readonly VITE_SCHOOL_DEMO_EMAIL: string;
  readonly VITE_SCHOOL_DEMO_PASSWORD: string;
  readonly VITE_PARENT_DEMO_EMAIL: string;
  readonly VITE_PARENT_DEMO_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
