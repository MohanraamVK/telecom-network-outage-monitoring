import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../hooks/useAuth";
import ChangePasswordDialog from "./ChangePasswordDialog";
import { CommandContext } from "./CommandContext";
import CommandPalette from "./CommandPalette";
import { resolveShortcut } from "./commands";
import ShortcutHelp from "./ShortcutHelp";

/** Owns the command palette, the keyboard shortcuts and the dialogs they open. */
function CommandProvider({ children }) {
  const { canEdit, logout, changePassword } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(null); // "palette" | "shortcuts" | "password" | null
  const pending = useRef(null);

  const close = useCallback(() => setOpen(null), []);

  const runAction = useCallback(
    (action) => {
      if (action === "logout") {
        logout({ redirectToLogin: false });
        navigate("/login", { replace: true });
      } else if (action === "shortcuts") {
        setOpen("shortcuts");
      } else if (action === "change-password" && canEdit) {
        setOpen("password");
      }
    },
    [canEdit, logout, navigate]
  );

  const runItem = useCallback(
    (item) => {
      if (item.to) navigate(item.to);
      else if (item.action) runAction(item.action);
    },
    [navigate, runAction]
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      const { command, pending: next } = resolveShortcut(event, pending.current, { canEdit });
      pending.current = next;
      if (!command) return;
      if (command.palette) {
        event.preventDefault();
        setOpen((current) => (current === "palette" ? null : current ?? "palette"));
        return;
      }
      // Letter shortcuts stay quiet while a dialog is open
      if (open || document.querySelector('[role="dialog"]')) return;
      event.preventDefault();
      if (command.navigate) navigate(command.navigate);
      else if (command.action) runAction(command.action);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [canEdit, navigate, open, runAction]);

  const value = useMemo(() => ({ openPalette: () => setOpen("palette") }), []);

  return (
    <CommandContext.Provider value={value}>
      {children}
      {open === "palette" ? <CommandPalette canEdit={canEdit} onClose={close} onRun={runItem} /> : null}
      <ShortcutHelp open={open === "shortcuts"} onClose={close} canEdit={canEdit} />
      {open === "password" ? (
        <ChangePasswordDialog
          onClose={close}
          changePassword={changePassword}
          onChanged={() => showSuccess("Password changed", "Other sessions have been signed out.")}
        />
      ) : null}
    </CommandContext.Provider>
  );
}

export default CommandProvider;
