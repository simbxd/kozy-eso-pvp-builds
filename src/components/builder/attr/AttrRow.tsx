const TOTAL = 64;

export default function AttrRow({
  label,
  colorClass,
  barClass,
  value,
  max,
  onChange,
}: {
  label: string;
  colorClass: string;
  barClass: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`w-16 shrink-0 text-sm font-body ${colorClass}`}
      >
        {label}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= 0}
          className="flex h-6 w-6 items-center justify-center rounded border border-border-2 text-text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
        >
          −
        </button>
        <span className="w-8 text-center font-mono text-sm text-text">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          className="flex h-6 w-6 items-center justify-center rounded border border-border-2 text-text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
        >
          +
        </button>
      </div>

      <div className="h-2 flex-1 overflow-hidden rounded-full bg-border-2">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${(value / TOTAL) * 100}%` }}
        />
      </div>

      <span className="w-7 shrink-0 text-right font-mono text-[10px] text-text-muted">
        {value > 0 ? `${Math.round((value / TOTAL) * 100)}%` : ""}
      </span>
    </div>
  );
}
