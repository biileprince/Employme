"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  MdDashboard,
  MdDescription,
  MdBookmark,
  MdPerson,
  MdSearch,
  MdLogout,
  MdMenu,
  MdClose,
  MdMessage,
  MdAddAlert,
  MdNotifications,
} from "react-icons/md";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const sidebarLinks = [
  { to: "/job-seeker/dashboard", label: "Dashboard", icon: MdDashboard },
  { to: "/jobs", label: "Browse Jobs", icon: MdSearch },
  {
    to: "/job-seeker/applications",
    label: "My Applications",
    icon: MdDescription,
  },
  { to: "/job-seeker/saved-jobs", label: "Saved Jobs", icon: MdBookmark },
  { to: "/job-seeker/job-alerts", label: "Job Alerts", icon: MdAddAlert },
  {
    to: "/job-seeker/notifications",
    label: "Notifications",
    icon: MdNotifications,
  },
  { to: "/job-seeker/messages", label: "Messages", icon: MdMessage },
  { to: "/job-seeker/profile", label: "Profile", icon: MdPerson },
];

export function JobSeekerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Close sidebar when pressing escape and handle body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen bg-background">
      <ScrollToTop />
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b border-border">
          <Link
            href="/"
            onClick={() => setIsSidebarOpen(false)}
            className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Employ<span className="text-secondary">.</span>
            <span className="text-secondary">me</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">Job Seeker Panel</p>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 p-4 flex-1">
          {sidebarLinks.map((link) => {
            const IconComponent = link.icon;
            const isActive = pathname === link.to;
            return (
              <Link
                key={link.to}
                href={link.to}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 relative ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-foreground hover:bg-muted hover:text-primary"
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-lg text-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-all duration-200"
          >
            <MdLogout className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <div className="bg-card/50 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              >
                {isSidebarOpen ? (
                  <MdClose className="w-6 h-6" />
                ) : (
                  <MdMenu className="w-6 h-6" />
                )}
              </button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {sidebarLinks.find((link) => link.to === pathname)?.label ||
                    "Dashboard"}
                </h1>
                <p className="hidden sm:block text-sm text-muted-foreground">
                  Manage your job search and applications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium px-3 py-2 rounded-lg hover:bg-muted/50"
              >
                Home
              </Link>
              <ThemeToggle />
              <div className="hidden md:block text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
