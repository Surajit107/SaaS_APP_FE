export function SubscriptionPlanSkeletonGrid() {
  return (
    <div className="mt-2 grid gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`plan-skeleton-${index}`} className="border-border rounded-xl border bg-card p-5">
          <div className="bg-muted h-5 w-24 animate-pulse rounded" />
          <div className="bg-muted mt-4 h-8 w-32 animate-pulse rounded" />
          <div className="bg-muted mt-4 h-4 w-full animate-pulse rounded" />
          <div className="bg-muted mt-2 h-4 w-3/4 animate-pulse rounded" />
          <div className="bg-muted mt-6 h-8 w-full animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}
