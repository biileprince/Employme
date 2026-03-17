"use client";

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function GlobalError({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm max-w-md w-full">
            <h1 className="mb-4 text-4xl font-bold text-destructive">Application Error</h1>
            <h2 className="mb-2 text-xl font-semibold">Something went critically wrong!</h2>
            <p className="mb-8 text-muted-foreground">
              A critical error occurred in the application root. We apologize for the inconvenience.
            </p>
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              Try to recover
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
