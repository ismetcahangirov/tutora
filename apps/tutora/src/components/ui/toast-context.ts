/**
 * Toast context + hook (issue #13).
 *
 * Split from the provider component so the file exports no components — this keeps
 * React Fast Refresh happy and avoids a circular import between hook and provider.
 */
import { createContext, useContext } from 'react';

export type ToastType = 'default' | 'success' | 'error' | 'info';

export type ToastOptions = {
  message: string;
  type?: ToastType;
  /** Auto-dismiss delay in ms. Defaults to 3000 (5000 for errors). */
  duration?: number;
};

export type ToastContextValue = {
  show: (options: ToastOptions) => void;
  hide: () => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error('useToast must be used within a <ToastProvider>.');
  }
  return context;
}
