export const Colors = {
  background: '#f4faf4',
  bgAlt: '#eaf4ea',
  headerBg: '#ddf3dd',
  surface: 'rgba(0,0,0,0.03)',
  surfaceSolid: '#ffffff',
  border: 'rgba(0,0,0,0.07)',
  borderMid: 'rgba(0,0,0,0.13)',
  borderStrong: 'rgba(0,0,0,0.2)',
  text: {
    primary: '#0d1a0d',
    secondary: 'rgba(13,26,13,0.5)',
    tertiary: 'rgba(13,26,13,0.28)',
    inverse: '#ffffff',
  },
  accent: '#16a34a',
  accentDeep: '#15803d',
  accentDim: 'rgba(22,163,74,0.1)',
  accentBorder: 'rgba(22,163,74,0.27)',
  pill: {
    bg: 'rgba(22,163,74,0.08)',
    border: 'rgba(22,163,74,0.2)',
    text: '#16a34a',
    activeBg: '#16a34a',
    activeText: '#ffffff',
  },
  danger: '#dc2626',
  dangerDim: 'rgba(220,38,38,0.1)',
  fill: {
    primary: '#16a34a',
    secondary: 'rgba(0,0,0,0.03)',
  },
  nav: {
    bg: 'rgba(244,250,244,0.97)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  timer: 80,
};

export const FontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '800' as const,
};
