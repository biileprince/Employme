import Link from "next/link";
import { HiArrowLeft } from "react-icons/hi";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-xl border border-border bg-card p-12 shadow-sm max-w-md w-full">
        <h2 className="text-6xl font-extrabold text-primary mb-2">404</h2>
        <h3 className="mb-4 text-2xl font-bold text-foreground">
          Page Not Found
        </h3>
        <p className="mb-8 text-muted-foreground">
          Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button className="w-full">
            <HiArrowLeft className="mr-2 h-4 w-4" />
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
