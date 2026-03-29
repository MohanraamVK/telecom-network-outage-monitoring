import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ConfirmationProvider } from "./context/ConfirmationContext";
import { ToastProvider } from "./context/ToastContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <ConfirmationProvider>
        <App />
      </ConfirmationProvider>
    </ToastProvider>
  </React.StrictMode>
);