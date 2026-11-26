export function Spinner({ className = "size-5" }) {
  return (
    <svg className={`animate-spin text-fjord-400 ${className}`} viewBox="0 0 24 24" fill="none" role="status" aria-label="Loading">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-fjord-800 ${className}`} aria-hidden="true" />;
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <svg viewBox="0 0 48 48" className="mb-4 size-10 text-fjord-600" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M24 30v8M16 40h16M24 30a10 10 0 100-20 10 10 0 000 20z" strokeLinecap="round" />
        <path d="M10 14a18 18 0 000 12M38 14a18 18 0 010 12" strokeLinecap="round" />
      </svg>
      <p className="font-display text-lg font-semibold text-fjord-100">{title}</p>
      {children ? <p className="mt-1 max-w-sm text-sm text-fjord-400">{children}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorBanner({ children, onRetry }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-4 rounded-md border border-outage/30 bg-outage/10 px-4 py-3 text-sm text-outage">
      <span>{children}</span>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">
          Try again
        </button>
      ) : null}
    </div>
  );
}
