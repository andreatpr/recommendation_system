"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  getCities,
  getNewUserRecommendations,
  NewUserRating,
  NewUserRecommendationResponse,
} from "@/lib/api";

export function NewUserPicker() {
  const [cities, setCities] = useState<{ city: string; cluster: number }[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [rating, setRating] = useState(5);
  const [ratings, setRatings] = useState<NewUserRating[]>([]);
  const [result, setResult] = useState<NewUserRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCities()
      .then((res) => {
        setCities(res.cities);
        setSelectedCity(res.cities[0]?.city ?? "");
      })
      .catch(() => setError("No se pudo cargar el catálogo de ciudades."));
  }, []);

  const availableCities = useMemo(() => {
    const selected = new Set(ratings.map((r) => r.city));
    return cities.filter((c) => !selected.has(c.city));
  }, [cities, ratings]);

  function addCity() {
    if (!selectedCity) return;

    setRatings((prev) => [
      ...prev,
      {
        city: selectedCity,
        rating,
      },
    ]);

    setResult(null);
    setSelectedCity("");
    setRating(5);
  }

  function removeCity(city: string) {
    setRatings((prev) => prev.filter((r) => r.city !== city));
    setResult(null);
  }

  async function generateRecommendations() {
    if (ratings.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getNewUserRecommendations(ratings, 10);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo generar la recomendación.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Nuevo usuario
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Selecciona ciudades que te gustan y asigna una calificación para construir un perfil temporal.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Ciudad</span>
          <select
            className="rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="">Selecciona una ciudad</option>
            {availableCities.map((c) => (
              <option key={c.city} value={c.city}>
                {c.city} · cluster {c.cluster}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Rating</span>
          <select
            className="rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            <option value={5}>5 ★</option>
            <option value={4}>4 ★</option>
            <option value={3}>3 ★</option>
            <option value={2}>2 ★</option>
            <option value={1}>1 ★</option>
          </select>
        </label>

        <button
          type="button"
          onClick={addCity}
          disabled={!selectedCity}
          className="rounded-lg bg-zinc-900 px-5 py-2 font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Agregar
        </button>
      </div>

      {ratings.length > 0 && (
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Historial simulado
          </h3>

          <div className="flex flex-col gap-2">
            {ratings.map((r) => (
              <div
                key={r.city}
                className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800"
              >
                <span>
                  <strong>{r.city}</strong> · {r.rating} ★
                </span>

                <button
                  type="button"
                  onClick={() => removeCity(r.city)}
                  className="text-red-600 hover:underline dark:text-red-400"
                >
                  quitar
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={generateRecommendations}
            disabled={loading}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Generando…" : "Generar recomendaciones"}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Recomendaciones para nuevo usuario
          </h3>

          <div className="grid gap-2">
            {result.recommendations.map((r, index) => (
              <div
                key={r.city}
                className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800"
              >
                <div>
                  <span className="font-semibold">
                    {index + 1}. {r.city}
                  </span>
                  <span className="ml-2 text-zinc-500">
                    cluster {r.cluster ?? "-"}
                  </span>
                </div>

                <div className="text-right text-xs text-zinc-600 dark:text-zinc-400">
                  <div>score: {r.score.toFixed(3)}</div>
                  <div>
                    content: {r.content_score.toFixed(3)} · pop:{" "}
                    {r.popularity_score.toFixed(3)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}