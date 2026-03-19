import { CardsSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="space-y-6 px-4">
      <div className="animate-pulse h-8 bg-muted rounded w-1/4" />
      <CardsSkeleton count={5} />
    </div>
  );
}
