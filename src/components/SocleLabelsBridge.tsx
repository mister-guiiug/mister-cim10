import type { ReactNode } from 'react';
import { LabelsProvider } from '@mister-guiiug/dev-wpa-config/react/labels';
import { useI18n } from '../i18n';

/**
 * Les libellés des composants du socle (ConfirmDialog, BottomNav, ThemeToggle…)
 * suivent la langue choisie dans l'app : sans ce pont, ils resteraient en
 * français quand l'utilisateur passe l'interface en anglais.
 */
export function SocleLabelsBridge({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  return <LabelsProvider locale={locale}>{children}</LabelsProvider>;
}
