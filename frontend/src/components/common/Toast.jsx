import { TONE } from "../../utils/labels";

const TYPE_TONE = { success: "signal", error: "outage", warning: "caution", info: "notice" };

function Toast({ toast, onRemove }) {
  const tone = TONE[TYPE_TONE[toast.type] ?? "notice"];
  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className="pointer-events-auto flex w-80 gap-3 rounded-md border border-fjord-700 bg-fjord-850 p-4 shadow-xl"
    >
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${tone.bg}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fjord-100">{toast.title}</p>
        {toast.message ? <p className="mt-0.5 text-sm text-fjord-300">{toast.message}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="self-start text-fjord-400 hover:text-fjord-100"
        aria-label="Dismiss notification"
      >
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export default Toast;
