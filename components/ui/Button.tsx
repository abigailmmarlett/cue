import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Text } from './Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    base: {
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: {
      backgroundColor: c.fill.primary,
    },
    secondary: {
      backgroundColor: c.fill.secondary,
      borderWidth: 1,
      borderColor: c.border,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    destructive: {
      backgroundColor: 'transparent',
    },
    disabled: {
      opacity: 0.4,
    },
  });
}

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, minHeight: 36 },
  md: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg, minHeight: 48 },
  lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, minHeight: 56 },
});

const labelSizeStyles = StyleSheet.create({
  sm: { fontSize: FontSize.sm },
  md: { fontSize: FontSize.base },
  lg: { fontSize: FontSize.lg },
});

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  style,
}: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const labelColor: 'inverse' | 'primary' =
    variant === 'primary' ? 'inverse' : 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        sizeStyles[size],
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.text.inverse : colors.text.primary} />
      ) : (
        <Text
          color={variant === 'destructive' ? 'primary' : labelColor}
          style={[
            labelSizeStyles[size],
            variant === 'destructive' && { color: '#D00000', fontWeight: FontWeight.medium },
            variant !== 'destructive' && { fontWeight: variant === 'primary' ? FontWeight.semibold : FontWeight.medium },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
