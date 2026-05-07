import { createContext } from 'react';

export interface DialogContextValue {
  alert: (message: string, options?: { okLabel?: string }) => Promise<void>;
  confirm: (
    message: string,
    options?: { okLabel?: string; cancelLabel?: string }
  ) => Promise<boolean>;
}

export const DialogContext = createContext<DialogContextValue | null>(null);
