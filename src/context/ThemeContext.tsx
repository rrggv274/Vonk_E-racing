import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ThemeContextType = {
  darkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false)

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev)
  }, [])

  const value = useMemo(
    () => ({ darkMode, toggleDarkMode }),
    [darkMode, toggleDarkMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
