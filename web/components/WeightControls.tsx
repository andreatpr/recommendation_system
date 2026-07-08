"use client";

import { useState } from "react";
import { RecommendationWeights } from "@/lib/api";

export function WeightControls({
  defaults,
  value,
  onChange,
}: {
  defaults: { w_content: number; w_pop: number; w_cf: number; k: number };
  value: RecommendationWeights;
  onChange: (weights: RecommendationWeights) => void;
}) {
  const [open, setOpen] = useState(false);

  const k = value.k ?? defaults.k;
  const wContent = value.w_content ?? defaults.w_content;
  const wPop = value.w_pop ?? defaults.w_pop;
  const wCf = value.w_cf ?? defaults.w_cf;

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-2 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400"
      >
        {open ? "▾" : "▸"} Avanzado: pesos del modelo híbrido
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-4 border-t border-black/10 p-4 dark:border-white/10 sm:grid-cols-4">
          <Slider label="k (resultados)" min={1} max={20} step={1} value={k} onChange={(v) => onChange({ ...value, k: v })} />
          <Slider label="Contenido" min={0} max={1} step={0.05} value={wContent} onChange={(v) => onChange({ ...value, w_content: v })} />
          <Slider label="Popularidad" min={0} max={1} step={0.05} value={wPop} onChange={(v) => onChange({ ...value, w_pop: v })} />
          <Slider label="Colaborativo (CF)" min={0} max={1} step={0.05} value={wCf} onChange={(v) => onChange({ ...value, w_cf: v })} />
        </div>
      )}
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
      <span>
        {label}: <span className="font-mono">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
