import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Modal, Platform, StyleSheet, View } from "react-native";

import { OwnerToast, type OwnerToastVariant } from "@/components/owner/OwnerToast";

const DEFAULT_DURATION_MS = 3000;

export interface ToastOptions {
  message?: string;
  durationMs?: number;
  onDismiss?: () => void;
}

interface ToastState {
  title: string;
  message?: string;
  variant: OwnerToastVariant;
  durationMs: number;
  onDismiss?: () => void;
}

interface ToastContextValue {
  show: (title: string, variant: OwnerToastVariant, options?: ToastOptions) => void;
  success: (title: string, message?: string, options?: Omit<ToastOptions, "message">) => void;
  error: (title: string, message?: string, options?: Omit<ToastOptions, "message">) => void;
  warning: (title: string, message?: string, options?: Omit<ToastOptions, "message">) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const dismiss = useCallback(() => {
    setToast((current) => {
      const callback = current?.onDismiss;
      if (callback) {
        setTimeout(callback, 0);
      }
      return null;
    });
  }, []);

  const show = useCallback((title: string, variant: OwnerToastVariant, options?: ToastOptions) => {
    setToast({
      title,
      message: options?.message,
      variant,
      durationMs: options?.durationMs ?? DEFAULT_DURATION_MS,
      onDismiss: options?.onDismiss,
    });
  }, []);

  const success = useCallback(
    (title: string, message?: string, options?: Omit<ToastOptions, "message">) => {
      show(title, "success", { ...options, message });
    },
    [show],
  );

  const error = useCallback(
    (title: string, message?: string, options?: Omit<ToastOptions, "message">) => {
      show(title, "error", { ...options, message });
    },
    [show],
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Omit<ToastOptions, "message">) => {
      show(title, "warning", { ...options, message });
    },
    [show],
  );

  const value = useMemo(
    () => ({ show, success, error, warning, dismiss }),
    [show, success, error, warning, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.host}>{children}</View>
      <Modal
        visible={!!toast}
        transparent
        animationType="none"
        statusBarTranslucent
        presentationStyle={Platform.OS === "ios" ? "overFullScreen" : undefined}
        onRequestClose={dismiss}>
        <View style={styles.toastOverlay} pointerEvents="box-none">
          <OwnerToast
            visible={!!toast}
            title={toast?.title ?? ""}
            message={toast?.message}
            variant={toast?.variant}
            durationMs={toast?.durationMs}
            onDismiss={dismiss}
          />
        </View>
      </Modal>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1 },
  toastOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
});

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
