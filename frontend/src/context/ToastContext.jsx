import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const toast = useCallback({
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  }, [addToast]);

  // Reassign so toast.success etc. work as methods
  const toastApi = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toastApi}>
      {children}

      {/* Toast container */}
      <div
        style={{
          position: "fixed",
          top: "80px",
          right: "1.5rem",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
          pointerEvents: "none",
        }}
      >
        <style>{`
          @keyframes toastIn {
            from { opacity: 0; transform: translateX(100px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          .rt-toast {
            animation: toastIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.9rem 1.4rem;
            border-radius: 12px;
            font-size: 0.88rem;
            font-weight: 600;
            font-family: inherit;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            max-width: 380px;
          }
          .rt-toast-success {
            background: color-mix(in srgb, #22c55e 15%, var(--panel));
            border: 1px solid color-mix(in srgb, #22c55e 40%, transparent);
            color: #4ade80;
          }
          .rt-toast-error {
            background: color-mix(in srgb, #ef4444 15%, var(--panel));
            border: 1px solid color-mix(in srgb, #ef4444 40%, transparent);
            color: #f87171;
          }
          .rt-toast-info {
            background: color-mix(in srgb, var(--marigold) 15%, var(--panel));
            border: 1px solid color-mix(in srgb, var(--marigold) 40%, transparent);
            color: var(--marigold);
          }
        `}</style>

        {toasts.map((t) => (
          <div key={t.id} className={`rt-toast rt-toast-${t.type}`}>
            {t.type === "success" && "✅"}
            {t.type === "error" && "❌"}
            {t.type === "info" && "🚂"}
            <span style={{ color: "var(--ink)" }}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
