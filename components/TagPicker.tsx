import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Text } from './ui/Text';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import {
  getAllTagCategories,
  getTagValuesByCategory,
  createTagCategory,
  createTagValue,
  type TagCategory,
  type TagValue,
} from '@/lib/db/tags';

interface Props {
  selectedTagValueIds: string[];
  onConfirm: (ids: string[]) => void;
  onClose: () => void;
}

interface CategoryWithValues extends TagCategory {
  values: TagValue[];
  addingValue: boolean;
  newValueText: string;
}

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    headerBtn: { minWidth: 60 },
    headerTitle: { textAlign: 'center' },
    scroll: { flex: 1 },
    empty: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      gap: Spacing.xs,
    },
    category: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xs,
      paddingHorizontal: Spacing.md,
    },
    categoryName: {
      letterSpacing: 0.8,
      marginBottom: Spacing.sm,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: Radius.sm,
      borderWidth: 1.5,
      borderColor: c.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmark: {
      fontSize: 13,
      color: c.text.inverse,
      lineHeight: 16,
    },
    addValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
      marginTop: Spacing.xs,
    },
    addCategorySection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    addCategoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
    },
    addIcon: {
      fontSize: 18,
      color: c.text.tertiary,
      lineHeight: 22,
    },
    inlineInput: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    input: {
      flex: 1,
      fontSize: FontSize.base,
      color: c.text.primary,
      borderBottomWidth: 1,
      borderBottomColor: c.borderStrong,
      paddingVertical: Spacing.xs,
    },
    inlineAddBtn: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    inlineCancelBtn: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
  });
}

export function TagPicker({ selectedTagValueIds, onConfirm, onClose }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [categories, setCategories] = useState<CategoryWithValues[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedTagValueIds));
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryText, setNewCategoryText] = useState('');

  const loadCategories = useCallback(() => {
    const cats = getAllTagCategories();
    setCategories(
      cats.map((c) => ({
        ...c,
        values: getTagValuesByCategory(c.id),
        addingValue: false,
        newValueText: '',
      }))
    );
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const toggleValue = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddCategory = () => {
    const name = newCategoryText.trim();
    if (!name) return;
    createTagCategory(name);
    setNewCategoryText('');
    setAddingCategory(false);
    loadCategories();
  };

  const handleAddValue = (categoryId: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    createTagValue(categoryId, trimmed);
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, values: getTagValuesByCategory(c.id), addingValue: false, newValueText: '' }
          : c
      )
    );
  };

  const setCategoryField = (
    categoryId: string,
    field: 'addingValue' | 'newValueText',
    value: boolean | string
  ) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, [field]: value } : c))
    );
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text variant="label" color="secondary">Cancel</Text>
          </TouchableOpacity>
          <Text variant="label" style={styles.headerTitle}>Tags</Text>
          <TouchableOpacity onPress={() => onConfirm(Array.from(selected))} style={styles.headerBtn}>
            <Text variant="label">Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {categories.length === 0 && !addingCategory && (
            <View style={styles.empty}>
              <Text variant="body" color="tertiary">No tag categories yet.</Text>
              <Text variant="caption" color="tertiary">Add one below to get started.</Text>
            </View>
          )}

          {categories.map((cat) => (
            <View key={cat.id} style={styles.category}>
              <Text variant="label" color="secondary" style={styles.categoryName}>
                {cat.name.toUpperCase()}
              </Text>

              {cat.values.map((val) => {
                const isSelected = selected.has(val.id);
                return (
                  <TouchableOpacity
                    key={val.id}
                    style={styles.valueRow}
                    onPress={() => toggleValue(val.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, isSelected && { backgroundColor: colors.fill.primary, borderColor: colors.fill.primary }]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text variant="body">{val.label}</Text>
                  </TouchableOpacity>
                );
              })}

              {cat.addingValue ? (
                <View style={styles.inlineInput}>
                  <TextInput
                    style={styles.input}
                    value={cat.newValueText}
                    onChangeText={(t) => setCategoryField(cat.id, 'newValueText', t)}
                    placeholder="Value name"
                    placeholderTextColor={colors.text.tertiary}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={() => handleAddValue(cat.id, cat.newValueText)}
                  />
                  <TouchableOpacity
                    onPress={() => handleAddValue(cat.id, cat.newValueText)}
                    style={styles.inlineAddBtn}
                  >
                    <Text variant="label">Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setCategoryField(cat.id, 'addingValue', false)}
                    style={styles.inlineCancelBtn}
                  >
                    <Text variant="label" color="tertiary">Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addValueRow}
                  onPress={() => setCategoryField(cat.id, 'addingValue', true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addIcon}>+</Text>
                  <Text variant="body" color="tertiary">Add value</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <View style={styles.addCategorySection}>
            {addingCategory ? (
              <View style={styles.inlineInput}>
                <TextInput
                  style={styles.input}
                  value={newCategoryText}
                  onChangeText={setNewCategoryText}
                  placeholder="Category name"
                  placeholderTextColor={colors.text.tertiary}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleAddCategory}
                />
                <TouchableOpacity onPress={handleAddCategory} style={styles.inlineAddBtn}>
                  <Text variant="label">Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setAddingCategory(false); setNewCategoryText(''); }}
                  style={styles.inlineCancelBtn}
                >
                  <Text variant="label" color="tertiary">Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addCategoryRow}
                onPress={() => setAddingCategory(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.addIcon}>+</Text>
                <Text variant="body" color="secondary">New category</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
