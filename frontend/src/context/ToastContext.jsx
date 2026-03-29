import { createContext, useCallback, useContext, useMemo, useState } from "react";
import ToastContainer from "../components/common/ToastContainer";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, message = "", duration = 3000 }) => {
      const id = Date.now() + Math.random();

      const newToast = {
        id,
        type,
        title,
        message,
      };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (title, message = "", duration = 3000) => {
      showToast({ type: "success", title, message, duration });
    },
    [showToast]
  );

  const showError = useCallback(
    (title, message = "", duration = 4000) => {
      showToast({ type: "error", title, message, duration });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title, message = "", duration = 3000) => {
      showToast({ type: "info", title, message, duration });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title, message = "", duration = 3500) => {
      showToast({ type: "warning", title, message, duration });
    },
    [showToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      showSuccess,
      showError,
      showInfo,
      showWarning,
      removeToast,
    }),
    [showToast, showSuccess, showError, showInfo, showWarning, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}