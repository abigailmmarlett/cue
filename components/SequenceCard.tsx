import { View, TouchableOpacity, StyleSheet, Alert, ActionSheetIOS, Platform } from 'react-native';
import { Text } from './ui/Text';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { formatSeconds } from '@/lib/utils/time';
import type { SequenceWithMeta } from '@/lib/db/sequences';

interface Props {
  sequence: SequenceWithMeta;
  onPress: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function SequenceCard({ sequence, onPress, onDuplicate, onDelete }: Props) {
  const showMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Duplicate', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (index) => {
          if (index === 1) onDuplicate();
          if (index === 2) confirmDelete();
        }
      );
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Sequence',
      `Delete "${sequence.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const exerciseLabel =
    sequence.exercise_count === 1 ? '1 exercise' : `${sequence.exercise_count} exercises`;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={showMenu}
      activeOpacity={0.7}
      style={styles.card}
    >
      <View style={styles.body}>
        <Text variant="heading" numberOfLines={1} style={styles.name}>
          {sequence.name}
        </Text>
        <View style={styles.meta}>
          <Text variant="label" color="secondary">
            {formatSeconds(sequence.total_duration)}
          </Text>
          <Text variant="label" color="tertiary" style={styles.dot}>
            ·
          </Text>
          <Text variant="label" color="secondary">
            {exerciseLabel}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={showMenu} hitSlop={12} style={styles.moreButton}>
        <Text variant="body" color="tertiary" style={styles.moreIcon}>
          •••
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  body: {
    flex: 1,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    fontSize: 10,
  },
  moreButton: {
    paddingLeft: Spacing.sm,
  },
  moreIcon: {
    letterSpacing: 1,
    fontSize: 12,
  },
});
