import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors as BaseColors } from '@/constants/theme';
import { THEME_PRESETS, buildColors, type Mode, type ThemeColors, type ThemeId } from '@/constants/themes';
import { getPreference, setPreference } from '@/lib/db/preferences';

interface ThemeContextValue {
  themeId: ThemeId;
  mode: Mode;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (id: ThemeId) => void;
  setMode: (mode: Mode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: 'forest',
  mode: 'system',
  isDark: false,
  colors: BaseColors,
  setTheme: () => {},
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();

  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const saved = getPreference('themeId');
    return (saved as ThemeId) ?? 'forest';
  });

  const [mode, setModeState] = useState<Mode>(() => {
    const saved = getPreference('mode');
    return (saved as Mode) ?? 'system';
  });

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const preset = THEME_PRESETS.find((p) => p.id === themeId) ?? THEME_PRESETS[0];
  const colors = useMemo(() => buildColors(preset, isDark), [preset, isDark]);

  const setTheme = (id: ThemeId) => {
    setThemeId(id);
    setPreference('themeId', id);
  };

  const setMode = (m: Mode) => {
    setModeState(m);
    setPreference('mode', m);
  };

  return (
    <ThemeContext.Provider value={{ themeId, mode, isDark, colors, setTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
