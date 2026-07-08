const CLUSTER_GRADIENTS = [
  "from-sky-500 to-blue-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-fuchsia-500 to-purple-600",
  "from-rose-500 to-pink-600",
];

const NO_CLUSTER_GRADIENT = "from-zinc-400 to-zinc-600";

// The API emits cluster = -1 as a sentinel for cities without a cluster assignment;
// treat any negative id the same as null (JS negative modulo would index out of range).
export function clusterGradient(cluster: number | null | undefined): string {
  if (cluster === null || cluster === undefined || cluster < 0) return NO_CLUSTER_GRADIENT;
  return CLUSTER_GRADIENTS[cluster % CLUSTER_GRADIENTS.length];
}

export function clusterLabel(cluster: number | null | undefined): string {
  return cluster === null || cluster === undefined || cluster < 0
    ? "Sin cluster"
    : `Cluster ${cluster}`;
}
