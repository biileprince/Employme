import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="text-xl font-bold text-primary">
              Employ<span className="text-secondary">.me</span>
            </Link>
            <p className="mt-4 text-muted-foreground">
              Connecting talent with opportunity across Ghana and beyond. Your
              career journey starts here.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-3">For Job Seekers</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/jobs"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Create Profile
                </Link>
              </li>
              <li>
                <Link
                  to="/jobs?jobType=remote"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Remote Jobs
                </Link>
              </li>
              <li>
                <Link
                  to="/about#job-seekers"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-3">For Employers</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/signup?role=employer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Post a Job
                </Link>
              </li>
              <li>
                <Link
                  to="/auth/login"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Employer Login
                </Link>
              </li>
              <li>
                <Link
                  to="/about#employers"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/about#features"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Features
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <p className="text-muted-foreground text-sm">
              © {currentYear} Employ.me. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-end">
              <Link
                to="/about"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                About Us
              </Link>
              <Link
                to="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
