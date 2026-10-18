import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { TextInput } from '@/components/ui/TextInput';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useTextSize, TEXT_SCALE } from '@/lib/hooks/usePreferences';
import type { ExerciseTag } from '@/lib/db/tags';
import type { RefObject } from 'react';
import { IconButton } from '@/components/ui/IconButton';

interface Props {
  title: string;
  countLabel?: string;
  safeTop: number;
  onAdd?: () => void;
  /** What VoiceOver says for the + button, e.g. "New sequence". */
  addLabel?: string;
  onImport?: () => void;
  search?: string;
  onSearchChange?: (v: string) => void;
  tagPills?: ExerciseTag[];
  activeTagIds?: string[];
  onTagToggle?: (tag: ExerciseTag) => void;
  addButtonRef?: RefObject<View | null>;
  filterAreaRef?: RefObject<View | null>;
}

function makeStyles(c: typeof Colors, textScale = 1.0) {
  return StyleSheet.create({
    header: {
      paddingHorizontal: 22,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    wordmarkRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 22,
    },
    wordmarkLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    accentBar: {
      width: 3,
      height: 78,
      borderRadius: 2,
      flexShrink: 0,
    },
    wordmark: {
      fontSize: Math.round(78 * textScale),
      fontWeight: '800',
      letterSpacing: -4,
      lineHeight: Math.round(86 * textScale),
      paddingRight: 4,
      color: c.text.primary,
    },
    countLabel: {
      fontSize: Math.round(10 * textScale),
      fontWeight: '600',
      // Secondary, not tertiary: it sits on the header's gradient.
      color: c.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginTop: 8,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    addButton: {
      width: 38,
      height: 38,
      borderRadius: 10,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
      flexShrink: 0,
    },
    addButtonText: {
      fontSize: Math.round(22 * textScale),
      fontWeight: '300',
      lineHeight: 26,
      marginTop: -1,
    },
    importButton: {
      width: 38,
      height: 38,
      borderRadius: 10,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
      flexShrink: 0,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderWidth: 1,
      marginBottom: 14,
      backgroundColor: c.surface,
      borderColor: c.borderMid,
    },
    searchIcon: {
      fontSize: Math.round(16 * textScale),
      color: c.text.tertiary,
      lineHeight: 18,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: c.text.primary,
      padding: 0,
    },
    searchClear: {
      fontSize: Math.round(12 * textScale),
      color: c.text.tertiary,
    },
    pillsRow: {
      flexDirection: 'row',
      gap: 7,
      paddingRight: 4,
    },
    pill: {
      borderWidth: 1,
      borderTopLeftRadius: 4,
      borderBottomLeftRadius: 4,
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
      paddingVertical: 6,
      paddingLeft: 11,
      paddingRight: 13,
    },
    pillText: {
      fontSize: Math.round(11 * textScale),
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });
}

export function ScreenHeader({
  title,
  countLabel,
  safeTop,
  onAdd,
  addLabel,
  onImport,
  search = '',
  onSearchChange,
  tagPills = [],
  activeTagIds = [],
  onTagToggle,
  addButtonRef,
  filterAreaRef,
}: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors, TEXT_SCALE[useTextSize()]);

  return (
    <LinearGradient
      colors={[colors.headerBgDark, colors.headerBg]}
      style={[styles.header, { paddingTop: safeTop + 18 }]}
    >
      <View style={styles.wordmarkRow}>
        <View style={styles.wordmarkLeft}>
          <View style={[styles.accentBar, { backgroundColor: colors.accent }]} />
          <View>
            {/* The wordmark is already huge, so it ignores Dynamic Type and shrinks to fit. */}
            <Text style={styles.wordmark} maxFontSizeMultiplier={1} numberOfLines={1} adjustsFontSizeToFit>
              {title}
            </Text>
            {countLabel ? <Text style={styles.countLabel}>{countLabel}</Text> : null}
          </View>
        </View>
        {(onImport || onAdd) && (
          <View style={styles.headerActions}>
            {onImport && (
              <IconButton
                label="Import a copied sequence link"
                style={[styles.importButton, { borderColor: colors.border }]}
                onPress={onImport}
                hitSlop={4}
              >
                <SymbolView name="square.and.arrow.down" size={18} tintColor={colors.text.secondary} />
              </IconButton>
            )}
            {onAdd && (
              <View ref={addButtonRef}>
                <IconButton
                  label={addLabel ?? 'Add'}
                  style={[styles.addButton, { borderColor: colors.accent }]}
                  onPress={onAdd}
                  hitSlop={4}
                >
                  <Text style={[styles.addButtonText, { color: colors.accentText }]}>+</Text>
                </IconButton>
              </View>
            )}
          </View>
        )}
      </View>

      {onSearchChange && (
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={search}
            onChangeText={onSearchChange}
            placeholder={`Search ${title}…`}
            accessibilityLabel={`Search ${title}`}
            placeholderTextColor={colors.text.tertiary}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <IconButton label="Clear search" onPress={() => onSearchChange('')}>
              <Text style={styles.searchClear}>✕</Text>
            </IconButton>
          )}
        </View>
      )}

      <View ref={filterAreaRef}>
        {tagPills.length > 0 && onTagToggle && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
            keyboardShouldPersistTaps="handled"
          >
            {tagPills.map((tag) => {
              const active = activeTagIds.includes(tag.tagValueId);
              return (
                <TouchableOpacity
                  key={tag.tagValueId}
                  style={[
                    styles.pill,
                    { backgroundColor: colors.pill.bg, borderColor: colors.pill.border },
                    active && { backgroundColor: colors.pill.activeBg, borderColor: colors.accent },
                  ]}
                  onPress={() => onTagToggle(tag)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${tag.label}`}
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[styles.pillText, { color: colors.pill.text }, active && { color: colors.pill.activeText }]}
                  >
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </LinearGradient>
  );
}
