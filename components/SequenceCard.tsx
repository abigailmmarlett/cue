import { View, TouchableOpacity, StyleSheet, Alert, ActionSheetIOS, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './ui/Text';
import { TagChips } from './TagChips';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { usePreferences, useTextSize, TEXT_SCALE } from '@/lib/hooks/usePreferences';
import { formatSeconds } from '@/lib/utils/time';
import type { SequenceWithTags } from '@/lib/db/sequences';

interface Props {
  sequence: SequenceWithTags;
  onPress: () => void;
  onPlay: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFavorite: () => void;
  onShare: () => void;
}

function makeStyles(c: typeof Colors, textScale = 1.0) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 10,
      marginBottom: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    accentBar: {
      height: 2,
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
      borderWidth: 1,
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
      marginLeft: 3,
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 4,
    },
    name: {
      fontSize: Math.round(17 * textScale),
      fontWeight: '700',
      color: c.text.primary,
      letterSpacing: -0.5,
      flex: 1,
    },
    star: {
      fontSize: Math.round(14 * textScale),
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    metaTime: {
      fontSize: Math.round(11 * textScale),
      fontWeight: '500',
      fontVariant: ['tabular-nums'] as const,
    },
    metaDot: {
      fontSize: Math.round(10 * textScale),
      color: c.text.tertiary,
    },
    metaSub: {
      fontSize: Math.round(11 * textScale),
      fontWeight: '500',
      color: c.text.secondary,
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
      backgroundColor: c.text.tertiary,
    },
  });
}

export function SequenceCard({ sequence, onPress, onPlay, onDuplicate, onDelete, onFavorite, onShare }: Props) {
  const { colors } = useTheme();
  const { hapticsEnabled } = usePreferences();
  const styles = makeStyles(colors, TEXT_SCALE[useTextSize()]);

  const showMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Duplicate', 'Share', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 4,
        },
        (index) => {
          if (index === 1) onPress();
          if (index === 2) onDuplicate();
          if (index === 3) onShare();
          if (index === 4) confirmDelete();
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
      <View style={[styles.accentBar, { backgroundColor: colors.accent }]} />
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: colors.accentDim, borderColor: colors.accentBorder }]}
          onPress={onPlay}
          activeOpacity={0.7}
        >
          <View style={[styles.playTriangle, { borderLeftColor: colors.accent }]} />
        </TouchableOpacity>

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <TouchableOpacity onPress={() => { if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onFavorite(); }} hitSlop={8} activeOpacity={0.7}>
              <Text style={[styles.star, { color: sequence.is_favorited ? '#f59e0b' : colors.text.tertiary }]}>★</Text>
            </TouchableOpacity>
            <Text style={styles.name} numberOfLines={1}>{sequence.name}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={[styles.metaTime, { color: colors.accent }]}>{totalTime}</Text>
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
