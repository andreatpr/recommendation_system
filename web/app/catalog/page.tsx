import Link from "next/link";
import { getCities } from "@/lib/api";
import { clusterGradient, clusterLabel } from "@/lib/clusterStyle";

const CLUSTERS = [0, 1, 2, 3];

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ cluster?: string }>;
}) {
  const { cluster: clusterParam } = await searchParams;
  const cluster = clusterParam !== undefined ? Number(clusterParam) : undefined;
  const { total, cities } = await getCities(cluster);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Catálogo de ciudades
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{total} ciudades en el catálogo.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterLink cluster={undefined} active={cluster === undefined} />
        {CLUSTERS.map((c) => (
          <FilterLink key={c} cluster={c} active={cluster === c} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {cities.map((c) => (
          <div
            key={c.city}
            className="overflow-hidden rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900"
          >
            <div className={`h-10 bg-gradient-to-br ${clusterGradient(c.cluster)}`} />
            <div className="p-3">
              <p className="truncate font-medium capitalize text-zinc-900 dark:text-zinc-50">
                {c.city}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{clusterLabel(c.cluster)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterLink({ cluster, active }: { cluster: number | undefined; active: boolean }) {
  const href = cluster === undefined ? "/catalog" : `/catalog?cluster=${cluster}`;
  const label = cluster === undefined ? "Todos" : clusterLabel(cluster);

  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-sm ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {label}
    </Link>
  );
}
