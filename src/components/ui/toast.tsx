"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
const ToastCtx = createContext<(message: string, tone?: Toast["tone"]) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3500);
  }, []);
  const value = useMemo(() => push, [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[80] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-md border px-3 py-2 text-sm shadow-sm ${
              toast.tone === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : toast.tone === "info"
                  ? "border-blue-200 bg-blue-50 text-blue-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
