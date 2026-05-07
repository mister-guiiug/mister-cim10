import { useContext } from 'react';
import {
  DialogContext,
  type DialogContextValue,
} from '../components/DialogContext';

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return ctx;
}
