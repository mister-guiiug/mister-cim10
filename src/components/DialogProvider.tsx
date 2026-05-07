import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { DialogContext, type DialogContextValue } from './DialogContext';

interface ActiveDialog {
  type: 'alert' | 'confirm';
  message: string;
  okLabel: string;
  cancelLabel: string;
  resolve: (result: boolean) => void;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveDialog | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const settle = useCallback((result: boolean) => {
    setActive(current => {
      if (current) current.resolve(result);
      return null;
    });
  }, []);

  // Ouvre la <dialog> native quand un dialogue est actif (focus trap + ESC).
  useEffect(() => {
    const el = dialogRef.current;
    if (!el || !active) return;
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
            okLabel: options?.okLabel ?? 'OK',
            cancelLabel: '',
            resolve: () => resolve(),
          });
        }),
      confirm: (message, options) =>
        new Promise<boolean>(resolve => {
          setActive({
            type: 'confirm',
            message,
            okLabel: options?.okLabel ?? 'OK',
            cancelLabel: options?.cancelLabel ?? 'Annuler',
            resolve,
          });
        }),
    }),
    []
  );

  return (
    <DialogContext.Provider value={value}>
      {children}
      {active && (
        <dialog ref={dialogRef} className="app-dialog">
          <div className="app-dialog-body">
            <p className="app-dialog-message">{active.message}</p>
            <div className="app-dialog-actions">
              {active.type === 'confirm' && (
                <button
                  type="button"
                  className="secondary"
                  data-result="cancel"
                  onClick={() => settle(false)}
                >
                  {active.cancelLabel}
                </button>
              )}
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
    </DialogContext.Provider>
  );
}
