import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { Chrome as Home, ChartPie as PieChart, Wallet, Plane } from 'lucide-react-native';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: colors.text.primary,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Resumos',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Gastos',
          tabBarIcon: ({ color, size }) => <PieChart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          title: 'Rendas',
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="travels"
        options={{
          title: 'Viagens',
          tabBarIcon: ({ color, size }) => <Plane size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}