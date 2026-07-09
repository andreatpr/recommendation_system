import { CityScore, RecommendationResponse } from "@/lib/api";
import { CityCard } from "@/components/CityCard";

function relativeScores(recommendations: CityScore[]): number[] {
  // Raw scores are not 0-1 (popularity uses z-score-derived baseline_score),
  // so the progress bar normalizes within each column.
  const scores = recommendations.map((c) => c.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  return scores.map((s) => (s - min) / range);
}

function Column({
  title,
  response,
  delayOffset = 0,
}: {
  title: string;
  response: RecommendationResponse;
  delayOffset?: number;
}) {
  const relative = relativeScores(response.recommendations);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {response.recommendations.map((c, i) => (
          <div
            key={c.city}
            className="animate-fade-up"
            style={{ animationDelay: `${(i + delayOffset) * 40}ms` }}
          >
            <CityCard city={c} method={response.method} relativeScore={relative[i]} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function RecommendationComparison({
  hybrid,
  popularity,
  leftTitle = "Recomendación híbrida",
}: {
  hybrid: RecommendationResponse;
  popularity: RecommendationResponse;
  leftTitle?: string;
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
        <Column title={leftTitle} response={hybrid} />
        <Column title="Solo popularidad" response={popularity} delayOffset={2} />
      </div>
    </div>
  );
}
