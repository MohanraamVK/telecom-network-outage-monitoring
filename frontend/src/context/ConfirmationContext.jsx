import { createContext, useContext, useMemo, useState } from "react";
import ConfirmationModal from "../components/common/ConfirmationModal";

const ConfirmationContext = createContext(null);

export function ConfirmationProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    confirmVariant: "danger",
    resolve: null,
  });

  const confirm = (options) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: options.title || "Are you sure?",
        message: options.message || "",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        confirmVariant: options.confirmVariant || "danger",
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    if (modalState.resolve) {
      modalState.resolve(true);
    }

    setModalState((prev) => ({
      ...prev,
      isOpen: false,
      resolve: null,
    }));
  };

  const handleCancel = () => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }

    setModalState((prev) => ({
      ...prev,
      isOpen: false,
      resolve: null,
    }));
  };

  const value = useMemo(
    () => ({
      confirm,
    }),
    []
  );

  return (
    <ConfirmationContext.Provider value={value}>
      {children}

      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        confirmVariant={modalState.confirmVariant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirmation() {
  const context = useContext(ConfirmationContext);

  if (!context) {
    throw new Error("useConfirmation must be used inside ConfirmationProvider");
  }

  return context;
}