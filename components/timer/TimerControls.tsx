import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import type { TimerStatus, TimerControls } from '@/lib/hooks/useTimer';

interface Props {
  status: TimerStatus;
  controls: TimerControls;
}

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.lg,
      gap: Spacing.lg,
    },
    primaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.lg,
    },
    secondaryRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.xl,
    },
    controlBtn: {
      alignItems: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.md,
      minWidth: 64,
    },
    controlBtnLg: {
      minWidth: 80,
      paddingVertical: Spacing.md,
    },
    controlBtnDisabled: {
      opacity: 0.3,
    },
    controlIcon: {
      fontSize: 22,
      color: c.text.primary,
    },
    controlIconLg: {
      fontSize: 26,
    },
    controlIconPrimary: {
      color: c.text.inverse,
    },
    controlIconDisabled: {
      color: c.text.tertiary,
    },
    controlLabel: {
      textAlign: 'center',
    },
    textButton: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
    },
  });
}

export function TimerControls({ status, controls }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const isIdle = status === 'idle';
  const isRunning = status === 'running';
  const isPaused = status === 'paused';

  return (
    <View style={styles.container}>
      <View style={styles.primaryRow}>
        <ControlButton
          icon="←"
          label="Back"
          onPress={controls.goBack}
          disabled={isIdle}
          size="md"
          styles={styles}
        />

        <ControlButton
          icon={isRunning ? '❙❙' : '▶'}
          label={isRunning ? 'Pause' : isPaused ? 'Resume' : 'Start'}
          onPress={isRunning ? controls.pause : isPaused ? controls.resume : controls.start}
          size="lg"
          primary
          accentColor={colors.accent}
          styles={styles}
        />

        <ControlButton
          icon="→"
          label="Skip"
          onPress={controls.skip}
          disabled={isIdle}
          size="md"
          styles={styles}
        />
      </View>

      <View style={styles.secondaryRow}>
        <TouchableOpacity onPress={controls.reset} style={styles.textButton} hitSlop={8}>
          <Text variant="label" color="tertiary">
            Reset
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface ControlButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  size: 'md' | 'lg';
  primary?: boolean;
  accentColor?: string;
  styles: ReturnType<typeof makeStyles>;
}

function ControlButton({ icon, label, onPress, disabled, size, primary, accentColor, styles }: ControlButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.controlBtn,
        size === 'lg' && styles.controlBtnLg,
        primary && { backgroundColor: accentColor },
        disabled && styles.controlBtnDisabled,
      ]}
    >
      <Text
        style={[
          styles.controlIcon,
          size === 'lg' && styles.controlIconLg,
          primary && styles.controlIconPrimary,
          disabled && styles.controlIconDisabled,
        ]}
      >
        {icon}
      </Text>
      <Text
        variant="caption"
        color={disabled ? 'tertiary' : primary ? 'inverse' : 'secondary'}
        style={styles.controlLabel}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
