import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { EventProvider } from './utils/EventContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
            contentStyle: { paddingTop: 0 },
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
