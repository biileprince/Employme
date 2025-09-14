// Theme management utility
type ThemeType = 'light' | 'dark';

class ThemeManager {
  theme: ThemeType;

  constructor() {
    this.theme = this.getStoredTheme() || this.getSystemTheme();
    this.init();
  }

  init(): void {
    this.applyTheme(this.theme);
    this.addEventListeners();
  }

  getStoredTheme(): ThemeType | null {
    return localStorage.getItem('theme') as ThemeType | null;
  }

  getSystemTheme(): ThemeType {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  applyTheme(theme: ThemeType): void {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    this.theme = theme;
    
    // Dispatch custom event for theme change
    const event = new CustomEvent('themeChanged', { detail: theme });
    window.dispatchEvent(event);
  }

  toggleTheme(): void {
    this.applyTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  addEventListeners(): void {
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('theme')) {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

// Initialize theme manager when in browser environment
let themeManager: ThemeManager;

if (typeof window !== 'undefined') {
  themeManager = new ThemeManager();
}

// Export for use in components
export { themeManager };
