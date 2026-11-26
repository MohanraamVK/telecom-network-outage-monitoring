import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Accessible overlay used for modals ("center") and side panels ("right").
 * Closes on Escape and backdrop click, traps initial focus, restores it on close.
 */
function Dialog({ open, onClose, title, description, children, footer, placement = "center", width = "max-w-lg" }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      // Prefer an explicit target, then the first form field; otherwise the panel itself
      const target =
        panelRef.current?.querySelector("[data-autofocus]") ??
        panelRef.current?.querySelector("form input, form select, form textarea") ??
        panelRef.current;
      target?.focus();
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const isDrawer = placement === "right";

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-fjord-950/70 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={
          isDrawer
            ? `relative ml-auto flex h-full outline-none w-full ${width} flex-col border-l border-fjord-700 bg-fjord-900 shadow-2xl`
            : `relative m-auto flex max-h-[90vh] outline-none w-[calc(100%-2rem)] ${width} flex-col rounded-lg border border-fjord-700 bg-fjord-900 shadow-2xl`
        }
      >
        <header className="flex items-start justify-between gap-4 border-b border-fjord-800 px-6 py-4">
          <div className="min-w-0">
            <h2 id="dialog-title" className="font-display text-xl font-semibold text-fjord-100">
              {title}
            </h2>
            {description ? <div className="mt-1 text-sm text-fjord-400">{description}</div> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded p-2 text-fjord-400 hover:bg-fjord-800 hover:text-fjord-100"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <footer className="flex justify-end gap-2 border-t border-fjord-800 px-6 py-4">{footer}</footer> : null}
      </div>
    </div>,
    document.body
  );
}

export default Dialog;
