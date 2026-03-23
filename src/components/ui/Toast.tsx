"use client";

import { cn } from "@/lib/utils";
import {
  createContext,
  useContext,
  useCallback,
  useState,
  ReactNode,
} from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

/* ─── Types ─── */

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

/* ─── Config ─── */

const AUTO_DISMISS_MS = 3000;

const toastStyles: Record<ToastType, string> = {
  success: "border-success bg-success-bg text-success",
  error: "border-error bg-error-bg text-error",
  warning: "border-warning bg-warning-bg text-warning",
  info: "border-info bg-info-bg text-info",
};

const toastIcons: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="h-4 w-4 shrink-0" />,
  error: <AlertCircle className="h-4 w-4 shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0" />,
  info: <Info className="h-4 w-4 shrink-0" />,
};

/* ─── Context ─── */

const ToastContext = createContext<ToastContextValue | null>(null);

function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

/* ─── Provider ─── */

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
    },
    [removeToast]
  );

  return (
    <ToastContext value={{ toast }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg",
              "animate-in slide-in-from-right-full fade-in duration-300",
              toastStyles[t.type]
            )}
          >
            {toastIcons[t.type]}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="rounded p-0.5 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export { ToastProvider, useToast };
export type { ToastType, Toast };
