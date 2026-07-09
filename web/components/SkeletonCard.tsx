function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
      <div className="h-16 bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

export function SkeletonResults() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {[0, 1].map((col) => (
        <section key={col} className="flex flex-col gap-3">
          <div className="h-6 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
