import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { FontSize, FontWeight } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useTextSize, TEXT_SCALE } from '@/lib/hooks/usePreferences';

type Variant = 'title' | 'heading' | 'body' | 'label' | 'caption' | 'timer';
type Color = 'primary' | 'secondary' | 'tertiary' | 'inverse';

interface Props extends TextProps {
  variant?: Variant;
  color?: Color;
}

const BASE_FONT_SIZES: Record<Variant, number> = {
  title: FontSize['2xl'],
  heading: FontSize.xl,
  body: FontSize.base,
  label: FontSize.sm,
  caption: FontSize.xs,
  timer: FontSize.timer,
};

export function Text({ variant = 'body', color = 'primary', style, ...props }: Props) {
  const { colors } = useTheme();
  const textSize = useTextSize();
  const scale = TEXT_SCALE[textSize];

  const colorStyle = {
    primary: { color: colors.text.primary },
    secondary: { color: colors.text.secondary },
    tertiary: { color: colors.text.tertiary },
    inverse: { color: colors.text.inverse },
  }[color];

  const sizeStyle = variant === 'timer'
    ? null
    : { fontSize: Math.round(BASE_FONT_SIZES[variant] * scale) };

  return (
    <RNText
      style={[styles.base, styles[variant], colorStyle, sizeStyle, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {},
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
  },
  timer: {
    fontSize: FontSize.timer,
    fontWeight: FontWeight.light,
    letterSpacing: -4,
    fontVariant: ['tabular-nums'],
  },
});
