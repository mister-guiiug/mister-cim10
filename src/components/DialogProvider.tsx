import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ConfirmDialog } from '@mister-guiiug/dev-wpa-config/react/confirm-dialog';
import { DialogContext, type DialogContextValue } from './DialogContext';
import { useI18n } from '../i18n';

interface ActiveDialog {
  type: 'alert' | 'confirm';
  message: string;
  okLabel: string;
  cancelLabel: string;
  resolve: (result: boolean) => void;
}

/**
 * L'API interne (useDialog → alert/confirm en promesses) ne change pas ; seul
 * le RENDU de `confirm` passe au `ConfirmDialog` du socle (rôle alertdialog,
 * focus initial sur Annuler, Échap, verrou de scroll). `alert` garde la
 * <dialog> native locale : le socle rend toujours ses deux boutons et n'a pas
 * de mode à bouton unique.
 */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveDialog | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { t } = useI18n();

  const settle = useCallback((result: boolean) => {
    setActive(current => {
      if (current) current.resolve(result);
      return null;
    });
  }, []);

  // Ouvre la <dialog> native quand une alerte est active (focus trap + ESC).
  useEffect(() => {
    const el = dialogRef.current;
    if (!el || !active || active.type !== 'alert') return;
    if (!el.open) el.showModal();
    const okBtn = el.querySelector<HTMLButtonElement>('[data-result="ok"]');
    okBtn?.focus();
    const onCancel = (e: Event) => {
      e.preventDefault();
      settle(false);
    };
    el.addEventListener('cancel', onCancel);
    return () => el.removeEventListener('cancel', onCancel);
  }, [active, settle]);

  const value = useMemo<DialogContextValue>(
    () => ({
      alert: (message, options) =>
        new Promise<void>(resolve => {
          setActive({
            type: 'alert',
            message,
            okLabel: options?.okLabel ?? t('common.ok'),
            cancelLabel: '',
            resolve: () => resolve(),
          });
        }),
      confirm: (message, options) =>
        new Promise<boolean>(resolve => {
          setActive({
            type: 'confirm',
            message,
            okLabel: options?.okLabel ?? t('common.ok'),
            cancelLabel: options?.cancelLabel ?? t('common.cancel'),
            resolve,
          });
        }),
    }),
    [t]
  );

  return (
    <DialogContext.Provider value={value}>
      {children}
      {active?.type === 'alert' && (
        <dialog ref={dialogRef} className="app-dialog">
          <div className="app-dialog-body">
            <p className="app-dialog-message">{active.message}</p>
            <div className="app-dialog-actions">
              <button
                type="button"
                className="primary"
                data-result="ok"
                onClick={() => settle(true)}
              >
                {active.okLabel}
              </button>
            </div>
          </div>
        </dialog>
      )}
      <ConfirmDialog
        open={active?.type === 'confirm'}
        title={t('common.confirmTitle')}
        message={active?.type === 'confirm' ? active.message : undefined}
        confirmLabel={active?.okLabel}
        cancelLabel={active?.cancelLabel}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </DialogContext.Provider>
  );
}
