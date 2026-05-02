export const Colors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  border: '#E5E5E5',
  borderStrong: '#D0D0D0',
  text: {
    primary: '#000000',
    secondary: '#6B6B6B',
    tertiary: '#9B9B9B',
    inverse: '#FFFFFF',
  },
  fill: {
    primary: '#000000',
    secondary: '#F5F5F5',
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
};
