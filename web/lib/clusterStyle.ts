const CLUSTER_GRADIENTS = [
  "from-sky-500 to-blue-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-fuchsia-500 to-purple-600",
  "from-rose-500 to-pink-600",
];

export function clusterGradient(cluster: number | null | undefined): string {
  if (cluster === null || cluster === undefined) return "from-zinc-400 to-zinc-600";
  return CLUSTER_GRADIENTS[cluster % CLUSTER_GRADIENTS.length];
}

export function clusterLabel(cluster: number | null | undefined): string {
  return cluster === null || cluster === undefined ? "Sin cluster" : `Cluster ${cluster}`;
}
