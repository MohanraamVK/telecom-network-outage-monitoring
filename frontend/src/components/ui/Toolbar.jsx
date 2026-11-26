import { useEffect, useState } from "react";

/** Search box that reports its value after the user stops typing. */
export function SearchInput({ value, onChange, placeholder = "Search", delay = 300 }) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // The parent cleared or changed the search: show its value
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return undefined;
    const timer = setTimeout(() => onChange(draft), delay);
    return () => clearTimeout(timer);
  }, [draft, value, onChange, delay]);

  return (
    <div className="relative w-full sm:w-72">
      <svg viewBox="0 0 20 20" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fjord-400" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="9" r="6" />
        <path d="M14 14l3.5 3.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-md bg-fjord-900 pr-3 pl-9 text-sm text-fjord-100 ring-1 ring-fjord-700 ring-inset placeholder:text-fjord-400 focus:ring-2 focus:ring-notice focus:outline-none"
      />
    </div>
  );
}

/** Row of mutually exclusive filter buttons. options: [{ value, label }] */
export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md bg-fjord-900 p-1 ring-1 ring-fjord-700 ring-inset">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`h-8 rounded px-3 text-sm font-medium transition-colors ${
              active ? "bg-fjord-700 text-fjord-100" : "text-fjord-400 hover:text-fjord-100"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Pagination({ page, totalPages, totalElements, size, onPageChange, onSizeChange }) {
  if (!totalElements) return null;
  const from = page * size + 1;
  const to = Math.min(totalElements, (page + 1) * size);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-fjord-800 px-4 py-3 text-sm text-fjord-400">
      <span>
        {from}–{to} of {totalElements}
      </span>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <span>Rows</span>
          <select
            value={size}
            onChange={(event) => onSizeChange(Number(event.target.value))}
            className="h-8 rounded bg-fjord-900 px-2 text-fjord-100 ring-1 ring-fjord-700 ring-inset"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-1">
          <PageButton disabled={page === 0} onClick={() => onPageChange(page - 1)} label="Previous page">
            <path d="M12 5l-5 5 5 5" />
          </PageButton>
          <span className="flex h-8 items-center px-2 text-fjord-300">
            {page + 1} / {Math.max(totalPages, 1)}
          </span>
          <PageButton disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)} label="Next page">
            <path d="M8 5l5 5-5 5" />
          </PageButton>
        </div>
      </div>
    </div>
  );
}

function PageButton({ disabled, onClick, label, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded text-fjord-300 ring-1 ring-fjord-700 ring-inset hover:bg-fjord-800 disabled:opacity-40"
    >
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

/** Clickable table header that toggles asc/desc. sort is "field,dir". */
export function SortHeader({ field, sort, onSort, children, className = "" }) {
  const [current, dir] = (sort ?? "").split(",");
  const active = current === field;
  const next = active && dir === "asc" ? "desc" : "asc";
  return (
    <th scope="col" className={`px-4 py-3 font-medium ${className}`} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort(`${field},${next}`)} className="inline-flex items-center gap-1 hover:text-fjord-100">
        {children}
        <svg viewBox="0 0 10 14" className={`h-3 w-2 ${active ? "text-notice" : "text-fjord-600"}`} fill="currentColor">
          <path d="M5 0l4 5H1z" opacity={active && dir === "desc" ? 0.3 : 1} />
          <path d="M5 14L1 9h8z" opacity={active && dir === "asc" ? 0.3 : 1} />
        </svg>
      </button>
    </th>
  );
}
