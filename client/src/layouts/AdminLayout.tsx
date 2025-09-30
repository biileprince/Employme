import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MdDashboard,
  MdPeople,
  MdWork,
  MdAssignment,
  MdLogout,
  MdMenu,
  MdClose,
  MdPersonAdd,
  MdAnalytics,
} from "react-icons/md";
import { useAuth } from "../contexts/AuthContext";
import ThemeToggle from "../components/ui/ThemeToggle";
import Button from "../components/ui/Button";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    path: "/admin/dashboard",
    label: "Dashboard",
    icon: MdDashboard,
  },
  {
    path: "/admin/users",
    label: "Users",
    icon: MdPeople,
  },
  {
    path: "/admin/jobs",
    label: "Jobs",
    icon: MdWork,
  },
  {
    path: "/admin/applications",
    label: "Applications",
    icon: MdAssignment,
  },
  {
    path: "/admin/analytics",
    label: "Analytics",
    icon: MdAnalytics,
  },
  {
    path: "/admin/create-admin",
    label: "Create Admin",
    icon: MdPersonAdd,
  },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black opacity-25"></div>
        </div>
      )}

      {/* Fixed Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-card lg:border-r lg:border-border lg:fixed lg:h-screen lg:top-0 lg:left-0 lg:z-40 lg:overflow-hidden">
        <div className="flex flex-col h-full min-h-0">
          {/* Header - Fixed height */}
          <div className="flex-shrink-0 p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  A
                </span>
              </div>
              <div>
                <h2 className="font-bold text-foreground">Admin Panel</h2>
                <p className="text-xs text-muted-foreground">Employ.me</p>
              </div>
            </div>
          </div>

          {/* Navigation - Scrollable middle section */}
          <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info and logout - Fixed at bottom */}
          <div className="flex-shrink-0 p-4 border-t border-border bg-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <MdPeople className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex-1 flex items-center justify-center gap-2 min-h-[36px]"
              >
                <MdLogout className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : "-100%",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform lg:hidden overflow-hidden"
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Header - Fixed height */}
          <div className="flex-shrink-0 p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    A
                  </span>
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Admin Panel</h2>
                  <p className="text-xs text-muted-foreground">Employ.me</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted flex-shrink-0"
              >
                <MdClose className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Navigation - Scrollable middle section */}
          <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info and logout - Fixed at bottom */}
          <div className="flex-shrink-0 p-4 border-t border-border bg-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <MdPeople className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex-1 flex items-center justify-center gap-2 min-h-[36px]"
              >
                <MdLogout className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Fixed Top header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 fixed top-0 right-0 left-0 lg:left-64 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
            >
              <MdMenu className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-foreground">
                {navItems.find((item) => isActiveRoute(item.path))?.label ||
                  "Admin Panel"}
              </h1>
              <span className="text-muted-foreground">•</span>
              <Link
                to="/"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Home
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:block">
              <p className="text-sm text-muted-foreground">
                Welcome back, {user?.firstName || "Admin"}
              </p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
