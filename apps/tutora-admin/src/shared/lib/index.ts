// Public API of the shared lib layer. Import via `@shared/lib`.
export { cn } from './cn';
export { pageMetaSchema, paginatedSchema, type PageMeta, type Paginated } from './pagination';
export {
  apiClient,
  API_PREFIX,
  setSessionTokens,
  getSessionTokens,
  configureAuthHandlers,
  type SessionTokens,
  type ApiAuthHandlers,
} from './api-client';
