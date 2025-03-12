import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './theme/ThemeContext';
import { EventProvider } from './utils/EventContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <EventProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="travel" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </EventProvider>
    </ThemeProvider>
  );
}
