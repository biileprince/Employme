"use client";

import { useEffect } from "react";
import { HiExclamationCircle } from "react-icons/hi";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm max-w-md w-full flex flex-col items-center">
        <HiExclamationCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Something went wrong!
        </h2>
        <p className="mb-6 text-muted-foreground">
          We&apos;re having trouble loading this section of the application. The error has been logged.
        </p>
        <Button onClick={() => reset()} variant="default">
          Try again
        </Button>
      </div>
    </div>
  );
}
