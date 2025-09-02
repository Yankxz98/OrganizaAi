import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { EventProvider } from './utils/EventContext';

// Componente para StatusBar que se adapta ao tema
function ThemedStatusBar() {
  const { theme, colors } = useTheme();
  
  // Determina o estilo da StatusBar com base no tema
  const statusBarStyle = theme === 'dark' ? 'light' : 'dark';
  
  return <StatusBar style={statusBarStyle} backgroundColor={colors.card} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <EventProvider>
          <Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#f8fafc' },
            animation: 'slide_from_right',
          }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="travel" options={{ headerShown: false }} />
          </Stack>
          <ThemedStatusBar />
        </EventProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
