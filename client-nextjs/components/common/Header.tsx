"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  HiChevronDown,
  HiMenu,
  HiX,
  HiUser,
  HiLogout,
  HiViewGrid,
} from "react-icons/hi";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Button } from "../ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { formatImageUrl } from "@/lib/api";

export function Header() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const dropdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (dropdown: string) => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
    }
    setActiveDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    dropdownTimerRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Reset image error when user changes
  useEffect(() => {
    if (user?.imageUrl || user?.profile) {
      setTimeout(() => {
        setImageLoadError(false);
      }, 0);
    }
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
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    return () => {
      if (dropdownTimerRef.current) {
        clearTimeout(dropdownTimerRef.current);
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 shadow-sm backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-3xl font-bold text-primary transition-colors hover:text-primary/80 md:text-4xl"
          >
            Employ<span className="text-secondary">.</span>
            <span className="text-secondary">me</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 lg:flex">
            <nav className="flex items-center gap-8">
              {user ? (
                // Authenticated Users Navigation
                <>
                  <Link
                    href="/"
                    className="rounded-lg px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                  >
                    Home
                  </Link>
                  <Link
                    href={
                      user?.role === "EMPLOYER"
                        ? "/employer/dashboard"
                        : "/job-seeker/dashboard"
                    }
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                  >
                    <HiViewGrid className="h-4 w-4" />
                    Dashboard
                  </Link>

                  {/* Jobs Dropdown */}
                  <div
                    className="group relative"
                    onMouseEnter={() => handleMouseEnter("jobs")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href="/jobs"
                      className="flex items-center gap-1 rounded-lg px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                    >
                      Jobs
                      <HiChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          activeDropdown === "jobs" ? "rotate-180" : ""
                        }`}
                      />
                    </Link>

                    {activeDropdown === "jobs" && (
                      <div
                        className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-card p-4 shadow-lg"
                        onMouseEnter={() => handleMouseEnter("jobs")}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="space-y-2">
                          <Link
                            href="/jobs"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            Browse All Jobs
                          </Link>
                          <Link
                            href="/jobs?category=TECHNOLOGY"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            Technology Jobs
                          </Link>
                          <Link
                            href="/jobs?category=FINANCE"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            Finance Jobs
                          </Link>
                          <Link
                            href="/jobs?category=HEALTHCARE"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            Healthcare Jobs
                          </Link>
                          <Link
                            href="/jobs?jobType=remote"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            Remote Jobs
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Employers Dropdown - Only for EMPLOYER role */}
                  {user?.role === "EMPLOYER" && (
                    <div
                      className="group relative"
                      onMouseEnter={() => handleMouseEnter("employers")}
                      onMouseLeave={handleMouseLeave}
                    >
                      <Link
                        href="/employer/dashboard"
                        className="flex items-center gap-1 rounded-lg px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                      >
                        Employers
                        <HiChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            activeDropdown === "employers" ? "rotate-180" : ""
                          }`}
                        />
                      </Link>

                      {activeDropdown === "employers" && (
                        <div
                          className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-card p-4 shadow-lg"
                          onMouseEnter={() => handleMouseEnter("employers")}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div className="space-y-2">
                            <Link
                              href="/employer/post-job"
                              className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                            >
                              Post a Job
                            </Link>
                            <Link
                              href="/employer/my-jobs"
                              className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                            >
                              My Jobs
                            </Link>
                            <Link
                              href="/employer/applications"
                              className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                            >
                              Applications
                            </Link>
                            <Link
                              href="/employer/dashboard"
                              className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                            >
                              Dashboard
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Link
                    href="/about"
                    className="rounded-lg px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                  >
                    About
                  </Link>
                </>
              ) : (
                // Public Navigation
                <>
                  <Link
                    href="/"
                    className="rounded-lg px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                  >
                    Home
                  </Link>

                  {/* Jobs Dropdown */}
                  <div
                    className="group relative"
                    onMouseEnter={() => handleMouseEnter("jobs")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href="/jobs"
                      className="flex items-center gap-1 rounded-lg px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                    >
                      Jobs
                      <HiChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          activeDropdown === "jobs" ? "rotate-180" : ""
                        }`}
                      />
                    </Link>

                    {activeDropdown === "jobs" && (
                      <div
                        className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-card p-4 shadow-lg"
                        onMouseEnter={() => handleMouseEnter("jobs")}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="space-y-2">
                          <Link
                            href="/jobs"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            Browse All Jobs
                          </Link>
                          <Link
                            href="/jobs?category=TECHNOLOGY"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            Technology Jobs
                          </Link>
                          <Link
                            href="/jobs?category=FINANCE"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            Finance Jobs
                          </Link>
                          <Link
                            href="/jobs?category=HEALTHCARE"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            Healthcare Jobs
                          </Link>
                          <Link
                            href="/jobs?jobType=remote"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            Remote Jobs
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Job Seekers Dropdown */}
                  <div
                    className="group relative"
                    onMouseEnter={() => handleMouseEnter("jobseekers")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href="/auth/signup"
                      className="flex items-center gap-1 rounded-lg px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                    >
                      Job Seekers
                      <HiChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          activeDropdown === "jobseekers" ? "rotate-180" : ""
                        }`}
                      />
                    </Link>

                    {activeDropdown === "jobseekers" && (
                      <div
                        className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-card p-4 shadow-lg"
                        onMouseEnter={() => handleMouseEnter("jobseekers")}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="space-y-2">
                          <Link
                            href="/auth/signup"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            Sign Up as Job Seeker
                          </Link>
                          <Link
                            href="/auth/login"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            Job Seeker Login
                          </Link>
                          <Link
                            href="/#how-it-works"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            How It Works
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Employers Dropdown */}
                  <div
                    className="group relative"
                    onMouseEnter={() => handleMouseEnter("employers")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href="/auth/login"
                      className="flex items-center gap-1 rounded-lg px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                    >
                      Employers
                      <HiChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          activeDropdown === "employers" ? "rotate-180" : ""
                        }`}
                      />
                    </Link>

                    {activeDropdown === "employers" && (
                      <div
                        className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-card p-4 shadow-lg"
                        onMouseEnter={() => handleMouseEnter("employers")}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="space-y-2">
                          <Link
                            href="/auth/signup?role=employer"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            Sign Up as Employer
                          </Link>
                          <Link
                            href="/auth/login"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            Employer Login
                          </Link>
                          <Link
                            href="/#how-it-works"
                            className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                          >
                            How It Works
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/about"
                    className="rounded-lg px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                  >
                    About
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground">
                    Welcome,{" "}
                    {user?.firstName || user?.email?.split("@")[0] || "User"}
                  </span>
                  <div className="group relative">
                    <button
                      className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                      onMouseEnter={() => handleMouseEnter("user")}
                      onMouseLeave={handleMouseLeave}
                    >
                      {/* User Profile Image or Icon */}
                      {!imageLoadError &&
                      (user?.imageUrl ||
                        (user?.profile as Record<string, unknown>)
                          ?.profileImageUrl ||
                        (user?.profile as Record<string, unknown>)?.logoUrl) ? (
                        <Image
                          src={formatImageUrl(
                            user.imageUrl ||
                              ((user.profile as Record<string, unknown>)
                                ?.profileImageUrl as string) ||
                              ((user.profile as Record<string, unknown>)
                                ?.logoUrl as string),
                          )}
                          alt="Profile"
                          width={32}
                          height={32}
                          className="rounded-full border border-border object-cover"
                          onError={() => {
                            setImageLoadError(true);
                          }}
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted">
                          <HiUser className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <HiChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          activeDropdown === "user" ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {activeDropdown === "user" && (
                      <div
                        className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-border bg-card p-4 shadow-lg"
                        onMouseEnter={() => handleMouseEnter("user")}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="space-y-2">
                          {user?.role === "EMPLOYER" ? (
                            <>
                              <Link
                                href="/employer/profile"
                                className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                              >
                                Profile
                              </Link>
                              <Link
                                href="/employer/dashboard"
                                className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                              >
                                Dashboard
                              </Link>
                              <Link
                                href="/employer/my-jobs"
                                className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                              >
                                My Jobs
                              </Link>
                              <Link
                                href="/employer/applications"
                                className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                              >
                                Applications
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link
                                href="/job-seeker/profile"
                                className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                              >
                                Profile
                              </Link>
                              <Link
                                href="/job-seeker/dashboard"
                                className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                              >
                                Dashboard
                              </Link>
                              <Link
                                href="/job-seeker/applications"
                                className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                              >
                                My Applications
                              </Link>
                              <Link
                                href="/job-seeker/saved-jobs"
                                className="block rounded-lg p-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                              >
                                Saved Jobs
                              </Link>
                            </>
                          )}
                          <hr className="my-2 border-border" />
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-red-500"
                          >
                            <HiLogout className="h-4 w-4" />
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted/50"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <HiX className="h-6 w-6" />
              ) : (
                <HiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 h-screen w-screen bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-screen w-80 max-w-[85vw] border-l border-border bg-card shadow-2xl">
              <div className="flex h-full flex-col">
                {/* Sidebar Header */}
                <div className="shrink-0 flex items-center justify-between border-b border-border p-6">
                  <Link
                    href="/"
                    className="text-2xl font-bold text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Employ<span className="text-secondary">.</span>
                    <span className="text-secondary">me</span>
                  </Link>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                  >
                    <HiX className="h-6 w-6" />
                  </button>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  <div className="space-y-6 p-6 pb-4">
                    {user ? (
                      <>
                        {/* User Welcome */}
                        <div className="rounded-xl border border-border bg-muted/50 p-4 text-center">
                          <span className="text-base font-medium text-foreground">
                            Welcome,{" "}
                            {user?.firstName ||
                              user?.email?.split("@")[0] ||
                              "User"}
                          </span>
                          <p className="mt-1 text-sm capitalize text-muted-foreground">
                            {user?.role?.toLowerCase().replace("_", " ")}{" "}
                            Account
                          </p>
                        </div>

                        {/* Navigation Links */}
                        <div className="space-y-2">
                          <Link
                            href="/"
                            className="flex items-center gap-3 rounded-xl p-4 font-medium text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Home
                          </Link>
                          <Link
                            href={
                              user?.role === "EMPLOYER"
                                ? "/employer/dashboard"
                                : "/job-seeker/dashboard"
                            }
                            className="flex items-center gap-3 rounded-xl p-4 font-medium text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <HiViewGrid className="h-5 w-5" />
                            Dashboard
                          </Link>
                          <Link
                            href="/jobs"
                            className="flex items-center gap-3 rounded-xl p-4 font-medium text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Browse Jobs
                          </Link>

                          {user?.role === "EMPLOYER" ? (
                            <>
                              <Link
                                href="/employer/my-jobs"
                                className="flex items-center gap-3 rounded-xl p-4 font-medium text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                My Jobs
                              </Link>
                              <Link
                                href="/employer/post-job"
                                className="flex items-center gap-3 rounded-xl p-4 font-medium text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Post Job
                              </Link>
                              <Link
                                href="/employer/applications"
                                className="flex items-center gap-3 rounded-xl p-4 font-medium text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Applications
                              </Link>
                              <Link
                                href="/employer/profile"
                                className="flex items-center gap-3 rounded-xl p-4 font-medium text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Profile
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link
                                href="/job-seeker/applications"
                                className="flex items-center gap-3 rounded-xl p-4 font-medium text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                My Applications
                              </Link>
                              <Link
                                href="/job-seeker/saved-jobs"
                                className="flex items-center gap-3 rounded-xl p-4 font-medium text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Saved Jobs
                              </Link>
                              <Link
                                href="/job-seeker/profile"
                                className="flex items-center gap-3 rounded-xl p-4 font-medium text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Profile
                              </Link>
                            </>
                          )}

                          <Link
                            href="/about"
                            className="flex items-center gap-3 rounded-xl p-4 font-medium text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
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
                            href="/"
                            className="flex items-center gap-3 rounded-xl p-4 font-medium text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Home
                          </Link>
                          <Link
                            href="/jobs"
                            className="flex items-center gap-3 rounded-xl p-4 font-medium text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Browse Jobs
                          </Link>
                          <Link
                            href="/jobs?category=TECHNOLOGY"
                            className="flex items-center gap-3 rounded-xl p-3 pl-6 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Technology Jobs
                          </Link>
                          <Link
                            href="/jobs?category=FINANCE"
                            className="flex items-center gap-3 rounded-xl p-3 pl-6 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Finance Jobs
                          </Link>
                          <Link
                            href="/jobs?jobType=remote"
                            className="flex items-center gap-3 rounded-xl p-3 pl-6 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Remote Jobs
                          </Link>

                          <div className="mt-4 border-t border-border pt-6">
                            <h4 className="mb-3 px-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                              For Employers
                            </h4>
                            <Link
                              href="/auth/signup?role=employer"
                              className="flex items-center gap-3 rounded-xl p-4 font-medium text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              Sign Up as Employer
                            </Link>
                            <Link
                              href="/auth/login"
                              className="flex items-center gap-3 rounded-xl p-4 font-medium text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-primary active:scale-95 active:bg-muted"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              Employer Login
                            </Link>
                          </div>

                          <Link
                            href="/about"
                            className="flex items-center gap-3 rounded-lg p-3 font-medium text-foreground transition-colors hover:bg-muted/50 hover:text-primary"
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
                <div className="shrink-0 border-t border-border p-6 bg-card">
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
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 p-4 font-medium text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 active:scale-95 dark:border-red-800 dark:hover:bg-red-950/20"
                        >
                          <HiLogout className="h-5 w-5" />
                          Logout
                        </button>
                      ) : (
                        <>
                          <Link
                            href="/auth/login"
                            className="w-full"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Button
                              variant="outline"
                              className="w-full font-semibold"
                            >
                              Log In
                            </Button>
                          </Link>
                          <Link
                            href="/auth/signup"
                            className="w-full"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Button className="w-full font-semibold">
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
      </div>
    </header>
  );
}
