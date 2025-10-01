"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Transition } from "@headlessui/react";
import clsx from "clsx";

type ToastLevel = "info" | "success" | "error";

type Toast = {
  id: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  level?: ToastLevel;
};

type ToastContextValue = {
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, level: "info", ...toast }]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 10000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({ toasts, pushToast, dismissToast }),
    [toasts, pushToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
        {toasts.map((toast) => (
          <Transition
            key={toast.id}
            appear
            show
            enter="transition transform duration-200"
            enterFrom="translate-y-4 opacity-0"
            enterTo="translate-y-0 opacity-100"
            leave="transition transform duration-150"
            leaveFrom="translate-y-0 opacity-100"
            leaveTo="translate-y-2 opacity-0"
          >
            <div
              className={clsx(
                "pointer-events-auto w-full max-w-sm rounded-lg border bg-white p-4 shadow-lg",
                "dark:border-slate-700 dark:bg-slate-800",
                toast.level === "success" &&
                  "border-green-200 bg-green-50 dark:border-green-600 dark:bg-green-900/40",
                toast.level === "error" &&
                  "border-red-200 bg-red-50 dark:border-red-600 dark:bg-red-900/40"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">
                    {toast.title}
                  </p>
                  {toast.description ? (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {toast.description}
                    </p>
                  ) : null}
                </div>
                <button
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-200"
                  onClick={() => dismissToast(toast.id)}
                >
                  Close
                </button>
              </div>
              {toast.onAction ? (
                <button
                  className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 dark:bg-brand-400 dark:text-slate-900 dark:hover:bg-brand-300"
                  onClick={() => {
                    toast.onAction?.();
                    dismissToast(toast.id);
                  }}
                >
                  {toast.actionLabel ?? "Undo"}
                </button>
              ) : null}
            </div>
          </Transition>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
