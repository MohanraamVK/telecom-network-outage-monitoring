import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow-semi-condensed/500.css";
import "@fontsource/barlow-semi-condensed/600.css";
import "@fontsource/barlow-semi-condensed/700.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ConfirmationProvider } from "./context/ConfirmationContext";
import { LiveProvider } from "./context/LiveContext";
import { ToastProvider } from "./context/ToastContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <ConfirmationProvider>
        <AuthProvider>
          <LiveProvider>
            <App />
          </LiveProvider>
        </AuthProvider>
      </ConfirmationProvider>
    </ToastProvider>
  </React.StrictMode>
);
