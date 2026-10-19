import { StyleSheet } from 'react-native';
import { Colors, Radius } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    sectionLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: c.text.tertiary,
      letterSpacing: 1.4,
      marginBottom: 8,
      marginLeft: 2,
    },
    card: {
      backgroundColor: c.surfaceSolid,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 22,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    rowLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: c.text.primary,
    },
    rowValue: {
      fontSize: 14,
      color: c.text.tertiary,
    },
    rowSubLabel: {
      fontSize: 12,
      color: c.text.tertiary,
      marginTop: 1,
    },
    timingChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    timingChipText: {
      fontSize: 13,
      color: c.text.secondary,
    },
    addTriggerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    deleteBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
  });
}

/** The section labels, cards and rows that every part of the Settings screen shares. */
export function useSettingsStyles() {
  return makeStyles(useTheme().colors);
}
