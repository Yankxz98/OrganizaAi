import { Stack } from 'expo-router';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

export default function ExpensesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: 'Despesas',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Despesas',
          presentation: 'card',
        } as NativeStackNavigationOptions}
      />
      <Stack.Screen
        name="add"
        options={{
          title: 'Adicionar Despesa',
          presentation: 'card',
        } as NativeStackNavigationOptions}
      />
    </Stack>
  );
} 