import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@shared/ui';

import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, toSupportedLanguage } from './languages';
import { useLanguage } from './use-language';

/** Compact az / en / ru switcher for the topbar and login (epic #81). */
export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('common.selectLanguage')}>
          <Languages />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup
          value={language}
          onValueChange={(value) => setLanguage(toSupportedLanguage(value))}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <DropdownMenuRadioItem key={lang} value={lang}>
              {LANGUAGE_LABELS[lang]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
