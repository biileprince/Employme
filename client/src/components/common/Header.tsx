import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { HiChevronDown, HiMenu, HiX, HiUser, HiLogout } from "react-icons/hi";
import ThemeToggle from "../ui/ThemeToggle";
import Button from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";

const Header = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownTimerRef = useRef<number | null>(null);

  const handleMouseEnter = (dropdown: string) => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
    }
    setActiveDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    dropdownTimerRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150); // Small delay to prevent flickering
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (dropdownTimerRef.current) {
        clearTimeout(dropdownTimerRef.current);
      }
    };
  }, []);

  const handleLogout = async () => {
    await handleSignOut();
  };

  return (
    <header className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto py-4 px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="text-3xl md:text-4xl font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Employ<span className="text-secondary">.</span>
            <span className="text-secondary">me</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <nav className="flex items-center gap-8">
              {user ? (
                // Authenticated Users Navigation - Dashboard + General Navigation
                <>
                  <Link
                    to={
                      user?.role === "EMPLOYER"
                        ? "/employer/dashboard"
                        : "/dashboard"
                    }
                    className="text-foreground hover:text-primary transition-colors font-medium text-base px-3 py-2 rounded-lg hover:bg-muted/50"
                  >
                    Dashboard
                  </Link>

                  {/* Jobs Dropdown */}
                  <div
                    className="relative group"
                    onMouseEnter={() => handleMouseEnter("jobs")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to="/jobs"
                      className="flex items-center text-foreground hover:text-primary transition-colors font-medium text-base gap-1 px-3 py-2 rounded-lg hover:bg-muted/50"
                    >
                      Jobs
                      <HiChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          activeDropdown === "jobs" ? "rotate-180" : ""
                        }`}
                      />
                    </Link>

                    {activeDropdown === "jobs" && (
                      <div
                        className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg p-4 z-50"
                        onMouseEnter={() => handleMouseEnter("jobs")}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="space-y-2">
                          <Link
                            to="/jobs"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Browse All Jobs
                          </Link>
                          <Link
                            to="/jobs?category=TECHNOLOGY"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Technology Jobs
                          </Link>
                          <Link
                            to="/jobs?category=FINANCE"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Finance Jobs
                          </Link>
                          <Link
                            to="/jobs?category=HEALTHCARE"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Healthcare Jobs
                          </Link>
                          <Link
                            to="/jobs?jobType=remote"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Remote Jobs
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Employers Dropdown */}
                  <div
                    className="relative group"
                    onMouseEnter={() => handleMouseEnter("employers")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to="/employers"
                      className="flex items-center text-foreground hover:text-primary transition-colors font-medium text-base gap-1 px-3 py-2 rounded-lg hover:bg-muted/50"
                    >
                      Employers
                      <HiChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          activeDropdown === "employers" ? "rotate-180" : ""
                        }`}
                      />
                    </Link>

                    {activeDropdown === "employers" && (
                      <div
                        className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg p-4 z-50"
                        onMouseEnter={() => handleMouseEnter("employers")}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="space-y-2">
                          <Link
                            to="/post-job"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Post a Job
                          </Link>
                          <Link
                            to="/browse-candidates"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Browse Candidates
                          </Link>
                          <Link
                            to="/employer-dashboard"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Employer Dashboard
                          </Link>
                          <Link
                            to="/pricing"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Pricing Plans
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Resources Dropdown */}
                  <div
                    className="relative group"
                    onMouseEnter={() => handleMouseEnter("resources")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to="/resources"
                      className="flex items-center text-foreground hover:text-primary transition-colors font-medium text-base gap-1 px-3 py-2 rounded-lg hover:bg-muted/50"
                    >
                      Resources
                      <HiChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          activeDropdown === "resources" ? "rotate-180" : ""
                        }`}
                      />
                    </Link>

                    {activeDropdown === "resources" && (
                      <div
                        className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg p-4 z-50"
                        onMouseEnter={() => handleMouseEnter("resources")}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="space-y-2">
                          <Link
                            to="/career-advice"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Career Advice
                          </Link>
                          <Link
                            to="/resume-builder"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Resume Builder
                          </Link>
                          <Link
                            to="/interview-tips"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Interview Tips
                          </Link>
                          <Link
                            to="/salary-guide"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Salary Guide
                          </Link>
                          <Link
                            to="/blog"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Blog
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    to="/about"
                    className="text-foreground hover:text-primary transition-colors font-medium text-base px-3 py-2 rounded-lg hover:bg-muted/50"
                  >
                    About
                  </Link>
                </>
              ) : (
                // Public Navigation (for non-authenticated users)
                <>
                  {/* Jobs Dropdown */}
                  <div
                    className="relative group"
                    onMouseEnter={() => handleMouseEnter("jobs")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to="/jobs"
                      className="flex items-center text-foreground hover:text-primary transition-colors font-medium text-base gap-1 px-3 py-2 rounded-lg hover:bg-muted/50"
                    >
                      Jobs
                      <HiChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          activeDropdown === "jobs" ? "rotate-180" : ""
                        }`}
                      />
                    </Link>

                    {activeDropdown === "jobs" && (
                      <div
                        className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg p-4 z-50"
                        onMouseEnter={() => handleMouseEnter("jobs")}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="space-y-2">
                          <Link
                            to="/jobs"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Browse All Jobs
                          </Link>
                          <Link
                            to="/jobs?category=TECHNOLOGY"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Technology Jobs
                          </Link>
                          <Link
                            to="/jobs?category=FINANCE"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Finance Jobs
                          </Link>
                          <Link
                            to="/jobs?category=HEALTHCARE"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Healthcare Jobs
                          </Link>
                          <Link
                            to="/jobs?jobType=remote"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Remote Jobs
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Employers Dropdown */}
                  <div
                    className="relative group"
                    onMouseEnter={() => handleMouseEnter("employers")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to="/employers"
                      className="flex items-center text-foreground hover:text-primary transition-colors font-medium text-base gap-1 px-3 py-2 rounded-lg hover:bg-muted/50"
                    >
                      Employers
                      <HiChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          activeDropdown === "employers" ? "rotate-180" : ""
                        }`}
                      />
                    </Link>

                    {activeDropdown === "employers" && (
                      <div
                        className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg p-4 z-50"
                        onMouseEnter={() => handleMouseEnter("employers")}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="space-y-2">
                          <Link
                            to="/post-job"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Post a Job
                          </Link>
                          <Link
                            to="/browse-candidates"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Browse Candidates
                          </Link>
                          <Link
                            to="/employer-dashboard"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Employer Dashboard
                          </Link>
                          <Link
                            to="/pricing"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Pricing Plans
                          </Link>
                          <Link
                            to="/employer-resources"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Resources
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Resources Dropdown */}
                  <div
                    className="relative group"
                    onMouseEnter={() => handleMouseEnter("resources")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to="/resources"
                      className="flex items-center text-foreground hover:text-primary transition-colors font-medium text-base gap-1 px-3 py-2 rounded-lg hover:bg-muted/50"
                    >
                      Resources
                      <HiChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          activeDropdown === "resources" ? "rotate-180" : ""
                        }`}
                      />
                    </Link>

                    {activeDropdown === "resources" && (
                      <div
                        className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg p-4 z-50"
                        onMouseEnter={() => handleMouseEnter("resources")}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="space-y-2">
                          <Link
                            to="/career-advice"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Career Advice
                          </Link>
                          <Link
                            to="/resume-builder"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Resume Builder
                          </Link>
                          <Link
                            to="/interview-tips"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Interview Tips
                          </Link>
                          <Link
                            to="/salary-guide"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Salary Guide
                          </Link>
                          <Link
                            to="/blog"
                            className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                          >
                            Blog
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    to="/about"
                    className="text-foreground hover:text-primary transition-colors font-medium text-base px-3 py-2 rounded-lg hover:bg-muted/50"
                  >
                    About
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-foreground font-medium">
                    Welcome,{" "}
                    {user?.firstName || user?.email?.split("@")[0] || "User"}
                  </span>
                  <div className="relative group">
                    <button
                      className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium px-3 py-2 rounded-lg hover:bg-muted/50"
                      onMouseEnter={() => handleMouseEnter("user")}
                      onMouseLeave={handleMouseLeave}
                    >
                      {/* User Profile Image or Icon */}
                      {user?.imageUrl ||
                      (user?.profile as Record<string, unknown>)
                        ?.profileImageUrl ||
                      (user?.profile as Record<string, unknown>)?.logoUrl ? (
                        <img
                          src={
                            user.imageUrl ||
                            ((user.profile as Record<string, unknown>)
                              ?.profileImageUrl as string) ||
                            ((user.profile as Record<string, unknown>)
                              ?.logoUrl as string)
                          }
                          alt="Profile"
                          className="w-8 h-8 rounded-full object-cover border border-border"
                          onError={(e) => {
                            // Fallback to user icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      ) : (
                        <HiUser className="w-5 h-5" />
                      )}
                      <HiChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          activeDropdown === "user" ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {activeDropdown === "user" && (
                      <div
                        className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg p-4 z-50"
                        onMouseEnter={() => handleMouseEnter("user")}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="space-y-2">
                          {user?.role === "EMPLOYER" ? (
                            <>
                              <Link
                                to="/employer/profile"
                                className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                              >
                                Profile
                              </Link>
                              <Link
                                to="/employer/dashboard"
                                className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                              >
                                Dashboard
                              </Link>
                              <Link
                                to="/employer/my-jobs"
                                className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                              >
                                My Jobs
                              </Link>
                              <Link
                                to="/employer/applications"
                                className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                              >
                                Applications
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link
                                to="/profile"
                                className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                              >
                                Profile
                              </Link>
                              <Link
                                to="/dashboard"
                                className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                              >
                                Dashboard
                              </Link>
                              <Link
                                to="/my-applications"
                                className="block text-foreground hover:text-primary transition-colors text-sm p-2 rounded-lg hover:bg-muted/50"
                              >
                                My Applications
                              </Link>
                            </>
                          )}
                          <hr className="border-border my-2" />
                          <button
                            onClick={handleLogout}
                            className="w-full text-left text-foreground hover:text-red-500 transition-colors text-sm p-2 rounded-lg hover:bg-muted/50 flex items-center gap-2"
                          >
                            <HiLogout className="w-4 h-4" />
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/login">
                    <Button
                      variant="outline"
                      size="md"
                      className="font-semibold text-base"
                    >
                      Log In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="md" className="font-semibold text-base">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted/50"
            >
              {isMobileMenuOpen ? (
                <HiX className="w-6 h-6" />
              ) : (
                <HiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-6 pb-6 border-t border-border pt-6 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-6">
              {user?.role === "EMPLOYER" ? (
                // Employer Mobile Navigation
                <div>
                  <h3 className="font-bold text-lg mb-3 text-primary">
                    Employer Panel
                  </h3>
                  <div className="space-y-2 pl-4">
                    <Link
                      to="/employer/dashboard"
                      className="block text-foreground hover:text-primary transition-colors font-medium p-2 rounded-lg hover:bg-muted/50"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/employer/my-jobs"
                      className="block text-foreground hover:text-primary transition-colors font-medium p-2 rounded-lg hover:bg-muted/50"
                    >
                      My Jobs
                    </Link>
                    <Link
                      to="/employer/post-job"
                      className="block text-foreground hover:text-primary transition-colors font-medium p-2 rounded-lg hover:bg-muted/50"
                    >
                      Post Job
                    </Link>
                    <Link
                      to="/employer/candidates"
                      className="block text-foreground hover:text-primary transition-colors font-medium p-2 rounded-lg hover:bg-muted/50"
                    >
                      Find Candidates
                    </Link>
                    <Link
                      to="/employer/applications"
                      className="block text-foreground hover:text-primary transition-colors font-medium p-2 rounded-lg hover:bg-muted/50"
                    >
                      Applications
                    </Link>
                  </div>
                </div>
              ) : user?.role === "JOB_SEEKER" ? (
                // Job Seeker Mobile Navigation
                <div>
                  <h3 className="font-bold text-lg mb-3 text-primary">
                    Job Seeker Panel
                  </h3>
                  <div className="space-y-2 pl-4">
                    <Link
                      to="/dashboard"
                      className="block text-foreground hover:text-primary transition-colors font-medium p-2 rounded-lg hover:bg-muted/50"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/jobs"
                      className="block text-foreground hover:text-primary transition-colors font-medium p-2 rounded-lg hover:bg-muted/50"
                    >
                      Browse Jobs
                    </Link>
                    <Link
                      to="/my-applications"
                      className="block text-foreground hover:text-primary transition-colors font-medium p-2 rounded-lg hover:bg-muted/50"
                    >
                      My Applications
                    </Link>
                    <Link
                      to="/profile"
                      className="block text-foreground hover:text-primary transition-colors font-medium p-2 rounded-lg hover:bg-muted/50"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              ) : (
                // Public Mobile Navigation
                <>
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-primary">
                      Jobs
                    </h3>
                    <div className="space-y-2 pl-4">
                      <Link
                        to="/jobs"
                        className="block text-foreground hover:text-primary transition-colors font-medium p-2 rounded-lg hover:bg-muted/50"
                      >
                        Browse All Jobs
                      </Link>
                      <Link
                        to="/jobs/tech"
                        className="block text-foreground hover:text-primary transition-colors font-medium p-2 rounded-lg hover:bg-muted/50"
                      >
                        Technology Jobs
                      </Link>
                      <Link
                        to="/jobs/remote"
                        className="block text-foreground hover:text-primary transition-colors font-medium p-2 rounded-lg hover:bg-muted/50"
                      >
                        Remote Jobs
                      </Link>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3 text-primary">
                      Employers
                    </h3>
                    <div className="space-y-2 pl-4">
                      <Link
                        to="/post-job"
                        className="block text-foreground hover:text-primary transition-colors font-medium p-2 rounded-lg hover:bg-muted/50"
                      >
                        Post a Job
                      </Link>
                      <Link
                        to="/pricing"
                        className="block text-foreground hover:text-primary transition-colors font-medium p-2 rounded-lg hover:bg-muted/50"
                      >
                        Pricing Plans
                      </Link>
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-3 pt-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-foreground font-medium">
                        Welcome,{" "}
                        {user?.firstName ||
                          user?.email?.split("@")[0] ||
                          "User"}
                      </span>
                    </div>
                    {user?.role === "EMPLOYER" ? (
                      <Link to="/employer/profile">
                        <Button
                          variant="outline"
                          fullWidth
                          className="font-semibold"
                        >
                          Profile
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/profile">
                        <Button
                          variant="outline"
                          fullWidth
                          className="font-semibold"
                        >
                          Profile
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      fullWidth
                      className="font-semibold text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <>
                    <Link to="/login">
                      <Button
                        variant="outline"
                        fullWidth
                        className="font-semibold"
                      >
                        Log In
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button fullWidth className="font-semibold">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
