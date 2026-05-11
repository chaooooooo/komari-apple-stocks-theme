import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type ThemeMode = 'dark' | 'light'

type ThemeContextValue = {
  theme: ThemeMode
  toggleTheme: () => void
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem('komari-theme-mode')

  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return 'dark'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getInitialTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('komari-theme-mode', theme)
  }, [theme])

  const value = useMemo<ThemeContextValue>(() => {
    return {
      theme,
      setTheme: setThemeState,
      toggleTheme: () => {
        setThemeState((current) => (current === 'dark' ? 'light' : 'dark'))
      },
    }
  }, [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }

  return context
}
