import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { SequenceCard } from '@/components/SequenceCard';
import { Colors, Spacing } from '@/constants/theme';
import { useSequences } from '@/lib/hooks/useSequences';
import { deleteSequence, duplicateSequence } from '@/lib/db/sequences';

export default function LibraryScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { bottom } = useSafeAreaInsets();
  const { sequences, loading, refresh } = useSequences();
  const flatListRef = useRef<FlatList>(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (sequences.length > prevLengthRef.current) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
    prevLengthRef.current = sequences.length;
  }, [sequences.length]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push('/builder')}
          hitSlop={8}
          style={styles.addButton}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, router]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (loading) {
    return <View style={styles.empty} />;
  }

  if (sequences.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="heading" style={styles.emptyTitle}>
          No sequences yet
        </Text>
        <Text variant="body" color="secondary" style={styles.emptySubtitle}>
          Create your first workout sequence to get started.
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/builder')}
          activeOpacity={0.8}
        >
          <Text variant="label" color="inverse">
            New Sequence
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={sequences}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.list, { paddingBottom: Spacing.md + bottom }]}
      renderItem={({ item }) => (
        <SequenceCard
          sequence={item}
          onPress={() => router.push(`/sequence/${item.id}`)}
          onDuplicate={() => {
            duplicateSequence(item.id);
            refresh();
          }}
          onDelete={() => {
            deleteSequence(item.id);
            refresh();
          }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.md,
  },
  addButton: {
    marginRight: Spacing.sm,
  },
  addIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.text.primary,
    lineHeight: 32,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  createButton: {
    backgroundColor: Colors.fill.primary,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    marginTop: Spacing.sm,
  },
});
