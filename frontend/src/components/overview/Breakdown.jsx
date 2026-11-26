import { TONE } from "../../utils/labels";

/** One stacked horizontal bar with a legend: a calmer alternative to pie charts. */
function Breakdown({ title, items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-display text-base font-semibold text-fjord-100">{title}</h3>
        <span className="text-sm text-fjord-400">{total} total</span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-fjord-800" role="img" aria-label={items.map((i) => `${i.label} ${i.value}`).join(", ")}>
        {total > 0
          ? items.map((item) =>
              item.value > 0 ? (
                <span key={item.label} className={TONE[item.tone].bg} style={{ width: `${(item.value / total) * 100}%` }} />
              ) : null
            )
          : null}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-2 text-fjord-300">
              <span className={`size-2 rounded-sm ${TONE[item.tone].bg}`} />
              {item.label}
            </dt>
            <dd className="font-semibold text-fjord-100">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default Breakdown;
