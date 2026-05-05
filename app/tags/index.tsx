import { View, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, FontSize } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';
import {
  getAllTagCategories,
  getTagValuesByCategory,
  createTagCategory,
  updateTagCategory,
  deleteTagCategory,
  createTagValue,
  updateTagValue,
  deleteTagValue,
  type TagCategory,
  type TagValue,
} from '@/lib/db/tags';

interface CategoryWithValues extends TagCategory {
  values: TagValue[];
  editingName: boolean;
  editNameText: string;
  addingValue: boolean;
  newValueText: string;
}

export default function TagsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [categories, setCategories] = useState<CategoryWithValues[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryText, setNewCategoryText] = useState('');
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [editValueText, setEditValueText] = useState('');

  const load = useCallback(() => {
    const cats = getAllTagCategories();
    setCategories(
      cats.map((c) => ({
        ...c,
        values: getTagValuesByCategory(c.id),
        editingName: false,
        editNameText: c.name,
        addingValue: false,
        newValueText: '',
      }))
    );
  }, []);

  useEffect(() => { load(); }, [load]);

  const setCatField = (
    id: string,
    fields: Partial<Pick<CategoryWithValues, 'editingName' | 'editNameText' | 'addingValue' | 'newValueText'>>
  ) => {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, ...fields } : c));
  };

  const handleAddCategory = () => {
    const name = newCategoryText.trim();
    if (!name) return;
    createTagCategory(name);
    setNewCategoryText('');
    setAddingCategory(false);
    load();
  };

  const handleRenameCategory = (cat: CategoryWithValues) => {
    const name = cat.editNameText.trim();
    if (name && name !== cat.name) updateTagCategory(cat.id, name);
    setCatField(cat.id, { editingName: false });
    load();
  };

  const handleDeleteCategory = (cat: CategoryWithValues) => {
    Alert.alert(
      `Delete "${cat.name}"?`,
      'This deletes all values and removes these tags from all exercises.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteTagCategory(cat.id); load(); } },
      ]
    );
  };

  const handleAddValue = (cat: CategoryWithValues) => {
    const label = cat.newValueText.trim();
    if (!label) return;
    createTagValue(cat.id, label);
    setCatField(cat.id, { addingValue: false, newValueText: '' });
    load();
  };

  const handleDeleteValue = (val: TagValue, categoryName: string) => {
    Alert.alert(
      `Delete "${val.label}"?`,
      `Removes this value from all exercises in "${categoryName}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteTagValue(val.id); load(); } },
      ]
    );
  };

  const handleSaveValue = (valId: string) => {
    const label = editValueText.trim();
    if (label) updateTagValue(valId, label);
    setEditingValueId(null);
    load();
  };

  const startEditValue = (val: TagValue) => {
    setEditingValueId(val.id);
    setEditValueText(val.label);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      {categories.map((cat) => (
        <View key={cat.id} style={styles.category}>
          {/* Category header */}
          {cat.editingName ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={cat.editNameText}
                onChangeText={(t) => setCatField(cat.id, { editNameText: t })}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => handleRenameCategory(cat)}
                onBlur={() => handleRenameCategory(cat)}
              />
              <TouchableOpacity onPress={() => handleRenameCategory(cat)} style={styles.actionBtn}>
                <Text variant="label">Done</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCatField(cat.id, { editingName: false })}
                style={styles.actionBtn}
              >
                <Text variant="label" color="tertiary">Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.categoryHeader}>
              <Text variant="label" style={styles.categoryName}>{cat.name}</Text>
              <TouchableOpacity
                onPress={() => setCatField(cat.id, { editingName: true, editNameText: cat.name })}
                hitSlop={8}
                style={styles.actionBtn}
              >
                <Text style={styles.editIcon}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteCategory(cat)} hitSlop={8} style={styles.actionBtn}>
                <Text style={styles.deleteIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Values */}
          {cat.values.map((val) => (
            <View key={val.id}>
              {editingValueId === val.id ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.editInput}
                    value={editValueText}
                    onChangeText={setEditValueText}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={() => handleSaveValue(val.id)}
                    onBlur={() => handleSaveValue(val.id)}
                  />
                  <TouchableOpacity onPress={() => handleSaveValue(val.id)} style={styles.actionBtn}>
                    <Text variant="label">Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditingValueId(null)}
                    style={styles.actionBtn}
                  >
                    <Text variant="label" color="tertiary">Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.valueRow}>
                  <Text variant="body" style={styles.valueLabel}>{val.label}</Text>
                  <TouchableOpacity onPress={() => startEditValue(val)} hitSlop={8} style={styles.actionBtn}>
                    <Text style={styles.editIcon}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteValue(val, cat.name)}
                    hitSlop={8}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.deleteIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {/* Add value */}
          {cat.addingValue ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={cat.newValueText}
                onChangeText={(t) => setCatField(cat.id, { newValueText: t })}
                placeholder="Value name"
                placeholderTextColor={colors.text.tertiary}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => handleAddValue(cat)}
              />
              <TouchableOpacity onPress={() => handleAddValue(cat)} style={styles.actionBtn}>
                <Text variant="label">Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCatField(cat.id, { addingValue: false, newValueText: '' })}
                style={styles.actionBtn}
              >
                <Text variant="label" color="tertiary">Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addRow}
              onPress={() => setCatField(cat.id, { addingValue: true })}
              activeOpacity={0.7}
            >
              <Text style={styles.addIcon}>+</Text>
              <Text variant="body" color="tertiary">Add value</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Add category */}
      <View style={styles.addCategorySection}>
        {addingCategory ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.editInput}
              value={newCategoryText}
              onChangeText={setNewCategoryText}
              placeholder="Category name"
              placeholderTextColor={colors.text.tertiary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAddCategory}
            />
            <TouchableOpacity onPress={handleAddCategory} style={styles.actionBtn}>
              <Text variant="label">Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setAddingCategory(false); setNewCategoryText(''); }}
              style={styles.actionBtn}
            >
              <Text variant="label" color="tertiary">Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addRow} onPress={() => setAddingCategory(true)} activeOpacity={0.7}>
            <Text style={styles.addIcon}>+</Text>
            <Text variant="body" color="secondary">New category</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: Spacing.xl },
    category: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xs,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    categoryName: {
      flex: 1,
      fontSize: FontSize.base,
      letterSpacing: 0.3,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    valueLabel: { flex: 1 },
    editRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    editInput: {
      flex: 1,
      fontSize: FontSize.base,
      color: c.text.primary,
      borderBottomWidth: 1,
      borderBottomColor: c.borderStrong,
      paddingVertical: 2,
    },
    actionBtn: {
      paddingHorizontal: Spacing.xs,
      paddingVertical: Spacing.xs,
    },
    editIcon: {
      fontSize: 15,
      color: c.text.secondary,
    },
    deleteIcon: {
      fontSize: 13,
      color: c.text.tertiary,
    },
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    addCategorySection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    addIcon: {
      fontSize: 18,
      color: c.text.tertiary,
      lineHeight: 22,
    },
  });
}
