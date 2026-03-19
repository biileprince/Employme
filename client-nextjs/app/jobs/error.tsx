"use client";

import { useEffect } from "react";
import { HiExclamationCircle, HiRefresh } from "react-icons/hi";
import { Button } from "@/components/ui/button";

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Jobs page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm max-w-md w-full text-center">
        <HiExclamationCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Failed to Load Jobs
        </h2>
        <p className="mb-6 text-muted-foreground">
          We&apos;re having trouble fetching job listings. Please try again.
        </p>
        <Button onClick={() => reset()} className="gap-2">
          <HiRefresh className="w-4 h-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}
