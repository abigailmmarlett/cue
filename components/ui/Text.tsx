import type { Ref } from 'react';
import { Text as RNText, TextProps, StyleSheet, type TextInstance } from 'react-native';
import { FontSize, FontWeight } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useTextSize, TEXT_SCALE } from '@/lib/hooks/usePreferences';

type Variant = 'title' | 'heading' | 'body' | 'label' | 'caption' | 'timer';
type Color = 'primary' | 'secondary' | 'tertiary' | 'inverse';

interface Props extends TextProps {
  variant?: Variant;
  color?: Color;
  ref?: Ref<TextInstance>;
}

/**
 * Text sizes multiply: the app's own text size setting, then iOS Dynamic Type. Layouts hold up to
 * twice the base size in total, so Dynamic Type is capped at whatever keeps the product within that.
 */
const MAX_TOTAL_SCALE = 2;
/** Display text is already large, so Dynamic Type grows it only a little. */
export const DISPLAY_MAX_MULTIPLIER = 1.2;

/** The Dynamic Type cap for normal text at the current app text size; pass it to RN text views. */
export function useMaxFontSizeMultiplier(): number {
  return Math.max(1, MAX_TOTAL_SCALE / TEXT_SCALE[useTextSize()]);
}

const BASE_FONT_SIZES: Record<Variant, number> = {
  title: FontSize['2xl'],
  heading: FontSize.xl,
  body: FontSize.base,
  label: FontSize.sm,
  caption: FontSize.xs,
  timer: FontSize.timer,
};

export function Text({ variant = 'body', color = 'primary', style, maxFontSizeMultiplier, ...props }: Props) {
  const { colors } = useTheme();
  const textSize = useTextSize();
  const scale = TEXT_SCALE[textSize];

  const colorStyle = {
    primary: { color: colors.text.primary },
    secondary: { color: colors.text.secondary },
    tertiary: { color: colors.text.tertiary },
    // Used for labels on filled buttons.
    inverse: { color: colors.text.onFill },
  }[color];

  const sizeStyle = variant === 'timer' ? null : { fontSize: Math.round(BASE_FONT_SIZES[variant] * scale) };

  const display = variant === 'title' || variant === 'timer';
  const textCap = Math.max(1, MAX_TOTAL_SCALE / scale);

  return (
    <RNText
      style={[styles.base, styles[variant], colorStyle, sizeStyle, style]}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? (display ? DISPLAY_MAX_MULTIPLIER : textCap)}
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
