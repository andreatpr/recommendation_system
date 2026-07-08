"use client";

import { useEffect, useState } from "react";
import { getSampleUsers } from "@/lib/api";

export function UserPicker({
  onSubmit,
  loading,
}: {
  onSubmit: (userId: string) => void;
  loading: boolean;
}) {
  const [sampleUsers, setSampleUsers] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [customUserId, setCustomUserId] = useState("");

  useEffect(() => {
    getSampleUsers(20)
      .then((res) => {
        setSampleUsers(res.user_ids);
        setSelected(res.user_ids[0] ?? "");
      })
      .catch(() => setSampleUsers([]));
  }, []);

  const activeUserId = customUserId.trim() || selected;

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (activeUserId) onSubmit(activeUserId);
      }}
    >
      <label className="flex flex-1 flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Usuario existente</span>
        <select
          className="rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setCustomUserId("");
          }}
        >
          {sampleUsers.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-1 flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">
          o escribe un user_id (para forzar cold-start)
        </span>
        <input
          className="rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
          placeholder="ej. usuario-inventado-123"
          value={customUserId}
          onChange={(e) => setCustomUserId(e.target.value)}
        />
      </label>

      <button
        type="submit"
        disabled={loading || !activeUserId}
        className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Buscando…" : "Descubrir ciudades"}
      </button>
    </form>
  );
}
