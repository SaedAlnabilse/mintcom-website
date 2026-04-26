import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';

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

function getStoredTheme(storageKey: string, defaultTheme: Theme): Theme {
  const storedTheme = localStorage.getItem(storageKey);
  return storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
    ? storedTheme
    : defaultTheme;
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    return getStoredTheme(storageKey, defaultTheme);
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(getStoredTheme(storageKey, defaultTheme)));

  useLayoutEffect(() => {
    const root = window.document.documentElement;

    const effectiveTheme = resolveTheme(theme);

    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    root.style.colorScheme = effectiveTheme;
    setResolvedTheme(effectiveTheme);

    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        const newTheme = resolveTheme('system');
        root.classList.remove('light', 'dark');
        root.classList.add(newTheme);
        root.style.colorScheme = newTheme;
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
            // Disconnect once found to save resources - iframe typically doesn't re-mount
            observer.disconnect();
            break;
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



