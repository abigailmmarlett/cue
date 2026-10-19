import { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { TextInput } from '@/components/ui/TextInput';
import { Text } from './ui/Text';
import { IconButton } from './ui/IconButton';
import { TagChips } from './TagChips';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useActionButtonSize, useTextSize, ACTION_BUTTON_SCALE, TEXT_SCALE } from '@/lib/hooks/usePreferences';
import { formatSeconds, spokenDuration } from '@/lib/utils/time';
import type { DraftExercise } from '@/lib/db/sequenceDraft';
import { DRAG_ITEM_HEIGHT, DragHandle, type ItemMover } from './DraggableList';

interface Props {
  exercise: DraftExercise;
  onNameChange: (name: string) => void;
  onDurationChange: (duration: number) => void;
  onDelete: () => void;
  onEditTags: () => void;
  onEditLoad?: () => void;
  onEditVariation?: () => void;
  onSideChange?: (side: 'left' | 'right' | null) => void;
  /** Lets VoiceOver users reorder with Move up / Move down instead of dragging. */
  mover?: ItemMover;
}

const HANDLE_WIDTH = 32;

// The row's buttons sit side by side, so their touch areas grow up and down to 44pt but only a
// little sideways, where they'd overlap their neighbours.
const ROW_HIT_SLOP = { top: 12, bottom: 12, left: 2, right: 2 };

function makeStyles(c: typeof Colors, scale: number, textScale: number) {
  const hw = Math.round(HANDLE_WIDTH * scale);
  return StyleSheet.create({
    outer: {
      height: DRAG_ITEM_HEIGHT,
      backgroundColor: c.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      justifyContent: 'center',
    },
    mainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
    },
    tagsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingLeft: Spacing.md + hw + Spacing.sm,
      marginTop: 4,
      gap: Spacing.xs,
    },
    handle: {
      width: hw,
      alignItems: 'center',
      justifyContent: 'center',
    },
    handleIcon: {
      fontSize: Math.round(18 * scale),
      lineHeight: 24,
    },
    nameInput: {
      flex: 1,
      fontSize: Math.round(FontSize.base * textScale),
      fontWeight: FontWeight.regular,
      color: c.text.primary,
      paddingVertical: 0,
      marginHorizontal: Spacing.sm,
    },
    nameInputLinked: {
      color: c.text.secondary,
    },
    tagButton: {
      paddingHorizontal: Math.round(Spacing.sm * scale),
      paddingVertical: Math.round(Spacing.xs * scale),
    },
    tagIcon: {
      fontSize: Math.round(17 * scale),
      color: c.text.tertiary,
    },
    tagIconActive: {
      color: c.text.secondary,
    },
    addTagsLabel: {
      fontSize: Math.round(11 * textScale),
      color: c.text.tertiary,
    },
    durationButton: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      backgroundColor: c.surface,
      borderRadius: 6,
      minWidth: 48,
      alignItems: 'center',
    },
    durationText: {
      fontVariant: ['tabular-nums'],
    },
    deleteButton: {
      width: Math.round(40 * scale),
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteIcon: {
      fontSize: Math.round(14 * scale),
    },
    sidePill: {
      flexDirection: 'row',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
      marginRight: Spacing.xs,
    },
    sideBtn: {
      paddingHorizontal: Math.round(10 * scale),
      paddingVertical: Math.round(3 * scale),
    },
    sideBtnActive: {
      backgroundColor: c.fill.primary,
    },
    sideBtnText: {
      fontSize: Math.round(11 * scale),
      fontWeight: '600' as const,
      color: c.text.tertiary,
    },
    sideBtnTextActive: {
      color: c.text.onFill,
    },
  });
}

