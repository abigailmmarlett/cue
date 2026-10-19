import { bestTextOn, ensureContrast } from '@/lib/utils/contrast';
import { Colors as BaseColors, DarkBaseColors } from './theme';

export type ThemeId =
  | 'forest'
  | 'ocean'
  | 'dusk'
  | 'ember'
  | 'stone'
  | 'bloom'
  | 'reverie'
  | 'tidal'
  | 'electric'
  | 'haze'
  | 'canopy'
  | 'dune'
  | 'wildfire'
  | 'verdigris';

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
    headerBgDark: '#BEA4B5',
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
  {
    id: 'haze',
    name: 'Haze',
    accent: '#C26D82',
    accentDeep: '#8B7DB8',
    accentDim: 'rgba(194,109,130,0.1)',
    accentBorder: 'rgba(194,109,130,0.27)',
    headerBg: '#F9EFF3',
    headerBgDark: '#EDD5DE',
    pillBg: 'rgba(139,125,184,0.1)',
    pillBorder: 'rgba(139,125,184,0.25)',
    pillAccent: '#8B7DB8',
  },
  {
    id: 'canopy',
    name: 'Canopy',
    accent: '#0F766E',
    accentDeep: '#B45309',
    accentDim: 'rgba(15,118,110,0.1)',
    accentBorder: 'rgba(15,118,110,0.27)',
    headerBg: '#F0FDFA',
    headerBgDark: '#C2EDE9',
    pillBg: 'rgba(180,83,9,0.08)',
    pillBorder: 'rgba(180,83,9,0.2)',
    pillAccent: '#B45309',
  },
  {
    id: 'dune',
    name: 'Dune',
    accent: '#C2851A',
    accentDeep: '#4D7C6D',
    accentDim: 'rgba(194,133,26,0.1)',
    accentBorder: 'rgba(194,133,26,0.27)',
    headerBg: '#FEFCE8',
    headerBgDark: '#F7EAAA',
    pillBg: 'rgba(77,124,109,0.1)',
    pillBorder: 'rgba(77,124,109,0.25)',
    pillAccent: '#4D7C6D',
  },
  {
    id: 'wildfire',
    name: 'Wildfire',
    accent: '#DC2626',
    accentDeep: '#BE185D',
    accentDim: 'rgba(220,38,38,0.1)',
    accentBorder: 'rgba(220,38,38,0.27)',
    headerBg: '#FFF1F2',
    headerBgDark: '#FFD0D6',
    pillBg: 'rgba(190,24,93,0.08)',
    pillBorder: 'rgba(190,24,93,0.2)',
    pillAccent: '#BE185D',
  },
  {
    id: 'verdigris',
    name: 'Verdigris',
    accent: '#0D9488',
    accentDeep: '#C2410C',
    accentDim: 'rgba(13,148,136,0.1)',
    accentBorder: 'rgba(13,148,136,0.27)',
    headerBg: '#F0FDFC',
    headerBgDark: '#C7EBE9',
    pillBg: 'rgba(194,65,12,0.08)',
    pillBorder: 'rgba(194,65,12,0.2)',
    pillAccent: '#C2410C',
  },
];

/** The theme a new install starts with, and the fallback when a saved theme no longer exists. */
export const DEFAULT_THEME_ID: ThemeId = 'ocean';
export const DEFAULT_PRESET = THEME_PRESETS.find((p) => p.id === DEFAULT_THEME_ID) ?? THEME_PRESETS[0];

export type ThemeColors = typeof BaseColors;

const WHITE = '#ffffff';

/**
 * A theme's colors for light or dark mode. Text colors derived from the accent are adjusted until
 * they pass WCAG's 4.5:1, keeping their hue: lib/utils/themeContrast.test.ts checks every theme.
 */
export function buildColors(preset: ThemePreset, isDark: boolean): ThemeColors {
  const base = isDark ? DarkBaseColors : BaseColors;
  const background = base.background;
  const pillColor = preset.pillAccent ?? preset.accent;

  // Buttons: in light mode, deepen the fill until white labels read on it; in dark mode, keep the
  // accent and use whichever of white or dark text reads better on it.
  const fill = isDark ? preset.accent : ensureContrast(preset.accent, 4.5, WHITE);
  const onFill = isDark ? bestTextOn(fill, WHITE, base.text.inverse) : WHITE;
  const pillFill = isDark ? pillColor : ensureContrast(pillColor, 4.5, WHITE);
  const onPillFill = isDark ? bestTextOn(pillFill, WHITE, base.text.inverse) : WHITE;

  // Text is adjusted for each background it's drawn on, one after another. Within a mode they're all
  // light or all dark, so each step only pushes the color further the same way. The header is a
  // gradient, so its text must read on both ends.
  const headerEnds = isDark ? [base.headerBg, base.headerBgDark] : [preset.headerBg, preset.headerBgDark];
  const readableOn = (color: string, ...placements: string[][]) =>
    placements.reduce((c, bgs) => ensureContrast(c, 4.5, ...bgs), color);

  return {
    ...base,
    text: { ...base.text, onFill },
    accent: preset.accent,
    // Accent text sits on the page, on cards, in headers and on the timer's accentDim badge.
    accentText: readableOn(
      preset.accent,
      [base.surface, background],
      [preset.accentDim, background],
      ...headerEnds.map((h) => [h])
    ),
    accentDeep: preset.accentDeep,
    accentDim: preset.accentDim,
    accentBorder: preset.accentBorder,
    // In dark mode, use the neutral dark headers from base instead of light-tinted preset headers
    ...(isDark ? {} : { headerBg: preset.headerBg, headerBgDark: preset.headerBgDark }),
    pill: {
      bg: preset.pillBg,
      border: preset.pillBorder,
      // Tag chips sit on the page and on cards; filter pills sit in the header.
      text: readableOn(
        pillColor,
        [preset.pillBg, background],
        [preset.pillBg, base.surface, background],
        ...headerEnds.map((h) => [preset.pillBg, h])
      ),
      activeBg: pillFill,
      activeText: onPillFill,
    },
    fill: {
      primary: fill,
      secondary: base.fill.secondary,
    },
  };
}
