import { useEffect, useState } from 'react';
import { HiSun, HiMoon } from 'react-icons/hi';
import { themeManager } from '../../utils/theme';

const ThemeToggle = () => {
  // Initialize with null to avoid hydration mismatch
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    // Set initial state after component mounts
    if (themeManager) {
      setIsDark(themeManager.theme === 'dark');
    }

    const handleThemeChange = () => {
      if (themeManager) {
        setIsDark(themeManager.theme === 'dark');
      }
    };

    // Listen for theme changes
    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    if (themeManager) {
      themeManager.toggleTheme();
    }
  };

  // Don't render anything during server-side rendering or initial client render
  if (isDark === null) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <HiSun className="w-5 h-5" />
      ) : (
        <HiMoon className="w-5 h-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
