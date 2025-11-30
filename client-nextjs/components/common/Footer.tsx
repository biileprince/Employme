import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-xl font-bold text-primary">
              Employ<span className="text-secondary">.me</span>
            </Link>
            <p className="mt-4 text-muted-foreground">
              Connecting employers and job seekers in Ghana with the perfect
              opportunities.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-medium">For Job Seekers</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/jobs"
                  className="text-muted-foreground hover:text-primary"
                >
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link
                  href="/create-profile"
                  className="text-muted-foreground hover:text-primary"
                >
                  Create Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/career-resources"
                  className="text-muted-foreground hover:text-primary"
                >
                  Career Resources
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-medium">For Employers</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/post-job"
                  className="text-muted-foreground hover:text-primary"
                >
                  Post a Job
                </Link>
              </li>
              <li>
                <Link
                  href="/browse-candidates"
                  className="text-muted-foreground hover:text-primary"
                >
                  Browse Candidates
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-muted-foreground hover:text-primary"
                >
                  Pricing Plans
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Employ.me. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
