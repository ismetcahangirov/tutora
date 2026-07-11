import { useTranslation } from 'react-i18next';

import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from './languages';
import { useLanguage } from './use-language';

/** az / en / ru switcher for the admin panel (epic #81). */
export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  return (
    <div role="group" aria-label={t('common.selectLanguage')} className="language-switcher">
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          aria-pressed={lang === language}
          onClick={() => setLanguage(lang)}
        >
          {LANGUAGE_LABELS[lang]}
        </button>
      ))}
    </div>
  );
}
