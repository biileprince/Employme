import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  HiChevronDown,
  HiMenu,
  HiX,
  HiUser,
  HiLogout,
  HiViewGrid,
} from "react-icons/hi";
import ThemeToggle from "../ui/ThemeToggle";
import Button from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";

const Header = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
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

  // Reset image error when user changes
  useEffect(() => {
    setImageLoadError(false);
  }, [user?.imageUrl, user?.profile]);

  // Close mobile menu when pressing escape and handle body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent body scroll when sidebar is open
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-40 shadow-sm">
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
                      to="/"
                      className="text-foreground hover:text-primary transition-colors font-medium text-base px-3 py-2 rounded-lg hover:bg-muted/50"
                    >
                      Home
                    </Link>
                    <Link
                      to={
                        user?.role === "EMPLOYER"
                          ? "/employer/dashboard"
                          : "/job-seeker/dashboard"
                      }
                      className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium text-base px-3 py-2 rounded-lg hover:bg-muted/50"
                    >
                      <HiViewGrid className="w-4 h-4" />
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
                          className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                          onMouseEnter={() => handleMouseEnter("jobs")}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div className="space-y-2">
                            <Link
                              to="/jobs"
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              Browse All Jobs
                            </Link>
                            <Link
                              to="/jobs?category=TECHNOLOGY"
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              Technology Jobs
                            </Link>
                            <Link
                              to="/jobs?category=FINANCE"
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              Finance Jobs
                            </Link>
                            <Link
                              to="/jobs?category=HEALTHCARE"
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              Healthcare Jobs
                            </Link>
                            <Link
                              to="/jobs?jobType=remote"
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              Remote Jobs
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Employers Dropdown - Only show for EMPLOYER role */}
                    {user?.role === "EMPLOYER" && (
                      <div
                        className="relative group"
                        onMouseEnter={() => handleMouseEnter("employers")}
                        onMouseLeave={handleMouseLeave}
                      >
                        <Link
                          to="/employer/dashboard"
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
                            className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                            onMouseEnter={() => handleMouseEnter("employers")}
                            onMouseLeave={handleMouseLeave}
                          >
                            <div className="space-y-2">
                              <Link
                                to="/employer/post-job"
                                className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                              >
                                Post a Job
                              </Link>
                              <Link
                                to="/employer/my-jobs"
                                className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                              >
                                My Jobs
                              </Link>
                              <Link
                                to="/employer/applications"
                                className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                              >
                                Applications
                              </Link>
                              <Link
                                to="/employer/dashboard"
                                className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                              >
                                Dashboard
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

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
                    <Link
                      to="/"
                      className="text-foreground hover:text-primary transition-colors font-medium text-base px-3 py-2 rounded-lg hover:bg-muted/50"
                    >
                      Home
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
                          className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                          onMouseEnter={() => handleMouseEnter("jobs")}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div className="space-y-2">
                            <Link
                              to="/jobs"
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              Browse All Jobs
                            </Link>
                            <Link
                              to="/jobs?category=TECHNOLOGY"
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              Technology Jobs
                            </Link>
                            <Link
                              to="/jobs?category=FINANCE"
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              Finance Jobs
                            </Link>
                            <Link
                              to="/jobs?category=HEALTHCARE"
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              Healthcare Jobs
                            </Link>
                            <Link
                              to="/jobs?jobType=remote"
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              Remote Jobs
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Job Seekers Dropdown */}
                    <div
                      className="relative group"
                      onMouseEnter={() => handleMouseEnter("jobseekers")}
                      onMouseLeave={handleMouseLeave}
                    >
                      <Link
                        to="/signup"
                        className="flex items-center text-foreground hover:text-primary transition-colors font-medium text-base gap-1 px-3 py-2 rounded-lg hover:bg-muted/50"
                      >
                        Job Seekers
                        <HiChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            activeDropdown === "jobseekers" ? "rotate-180" : ""
                          }`}
                        />
                      </Link>

                      {activeDropdown === "jobseekers" && (
                        <div
                          className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                          onMouseEnter={() => handleMouseEnter("jobseekers")}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div className="space-y-2">
                            <Link
                              to="/signup"
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              Sign Up as Job Seeker
                            </Link>
                            <Link
                              to="/login"
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              Job Seeker Login
                            </Link>
                            <Link
                              to="/#how-it-works"
                              onClick={(e) => {
                                e.preventDefault();
                                const element =
                                  document.querySelector("#how-it-works");
                                if (element) {
                                  element.scrollIntoView({
                                    behavior: "smooth",
                                  });
                                }
                              }}
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              How It Works
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
                        to="/login"
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
                          className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                          onMouseEnter={() => handleMouseEnter("employers")}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div className="space-y-2">
                            <Link
                              to="/signup?role=employer"
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              Sign Up as Employer
                            </Link>
                            <Link
                              to="/login"
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              Employer Login
                            </Link>
                            <Link
                              to="/#how-it-works"
                              onClick={(e) => {
                                e.preventDefault();
                                const element =
                                  document.querySelector("#how-it-works");
                                if (element) {
                                  element.scrollIntoView({
                                    behavior: "smooth",
                                  });
                                }
                              }}
                              className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                            >
                              How It Works
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
                        {!imageLoadError &&
                        (user?.imageUrl ||
                          (user?.profile as Record<string, unknown>)
                            ?.profileImageUrl ||
                          (user?.profile as Record<string, unknown>)
                            ?.logoUrl) ? (
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
                            onError={() => {
                              setImageLoadError(true);
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                            <HiUser className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <HiChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            activeDropdown === "user" ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {activeDropdown === "user" && (
                        <div
                          className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                          onMouseEnter={() => handleMouseEnter("user")}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div className="space-y-2">
                            {user?.role === "EMPLOYER" ? (
                              <>
                                <Link
                                  to="/employer/profile"
                                  className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                                >
                                  Profile
                                </Link>
                                <Link
                                  to="/employer/dashboard"
                                  className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                                >
                                  Dashboard
                                </Link>
                                <Link
                                  to="/employer/my-jobs"
                                  className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                                >
                                  My Jobs
                                </Link>
                                <Link
                                  to="/employer/applications"
                                  className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                                >
                                  Applications
                                </Link>
                              </>
                            ) : (
                              <>
                                <Link
                                  to="/job-seeker/profile"
                                  className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                                >
                                  Profile
                                </Link>
                                <Link
                                  to="/job-seeker/dashboard"
                                  className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                                >
                                  Dashboard
                                </Link>
                                <Link
                                  to="/job-seeker/applications"
                                  className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                                >
                                  My Applications
                                </Link>
                                <Link
                                  to="/job-seeker/saved-jobs"
                                  className="block text-foreground hover:text-primary transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 hover:translate-x-1"
                                >
                                  Saved Jobs
                                </Link>
                              </>
                            )}
                            <hr className="border-border my-2" />
                            <button
                              onClick={handleLogout}
                              className="w-full text-left text-foreground hover:text-red-500 transition-all duration-200 text-sm p-2 rounded-lg hover:bg-muted/50 flex items-center gap-2 hover:translate-x-1"
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
                <HiMenu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay - Separate from header to avoid z-index conflicts */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 pointer-events-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-card border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0">
            <div className="flex flex-col h-full overflow-hidden">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <Link
                  to="/"
                  className="text-2xl font-bold text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Employ<span className="text-secondary">.</span>
                  <span className="text-secondary">me</span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted/50"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="p-6 space-y-6">
                  {user ? (
                    <>
                      {/* User Welcome */}
                      <div className="text-center p-4 bg-muted/50 rounded-xl border border-border">
                        <span className="text-foreground font-medium text-base">
                          Welcome,{" "}
                          {user?.firstName ||
                            user?.email?.split("@")[0] ||
                            "User"}
                        </span>
                        <p className="text-muted-foreground text-sm mt-1 capitalize">
                          {user?.role?.toLowerCase().replace("_", " ")} Account
                        </p>
                      </div>{" "}
                      {/* Navigation Links */}
                      <div className="space-y-2">
                        <Link
                          to="/"
                          className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-4 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Home
                        </Link>
                        <Link
                          to={
                            user?.role === "EMPLOYER"
                              ? "/employer/dashboard"
                              : "/job-seeker/dashboard"
                          }
                          className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-4 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <HiViewGrid className="w-5 h-5" />
                          Dashboard
                        </Link>
                        <Link
                          to="/jobs"
                          className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-4 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Browse Jobs
                        </Link>

                        {user?.role === "EMPLOYER" ? (
                          <>
                            <Link
                              to="/employer/my-jobs"
                              className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-4 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              My Jobs
                            </Link>
                            <Link
                              to="/employer/post-job"
                              className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-4 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              Post Job
                            </Link>
                            <Link
                              to="/employer/applications"
                              className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-4 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              Applications
                            </Link>
                            <Link
                              to="/employer/profile"
                              className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-4 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              Profile
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/job-seeker/applications"
                              className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-4 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              My Applications
                            </Link>
                            <Link
                              to="/job-seeker/saved-jobs"
                              className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-4 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              Saved Jobs
                            </Link>
                            <Link
                              to="/job-seeker/profile"
                              className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-4 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              Profile
                            </Link>
                          </>
                        )}

                        <Link
                          to="/about"
                          className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-4 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          About
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Public Navigation */}
                      <div className="space-y-2">
                        <Link
                          to="/"
                          className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-4 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Home
                        </Link>
                        <Link
                          to="/jobs"
                          className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-4 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Browse Jobs
                        </Link>
                        <Link
                          to="/jobs?category=TECHNOLOGY"
                          className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-all duration-200 text-sm p-3 pl-6 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Technology Jobs
                        </Link>
                        <Link
                          to="/jobs?category=FINANCE"
                          className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-all duration-200 text-sm p-3 pl-6 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Finance Jobs
                        </Link>
                        <Link
                          to="/jobs?jobType=remote"
                          className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-all duration-200 text-sm p-3 pl-6 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Remote Jobs
                        </Link>

                        <div className="pt-6 border-t border-border mt-4">
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-4">
                            For Employers
                          </h4>
                          <Link
                            to="/signup?role=employer"
                            className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-4 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Sign Up as Employer
                          </Link>
                          <Link
                            to="/auth/login"
                            className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-4 rounded-xl hover:bg-muted/50 active:bg-muted active:scale-95"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Employer Login
                          </Link>
                        </div>

                        <Link
                          to="/about"
                          className="flex items-center gap-3 text-foreground hover:text-primary transition-all duration-200 font-medium p-3 rounded-lg hover:bg-muted/50"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          About
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 border-t border-border">
                <div className="flex flex-col gap-4">
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Theme
                    </span>
                    <ThemeToggle />
                  </div>

                  {/* Auth Actions */}
                  <div className="flex flex-col gap-3">
                    {user ? (
                      <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full text-red-500 hover:text-red-600 transition-all duration-200 font-medium p-4 rounded-xl border border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/20 active:scale-95"
                      >
                        <HiLogout className="w-5 h-5" />
                        Logout
                      </button>
                    ) : (
                      <>
                        <Link
                          to="login"
                          className="w-full"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Button
                            variant="outline"
                            fullWidth
                            className="font-semibold"
                          >
                            Log In
                          </Button>
                        </Link>
                        <Link
                          to="/signup"
                          className="w-full"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Button fullWidth className="font-semibold">
                            Sign Up
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
