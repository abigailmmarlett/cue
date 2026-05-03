import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { runMigrations } from '@/lib/db/schema';
import { Colors } from '@/constants/theme';

// Run synchronously before any screen renders
runMigrations();

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text.primary,
    border: Colors.border,
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <ThemeProvider value={AppTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text.primary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Cue', headerLargeTitle: true }} />
        <Stack.Screen
          name="builder/index"
          options={{ title: 'New Sequence', presentation: 'modal' }}
        />
        <Stack.Screen
          name="builder/[id]"
          options={{ title: 'Edit Sequence', presentation: 'modal' }}
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
      <StatusBar style="dark" />
    </ThemeProvider>
    </GestureHandlerRootView>
  );
}
