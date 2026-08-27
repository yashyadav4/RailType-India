import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

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
            gap: 0.8rem;
            padding: 1rem 1.4rem;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            font-family: "JetBrains Mono", monospace;
            background: var(--panel);
            border: 1px solid var(--border);
            color: var(--ink);
            box-shadow: var(--shadow-md);
            max-width: 380px;
          }
          .rt-toast-success svg { color: #4ade80; }
          .rt-toast-error svg { color: #f87171; }
          .rt-toast-info svg { color: var(--marigold); }
        `}</style>

        {toasts.map((t) => (
          <div key={t.id} className={`rt-toast rt-toast-${t.type}`}>
            {t.type === "success" && <CheckCircle2 size={18} />}
            {t.type === "error" && <XCircle size={18} />}
            {t.type === "info" && <Info size={18} />}
            <span style={{ color: "var(--ink)", lineHeight: 1.4 }}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
