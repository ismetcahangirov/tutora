import { Global, Module } from '@nestjs/common';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { DEFAULT_LANGUAGE, I18N_LOADER_PATH } from './i18n.config';

/**
 * App-wide i18n wiring (epic #81). `nestjs-i18n`'s `I18nModule` is not global, so
 * it is registered once here and re-exported behind `@Global()` — that makes
 * `I18nService` injectable everywhere (e.g. the mailer) without every feature
 * module re-declaring it.
 *
 * Request language is resolved in order: `?lang=` query → `Accept-Language`
 * header → `x-lang` header, falling back to Azerbaijani. `watch` is disabled so
 * no filesystem watcher leaks and keeps Jest workers alive.
 */
@Global()
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: DEFAULT_LANGUAGE,
      loaderOptions: { path: I18N_LOADER_PATH, watch: false },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
  ],
  exports: [I18nModule],
})
export class AppI18nModule {}
