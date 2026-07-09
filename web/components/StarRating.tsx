"use client";

const SIZES = { sm: "h-3.5 w-3.5", md: "h-5 w-5" } as const;

function Star({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M10 1.5l2.47 5.36 5.86.63-4.36 3.96 1.2 5.77L10 14.3l-5.17 2.92 1.2-5.77L1.67 7.49l5.86-.63L10 1.5z" />
    </svg>
  );
}

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: keyof typeof SIZES;
}) {
  const starClass = SIZES[size];

  if (readOnly) {
    // Fractional fill: gray row underneath, amber row clipped to value/5.
    return (
      <span className="relative inline-flex" aria-label={`${value.toFixed(1)} de 5 estrellas`}>
        <span className="flex text-zinc-300 dark:text-zinc-600">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={starClass} />
          ))}
        </span>
        <span
          className="absolute inset-0 flex overflow-hidden text-amber-400"
          style={{ width: `${Math.max(0, Math.min(value / 5, 1)) * 100}%` }}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={`${starClass} shrink-0`} />
          ))}
        </span>
      </span>
    );
  }

  return (
    <span className="group inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
          onClick={() => onChange?.(n)}
          className={`transition-colors ${
            n <= value ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"
          } hover:text-amber-500`}
        >
          <Star className={starClass} />
        </button>
      ))}
    </span>
  );
}
