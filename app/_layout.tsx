import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { runMigrations } from '@/lib/db/schema';
import { ThemeProvider, useTheme } from '@/lib/contexts/ThemeContext';

// Run synchronously before any screen renders
runMigrations();

function AppShell() {
  const { colors, isDark } = useTheme();

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
        <Stack.Screen
          name="sequence/[id]/index"
          options={{ title: '' }}
        />
        <Stack.Screen
          name="sequence/[id]/timer"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="tags/index"
          options={{ title: 'Tags' }}
        />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
