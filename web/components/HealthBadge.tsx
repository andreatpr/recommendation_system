"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";

export function HealthBadge() {
  const [status, setStatus] = useState<"checking" | "up" | "down">("checking");

  useEffect(() => {
    getHealth()
      .then((res) => setStatus(res.model_loaded ? "up" : "down"))
      .catch(() => setStatus("down"));
  }, []);

  const color =
    status === "up" ? "bg-emerald-500" : status === "down" ? "bg-red-500" : "bg-zinc-400";
  const label = status === "up" ? "API en línea" : status === "down" ? "API no disponible" : "Comprobando…";

  return (
    <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
