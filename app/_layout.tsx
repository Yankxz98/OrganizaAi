import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './theme/ThemeContext';
import { EventProvider } from './utils/EventContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <EventProvider>
          <Stack screenOptions={{
            headerShown: false,
            contentStyle: { paddingTop: 0 },
            animation: 'slide_from_right',
          }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="travel" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </EventProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
