import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { Colors, Spacing, Radius } from '@/constants/theme';
import type { TimerStatus, TimerControls } from '@/lib/hooks/useTimer';

interface Props {
  status: TimerStatus;
  controls: TimerControls;
}

export function TimerControls({ status, controls }: Props) {
  const isIdle = status === 'idle';
  const isRunning = status === 'running';
  const isPaused = status === 'paused';

  return (
    <View style={styles.container}>
      {/* Primary controls */}
      <View style={styles.primaryRow}>
        <ControlButton
          icon="←"
          label="Back"
          onPress={controls.goBack}
          disabled={isIdle}
          size="md"
        />

        <ControlButton
          icon={isRunning ? '⏸' : '▶'}
          label={isRunning ? 'Pause' : isPaused ? 'Resume' : 'Start'}
          onPress={isRunning ? controls.pause : isPaused ? controls.resume : controls.start}
          size="lg"
          primary
        />

        <ControlButton
          icon="→"
          label="Skip"
          onPress={controls.skip}
          disabled={isIdle}
          size="md"
        />
      </View>

      {/* Secondary controls */}
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
}

function ControlButton({ icon, label, onPress, disabled, size, primary }: ControlButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.controlBtn,
        size === 'lg' && styles.controlBtnLg,
        primary && styles.controlBtnPrimary,
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

const styles = StyleSheet.create({
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
    backgroundColor: Colors.fill.primary,
    minWidth: 80,
    paddingVertical: Spacing.md,
  },
  controlBtnPrimary: {
    backgroundColor: Colors.fill.primary,
  },
  controlBtnDisabled: {
    opacity: 0.3,
  },
  controlIcon: {
    fontSize: 22,
    color: Colors.text.primary,
  },
  controlIconLg: {
    fontSize: 26,
  },
  controlIconPrimary: {
    color: Colors.text.inverse,
  },
  controlIconDisabled: {
    color: Colors.text.tertiary,
  },
  controlLabel: {
    textAlign: 'center',
  },
  textButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
});
