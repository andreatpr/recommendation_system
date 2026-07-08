import { CityBadge, CityScore } from "@/lib/api";
import { clusterGradient, clusterLabel } from "@/lib/clusterStyle";
import { formatCount } from "@/lib/format";
import StarRating from "@/components/StarRating";

const METHOD_PILLS = {
  hybrid: { label: "Híbrido", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  popularity: { label: "Popularidad", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  preferences: { label: "Personalizado", className: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300" },
} as const;

export function Badge({ badge }: { badge: CityBadge }) {
  if (!badge) return null;
  return badge === "popular" ? (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
      Popular
    </span>
  ) : (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
      Joya oculta
    </span>
  );
}

export function CityCard({
  city,
  method,
  relativeScore,
}: {
  city: CityScore;
  method?: keyof typeof METHOD_PILLS;
  relativeScore?: number;
}) {
  const pill = method ? METHOD_PILLS[method] : undefined;

  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-zinc-900">
      <div className={`h-16 bg-gradient-to-br ${clusterGradient(city.cluster)}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold capitalize text-zinc-900 dark:text-zinc-50">
            {city.city}
          </h3>
          {pill && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${pill.className}`}>
              {pill.label}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{clusterLabel(city.cluster)}</p>
          <Badge badge={city.badge} />
        </div>
        {city.avg_rating !== null && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
            <StarRating value={city.avg_rating} readOnly size="sm" />
            <span className="font-medium">{city.avg_rating.toFixed(1)}</span>
            {city.reviewers !== null && (
              <span className="text-zinc-500 dark:text-zinc-400">
                · {formatCount(city.reviewers)} reseñas
              </span>
            )}
          </div>
        )}
        {relativeScore !== undefined && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${Math.round(Math.max(0, Math.min(relativeScore, 1)) * 100)}%` }}
            />
          </div>
        )}
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          score <span className="font-mono">{city.score.toFixed(3)}</span>
        </p>
      </div>
    </div>
  );
}
