import { RecommendationResponse } from "@/lib/api";
import { CityCard } from "@/components/CityCard";

export function RecommendationComparison({
  hybrid,
  popularity,
}: {
  hybrid: RecommendationResponse;
  popularity: RecommendationResponse;
}) {
  return (
    <div className="flex flex-col gap-4">
      {hybrid.is_cold_start && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <strong>Usuario nuevo detectado (cold-start).</strong> No hay historial para
          personalizar, así que ambas columnas muestran el ranking de popularidad.
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Recomendación híbrida
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {hybrid.recommendations.map((c) => (
              <CityCard key={c.city} city={c} method={hybrid.method} />
            ))}
          </div>
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Solo popularidad
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {popularity.recommendations.map((c) => (
              <CityCard key={c.city} city={c} method="popularity" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
