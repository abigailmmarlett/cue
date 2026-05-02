import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Text } from './Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

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

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  style,
}: Props) {
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
        <ActivityIndicator color={variant === 'primary' ? Colors.text.inverse : Colors.text.primary} />
      ) : (
        <Text style={[labelStyles[variant], labelSizeStyles[size]]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.fill.primary,
  },
  secondary: {
    backgroundColor: Colors.fill.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
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

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, minHeight: 36 },
  md: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg, minHeight: 48 },
  lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, minHeight: 56 },
});

const labelStyles = StyleSheet.create({
  primary: { color: Colors.text.inverse, fontWeight: FontWeight.semibold },
  secondary: { color: Colors.text.primary, fontWeight: FontWeight.medium },
  ghost: { color: Colors.text.primary, fontWeight: FontWeight.medium },
  destructive: { color: '#D00000', fontWeight: FontWeight.medium },
});

const labelSizeStyles = StyleSheet.create({
  sm: { fontSize: FontSize.sm },
  md: { fontSize: FontSize.base },
  lg: { fontSize: FontSize.lg },
});
