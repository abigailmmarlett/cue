import { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LoadDot } from '@/components/LoadDot';
import { Text } from '@/components/ui/Text';
import { Colors, Radius } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { createLoadIcon, deleteLoadIcon, getAllLoadIcons } from '@/lib/db/loadIcons';
import { useSettingsStyles } from './styles';

const LOAD_COLORS: { hex: string; name: string }[] = [
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#9CA3AF', name: 'Lt Gray' },
  { hex: '#6B7280', name: 'Gray' },
  { hex: '#1F2937', name: 'Black' },
  { hex: '#3B82F6', name: 'Blue' },
  { hex: '#EF4444', name: 'Red' },
  { hex: '#22C55E', name: 'Green' },
  { hex: '#EAB308', name: 'Yellow' },
  { hex: '#A855F7', name: 'Purple' },
  { hex: '#F97316', name: 'Orange' },
  { hex: '#EC4899', name: 'Pink' },
  { hex: '#14B8A6', name: 'Teal' },
];

const COLOR_NAMES = new Map(LOAD_COLORS.map((c) => [c.hex, c.name]));

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    iconListRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 10,
    },
    iconLabel: {
      flex: 1,
      fontSize: 14,
      color: c.text.primary,
    },
    deleteIconBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    addFormSection: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      gap: 12,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    colorSwatch: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1.5,
    },
    colorSwatchActive: {
      borderWidth: 2.5,
    },
    sizePills: {
      flexDirection: 'row',
      gap: 8,
    },
    sizePill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: Radius.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    sizePillActive: {
      borderColor: c.accent,
    },
    sizePillText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text.secondary,
    },
    sizePillTextActive: {
      color: c.accentText,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    addIconBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: Radius.sm,
      backgroundColor: c.fill.primary,
      alignSelf: 'flex-start',
    },
    addIconBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text.onFill,
    },
  });
}

/** Settings: the load icons exercises can show, and a form to make new ones. */
export function LoadIconsSection() {
  const { colors } = useTheme();
  const styles = { ...useSettingsStyles(), ...makeStyles(colors) };

  const [loadIcons, setLoadIcons] = useState(getAllLoadIcons);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newColor, setNewColor] = useState('#3B82F6');
  const [newSize, setNewSize] = useState<'S' | 'M' | 'L' | null>(null);

  const handleCreateIcon = () => {
    const colorName = COLOR_NAMES.get(newColor) ?? newColor;
    const label = newSize ? `${colorName} ${newSize}` : colorName;
    createLoadIcon(newColor, newSize, label);
    setLoadIcons(getAllLoadIcons());
    setShowAddForm(false);
    setNewColor('#3B82F6');
    setNewSize(null);
  };

  const handleDeleteIcon = (id: string) => {
    Alert.alert('Delete icon?', 'Exercises using this icon will no longer display it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteLoadIcon(id);
          setLoadIcons(getAllLoadIcons());
        },
      },
    ]);
  };
  return (
    <>
      <Text style={styles.sectionLabel}>LOAD ICONS</Text>

      <View style={styles.card}>
        {loadIcons.map((icon, idx) => (
          <View key={icon.id} style={[styles.iconListRow, idx > 0 && styles.rowBorder]}>
            <LoadDot color={icon.color} size={icon.size} diameter={20} />
            <Text style={styles.iconLabel}>{icon.label}</Text>
            <TouchableOpacity
              onPress={() => handleDeleteIcon(icon.id)}
              style={styles.deleteIconBtn}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${icon.label} icon`}
            >
              <Text variant="caption" color="tertiary">
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {showAddForm ? (
          <View style={[styles.addFormSection, loadIcons.length > 0 && styles.rowBorder]}>
            <View style={styles.colorGrid}>
              {LOAD_COLORS.map((c) => {
                const isWhite = c.hex === '#FFFFFF';
                const active = newColor === c.hex;
                return (
                  <TouchableOpacity
                    key={c.hex}
                    onPress={() => setNewColor(c.hex)}
                    activeOpacity={0.8}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={c.name}
                    accessibilityState={{ selected: active }}
                  >
                    <View
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor: c.hex,
                          borderColor: active ? colors.accent : isWhite ? colors.borderMid : 'rgba(0,0,0,0.15)',
                        },
                        active && styles.colorSwatchActive,
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.sizePills}>
              {([null, 'S', 'M', 'L'] as const).map((s) => {
                const active = newSize === s;
                return (
                  <TouchableOpacity
                    key={String(s)}
                    onPress={() => setNewSize(s)}
                    style={[styles.sizePill, active && styles.sizePillActive]}
                    activeOpacity={0.8}
                    hitSlop={{ top: 8, bottom: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Size ${s ?? 'none'}`}
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.sizePillText, active && styles.sizePillTextActive]}>{s ?? 'None'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.previewRow}>
              <LoadDot color={newColor} size={newSize} diameter={28} />
              <Text variant="caption" color="secondary">
                {newSize
                  ? `${COLOR_NAMES.get(newColor) ?? newColor} ${newSize}`
                  : (COLOR_NAMES.get(newColor) ?? newColor)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={handleCreateIcon}
                style={styles.addIconBtn}
                activeOpacity={0.8}
                hitSlop={{ top: 6, bottom: 6 }}
                accessibilityRole="button"
              >
                <Text style={styles.addIconBtnText}>Save Icon</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowAddForm(false);
                  setNewColor('#3B82F6');
                  setNewSize(null);
                }}
                style={[
                  styles.addIconBtn,
                  { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
                ]}
                activeOpacity={0.8}
                hitSlop={{ top: 6, bottom: 6 }}
                accessibilityRole="button"
              >
                <Text style={[styles.addIconBtnText, { color: colors.text.secondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowAddForm(true)}
            style={[styles.addTriggerRow, loadIcons.length > 0 && styles.rowBorder]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="New icon"
          >
            <Text style={{ fontSize: 18, color: colors.text.tertiary, lineHeight: 22 }}>+</Text>
            <Text variant="body" color="tertiary">
              New icon
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}
