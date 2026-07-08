import { CityScore } from "@/lib/api";
import { clusterGradient, clusterLabel } from "@/lib/clusterStyle";

export function CityCard({
  city,
  method,
}: {
  city: CityScore;
  method?: "hybrid" | "popularity";
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <div className={`h-16 bg-gradient-to-br ${clusterGradient(city.cluster)}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold capitalize text-zinc-900 dark:text-zinc-50">
            {city.city}
          </h3>
          {method && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                method === "hybrid"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {method === "hybrid" ? "Híbrido" : "Popularidad"}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {clusterLabel(city.cluster)}
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          score <span className="font-mono">{city.score.toFixed(3)}</span>
        </p>
      </div>
    </div>
  );
}
