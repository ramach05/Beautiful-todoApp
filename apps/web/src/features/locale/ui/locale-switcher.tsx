import { useUnit } from 'effector-react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LOCALE, type AppLocale } from '@bt/shared';

import { Button } from '@/shared/ui/button';

import { $locale, localeChanged } from '../model/locale';

/** Language switcher: the button shows the target language by its own name */
export function LocaleSwitcher() {
  const { t } = useTranslation();
  const locale = useUnit($locale);
  const next: AppLocale = locale === DEFAULT_LOCALE ? 'ru' : DEFAULT_LOCALE;

  return (
    <Button variant="ghost" size="sm" className="shrink-0" onClick={() => localeChanged(next)}>
      {t(`locale.${next}`)}
    </Button>
  );
}
