import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ConfirmDialog } from '@mister-guiiug/dev-wpa-config/react/confirm-dialog';
import { DialogContext, type DialogContextValue } from './DialogContext';
import { useI18n } from '../i18n';

interface ActiveDialog {
  type: 'alert' | 'confirm';
  message: string;
  /** `undefined` : le libellé par défaut du socle, qui suit déjà la langue. */
  okLabel?: string;
  cancelLabel?: string;
  resolve: (result: boolean) => void;
}

/**
 * L'API interne (useDialog → alert/confirm en promesses) ne change pas ; seul
 * le RENDU passe au `ConfirmDialog` du socle — les DEUX modes désormais.
 *
 * `alert` était resté sur une <dialog> native locale parce que le composant
 * rendait inconditionnellement deux boutons. Le mode MONO-ACTION du socle
 * (3.23.0) lève ce blocage : `cancelLabel={null}` — et non `undefined`, qui
 * garderait le repli « Annuler » — retire le bouton d'annulation, garde le
 * rôle `alertdialog`, pose le focus initial sur l'action unique et fait
 * valoir Échap comme le clic sur le voile pour un « OK » (via `onConfirm`).
 *
 * Les libellés par défaut ne sont plus tirés du dictionnaire de l'app : le
 * socle les fournit (« OK », « Annuler ») et le `SocleLabelsBridge` les
 * accorde à la langue courante. L'app ne nomme donc plus que les titres, que
 * le socle exige pour donner un nom accessible à la boîte.
 */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveDialog | null>(null);
  const { t } = useI18n();

  const settle = useCallback((result: boolean) => {
    setActive(current => {
      if (current) current.resolve(result);
      return null;
    });
  }, []);

  const value = useMemo<DialogContextValue>(
    () => ({
      alert: (message, options) =>
        new Promise<void>(resolve => {
          setActive({
            type: 'alert',
            message,
            okLabel: options?.okLabel,
            resolve: () => resolve(),
          });
        }),
      confirm: (message, options) =>
        new Promise<boolean>(resolve => {
          setActive({
            type: 'confirm',
            message,
            okLabel: options?.okLabel,
            cancelLabel: options?.cancelLabel,
            resolve,
          });
        }),
    }),
    []
  );

  const isAlert = active?.type === 'alert';

  return (
    <DialogContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={active !== null}
        title={isAlert ? t('common.alertTitle') : t('common.confirmTitle')}
        message={active?.message}
        confirmLabel={active?.okLabel}
        // `null` bascule en mono-action ; `undefined` laisserait « Annuler ».
        cancelLabel={isAlert ? null : active?.cancelLabel}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </DialogContext.Provider>
  );
}
