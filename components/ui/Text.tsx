import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { FontSize, FontWeight } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';

type Variant = 'title' | 'heading' | 'body' | 'label' | 'caption' | 'timer';
type Color = 'primary' | 'secondary' | 'tertiary' | 'inverse';

interface Props extends TextProps {
  variant?: Variant;
  color?: Color;
}

export function Text({ variant = 'body', color = 'primary', style, ...props }: Props) {
  const { colors } = useTheme();
  const colorStyle = {
    primary: { color: colors.text.primary },
    secondary: { color: colors.text.secondary },
    tertiary: { color: colors.text.tertiary },
    inverse: { color: colors.text.inverse },
  }[color];

  return (
    <RNText
      style={[styles.base, styles[variant], colorStyle, style]}
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
