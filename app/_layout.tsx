import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { useState, useEffect, useCallback } from 'react';

import { DatabaseTooNewError, runMigrations } from '@/lib/db/schema';
import { getPreference } from '@/lib/db/preferences';
import { ThemeProvider, useTheme } from '@/lib/contexts/ThemeContext';
import { TourProvider, useTour } from '@/lib/contexts/TourContext';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { TourOverlay } from '@/components/TourOverlay';
import { ErrorFallback } from '@/components/ErrorFallback';

// Keep the home screen under deep-linked routes (e.g. cue://import) so they can always go back.
export const unstable_settings = { initialRouteName: 'index' };

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Sets up the database. Returns the error instead of crashing so we can show a recoverable screen. */
function openDatabase(): Error | null {
  try {
    runMigrations();
    return null;
  } catch (e) {
    console.error('Could not open the database', e);
    return e instanceof Error ? e : new Error(String(e));
  }
}

// Last-resort fallback for errors that no route-level boundary caught.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <ErrorFallback
      title="Something went wrong"
      message="Cue ran into a problem. Your saved sequences are safe."
      error={error}
      actions={[{ label: 'Try again', onPress: retry }]}
    />
  );
}

function AppShellInner() {
  const { colors, isDark } = useTheme();
  const { startTour } = useTour();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync()
      .catch(() => {})
      .then(() => {
        // The welcome plays on first launch and leads into the tour; later launches go straight in.
        if (!getPreference('hasTakenTour')) setShowWelcome(true);
      });
  }, []);

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false);
    setTimeout(() => startTour(), 400);
  }, [startTour]);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.background,
      card: colors.headerBg,
      text: colors.text.primary,
      border: colors.border,
    },
  };

  return (
    <NavThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: colors.accent,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* The tab screens hide their headers; the titles label the back button on screens they open. */}
        <Stack.Screen name="index" options={{ title: 'Sequences', headerShown: false, animation: 'none' }} />
        <Stack.Screen name="library" options={{ title: 'Library', headerShown: false, animation: 'none' }} />
        <Stack.Screen name="preferences" options={{ title: 'Settings', headerShown: false, animation: 'none' }} />
        <Stack.Screen
          name="builder/index"
          options={{ title: 'New Sequence', presentation: 'modal', headerBackButtonMenuEnabled: false }}
        />
        <Stack.Screen
          name="builder/[id]"
          options={{ title: 'Edit Sequence', presentation: 'modal', headerBackButtonMenuEnabled: false }}
        />
        <Stack.Screen name="sequence/[id]/index" options={{ title: '' }} />
        <Stack.Screen name="sequence/[id]/timer" options={{ headerShown: false }} />
        <Stack.Screen name="tags/index" options={{ title: 'Tags' }} />
        <Stack.Screen
          name="import"
          options={{ title: 'Shared Sequence', presentation: 'modal', headerBackButtonMenuEnabled: false }}
        />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {showWelcome && <WelcomeScreen onComplete={handleWelcomeComplete} />}
      <TourOverlay />
    </NavThemeProvider>
  );
}

function AppShell() {
  return (
    <TourProvider>
      <AppShellInner />
    </TourProvider>
  );
}

export default function RootLayout() {
  // Runs before any screen renders, since every screen reads from the database.
  const [dbError, setDbError] = useState(openDatabase);

  if (dbError instanceof DatabaseTooNewError) {
    return (
      <ErrorFallback
        title="Update Cue to open your data"
        message="Your data was saved by a newer version of Cue. Update Cue from the App Store to keep using it."
        error={dbError}
        actions={[]}
      />
    );
  }
  if (dbError) {
    return (
      <ErrorFallback
        title="Cue couldn't open your data"
        message="Try again, or close and reopen the app. If this keeps happening, please contact support."
        error={dbError}
        actions={[{ label: 'Try again', onPress: () => setDbError(openDatabase()) }]}
      />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
