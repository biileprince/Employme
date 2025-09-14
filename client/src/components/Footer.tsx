import { Link } from 'react-router-dom';

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
              Connecting employers and job seekers in Ghana with the perfect opportunities.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-3">For Job Seekers</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/jobs" className="text-muted-foreground hover:text-primary">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link to="/create-profile" className="text-muted-foreground hover:text-primary">
                  Create Profile
                </Link>
              </li>
              <li>
                <Link to="/career-resources" className="text-muted-foreground hover:text-primary">
                  Career Resources
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-3">For Employers</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/post-job" className="text-muted-foreground hover:text-primary">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link to="/browse-resumes" className="text-muted-foreground hover:text-primary">
                  Browse Resumes
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-primary">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {currentYear} Employ.me. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary">
              Terms of Service
            </Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
