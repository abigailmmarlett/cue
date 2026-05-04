import { View, TouchableOpacity, StyleSheet, Alert, ActionSheetIOS, Platform } from 'react-native';
import { Text } from './ui/Text';
import { TagChips } from './TagChips';
import { Colors } from '@/constants/theme';
import { formatSeconds } from '@/lib/utils/time';
import type { SequenceWithTags } from '@/lib/db/sequences';

interface Props {
  sequence: SequenceWithTags;
  onPress: () => void;
  onPlay: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function SequenceCard({ sequence, onPress, onPlay, onDuplicate, onDelete }: Props) {
  const showMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Duplicate', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 3,
        },
        (index) => {
          if (index === 1) onPress();
          if (index === 2) onDuplicate();
          if (index === 3) confirmDelete();
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

  const totalTime = formatSeconds(sequence.total_duration);
  const exLabel = sequence.exercise_count === 1 ? '1 ex' : `${sequence.exercise_count} ex`;

  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.row}>
        <TouchableOpacity style={styles.playButton} onPress={onPlay} activeOpacity={0.7}>
          <View style={styles.playTriangle} />
        </TouchableOpacity>

        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>{sequence.name}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaTime}>{totalTime}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaSub}>{exLabel}</Text>
          </View>
          {sequence.tags.length > 0 && (
            <TagChips tags={sequence.tags} style={styles.tags} />
          )}
        </View>

        <TouchableOpacity style={styles.menuButton} onPress={showMenu} hitSlop={12}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accentBar: {
    height: 2,
    backgroundColor: Colors.accent,
    opacity: 0.65,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    paddingTop: 13,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: Colors.accent,
    marginLeft: 3,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metaTime: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.accent,
    fontVariant: ['tabular-nums'] as const,
  },
  metaDot: {
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  metaSub: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  tags: {
    marginTop: 2,
  },
  menuButton: {
    flexShrink: 0,
    paddingLeft: 8,
    gap: 3.5,
    alignItems: 'center',
    paddingTop: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.text.tertiary,
  },
});
