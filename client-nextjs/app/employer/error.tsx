"use client";

import { useEffect } from "react";
import { HiExclamationCircle } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EmployerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Employer section error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm max-w-md w-full flex flex-col items-center">
        <HiExclamationCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Dashboard Error
        </h2>
        <p className="mb-6 text-muted-foreground">
          We couldn&apos;t load your employer dashboard. This might be a
          temporary issue.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => reset()} variant="default">
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
