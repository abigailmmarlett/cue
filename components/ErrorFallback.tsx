import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useRouter, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Colors, DarkBaseColors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

interface Action {
  label: string;
  onPress: () => void;
}

interface Props {
  title: string;
  message: string;
  actions: Action[];
  error?: Error;
}

/**
 * Full-screen error message. Deliberately avoids ThemeContext and other app state
 * so it can render even when the app failed before those were set up.
 */
export function ErrorFallback({ title, message, actions, error }: Props) {
  const c = useColorScheme() === 'dark' ? DarkBaseColors : Colors;

  useEffect(() => {
    // The app may have failed before it hid the native splash screen.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text.primary }]} accessibilityRole="header">
        {title}
      </Text>
      <Text style={[styles.message, { color: c.text.secondary }]}>{message}</Text>
      {__DEV__ && error && (
        <Text style={[styles.details, { color: c.text.tertiary }]} selectable>
          {error.message}
        </Text>
      )}
      <View style={styles.actions}>
        {actions.map((action, i) => (
          <TouchableOpacity
            key={action.label}
            onPress={action.onPress}
            accessibilityRole="button"
            style={[
              styles.button,
              i === 0 ? { backgroundColor: c.fill.primary } : { borderColor: c.border, borderWidth: 1 },
            ]}
          >
            <Text style={[styles.buttonLabel, { color: i === 0 ? c.text.inverse : c.text.primary }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/** Error boundary for individual routes: export it as `ErrorBoundary` from a route file. */
export function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const router = useRouter();
  return (
    <ErrorFallback
      title="Something went wrong"
      message="This screen ran into a problem. Your saved sequences are safe."
      error={error}
      actions={[
        { label: 'Try again', onPress: retry },
        { label: 'Go back', onPress: () => (router.canGoBack() ? router.back() : router.replace('/')) },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.base,
    textAlign: 'center',
  },
  details: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    fontFamily: 'Menlo',
  },
  actions: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
    alignSelf: 'stretch',
  },
  button: {
    minHeight: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  buttonLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
});
