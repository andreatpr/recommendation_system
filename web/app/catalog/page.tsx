import Link from "next/link";
import { CityInfo, getCities } from "@/lib/api";
import { clusterGradient, clusterLabel } from "@/lib/clusterStyle";
import { formatCount } from "@/lib/format";
import { Badge } from "@/components/CityCard";
import StarRating from "@/components/StarRating";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ cluster?: string }>;
}) {
  const { cluster: clusterParam } = await searchParams;
  const cluster =
    clusterParam !== undefined && /^\d+$/.test(clusterParam) ? Number(clusterParam) : undefined;

  let allCities: CityInfo[];
  try {
    ({ cities: allCities } = await getCities());
  } catch {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Catálogo de ciudades
        </h1>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          No se pudo cargar el catálogo: la API no está disponible. Verifica que el backend esté
          corriendo e intenta de nuevo.
        </p>
      </div>
    );
  }

  const clusters = [...new Set(allCities.map((c) => c.cluster))].sort((a, b) => a - b);
  const cities = cluster !== undefined ? allCities.filter((c) => c.cluster === cluster) : allCities;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Catálogo de ciudades
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{cities.length} ciudades en el catálogo.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterLink cluster={undefined} active={cluster === undefined} />
        {clusters.map((c) => (
          <FilterLink key={c} cluster={c} active={cluster === c} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {cities.map((c) => (
          <div
            key={c.city}
            className="overflow-hidden rounded-lg border border-black/10 bg-white transition-shadow hover:shadow-md dark:border-white/10 dark:bg-zinc-900"
          >
            <div className={`h-10 bg-gradient-to-br ${clusterGradient(c.cluster)}`} />
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-medium capitalize text-zinc-900 dark:text-zinc-50">
                  {c.city}
                </p>
                <Badge badge={c.badge} />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{clusterLabel(c.cluster)}</p>
              {c.avg_rating !== null && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <StarRating value={c.avg_rating} readOnly size="sm" />
                  <span className="font-medium">{c.avg_rating.toFixed(1)}</span>
                  {c.reviewers !== null && (
                    <span className="text-zinc-500 dark:text-zinc-400">
                      · {formatCount(c.reviewers)} reseñas
                    </span>
                  )}
                </div>
              )}
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
      className={`rounded-full px-3 py-1 text-sm transition-colors ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      }`}
    >
      {label}
    </Link>
  );
}
