import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  resolvedTheme: 'light',
};

const ThemeContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove existing classes
    root.classList.remove('light', 'dark');

    // Determine effective theme
    let effectiveTheme = theme;
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      effectiveTheme = systemTheme;
    }

    // Apply class
    root.classList.add(effectiveTheme);
    setTimeout(() => {
      setResolvedTheme(effectiveTheme as 'light' | 'dark');
    }, 0);

    // Save to storage
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(newTheme);
        setResolvedTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Sync Theme with Chatbot Widget
  useEffect(() => {
    const sendThemeToChatbot = () => {
      const iframe = document.querySelector('iframe[src*="hf.space"]') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'theme-change',
          theme: resolvedTheme
        }, '*');
      }
    };

    // 1. Send immediately (if iframe exists)
    sendThemeToChatbot();

    // 2. Observe DOM to send when iframe is injected
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          const iframe = document.querySelector('iframe[src*="hf.space"]');
          if (iframe) {
            sendThemeToChatbot();
            // Disconnect once found to save resources, or keep if iframe can be re-mounted
            // observer.disconnect(); 
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 3. Set a small interval to retry ensuring the message gets through during iframe load
    const interval = setInterval(sendThemeToChatbot, 1000);
    const timeout = setTimeout(() => clearInterval(interval), 5000); // Stop retrying after 5s

    return () => {
      observer.disconnect();
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [resolvedTheme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme);
    },
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};



