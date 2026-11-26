/** A key cap, e.g. <Kbd>g</Kbd> */
function Kbd({ children }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-fjord-700 bg-fjord-850 px-1 font-sans text-[11px] font-medium text-fjord-300">
      {children}
    </kbd>
  );
}

export function KeySequence({ keys }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((key, i) => (
        <Kbd key={`${key}-${i}`}>{key}</Kbd>
      ))}
    </span>
  );
}

export default Kbd;