export function ExerciseRow({
  exercise,
  onNameChange,
  onDurationChange,
  onDelete,
  onEditTags,
  onEditLoad,
  onEditVariation,
  onSideChange,
  mover,
}: Props) {
  const { colors } = useTheme();
  const actionButtonSize = useActionButtonSize();
  const textSize = useTextSize();
  const styles = useMemo(
    () => makeStyles(colors, ACTION_BUTTON_SCALE[actionButtonSize], TEXT_SCALE[textSize]),
    [colors, actionButtonSize, textSize]
  );
  const hasLoad =
    (exercise.loadModified?.length ?? 0) > 0 ||
    (exercise.loadBase?.length ?? 0) > 0 ||
    (exercise.loadAmplified?.length ?? 0) > 0;

  const editDuration = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Set Duration',
        'Enter duration in seconds (e.g. 45)',
        (text) => {
          const n = parseInt(text, 10);
          if (!isNaN(n) && n > 0) onDurationChange(n);
        },
        'plain-text',
        String(exercise.duration)
      );
    }
  };

  return (
    <View style={styles.outer}>
      <View style={styles.mainRow}>
        <DragHandle>
          <View
            style={styles.handle}
            accessible={!!mover}
            accessibilityLabel={`Reorder ${exercise.name || 'exercise'}`}
            accessibilityActions={[
              ...(mover?.canMove(-1) ? [{ name: 'moveUp', label: 'Move up' }] : []),
              ...(mover?.canMove(1) ? [{ name: 'moveDown', label: 'Move down' }] : []),
            ]}
            onAccessibilityAction={({ nativeEvent }) => {
              if (nativeEvent.actionName === 'moveUp') mover?.move(-1);
              if (nativeEvent.actionName === 'moveDown') mover?.move(1);
            }}
          >
            <Text color="tertiary" style={styles.handleIcon}>
              ≡
            </Text>
          </View>
        </DragHandle>

        <TextInput
          style={[styles.nameInput, !!exercise.libraryExerciseId && styles.nameInputLinked]}
          value={exercise.name}
          onChangeText={onNameChange}
          placeholder="Exercise name"
          accessibilityLabel="Exercise name"
          placeholderTextColor={colors.text.tertiary}
          returnKeyType="done"
          maxLength={60}
          editable={!exercise.libraryExerciseId}
        />

        {onEditLoad && (
          <IconButton
            label={hasLoad ? 'Edit loads' : 'Add loads'}
            onPress={onEditLoad}
            style={styles.tagButton}
            hitSlop={ROW_HIT_SLOP}
          >
            <Text style={[styles.tagIcon, hasLoad && styles.tagIconActive]}>⊙</Text>
          </IconButton>
        )}

        {onEditVariation && (
          <IconButton label="Variations" onPress={onEditVariation} style={styles.tagButton} hitSlop={ROW_HIT_SLOP}>
            <Text
              style={[styles.tagIcon, !!(exercise.variationSets?.length || exercise.variation) && styles.tagIconActive]}
            >
              ◈
            </Text>
          </IconButton>
        )}

        {exercise.isBilateral && onSideChange && (
          <View style={styles.sidePill}>
            <TouchableOpacity
              onPress={() => onSideChange(exercise.side === 'left' ? null : 'left')}
              style={[styles.sideBtn, exercise.side === 'left' && styles.sideBtnActive]}
              hitSlop={{ top: 12, bottom: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Left side"
              accessibilityState={{ selected: exercise.side === 'left' }}
            >
              <Text style={[styles.sideBtnText, exercise.side === 'left' && styles.sideBtnTextActive]}>L</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSideChange(exercise.side === 'right' ? null : 'right')}
              style={[styles.sideBtn, exercise.side === 'right' && styles.sideBtnActive]}
              hitSlop={{ top: 12, bottom: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Right side"
              accessibilityState={{ selected: exercise.side === 'right' }}
            >
              <Text style={[styles.sideBtnText, exercise.side === 'right' && styles.sideBtnTextActive]}>R</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          onPress={editDuration}
          style={styles.durationButton}
          hitSlop={{ top: 10, bottom: 10, left: 2, right: 2 }}
          accessibilityRole="button"
          accessibilityLabel={`Duration, ${spokenDuration(exercise.duration)}`}
        >
          <Text variant="label" color="secondary" style={styles.durationText}>
            {formatSeconds(exercise.duration)}
          </Text>
        </TouchableOpacity>

        <IconButton
          label={`Remove ${exercise.name || 'exercise'}`}
          onPress={onDelete}
          style={styles.deleteButton}
          hitSlop={{ ...ROW_HIT_SLOP, top: 15, bottom: 15 }}
        >
          <Text color="tertiary" style={styles.deleteIcon}>
            ✕
          </Text>
        </IconButton>
      </View>

      <View style={styles.tagsRow}>
        {exercise.tags.length > 0 && <TagChips tags={exercise.tags} />}
        <TouchableOpacity onPress={onEditTags} hitSlop={14} accessibilityRole="button">
          <Text style={styles.addTagsLabel}>{exercise.tags.length > 0 ? 'Edit tags' : '+ Add tags'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
