import { Stack } from 'expo-router';
import React from 'react';

import { useTheme } from '../theme/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: colors.text.primary,
        },
        headerShown: false, // Esconde todos os headers por padrão
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="expenses"
        options={{
          headerShown: true,
          title: 'Gastos',
        }}
      />
      <Stack.Screen
        name="income"
        options={{
          headerShown: true,
          title: 'Rendas',
        }}
      />
      <Stack.Screen
        name="travels"
        options={{
          headerShown: true,
          title: 'Viagens',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: true,
          title: 'Configurações',
        }}
      />
    </Stack>
  );
}
