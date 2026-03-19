import { DashboardSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="p-6">
      <DashboardSkeleton />
    </div>
  );
}
