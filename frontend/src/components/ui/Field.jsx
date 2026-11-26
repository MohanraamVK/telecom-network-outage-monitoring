import { useId } from "react";

const control =
  "w-full rounded-md bg-fjord-900 px-3 text-sm text-fjord-100 ring-1 ring-inset ring-fjord-700 " +
  "placeholder:text-fjord-400 focus:outline-none focus:ring-2 focus:ring-notice disabled:opacity-60";

function Wrapper({ id, label, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-fjord-300">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-outage">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-fjord-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({ label, hint, error, className = "", ...props }) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${control} h-10 ${error ? "ring-outage" : ""} ${className}`}
        {...props}
      />
    </Wrapper>
  );
}

export function SelectField({ label, hint, error, children, className = "", ...props }) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error}>
      <select id={id} className={`${control} h-10 ${className}`} {...props}>
        {children}
      </select>
    </Wrapper>
  );
}

export function TextArea({ label, hint, error, className = "", ...props }) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error}>
      <textarea id={id} className={`${control} min-h-20 py-2 ${className}`} {...props} />
    </Wrapper>
  );
}
