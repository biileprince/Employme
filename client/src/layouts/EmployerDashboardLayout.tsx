import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MdDashboard, 
  MdAdd, 
  MdWork, 
  MdDescription, 
  MdPeople, 
  MdSettings, 
  MdLogout 
} from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ui/ThemeToggle';

const sidebarLinks = [
  { to: '/employer/dashboard', label: 'Dashboard', icon: MdDashboard },
  { to: '/employer/post-job', label: 'Post Job', icon: MdAdd },
  { to: '/employer/my-jobs', label: 'My Jobs', icon: MdWork },
  { to: '/employer/applications', label: 'Applications', icon: MdDescription },
  { to: '/employer/candidates', label: 'Find Candidates', icon: MdPeople },
  { to: '/employer/profile', label: 'Profile', icon: MdSettings },
];

export default function EmployerDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col shadow-lg z-40">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
            Employ<span className="text-secondary">.</span><span className="text-secondary">me</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">Employer Panel</p>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 p-4 flex-1">
          {sidebarLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 ${
                  location.pathname === link.to
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-foreground hover:bg-muted hover:text-primary'
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
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <div className="bg-card/50 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {sidebarLinks.find(link => link.to === location.pathname)?.label || 'Dashboard'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your job postings and applications
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
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
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
