"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ToastKind = "success" | "error";

type Toast = { id: number; kind: ToastKind; message: string };

type ToastApi = (kind: ToastKind, message: string) => void;

const ToastContext = createContext<ToastApi | null>(null);

/**
 * Minimal toast stack — no dependency, no portal, no global store.
 *
 * Wrap the part of the tree that needs it and call `useToast()`. Toasts
 * auto-dismiss after 4s (errors linger at 7s, since they usually ask the user
 * to do something) and can be dismissed early by clicking.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback<ToastApi>((kind, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const ms = toast.kind === "error" ? 7000 : 4000;
    const timer = setTimeout(() => onDismiss(toast.id), ms);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const success = toast.kind === "success";

  return (
    <button
      type="button"
      onClick={() => onDismiss(toast.id)}
      className={`pointer-events-auto flex w-full items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left shadow-lg transition-all ${
        success
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <span className="mt-0.5 shrink-0">
        {success ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1 text-xs leading-relaxed">{toast.message}</span>
      <span className="shrink-0 text-[10px] opacity-50">✕</span>
    </button>
  );
}

/**
 * Returns a `notify(kind, message)` function. Safe to call outside a
 * ToastProvider — it becomes a no-op rather than throwing, so components using
 * it stay reusable in trees that haven't opted in.
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  return ctx ?? (() => {});
}
