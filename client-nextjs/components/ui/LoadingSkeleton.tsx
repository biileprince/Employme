export function PageLoadingSkeleton({ title }: { title?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
      <p className="text-muted-foreground">{title || "Loading..."}</p>
    </div>
  );
}

export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-card border border-border rounded-xl p-6"
        >
          <div className="h-6 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-2/3 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6">
            <div className="h-4 bg-muted rounded w-1/2 mb-2" />
            <div className="h-8 bg-muted rounded w-1/3" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="h-6 bg-muted rounded w-1/3 mb-4" />
          <CardsSkeleton count={3} />
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="h-6 bg-muted rounded w-1/3 mb-4" />
          <CardsSkeleton count={3} />
        </div>
      </div>
    </div>
  );
}

export function ProfileFormSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-10 bg-muted rounded w-1/3" />
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="h-6 bg-muted rounded w-1/4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
        <div className="h-10 bg-muted rounded" />
        <div className="h-24 bg-muted rounded" />
      </div>
    </div>
  );
}
