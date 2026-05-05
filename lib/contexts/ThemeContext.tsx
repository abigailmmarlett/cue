import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors as BaseColors, DarkBaseColors } from '@/constants/theme';
import { getPreference, setPreference } from '@/lib/db/preferences';

export type ThemeId = 'forest' | 'ocean' | 'dusk' | 'ember' | 'stone'
  | 'bloom' | 'reverie' | 'tidal' | 'electric';

export type Mode = 'light' | 'dark' | 'system';

export interface ThemePreset {
  id: ThemeId;
  name: string;
  accent: string;
  accentDeep: string;
  accentDim: string;
  accentBorder: string;
  headerBg: string;
  headerBgDark: string;
  pillBg: string;
  pillBorder: string;
  pillAccent?: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'forest',
    name: 'Forest',
    accent: '#16a34a',
    accentDeep: '#15803d',
    accentDim: 'rgba(22,163,74,0.1)',
    accentBorder: 'rgba(22,163,74,0.27)',
    headerBg: '#ddf3dd',
    headerBgDark: '#b8e6bc',
    pillBg: 'rgba(22,163,74,0.08)',
    pillBorder: 'rgba(22,163,74,0.2)',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    accent: '#0284c7',
    accentDeep: '#0369a1',
    accentDim: 'rgba(2,132,199,0.1)',
    accentBorder: 'rgba(2,132,199,0.27)',
    headerBg: '#dbeafe',
    headerBgDark: '#b3d4fb',
    pillBg: 'rgba(2,132,199,0.08)',
    pillBorder: 'rgba(2,132,199,0.2)',
  },
  {
    id: 'dusk',
    name: 'Dusk',
    accent: '#7c3aed',
    accentDeep: '#6d28d9',
    accentDim: 'rgba(124,58,237,0.1)',
    accentBorder: 'rgba(124,58,237,0.27)',
    headerBg: '#ede9fe',
    headerBgDark: '#d4ccfb',
    pillBg: 'rgba(124,58,237,0.08)',
    pillBorder: 'rgba(124,58,237,0.2)',
  },
  {
    id: 'ember',
    name: 'Ember',
    accent: '#ea580c',
    accentDeep: '#c2410c',
    accentDim: 'rgba(234,88,12,0.1)',
    accentBorder: 'rgba(234,88,12,0.27)',
    headerBg: '#ffedd5',
    headerBgDark: '#fdd0a0',
    pillBg: 'rgba(234,88,12,0.08)',
    pillBorder: 'rgba(234,88,12,0.2)',
  },
  {
    id: 'stone',
    name: 'Stone',
    accent: '#475569',
    accentDeep: '#334155',
    accentDim: 'rgba(71,85,105,0.1)',
    accentBorder: 'rgba(71,85,105,0.27)',
    headerBg: '#f1f5f9',
    headerBgDark: '#dce3ec',
    pillBg: 'rgba(71,85,105,0.08)',
    pillBorder: 'rgba(71,85,105,0.2)',
  },
  {
    id: 'bloom',
    name: 'Bloom',
    accent: '#ED6B86',
    accentDeep: '#7FB285',
    accentDim: 'rgba(250,179,169,0.18)',
    accentBorder: 'rgba(237,107,134,0.27)',
    headerBg: '#FDE8E5',
    headerBgDark: '#FAB3A9',
    pillBg: 'rgba(127,178,133,0.1)',
    pillBorder: 'rgba(127,178,133,0.25)',
    pillAccent: '#7FB285',
  },
  {
    id: 'reverie',
    name: 'Reverie',
    accent: '#8CABBE',
    accentDeep: '#A4A8D1',
    accentDim: 'rgba(164,191,235,0.18)',
    accentBorder: 'rgba(140,171,190,0.27)',
    headerBg: '#EDE8F2',
    headerBgDark: '#BBA0B2',
    pillBg: 'rgba(164,168,209,0.1)',
    pillBorder: 'rgba(164,168,209,0.25)',
    pillAccent: '#A4A8D1',
  },
  {
    id: 'tidal',
    name: 'Tidal',
    accent: '#70A0AF',
    accentDeep: '#706993',
    accentDim: 'rgba(160,193,185,0.2)',
    accentBorder: 'rgba(112,160,175,0.27)',
    headerBg: '#F7F2E2',
    headerBgDark: '#F4E8C1',
    pillBg: 'rgba(112,105,147,0.1)',
    pillBorder: 'rgba(112,105,147,0.25)',
    pillAccent: '#706993',
  },
  {
    id: 'electric',
    name: 'Electric',
    accent: '#0EB1D2',
    accentDeep: '#34E4EA',
    accentDim: 'rgba(14,177,210,0.15)',
    accentBorder: 'rgba(14,177,210,0.3)',
    headerBg: '#F8EDEB',
    headerBgDark: '#E5CDC8',
    pillBg: 'rgba(112,105,147,0.1)',
    pillBorder: 'rgba(112,105,147,0.25)',
    pillAccent: '#706993',
  },
];

export type ThemeColors = typeof BaseColors;

function buildColors(preset: ThemePreset, isDark: boolean): ThemeColors {
  const base = isDark ? DarkBaseColors : BaseColors;
  const pillColor = preset.pillAccent ?? preset.accent;
  return {
    ...base,
    accent: preset.accent,
    accentDeep: preset.accentDeep,
    accentDim: preset.accentDim,
    accentBorder: preset.accentBorder,
    // In dark mode, use the neutral dark headers from base instead of light-tinted preset headers
    ...(isDark ? {} : { headerBg: preset.headerBg, headerBgDark: preset.headerBgDark }),
    pill: {
      bg: preset.pillBg,
      border: preset.pillBorder,
      text: pillColor,
      activeBg: pillColor,
      activeText: isDark ? DarkBaseColors.text.primary : '#ffffff',
    },
    fill: {
      primary: preset.accent,
      secondary: base.fill.secondary,
    },
  };
}

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
  const colors = buildColors(preset, isDark);

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
