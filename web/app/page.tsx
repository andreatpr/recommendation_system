"use client";

import { useState } from "react";
import {
  ApiError,
  getPopularity,
  getRecommendations,
  RecommendationResponse,
  RecommendationWeights,
} from "@/lib/api";
import { UserPicker } from "@/components/UserPicker";
import { WeightControls } from "@/components/WeightControls";
import { RecommendationComparison } from "@/components/RecommendationComparison";
import { ModelInfoBanner } from "@/components/ModelInfoBanner";

const DEFAULT_WEIGHTS = { w_content: 0.05, w_pop: 0.1, w_cf: 0.85, k: 10 };

export default function Home() {
  const [weights, setWeights] = useState<RecommendationWeights>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    hybrid: RecommendationResponse;
    popularity: RecommendationResponse;
  } | null>(null);

  async function handleSearch(userId: string) {
    setLoading(true);
    setError(null);
    try {
      const k = weights.k ?? DEFAULT_WEIGHTS.k;
      const [hybrid, popularity] = await Promise.all([
        getRecommendations(userId, weights),
        getPopularity(k),
      ]);
      setResult({ hybrid, popularity });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <section className="flex flex-col gap-3 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Descubre tu próxima ciudad favorita
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Un motor de recomendación híbrido (colaborativo + contenido + popularidad),
          entrenado sobre el Yelp Academic Dataset. Elige un usuario conocido o escribe uno
          nuevo para ver cómo el sistema maneja el cold-start.
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
        <UserPicker onSubmit={handleSearch} loading={loading} />
        <WeightControls defaults={DEFAULT_WEIGHTS} value={weights} onChange={setWeights} />
      </section>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {result && <RecommendationComparison hybrid={result.hybrid} popularity={result.popularity} />}

      <div className="mt-auto pt-8">
        <ModelInfoBanner />
      </div>
    </div>
  );
}
