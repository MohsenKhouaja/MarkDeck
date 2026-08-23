import type React from "react";
import themeContext from "./ThemeContext";
import { useEffect, useState } from "react";

type ThemeProviderProps = {
  children: React.ReactNode;
  storage?: "local" | "session";
  storageKeyPrefix?: string;
};

export function ThemeProvider({
  children,
  storage = "local",
  storageKeyPrefix = "",
}: ThemeProviderProps) {
  const defaultTheme = { theme: "default", tone: "root" };
  const themeKey = `${storageKeyPrefix}theme`;
  const toneKey = `${storageKeyPrefix}tone`;
  const storageBucket = storage === "session" ? sessionStorage : localStorage;
  const [theme, setTheme] = useState(
    () => storageBucket.getItem(themeKey) || defaultTheme.theme,
  );
  const [tone, setTone] = useState(
    () => storageBucket.getItem(toneKey) || defaultTheme.tone,
  );

  useEffect(() => {
    storageBucket.setItem(themeKey, theme);
    storageBucket.setItem(toneKey, tone);
  }, [storageBucket, theme, themeKey, tone, toneKey]);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
  };

  const toggleTone = (newTone: string) => {
    setTone(newTone);
  };

  return (
    <themeContext.Provider value={{ theme, tone, changeTheme, toggleTone }}>
      {children}
    </themeContext.Provider>
  );
}
