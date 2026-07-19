// Shared infrastructure. Import via `@shared/lib` / `@/shared/lib`.
export { apiClient, setAuthTokens, configureApiAuth } from './api-client';
export type { SessionTokens, ApiAuthHandlers } from './api-client';
export { storage } from './mmkv-storage';
export type { AppStorage } from './mmkv-storage';
