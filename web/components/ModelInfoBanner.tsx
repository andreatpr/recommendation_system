"use client";

import { useEffect, useState } from "react";
import { getModelInfo, ModelInfoResponse } from "@/lib/api";

export function ModelInfoBanner() {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<ModelInfoResponse | null>(null);

  useEffect(() => {
    getModelInfo()
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);

  if (!info) return null;

  const { metrics, data_quality: dataQuality } = info;

  return (
    <div className="rounded-lg border border-black/10 text-sm dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400"
      >
        {open ? "▾" : "▸"} Sobre el modelo (métricas y transparencia de datos)
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-6 border-t border-black/10 p-4 dark:border-white/10 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 font-medium text-zinc-900 dark:text-zinc-50">
              Recall@{metrics.k} (evaluación leave-one-out, {metrics.n_users_eval} usuarios)
            </h3>
            <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
              <li>
                Baseline popularidad: recall {(metrics.baseline_popularity.recall * 100).toFixed(1)}%,
                ndcg {metrics.baseline_popularity.ndcg.toFixed(3)}
              </li>
              <li>
                Sistema híbrido: recall {(metrics.hybrid.recall * 100).toFixed(1)}%, ndcg{" "}
                {metrics.hybrid.ndcg.toFixed(3)}
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-zinc-900 dark:text-zinc-50">
              Calidad de datos servidos
            </h3>
            <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
              <li>
                Popularidad por cluster: <strong>{dataQuality.cluster_popularity_source}</strong>
              </li>
              <li>
                Exclusión de ciudades ya vistas:{" "}
                <strong>{dataQuality.seen_exclusion_available ? "disponible" : "no disponible"}</strong>
              </li>
              <li>
                Ciudades en catálogo: {dataQuality.cities_filtered_count}, con score:{" "}
                {dataQuality.cities_scored_count}
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
