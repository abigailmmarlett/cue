import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { useState, useEffect, useCallback } from 'react';

import { runMigrations } from '@/lib/db/schema';
import { getPreference } from '@/lib/db/preferences';
import { ThemeProvider, useTheme } from '@/lib/contexts/ThemeContext';
import { TourProvider, useTour } from '@/lib/contexts/TourContext';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { TourOverlay } from '@/components/TourOverlay';
import { ErrorFallback } from '@/components/ErrorFallback';

// Keep the home screen under deep-linked routes (e.g. cue://import) so they can always go back.
export const unstable_settings = { initialRouteName: 'index' };

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Sets up the database. Returns false instead of crashing so we can show a recoverable screen. */
function openDatabase(): boolean {
  try {
    runMigrations();
    return true;
  } catch {
    return false;
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
      .then(() => setShowWelcome(true));
  }, []);

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false);
    const hasTaken = getPreference('hasTakenTour');
    if (!hasTaken) {
      setTimeout(() => startTour(), 400);
    }
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
        <Stack.Screen name="index" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="library" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="preferences" options={{ headerShown: false, animation: 'none' }} />
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
  const [dbReady, setDbReady] = useState(openDatabase);

  if (!dbReady) {
    return (
      <ErrorFallback
        title="Cue couldn't open your data"
        message="Try again, or close and reopen the app. If this keeps happening, please contact support."
        actions={[{ label: 'Try again', onPress: () => setDbReady(openDatabase()) }]}
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
