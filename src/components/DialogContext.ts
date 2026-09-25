import { createContext } from 'react';

export interface DialogContextValue {
  alert: (message: string, options?: { okLabel?: string }) => Promise<void>;
  confirm: (
    message: string,
    /**
     * `title` remplace « Confirmation » quand la question mérite d'être
     * nommée — l'accord pour la dictée en ligne n'est pas une confirmation
     * d'un geste, c'est un consentement.
     */
    options?: { okLabel?: string; cancelLabel?: string; title?: string }
  ) => Promise<boolean>;
}

export const DialogContext = createContext<DialogContextValue | null>(null);
