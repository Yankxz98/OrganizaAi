import { Stack } from 'expo-router';

export default function ExpensesLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="add" 
        options={({ route }) => {
          const params = route.params as { expenseId?: string };
          return {
            title: params?.expenseId ? 'Editar Despesa' : 'Adicionar Despesa',
            presentation: 'modal'
          };
        }} 
      />
    </Stack>
  );
} 