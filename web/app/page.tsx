"use client";

import { useState } from "react";
import {
  ApiError,
  getPopularity,
  getRecommendations,
  postPreferences,
  PreferenceItem,
  RecommendationResponse,
  RecommendationWeights,
} from "@/lib/api";
import { UserPicker } from "@/components/UserPicker";
import { WeightControls } from "@/components/WeightControls";
import { RecommendationComparison } from "@/components/RecommendationComparison";
import { ModelInfoBanner } from "@/components/ModelInfoBanner";
import { SkeletonResults } from "@/components/SkeletonCard";
import PreferencePicker from "@/components/PreferencePicker";

const DEFAULT_WEIGHTS = { w_content: 0.05, w_pop: 0.1, w_cf: 0.85, k: 10 };

type Mode = "prefs" | "demo";

export default function Home() {
  const [mode, setMode] = useState<Mode>("prefs");
  const [weights, setWeights] = useState<RecommendationWeights>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    left: RecommendationResponse;
    popularity: RecommendationResponse;
  } | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setResult(null);
    setError(null);
  }

  async function run(fetchLeft: () => Promise<RecommendationResponse>, k: number) {
    setLoading(true);
    setError(null);
    try {
      const [left, popularity] = await Promise.all([fetchLeft(), getPopularity(k)]);
      setResult({ left, popularity });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handlePreferences(prefs: PreferenceItem[]) {
    run(() => postPreferences(prefs, 10), 10);
  }

  function handleDemoSearch(userId: string) {
    const k = weights.k ?? DEFAULT_WEIGHTS.k;
    run(() => getRecommendations(userId, weights), k);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-16">
      <section className="flex flex-col gap-3 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Descubre tu próxima{" "}
          <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-violet-400">
            ciudad favorita
          </span>
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Cuéntanos qué ciudades te gustan y te recomendamos las siguientes, con un motor
          híbrido entrenado sobre el Yelp Academic Dataset.
        </p>
      </section>

      <div
        role="tablist"
        aria-label="Modo de recomendación"
        className="flex w-fit gap-1 rounded-full border border-black/10 bg-white p-1 dark:border-white/10 dark:bg-zinc-900"
      >
        {(
          [
            ["prefs", "Tus gustos"],
            ["demo", "Modo demo académico"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={mode === value}
            onClick={() => switchMode(value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === value
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
        {mode === "prefs" ? (
          <PreferencePicker onSubmit={handlePreferences} loading={loading} />
        ) : (
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Modo demo con usuarios reales del dataset: muestra el sistema híbrido
              completo (colaborativo + contenido + popularidad). Escribe un user_id
              inventado para ver el manejo de cold-start.
            </p>
            <UserPicker onSubmit={handleDemoSearch} loading={loading} />
            <WeightControls defaults={DEFAULT_WEIGHTS} value={weights} onChange={setWeights} />
          </>
        )}
      </section>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && <SkeletonResults />}

      {!loading && result && (
        <RecommendationComparison
          hybrid={result.left}
          popularity={result.popularity}
          leftTitle={result.left.method === "preferences" ? "Según tus gustos" : undefined}
        />
      )}

      {!loading && !result && !error && (
        <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {mode === "prefs"
            ? "Elige tus ciudades favoritas arriba para recibir recomendaciones personalizadas."
            : "Elige un usuario del dataset (o inventa uno) para comparar el ranking híbrido contra la popularidad."}
        </div>
      )}

      <div className="mt-auto pt-8">
        <ModelInfoBanner />
      </div>
    </div>
  );
}
