// types/env.d.ts

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_GOOGLE_SCRIPT_URL: string;
    EXPO_PUBLIC_API_URL: string;
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: string;
  }
}
