import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import { ConfirmSheet } from '../components/feedback/ConfirmSheet';
import { ErrorModal } from '../components/feedback/ErrorModal';
import { Snackbar, SnackbarVariant } from '../components/feedback/Snackbar';
import { Toast, ToastVariant } from '../components/feedback/Toast';

type SnackState = {
  message: string;
  variant: SnackbarVariant;
};

type ToastState = {
  title: string;
  body?: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
};

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

type FeedbackContextValue = {
  showError: (message: string, options?: { title?: string; mode?: 'modal' | 'snackbar' | 'toast' }) => void;
  showSnack: (message: string, variant?: SnackbarVariant) => void;
  showToast: (
    title: string,
    options?: {
      body?: string;
      variant?: ToastVariant;
      actionLabel?: string;
      onAction?: () => void;
    },
  ) => void;
  showConfirm: (options: ConfirmState) => void;
  hide: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const SNACK_DURATION_MS = 4500;
const TOAST_DURATION_MS = 4500;

type Props = {
  children: ReactNode;
};

export function FeedbackProvider({ children }: Props) {
  const [modal, setModal] = useState<{ message: string; title: string } | null>(null);
  const [snack, setSnack] = useState<SnackState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSnackTimer = useCallback(() => {
    if (snackTimer.current) {
      clearTimeout(snackTimer.current);
      snackTimer.current = null;
    }
  }, []);

  const clearToastTimer = useCallback(() => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearSnackTimer();
    clearToastTimer();
    setModal(null);
    setSnack(null);
    setToast(null);
  }, [clearSnackTimer, clearToastTimer]);

  const hideConfirm = useCallback(() => {
    setConfirm(null);
    setConfirmLoading(false);
  }, []);

  const showSnack = useCallback(
    (message: string, variant: SnackbarVariant = 'info') => {
      clearSnackTimer();
      clearToastTimer();
      setToast(null);
      setSnack({ message, variant });
      snackTimer.current = setTimeout(() => setSnack(null), SNACK_DURATION_MS);
    },
    [clearSnackTimer, clearToastTimer],
  );

  const showToast = useCallback(
    (
      title: string,
      options?: {
        body?: string;
        variant?: ToastVariant;
        actionLabel?: string;
        onAction?: () => void;
      },
    ) => {
      clearSnackTimer();
      clearToastTimer();
      setSnack(null);
      const next: ToastState = {
        title,
        body: options?.body,
        variant: options?.variant ?? 'info',
        actionLabel: options?.actionLabel,
        onAction: options?.onAction,
      };
      setToast(next);
      if (!options?.actionLabel) {
        toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
      }
    },
    [clearSnackTimer, clearToastTimer],
  );

  const showError = useCallback(
    (message: string, options?: { title?: string; mode?: 'modal' | 'snackbar' | 'toast' }) => {
      const mode = options?.mode ?? 'modal';
      if (mode === 'snackbar') {
        showSnack(message, 'error');
        return;
      }
      if (mode === 'toast') {
        showToast(options?.title ?? 'Ошибка', { body: message, variant: 'danger' });
        return;
      }
      clearSnackTimer();
      clearToastTimer();
      setSnack(null);
      setToast(null);
      setModal({ message, title: options?.title ?? 'Ошибка' });
    },
    [clearSnackTimer, clearToastTimer, showSnack, showToast],
  );

  const showConfirm = useCallback((options: ConfirmState) => {
    setConfirm(options);
    setConfirmLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!confirm || confirmLoading) return;
    setConfirmLoading(true);
    try {
      await confirm.onConfirm();
      hideConfirm();
    } catch {
      setConfirmLoading(false);
    }
  }, [confirm, confirmLoading, hideConfirm]);

  useEffect(
    () => () => {
      clearSnackTimer();
      clearToastTimer();
    },
    [clearSnackTimer, clearToastTimer],
  );

  const value = useMemo(
    () => ({ showError, showSnack, showToast, showConfirm, hide }),
    [showError, showSnack, showToast, showConfirm, hide],
  );

  return (
    <FeedbackContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        <Toast
          visible={toast !== null}
          title={toast?.title ?? ''}
          body={toast?.body}
          variant={toast?.variant ?? 'info'}
          actionLabel={toast?.actionLabel}
          onAction={toast?.onAction}
          onDismiss={() => setToast(null)}
        />
        <ErrorModal
          visible={modal !== null}
          message={modal?.message ?? ''}
          title={modal?.title}
          onClose={hide}
        />
        <Snackbar
          visible={snack !== null}
          message={snack?.message ?? ''}
          variant={snack?.variant ?? 'info'}
          onDismiss={hide}
        />
        <ConfirmSheet
          visible={confirm !== null}
          title={confirm?.title ?? ''}
          message={confirm?.message ?? ''}
          confirmLabel={confirm?.confirmLabel}
          cancelLabel={confirm?.cancelLabel}
          destructive={confirm?.destructive ?? true}
          loading={confirmLoading}
          onConfirm={() => void handleConfirm()}
          onCancel={hideConfirm}
        />
      </View>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return ctx;
}
