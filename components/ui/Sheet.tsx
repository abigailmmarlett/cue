import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './Text';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/lib/contexts/ThemeContext';

export interface SheetButton {
  label: string;
  onPress: () => void;
  /** Shown in the main text color, for the button that confirms (e.g. Done). Others are dimmer. */
  primary?: boolean;
}

interface Props {
  title: string;
  /** Swiping the sheet down calls this. */
  onClose: () => void;
  left?: SheetButton;
  right?: SheetButton;
  /** Shrinks the content to stay above the keyboard; for sheets with a field near the bottom. */
  avoidKeyboard?: boolean;
  children: ReactNode;
}

/** A page sheet that slides up over the screen, with a title and up to two header buttons. Mount it to show it. */
export function Sheet({ title, onClose, left, right, avoidKeyboard, children }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const content = (
    <>
      <View style={styles.header}>
        <HeaderButton button={left} align="left" />
        <Text variant="label" style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        <HeaderButton button={right} align="right" />
      </View>
      {children}
    </>
  );

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {/* A page sheet starts below the status bar, so only the bottom needs insetting. */}
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        {avoidKeyboard ? (
          <KeyboardAvoidingView style={styles.flex} behavior="padding">
            {content}
          </KeyboardAvoidingView>
        ) : (
          content
        )}
      </SafeAreaView>
    </Modal>
  );
}

function HeaderButton({ button, align }: { button?: SheetButton; align: 'left' | 'right' }) {
  if (!button) return <View style={headerButtonStyle} />;
  return (
    <TouchableOpacity onPress={button.onPress} style={headerButtonStyle} hitSlop={12} accessibilityRole="button">
      <Text variant="label" color={button.primary ? 'primary' : 'secondary'} style={{ textAlign: align }}>
        {button.label}
      </Text>
    </TouchableOpacity>
  );
}

const headerButtonStyle = { minWidth: 60 };

function makeStyles(c: typeof Colors) {
  return StyleSheet.create({
    flex: { flex: 1 },
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
    title: { flex: 1, textAlign: 'center', marginHorizontal: Spacing.sm },
  });
}
